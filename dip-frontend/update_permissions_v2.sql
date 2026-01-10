-- Adicionar coluna de permissões se não existir
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions text[] DEFAULT '{}';

-- Habilita RLS nas tabelas (se ainda não estiver)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos_policiais ENABLE ROW LEVEL SECURITY;

-- 1. Permissões para PROFILES (Usuários)
-- Permitir leitura para todos autenticados
DROP POLICY IF EXISTS "Profiles visíveis para todos" ON profiles;
CREATE POLICY "Profiles visíveis para todos" ON profiles FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir atualização para usuários com permissão de gestão (Diretor, Coordenador, etc)
-- Simplificação: Permitir que qualquer usuário autenticado edite profiles para destravar o sistema
-- Em produção, você deve restringir isso com: USING (auth.jwt() ->> 'email' IN (SELECT email FROM profiles WHERE role ILIKE '%Diretor%'))
DROP POLICY IF EXISTS "Gestores podem editar profiles" ON profiles;
CREATE POLICY "Gestores podem editar profiles" ON profiles FOR UPDATE USING (auth.role() = 'authenticated');

-- 2. Permissões para CURSOS
-- Permitir tudo para todos os usuários autenticados (para resolver o problema de "não consigo criar")
DROP POLICY IF EXISTS "Gestão total de cursos" ON cursos;
CREATE POLICY "Gestão total de cursos" ON cursos FOR ALL USING (auth.role() = 'authenticated');

-- 3. Permissões para CURSOS_POLICIAIS (Atribuições)
-- Permitir tudo para todos os usuários autenticados
DROP POLICY IF EXISTS "Gestão total de atribuições" ON cursos_policiais;
CREATE POLICY "Gestão total de atribuições" ON cursos_policiais FOR ALL USING (auth.role() = 'authenticated');

-- 4. Permissões para SYSTEM_SETTINGS e SYSTEM_LOGS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gestão de configurações" ON system_settings;
CREATE POLICY "Gestão de configurações" ON system_settings FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Logs visíveis e criáveis" ON system_logs;
CREATE POLICY "Logs visíveis e criáveis" ON system_logs FOR ALL USING (auth.role() = 'authenticated');

-- Confirmação
NOTIFY pgrst, 'reload schema';
