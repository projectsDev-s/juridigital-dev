import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
    const INSTANCE_NAME = Deno.env.get('EVOLUTION_INSTANCE_NAME');
    
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !INSTANCE_NAME) {
      throw new Error('Evolution API credentials not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'connect') {
      console.log(`Connecting to instance: ${INSTANCE_NAME}`);
      
      // Primeiro, verificar se a instância existe
      const checkInstanceResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      });

      // Se a instância não existe (404), criar ela
      if (checkInstanceResponse.status === 404) {
        console.log(`Instance ${INSTANCE_NAME} does not exist. Creating...`);
        
        const createInstanceResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
          method: 'POST',
          headers: {
            'apikey': EVOLUTION_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instanceName: INSTANCE_NAME,
            token: Deno.env.get('EVOLUTION_INSTANCE_TOKEN'),
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          }),
        });

        if (!createInstanceResponse.ok) {
          const errorText = await createInstanceResponse.text();
          console.error('Error creating instance:', errorText);
          throw new Error(`Failed to create instance: ${createInstanceResponse.status} - ${errorText}`);
        }

        const createData = await createInstanceResponse.json();
        console.log('Instance created successfully:', createData);
      } else if (!checkInstanceResponse.ok) {
        const errorText = await checkInstanceResponse.text();
        console.error('Error checking instance:', errorText);
        throw new Error(`Failed to check instance: ${checkInstanceResponse.status}`);
      } else {
        console.log(`Instance ${INSTANCE_NAME} already exists`);
      }
      
      // Agora obter QR Code da instância
      const qrCodeResponse = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      });

      if (!qrCodeResponse.ok) {
        const errorText = await qrCodeResponse.text();
        console.error('Error getting QR code:', errorText);
        throw new Error(`Failed to get QR code: ${qrCodeResponse.status} - ${errorText}`);
      }

      const qrData = await qrCodeResponse.json();
      console.log('QR Code received');

      // Atualizar banco de dados
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          status: 'connecting',
          qr_code: qrData.base64 || qrData.qrcode?.base64,
          instance_id: INSTANCE_NAME,
        })
        .eq('tipo', 'ia');

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          qrCode: qrData.base64 || qrData.qrcode?.base64,
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
        .eq('tipo', 'ia');

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

    if (action === 'status') {
      console.log(`Checking status for instance: ${INSTANCE_NAME}`);
      
      // Verificar status na Evolution API
      const statusResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY,
        },
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Error getting status:', errorText);
        throw new Error(`Failed to get status: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      console.log('Status received from Evolution API:', JSON.stringify(statusData));

      // Mapear status da Evolution para nosso sistema
      let mappedStatus = 'disconnected';
      const actualState = statusData.state || statusData.instance?.state;
      console.log('Actual state from Evolution:', actualState);
      
      // Aceitar múltiplos formatos de status
      if (actualState === 'open' || actualState === 'connected') {
        mappedStatus = 'connected';
      } else if (actualState === 'connecting' || actualState === 'close') {
        mappedStatus = 'connecting';
      }
      
      console.log('Mapped status:', mappedStatus);

      // Atualizar banco de dados
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({
          status: mappedStatus,
          ultima_conexao: mappedStatus === 'connected' ? new Date().toISOString() : null,
        })
        .eq('tipo', 'ia');

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          status: mappedStatus,
        }),
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
