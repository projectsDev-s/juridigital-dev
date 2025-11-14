-- Habilitar RLS nas tabelas (se já não estiver)
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Dropar políticas existentes se existirem e recriar
DROP POLICY IF EXISTS "Permitir leitura pública dos agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Permitir inserção pública de agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Permitir atualização pública dos agendamentos" ON public.agendamentos;

-- Criar políticas para agendamentos
CREATE POLICY "Permitir leitura pública dos agendamentos"
ON public.agendamentos
FOR SELECT
USING (true);

CREATE POLICY "Permitir inserção pública de agendamentos"
ON public.agendamentos
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir atualização pública dos agendamentos"
ON public.agendamentos
FOR UPDATE
USING (true);

-- Dropar e recriar políticas para notifications
DROP POLICY IF EXISTS "Permitir leitura pública das notificações" ON public.notifications;
DROP POLICY IF EXISTS "Permitir inserção pública de notificações" ON public.notifications;
DROP POLICY IF EXISTS "Permitir atualização pública das notificações" ON public.notifications;

CREATE POLICY "Permitir leitura pública das notificações"
ON public.notifications
FOR SELECT
USING (true);

CREATE POLICY "Permitir inserção pública de notificações"
ON public.notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir atualização pública das notificações"
ON public.notifications
FOR UPDATE
USING (true);

-- Dropar e recriar políticas para whatsapp_instances
DROP POLICY IF EXISTS "Permitir leitura pública das instâncias WhatsApp" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Permitir inserção de instâncias WhatsApp" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Permitir atualização das instâncias WhatsApp" ON public.whatsapp_instances;

CREATE POLICY "Permitir leitura pública das instâncias WhatsApp"
ON public.whatsapp_instances
FOR SELECT
USING (true);

CREATE POLICY "Permitir inserção de instâncias WhatsApp"
ON public.whatsapp_instances
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir atualização das instâncias WhatsApp"
ON public.whatsapp_instances
FOR UPDATE
USING (true);

-- Dropar e recriar políticas para users
DROP POLICY IF EXISTS "Permitir leitura pública dos usuários" ON public.users;

CREATE POLICY "Permitir leitura pública dos usuários"
ON public.users
FOR SELECT
USING (true);

-- Dropar e recriar políticas para n8n_chat_histories
DROP POLICY IF EXISTS "Permitir operações públicas no chat" ON public.n8n_chat_histories;

CREATE POLICY "Permitir operações públicas no chat"
ON public.n8n_chat_histories
FOR ALL
USING (true);