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

  const candidates = [
    payload.base64,
    payload.base64Image,
    payload.image,
    payload.qrcode?.base64,
    payload.qrcode?.base64Image,
    payload.qrcode?.code,
    payload.qrcode?.image,
    payload.qrCode,
    payload.qrCode?.base64,
    payload.qrCode?.base64Image,
    payload.data?.qrcode?.base64,
    payload.data?.qrcode?.base64Image,
    payload.data?.qrCode,
    payload.data?.qrCode?.base64,
    payload.data?.qrCode?.base64Image,
    payload.instance?.qrcode?.base64,
    payload.instance?.qrcode?.base64Image,
    payload.instance?.qrCode,
    payload.instance?.qrCode?.base64,
    payload.instance?.qrCode?.base64Image,
    payload?.qrcodeUrl,
    payload?.qrCodeUrl,
    payload?.url,
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
      console.log(`Gerando QR Code para instância: ${INSTANCE_NAME}`);
      
      // Verificar se a instância existe
      const checkInstanceResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      });

      // Se a instância não existe (404), criar ela
      if (checkInstanceResponse.status === 404) {
        console.log(`Instância ${INSTANCE_NAME} não existe. Criando...`);
        
        const createInstanceResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instanceName: INSTANCE_NAME,
            token: INSTANCE_TOKEN || undefined,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          }),
        });

        if (!createInstanceResponse.ok) {
          const errorText = await createInstanceResponse.text();
          console.error('Erro ao criar instância:', errorText);
          throw new Error(`Falha ao criar instância: ${createInstanceResponse.status} - ${errorText}`);
        }

        console.log('Instância criada com sucesso');
      } else if (!checkInstanceResponse.ok && checkInstanceResponse.status !== 200) {
        const errorText = await checkInstanceResponse.text();
        console.error('Erro ao verificar instância:', errorText);
        // Continuar mesmo com erro, tentar gerar QR code
      }
      
      // Obter QR Code da instância
      console.log('Tentando obter QR Code da URL:', `${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`);
      
      const qrCodeResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      });

      console.log('Status da resposta:', qrCodeResponse.status);
      const responseText = await qrCodeResponse.text();
      console.log('Resposta da API (texto):', responseText);

      if (!qrCodeResponse.ok) {
        console.error('Erro ao obter QR code:', responseText);
        throw new Error(`Falha ao obter QR code: ${qrCodeResponse.status} - ${responseText}. Verifique se as credenciais da Evolution API estão corretas em Configurações.`);
      }

      let qrData;
      try {
        qrData = JSON.parse(responseText);
        console.log('Estrutura da resposta JSON:', JSON.stringify(qrData, null, 2));
      } catch (e) {
        console.error('Falha ao parsear resposta como JSON:', e);
        throw new Error('Resposta inválida da Evolution API. Verifique a URL da API em Configurações.');
      }

      const qrImage = extractQrCode(qrData);
      
      if (!qrImage) {
        console.error('QR Code não encontrado na resposta. Estrutura recebida:', JSON.stringify(qrData, null, 2));
        throw new Error(`QR Code não encontrado na resposta da Evolution API. Resposta: ${JSON.stringify(qrData)}. Verifique se a instância "${INSTANCE_NAME}" está correta.`);
      }

      console.log('QR Code gerado com sucesso');

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
