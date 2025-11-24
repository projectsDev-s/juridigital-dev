-- Adicionar campos de instância à tabela evolution_config
ALTER TABLE evolution_config 
ADD COLUMN IF NOT EXISTS instance_name TEXT,
ADD COLUMN IF NOT EXISTS instance_token TEXT;

-- Atualizar registro existente com valores padrão (se houver)
UPDATE evolution_config 
SET 
  instance_name = COALESCE(instance_name, 'sd-dv'),
  instance_token = COALESCE(instance_token, '')
WHERE instance_name IS NULL OR instance_token IS NULL;