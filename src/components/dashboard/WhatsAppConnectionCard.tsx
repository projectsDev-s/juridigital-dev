import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, CheckCircle2, XCircle, Wifi } from "lucide-react";

interface WhatsAppConnectionCardProps {
  tipo: "ia" | "escritorio";
  titulo: string;
  descricao: string;
}

const WhatsAppConnectionCard = ({ tipo, titulo, descricao }: WhatsAppConnectionCardProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("disconnected");

  useEffect(() => {
    loadInstanceData();
    
    // Setup realtime subscription apenas para QR code
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
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as any;
            setQrCode(newData.qr_code);
            setStatus(newData.status || "disconnected");
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tipo]);

  const loadInstanceData = async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_instances")
        .select("qr_code, status")
        .eq("tipo", tipo)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao carregar instância:", error);
        return;
      }

      if (data) {
        setQrCode(data.qr_code);
        setStatus(data.status || "disconnected");
      }
    } catch (error) {
      console.error("Erro ao carregar instância:", error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);

    try {
      toast.info("Gerando QR Code...");

      const { data, error } = await supabase.functions.invoke('whatsapp-qrcode', {
        body: {
          action: 'connect',
          tipo,
        },
      });

      if (error) throw error;

      if (!data.success || !data.qrCode) {
        throw new Error(data.error || 'Falha ao gerar QR Code');
      }

      setQrCode(data.qrCode);
      setStatus("connecting");

      toast.success("QR Code gerado!", {
        description: "Escaneie o código com seu WhatsApp",
      });
    } catch (error: any) {
      console.error("Erro ao gerar QR Code:", error);
      toast.error("Erro ao gerar QR Code", {
        description: error.message || "Verifique as credenciais nas Configurações",
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
          tipo,
        },
      });

      if (error) throw error;

      if (!data.success || !data.qrCode) {
        throw new Error(data.error || 'Falha ao gerar novo QR Code');
      }

      setQrCode(data.qrCode);
      setStatus("connecting");

      toast.success("Novo QR Code gerado!", {
        description: "Escaneie o código com seu WhatsApp",
      });
    } catch (error: any) {
      console.error("Erro ao gerar QR Code:", error);
      toast.error("Erro ao gerar QR Code", {
        description: error.message,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      toast.info("Desconectando...");

      const { error } = await supabase.functions.invoke('whatsapp-qrcode', {
        body: {
          action: 'disconnect',
          tipo,
        },
      });

      if (error) throw error;

      setQrCode(null);
      setStatus("disconnected");

      toast.success("WhatsApp desconectado");
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
        {qrCode ? (
          <div className="space-y-3">
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <img 
                src={qrCode} 
                alt="QR Code WhatsApp" 
                className="w-48 h-48"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleRefreshQRCode}
                disabled={isConnecting}
                variant="outline"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar QR
                  </>
                )}
              </Button>
              <Button
                onClick={handleDisconnect}
                variant="destructive"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full gradient-primary hover:opacity-90 transition-smooth"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Gerando QR Code...
              </>
            ) : (
              "Gerar QR Code"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppConnectionCard;
