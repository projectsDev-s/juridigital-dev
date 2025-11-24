import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Scale, Settings, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import WhatsAppConnectionCard from "@/components/dashboard/WhatsAppConnectionCard";
import AgendamentosModal from "@/components/dashboard/AgendamentosModal";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { supabase } from "@/integrations/supabase/client";

interface UserSession {
  id: string;
  email: string;
  nome: string;
  cargo: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [showAgendamentos, setShowAgendamentos] = useState(false);
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar sessão
    const sessionData = localStorage.getItem("user_session");
    if (!sessionData) {
      navigate("/login");
      return;
    }

    const userData = JSON.parse(sessionData);
    setUser(userData);
    checkApiConfiguration();
  }, [navigate]);

  const checkApiConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from("evolution_config")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setIsApiConfigured(!!data && !!data.api_url && !!data.global_key);
    } catch (error) {
      console.error("Erro ao verificar configurações:", error);
      setIsApiConfigured(false);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    toast.success("Logout realizado com sucesso");
    navigate("/login");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-elegant">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-elegant-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center shadow-elegant-sm">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Dias e Gonçalves</h1>
                <p className="text-sm text-muted-foreground">Painel Administrativo</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!loadingConfig && (
                <Badge
                  variant={isApiConfigured ? "default" : "destructive"}
                  className="flex items-center gap-1.5"
                >
                  {isApiConfigured ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      API Configurada
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3" />
                      API Não Configurada
                    </>
                  )}
                </Badge>
              )}
              <NotificationBell onNotificationClick={() => setShowAgendamentos(true)} />
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-foreground">{user.nome}</p>
                <p className="text-xs text-muted-foreground">{user.cargo}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="transition-smooth"
                    title="Menu"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Seção de Boas-vindas */}
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Bem-vindo(a), {user.nome.split(' ')[0]}
            </h2>
            <p className="text-muted-foreground">
              Gerencie as conexões do WhatsApp e visualize os agendamentos
            </p>
          </div>

          {/* Cards em Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card de Conexão WhatsApp da IA */}
            <Card className="shadow-elegant-lg border-0">
              <CardHeader>
                <CardTitle className="text-2xl">Conexão da IA</CardTitle>
                <CardDescription>
                  Gerencie a conexão do WhatsApp para o chatbot automatizado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WhatsAppConnectionCard
                  tipo="ia"
                  titulo="Conexão da IA"
                  descricao="Chatbot automatizado via Evolution API"
                />
              </CardContent>
            </Card>

            {/* Seção de Agendamentos */}
            <Card className="shadow-elegant-lg border-0">
              <CardHeader>
                <CardTitle className="text-2xl">Agendamentos</CardTitle>
                <CardDescription>
                  Visualize e gerencie os agendamentos confirmados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowAgendamentos(true)}
                  className="gradient-primary hover:opacity-90 transition-smooth shadow-elegant-md"
                  size="lg"
                >
                  Listar Agendamentos
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal de Agendamentos */}
      <AgendamentosModal
        open={showAgendamentos}
        onOpenChange={setShowAgendamentos}
      />
    </div>
  );
};

export default Dashboard;
