-- Criar tabela de usuários (autenticação customizada, SEM RLS)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  cargo VARCHAR(100),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de instâncias WhatsApp (SEM RLS)
CREATE TABLE public.whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'ia' ou 'escritorio'
  instance_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'disconnected', -- 'connected', 'disconnected', 'connecting'
  qr_code TEXT,
  ultima_conexao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de agendamentos (SEM RLS)
CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente VARCHAR(255) NOT NULL,
  telefone VARCHAR(50),
  email VARCHAR(255),
  data_agendamento TIMESTAMP WITH TIME ZONE NOT NULL,
  campanha VARCHAR(100), -- 'TOI', 'LOAS', 'Águas do Rio'
  status VARCHAR(50) DEFAULT 'confirmado', -- 'confirmado', 'reagendado', 'pendente', 'cancelado'
  observacoes TEXT,
  sheets_row_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de notificações (SEM RLS)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(50) NOT NULL, -- 'novo_agendamento', 'whatsapp_desconectado', etc
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT,
  lida BOOLEAN DEFAULT false,
  agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_agendamentos_data ON public.agendamentos(data_agendamento);
CREATE INDEX idx_agendamentos_status ON public.agendamentos(status);
CREATE INDEX idx_agendamentos_campanha ON public.agendamentos(campanha);
CREATE INDEX idx_notifications_lida ON public.notifications(lida);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON public.whatsapp_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON public.agendamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuário padrão para testes (senha: admin123)
-- Hash bcrypt da senha 'admin123'
INSERT INTO public.users (email, password_hash, nome, cargo) 
VALUES ('admin@rodriguesalves.adv.br', '$2a$10$rKzDYW8m5xN.VH7yqYQO4OqZNvBqxJDH.JQ6vLqPBxQVmxFZK2pHO', 'Administrador', 'Gerente');

-- Inserir instâncias WhatsApp padrão
INSERT INTO public.whatsapp_instances (nome, tipo, instance_id) 
VALUES 
  ('Instância da IA', 'ia', 'instance-ia-001'),
  ('Instância do Escritório', 'escritorio', 'instance-escritorio-001');