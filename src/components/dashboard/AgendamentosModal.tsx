import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Search, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgendamentosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Agendamento {
  id: string;
  nome_cliente: string;
  telefone: string;
  data_agendada: string;
  hora_agendada: string;
  campanha: string;
  status: string;
  created_at: string;
}

const AgendamentosModal = ({ open, onOpenChange }: AgendamentosModalProps) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [campanhaFilter, setCampanhaFilter] = useState("todas");

  useEffect(() => {
    if (open) {
      loadAgendamentos();
    }
  }, [open]);

  const loadAgendamentos = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("agendamentos")
        .select("*")
        .order("data_agendada", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setAgendamentos(data || []);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      confirmado: { variant: "default", label: "Confirmado" },
      reagendado: { variant: "secondary", label: "Reagendado" },
      pendente: { variant: "outline", label: "Pendente" },
      cancelado: { variant: "destructive", label: "Cancelado" },
    };

    const config = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredAgendamentos = agendamentos.filter((agendamento) => {
    const matchesSearch = agendamento.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agendamento.telefone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || agendamento.status === statusFilter;
    const matchesCampanha = campanhaFilter === "todas" || agendamento.campanha === campanhaFilter;

    return matchesSearch && matchesStatus && matchesCampanha;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Users className="h-6 w-6" />
            Clientes Agendados
          </DialogTitle>
          <DialogDescription>
            Visualize e gerencie todos os agendamentos confirmados
          </DialogDescription>
        </DialogHeader>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="reagendado">Reagendado</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={campanhaFilter} onValueChange={setCampanhaFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por campanha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as campanhas</SelectItem>
              <SelectItem value="TOI">TOI</SelectItem>
              <SelectItem value="LOAS">LOAS</SelectItem>
              <SelectItem value="Águas do Rio">Águas do Rio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="flex-1 overflow-auto border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Carregando agendamentos...</p>
            </div>
          ) : filteredAgendamentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-2">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgendamentos.map((agendamento) => (
                  <TableRow key={agendamento.id}>
                    <TableCell className="font-medium">{agendamento.nome_cliente}</TableCell>
                    <TableCell>{agendamento.telefone || "-"}</TableCell>
                    <TableCell>
                      {format(new Date(agendamento.data_agendada), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {agendamento.hora_agendada || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{agendamento.campanha || "-"}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(agendamento.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Total: {filteredAgendamentos.length} agendamento(s)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgendamentosModal;
