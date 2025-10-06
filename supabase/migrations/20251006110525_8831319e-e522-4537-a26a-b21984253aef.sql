-- Habilitar realtime na tabela whatsapp_instances
ALTER TABLE public.whatsapp_instances REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_instances;