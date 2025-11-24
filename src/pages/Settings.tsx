import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Scale } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const [apiUrl, setApiUrl] = useState("");
  const [globalKey, setGlobalKey] = useState("");
  const [configId, setConfigId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("evolution_config")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setApiUrl(data.api_url);
        setGlobalKey(data.global_key);
        setConfigId(data.id);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      toast.error("Erro ao carregar configurações");
    }
  };

  const handleSave = async () => {
    if (!apiUrl || !globalKey) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      if (configId) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from("evolution_config")
          .update({
            api_url: apiUrl,
            global_key: globalKey,
          })
          .eq("id", configId);

        if (error) throw error;
      } else {
        // Criar nova configuração
        const { data, error } = await supabase
          .from("evolution_config")
          .insert({
            api_url: apiUrl,
            global_key: globalKey,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setConfigId(data.id);
      }

      toast.success("Configurações salvas com sucesso");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-elegant">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-elegant-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="transition-smooth"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center shadow-elegant-sm">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Configurações</h1>
              <p className="text-sm text-muted-foreground">Webhook Evolution API</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl shadow-elegant-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Credenciais Evolution API</CardTitle>
            <CardDescription>
              Configure as credenciais para conectar com a Evolution API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="api-url">URL da API</Label>
              <Input
                id="api-url"
                type="url"
                placeholder="https://api.evolution.com"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Endereço completo da Evolution API
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="global-key">Global API Key</Label>
              <Input
                id="global-key"
                type="password"
                placeholder="Sua chave de API"
                value={globalKey}
                onChange={(e) => setGlobalKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Chave global de autenticação da Evolution API
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="gradient-primary hover:opacity-90 transition-smooth shadow-elegant-md w-full"
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;