-- Atualizar Policies para Profiles (Gestão de Usuários)
-- Permitir que Diretores e Coordenadores (case insensitive) editem qualquer perfil
drop policy if exists "Managers can update profiles" on public.profiles;
create policy "Managers can update profiles" on public.profiles
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and (lower(role) like '%diretor%' or lower(role) like '%coordenador%')
    )
  );

-- Permitir que Diretores e Coordenadores deletem perfis (se necessário)
drop policy if exists "Managers can delete profiles" on public.profiles;
create policy "Managers can delete profiles" on public.profiles
  for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and (lower(role) like '%diretor%' or lower(role) like '%coordenador%')
    )
  );

-- Atualizar Policies para System Settings (Corporação, Cargos)
alter table if exists public.system_settings enable row level security;

drop policy if exists "Settings visible to all" on public.system_settings;
create policy "Settings visible to all" on public.system_settings
  for select using (auth.role() = 'authenticated');

drop policy if exists "Managers can update settings" on public.system_settings;
create policy "Managers can update settings" on public.system_settings
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and (lower(role) like '%diretor%' or lower(role) like '%coordenador%')
    )
  );

-- Garantir que System Logs permita inserção por todos (para logs de ação)
alter table if exists public.system_logs enable row level security;

drop policy if exists "Logs visible to all" on public.system_logs;
create policy "Logs visible to all" on public.system_logs
  for select using (auth.role() = 'authenticated');

drop policy if exists "Everyone can insert logs" on public.system_logs;
create policy "Everyone can insert logs" on public.system_logs
  for insert with check (auth.role() = 'authenticated');
