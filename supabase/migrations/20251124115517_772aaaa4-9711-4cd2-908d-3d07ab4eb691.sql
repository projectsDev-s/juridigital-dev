-- Criar tabela para armazenar configurações da Evolution API
CREATE TABLE public.evolution_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_url TEXT NOT NULL,
  global_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.evolution_config ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública das configurações
CREATE POLICY "Permitir leitura pública das configurações Evolution"
ON public.evolution_config
FOR SELECT
USING (true);

-- Permitir inserção pública de configurações
CREATE POLICY "Permitir inserção pública de configurações Evolution"
ON public.evolution_config
FOR INSERT
WITH CHECK (true);

-- Permitir atualização pública das configurações
CREATE POLICY "Permitir atualização pública das configurações Evolution"
ON public.evolution_config
FOR UPDATE
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_evolution_config_updated_at
BEFORE UPDATE ON public.evolution_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();