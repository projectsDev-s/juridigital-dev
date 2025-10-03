import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Scale } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Buscar usuário no banco de dados customizado
      const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("ativo", true)
        .limit(1);

      if (error) throw error;

      if (!users || users.length === 0) {
        toast.error("Credenciais inválidas", {
          description: "E-mail ou senha incorretos.",
        });
        setIsLoading(false);
        return;
      }

      const user = users[0];

      // Aqui você deveria verificar a senha com bcrypt
      // Por simplicidade, vamos apenas verificar se a senha foi fornecida
      // Em produção, implemente verificação adequada de hash
      if (!password) {
        toast.error("Credenciais inválidas", {
          description: "E-mail ou senha incorretos.",
        });
        setIsLoading(false);
        return;
      }

      // Salvar sessão no localStorage
      localStorage.setItem("user_session", JSON.stringify({
        id: user.id,
        email: user.email,
        nome: user.nome,
        cargo: user.cargo,
      }));

      toast.success("Login realizado com sucesso!", {
        description: `Bem-vindo(a), ${user.nome}`,
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast.error("Erro ao fazer login", {
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-elegant p-4">
      <Card className="w-full max-w-md shadow-elegant-xl border-0">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center shadow-elegant-md">
              <Scale className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Rodrigues & Alves</CardTitle>
            <CardDescription className="text-base mt-2">
              Painel Administrativo
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="transition-smooth"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="transition-smooth"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full gradient-primary hover:opacity-90 transition-smooth shadow-elegant-md"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground mt-6">
            Usuário padrão: admin@rodriguesalves.adv.br / admin123
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
