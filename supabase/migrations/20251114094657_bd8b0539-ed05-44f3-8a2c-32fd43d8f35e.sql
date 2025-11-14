-- Habilitar RLS na tabela agendamentos
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura pública dos agendamentos
CREATE POLICY "Permitir leitura pública dos agendamentos"
ON public.agendamentos
FOR SELECT
USING (true);

-- Criar política para permitir inserção pública de agendamentos
CREATE POLICY "Permitir inserção pública de agendamentos"
ON public.agendamentos
FOR INSERT
WITH CHECK (true);

-- Criar política para permitir atualização pública de agendamentos
CREATE POLICY "Permitir atualização pública dos agendamentos"
ON public.agendamentos
FOR UPDATE
USING (true);

-- Habilitar RLS na tabela notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura pública das notificações
CREATE POLICY "Permitir leitura pública das notificações"
ON public.notifications
FOR SELECT
USING (true);

-- Criar política para permitir inserção pública de notificações
CREATE POLICY "Permitir inserção pública de notificações"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Criar política para permitir atualização pública das notificações
CREATE POLICY "Permitir atualização pública das notificações"
ON public.notifications
FOR UPDATE
USING (true);

-- Habilitar RLS na tabela whatsapp_instances
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura pública das instâncias
CREATE POLICY "Permitir leitura pública das instâncias WhatsApp"
ON public.whatsapp_instances
FOR SELECT
USING (true);

-- Criar política para permitir inserção de instâncias
CREATE POLICY "Permitir inserção de instâncias WhatsApp"
ON public.whatsapp_instances
FOR INSERT
WITH CHECK (true);

-- Criar política para permitir atualização de instâncias
CREATE POLICY "Permitir atualização das instâncias WhatsApp"
ON public.whatsapp_instances
FOR UPDATE
USING (true);

-- Habilitar RLS na tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura pública dos usuários
CREATE POLICY "Permitir leitura pública dos usuários"
ON public.users
FOR SELECT
USING (true);

-- Habilitar RLS na tabela n8n_chat_histories
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas operações no chat
CREATE POLICY "Permitir operações públicas no chat"
ON public.n8n_chat_histories
FOR ALL
USING (true);