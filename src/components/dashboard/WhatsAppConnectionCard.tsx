import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Smartphone, RefreshCw, CheckCircle2, XCircle, Wifi } from "lucide-react";

interface WhatsAppConnectionCardProps {
  tipo: "ia" | "escritorio";
  titulo: string;
  descricao: string;
}

const WhatsAppConnectionCard = ({ tipo, titulo, descricao }: WhatsAppConnectionCardProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("disconnected");
  const [instanceId, setInstanceId] = useState<string>("");

  useEffect(() => {
    loadInstanceData();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('whatsapp-instances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `tipo=eq.${tipo}`
        },
        (payload) => {
          console.log('Realtime update:', payload);
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as any;
            setStatus(newData.status || "disconnected");
            setQrCode(newData.qr_code);
            setInstanceId(newData.id);
          }
        }
      )
      .subscribe();

    // Verificar status a cada 5 segundos
    const interval = setInterval(loadInstanceData, 5000);
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [tipo]);

  const loadInstanceData = async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .eq("tipo", tipo)
        .single();

      if (error) throw error;

      if (data) {
        setStatus(data.status || "disconnected");
        setQrCode(data.qr_code);
        setInstanceId(data.id);
      }
    } catch (error) {
      console.error("Erro ao carregar instância:", error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);

    try {
      toast.info("Conectando à Evolution API...", {
        description: "Gerando QR Code",
      });

      const { data, error } = await supabase.functions.invoke('whatsapp-qrcode', {
        body: {
          action: 'connect',
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error('Falha ao gerar QR Code');
      }

      toast.success("QR Code gerado!", {
        description: "Escaneie o código com seu WhatsApp",
      });

      await loadInstanceData();

      // Verificar status imediatamente após gerar QR code
      setTimeout(async () => {
        const { data: statusData } = await supabase.functions.invoke('whatsapp-qrcode', {
          body: { action: 'status' },
        });
        console.log('Status check after QR generation:', statusData);
        await loadInstanceData();
      }, 2000);

      // Iniciar polling agressivo para verificar status de conexão
      const checkInterval = setInterval(async () => {
        try {
          const { data: statusData, error: statusError } = await supabase.functions.invoke('whatsapp-qrcode', {
            body: {
              action: 'status',
            },
          });

          console.log('Polling status:', statusData);

          if (statusError) {
            console.error('Status error:', statusError);
            clearInterval(checkInterval);
            return;
          }

          await loadInstanceData();

          if (statusData.status === 'connected') {
            clearInterval(checkInterval);
            toast.success("WhatsApp conectado!", {
              description: `${titulo} conectado com sucesso`,
            });
          }
        } catch (err) {
          console.error('Erro ao verificar status:', err);
        }
      }, 3000);

      // Limpar polling após 3 minutos
      setTimeout(() => clearInterval(checkInterval), 180000);

    } catch (error: any) {
      console.error("Erro ao conectar:", error);
      toast.error("Erro ao conectar WhatsApp", {
        description: error.message || "Verifique as credenciais da Evolution API",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRefreshQRCode = async () => {
    setIsConnecting(true);

    try {
      toast.info("Gerando novo QR Code...");

      const { data, error } = await supabase.functions.invoke('whatsapp-qrcode', {
        body: {
          action: 'connect',
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error('Falha ao gerar novo QR Code');
      }

      toast.success("Novo QR Code gerado!", {
        description: "Escaneie o código com seu WhatsApp",
      });

      await loadInstanceData();

    } catch (error: any) {
      console.error("Erro ao atualizar QR Code:", error);
      toast.error("Erro ao gerar novo QR Code", {
        description: error.message,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      toast.info("Verificando status...");

      const { data, error } = await supabase.functions.invoke('whatsapp-qrcode', {
        body: {
          action: 'status',
        },
      });

      if (error) throw error;

      console.log('Status manual check:', data);

      await loadInstanceData();
      
      toast.success("Status atualizado", {
        description: `Status: ${data.status === 'connected' ? 'Conectado' : data.status === 'connecting' ? 'Conectando' : 'Desconectado'}`,
      });
    } catch (error: any) {
      console.error("Erro ao verificar status:", error);
      toast.error("Erro ao verificar status", {
        description: error.message,
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      toast.info("Desconectando...");

      const { error } = await supabase.functions.invoke('whatsapp-qrcode', {
        body: {
          action: 'disconnect',
        },
      });

      if (error) throw error;

      toast.success("WhatsApp desconectado");
      await loadInstanceData();
    } catch (error: any) {
      console.error("Erro ao desconectar:", error);
      toast.error("Erro ao desconectar", {
        description: error.message,
      });
    }
  };

  return (
    <Card className="shadow-elegant-md border border-border transition-smooth hover:shadow-elegant-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center transition-smooth ${
            status === "connected" 
              ? "bg-green-100 dark:bg-green-900/30 shadow-glow" 
              : status === "connecting"
              ? "bg-yellow-100 dark:bg-yellow-900/30"
              : "bg-muted"
          }`}>
            <Wifi className={`h-6 w-6 transition-smooth ${
              status === "connected" 
                ? "text-green-600 dark:text-green-400" 
                : status === "connecting"
                ? "text-yellow-600 dark:text-yellow-400 animate-pulse"
                : "text-muted-foreground"
            }`} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{titulo}</CardTitle>
            <CardDescription className="text-sm">{descricao}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {status === "connected" && (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            )}
            {status === "disconnected" && (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">Status:</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${
              status === "connected" ? "text-green-600 dark:text-green-400" : 
              status === "connecting" ? "text-yellow-600 dark:text-yellow-400" : 
              "text-muted-foreground"
            }`}>
              {status === "connected" ? "Conectado" : 
               status === "connecting" ? "Conectando..." : 
               "Desconectado"}
            </span>
            <Button
              onClick={handleRefreshStatus}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {qrCode && status === "connecting" && (
          <div className="space-y-3">
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <img 
                src={qrCode} 
                alt="QR Code WhatsApp" 
                className="w-48 h-48"
              />
            </div>
            <Button
              onClick={handleRefreshQRCode}
              disabled={isConnecting}
              variant="outline"
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Gerando novo QR Code...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar QR Code
                </>
              )}
            </Button>
          </div>
        )}

        {status === "disconnected" && (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full gradient-primary hover:opacity-90 transition-smooth"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              "Conectar"
            )}
          </Button>
        )}

        {status === "connected" && (
          <Button
            onClick={handleDisconnect}
            variant="destructive"
            className="w-full"
          >
            Desconectar
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppConnectionCard;
