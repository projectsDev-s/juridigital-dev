import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para buscar configurações do banco de dados
async function getEvolutionConfig(supabase: any) {
  const { data, error } = await supabase
    .from('evolution_config')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar configurações:', error);
    throw new Error('Configurações da Evolution API não encontradas');
  }

  if (!data) {
    throw new Error('Nenhuma configuração da Evolution API cadastrada');
  }

  if (!data.api_url || !data.global_key || !data.instance_name) {
    throw new Error('Configurações da Evolution API incompletas. Atualize-as no menu Configurações.');
  }

  return data;
}

function normalizeQrString(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:image')) {
    return trimmed;
  }
  if (trimmed.startsWith('http')) {
    return trimmed;
  }
  const base64 = trimmed.replace(/^base64,/i, '');
  return `data:image/png;base64,${base64}`;
}

function extractQrCode(payload: any): string | null {
  if (!payload) return null;

  // Evolution API retorna o QR code no campo 'code' (já é base64)
  const candidates = [
    payload.code,  // Campo correto segundo documentação
    payload.qrcode?.code,
    payload.qrCode?.code,
    payload.base64,
    payload.qrcode?.base64,
  ];

  const raw = candidates.find((val) => typeof val === 'string' && val.length > 10);
  return normalizeQrString(raw);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body?.action;
    const connectionType = body?.tipo === 'escritorio' ? 'escritorio' : 'ia';

    if (!action) {
      throw new Error('Parâmetro "action" é obrigatório.');
    }
    
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar configurações do banco de dados
    const config = await getEvolutionConfig(supabase);
    const EVOLUTION_API_URL = config.api_url;
    const EVOLUTION_API_KEY = config.global_key;
    const INSTANCE_NAME = config.instance_name || 'sd-dv';
    const INSTANCE_TOKEN = config.instance_token;
    
    console.log('Configurações carregadas do banco de dados');
    console.log('API URL:', EVOLUTION_API_URL);
    console.log('API Key presente:', !!EVOLUTION_API_KEY);
    console.log('Ação recebida:', action);
    console.log('Tipo solicitado:', connectionType);
    console.log('Instance name:', INSTANCE_NAME);
    console.log('Instance token presente:', !!INSTANCE_TOKEN);

    if (action === 'connect') {
      console.log(`Buscando QR Code da instância existente: ${INSTANCE_NAME}`);
      
      let qrImage: string | null = null;
      
      // Buscar QR Code da instância existente
      console.log('Aguardando 2 segundos antes de buscar QR Code...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      for (let attempt = 1; attempt <= 10; attempt++) {
        console.log(`Tentativa ${attempt}/10 de buscar QR Code...`);
        
        const qrCodeResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, {
          method: 'GET',
          headers: {
            'apikey': EVOLUTION_API_KEY,
          },
        });

        if (qrCodeResponse.ok) {
          const qrData = await qrCodeResponse.json();
          console.log(`Resposta:`, JSON.stringify(qrData, null, 2));
          
          // count > 0 significa que o QR code está disponível
          if (qrData.count && qrData.count > 0 && qrData.code) {
            qrImage = normalizeQrString(qrData.code);
            
            if (qrImage) {
              console.log('✓ QR Code gerado com sucesso!');
              break;
            }
          }
          
          if (!qrImage && attempt < 10) {
            console.log(`QR Code ainda não disponível (count: ${qrData.count || 0}). Aguardando 3 segundos...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } else {
          console.error(`Erro na requisição (${qrCodeResponse.status}):`, await qrCodeResponse.text());
          if (attempt < 10) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }
      
      if (!qrImage) {
        console.error('✗ QR Code não foi encontrado após todas as tentativas');
        throw new Error('Não foi possível obter o QR Code da instância. Verifique se a instância está ativa na Evolution API e tente novamente.');
      }

      console.log('✓ QR Code obtido com sucesso');

      // Atualizar banco de dados
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          status: 'connecting',
          qr_code: qrImage,
          instance_id: INSTANCE_NAME,
        })
        .eq('tipo', connectionType);

      if (updateError) {
        console.error('Erro ao atualizar banco de dados:', updateError);
        // Não falhar se o update der erro, o QR code já foi gerado
      }

      return new Response(
        JSON.stringify({
          success: true,
          qrCode: qrImage,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'disconnect') {
      console.log(`Disconnecting instance: ${INSTANCE_NAME}`);
      
      // Desconectar da Evolution API
      const logoutResponse = await fetch(`${EVOLUTION_API_URL}/instance/logout/${INSTANCE_NAME}`, {
        method: 'DELETE',
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      });

      if (!logoutResponse.ok) {
        console.error('Error disconnecting:', await logoutResponse.text());
      }

      // Atualizar banco de dados
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          status: 'disconnected',
          qr_code: null,
        })
        .eq('tipo', connectionType);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('Error in whatsapp-qrcode function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
