import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, LogOut, Scale } from "lucide-react";
import { toast } from "sonner";
import WhatsAppConnectionCard from "@/components/dashboard/WhatsAppConnectionCard";
import AgendamentosModal from "@/components/dashboard/AgendamentosModal";
import NotificationBell from "@/components/dashboard/NotificationBell";

interface UserSession {
  id: string;
  email: string;
  nome: string;
  cargo: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [showAgendamentos, setShowAgendamentos] = useState(false);
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
  }, [navigate]);

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
                <h1 className="text-xl font-bold text-foreground">Rodrigues & Alves</h1>
                <p className="text-sm text-muted-foreground">Painel Administrativo</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell onNotificationClick={() => setShowAgendamentos(true)} />
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-foreground">{user.nome}</p>
                <p className="text-xs text-muted-foreground">{user.cargo}</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="transition-smooth hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
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
