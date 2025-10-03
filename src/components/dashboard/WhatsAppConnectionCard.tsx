import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Smartphone, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

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
    const interval = setInterval(loadInstanceData, 10000); // Atualizar a cada 10s
    return () => clearInterval(interval);
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
      // Aqui você faria a integração real com a Evolution API
      // Por enquanto, vamos simular gerando um QR Code placeholder
      
      // Atualizar status para "connecting"
      const { error: updateError } = await supabase
        .from("whatsapp_instances")
        .update({
          status: "connecting",
          qr_code: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        })
        .eq("tipo", tipo);

      if (updateError) throw updateError;

      toast.success("Gerando QR Code...", {
        description: "Escaneie o código com o WhatsApp",
      });

      await loadInstanceData();

      // Simular conexão após 3 segundos
      setTimeout(async () => {
        const { error } = await supabase
          .from("whatsapp_instances")
          .update({
            status: "connected",
            ultima_conexao: new Date().toISOString()
          })
          .eq("tipo", tipo);

        if (!error) {
          toast.success("WhatsApp conectado!", {
            description: `${titulo} conectado com sucesso`,
          });
          await loadInstanceData();
        }
      }, 3000);

    } catch (error: any) {
      console.error("Erro ao conectar:", error);
      toast.error("Erro ao conectar WhatsApp", {
        description: error.message || "Tente novamente",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase
        .from("whatsapp_instances")
        .update({
          status: "disconnected",
          qr_code: null
        })
        .eq("tipo", tipo);

      if (error) throw error;

      toast.success("WhatsApp desconectado");
      await loadInstanceData();
    } catch (error: any) {
      console.error("Erro ao desconectar:", error);
      toast.error("Erro ao desconectar");
    }
  };

  return (
    <Card className="shadow-elegant-md border border-border transition-smooth hover:shadow-elegant-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
            status === "connected" ? "bg-green-100 dark:bg-green-900" : "bg-muted"
          }`}>
            <Smartphone className={`h-5 w-5 ${
              status === "connected" ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
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
          <span className={`text-sm font-semibold ${
            status === "connected" ? "text-green-600 dark:text-green-400" : 
            status === "connecting" ? "text-yellow-600 dark:text-yellow-400" : 
            "text-muted-foreground"
          }`}>
            {status === "connected" ? "Conectado" : 
             status === "connecting" ? "Conectando..." : 
             "Desconectado"}
          </span>
        </div>

        {qrCode && status === "connecting" && (
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <img 
              src={qrCode} 
              alt="QR Code WhatsApp" 
              className="w-48 h-48"
            />
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
