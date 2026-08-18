-- ==================== SUPABASE SCHEMA ====================
-- Este script é seguro para reexecução. Objetos já existentes serão ignorados ou atualizados.

-- ==================== PERFIS ====================
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text check (role in ('admin', 'officer', 'viewer')) default 'officer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- ==================== PRISÕES ====================
create table if not exists public.prisoes (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  documento text,
  artigo text not null,
  data_prisao date not null,
  status text default 'Preso',
  foto_principal text,
  fotos_adicionais text[],
  local_prisao text,
  conduzido_por text,
  observacoes text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.prisoes enable row level security;

drop policy if exists "Qualquer usuario autenticado pode ver prisoes" on public.prisoes;
create policy "Qualquer usuario autenticado pode ver prisoes"
  on public.prisoes for select
  using ( auth.role() = 'authenticated' );

drop policy if exists "Usuarios autenticados podem criar prisoes" on public.prisoes;
create policy "Usuarios autenticados podem criar prisoes"
  on public.prisoes for insert
  with check ( auth.role() = 'authenticated' );

drop policy if exists "Usuarios podem editar suas proprias prisoes ou admins" on public.prisoes;
create policy "Usuarios podem editar suas proprias prisoes ou admins"
  on public.prisoes for update
  using ( auth.uid() = created_by or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

-- ==================== PROCURADOS ====================
create table if not exists public.procurados (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  documento text,
  motivo text not null,
  periculosidade text check (periculosidade in ('Baixa', 'Média', 'Alta', 'Extrema')),
  recompensa text,
  status text default 'Procurado',
  foto_principal text,
  observacoes text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.procurados enable row level security;

drop policy if exists "Qualquer usuario autenticado pode ver procurados" on public.procurados;
create policy "Qualquer usuario autenticado pode ver procurados"
  on public.procurados for select
  using ( auth.role() = 'authenticated' );

drop policy if exists "Usuarios autenticados podem criar procurados" on public.procurados;
create policy "Usuarios autenticados podem criar procurados"
  on public.procurados for insert
  with check ( auth.role() = 'authenticated' );

drop policy if exists "Usuarios podem editar procurados" on public.procurados;
create policy "Usuarios podem editar procurados"
  on public.procurados for update
  using ( auth.role() = 'authenticated' );

-- ==================== INVESTIGAÇÕES ====================
create table if not exists public.investigacoes (
  id uuid default uuid_generate_v4() primary key,
  titulo text not null,
  descricao text,
  status text default 'Em Andamento',
  prioridade text default 'Média',
  responsavel_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.investigacoes enable row level security;

drop policy if exists "Qualquer usuario autenticado pode ver investigacoes" on public.investigacoes;
create policy "Qualquer usuario autenticado pode ver investigacoes"
  on public.investigacoes for select
  using ( auth.role() = 'authenticated' );

drop policy if exists "Usuarios autenticados podem criar investigacoes" on public.investigacoes;
create policy "Usuarios autenticados podem criar investigacoes"
  on public.investigacoes for insert
  with check ( auth.role() = 'authenticated' );

-- ==================== PROVAS ====================
create table if not exists public.provas (
  id uuid default uuid_generate_v4() primary key,
  investigacao_id uuid references public.investigacoes(id) on delete cascade,
  tipo text not null,
  descricao text,
  arquivo_url text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.provas enable row level security;

drop policy if exists "Qualquer usuario autenticado pode ver provas" on public.provas;
create policy "Qualquer usuario autenticado pode ver provas"
  on public.provas for select
  using ( auth.role() = 'authenticated' );

drop policy if exists "Usuarios autenticados podem adicionar provas" on public.provas;
create policy "Usuarios autenticados podem adicionar provas"
  on public.provas for insert
  with check ( auth.role() = 'authenticated' );

-- ==================== LOGS DO SISTEMA ====================
create table if not exists public.system_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  action text not null,
  details text,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.system_logs enable row level security;

drop policy if exists "Admins podem ver logs" on public.system_logs;
create policy "Admins podem ver logs"
  on public.system_logs for select
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

drop policy if exists "Sistema pode criar logs" on public.system_logs;
create policy "Sistema pode criar logs"
  on public.system_logs for insert
  with check ( auth.role() = 'authenticated' );

-- ==================== COMUNICAÇÃO INTERNA ====================

-- Servidores
create table if not exists public.servers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  icon_url text,
  owner_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.servers enable row level security;

drop policy if exists "Membros podem ver servidores" on public.servers;
create policy "Membros podem ver servidores"
  on public.servers for select
  using ( exists (select 1 from public.members m where m.server_id = id and m.user_id = auth.uid()) or auth.uid() = owner_id );

drop policy if exists "Usuarios autenticados podem criar servidores" on public.servers;
create policy "Usuarios autenticados podem criar servidores"
  on public.servers for insert
  with check ( auth.role() = 'authenticated' );

drop policy if exists "Dono pode editar servidor" on public.servers;
create policy "Dono pode editar servidor"
  on public.servers for update
  using ( auth.uid() = owner_id );

drop policy if exists "Dono pode excluir servidor" on public.servers;
create policy "Dono pode excluir servidor"
  on public.servers for delete
  using ( auth.uid() = owner_id );

-- Canais
create table if not exists public.channels (
  id uuid default uuid_generate_v4() primary key,
  server_id uuid references public.servers(id) on delete cascade not null,
  name text not null,
  type text not null default 'text' check (type in ('text','voice')),
  position int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.channels enable row level security;

drop policy if exists "Membros podem ver canais" on public.channels;
create policy "Membros podem ver canais"
  on public.channels for select
  using ( exists (select 1 from public.members m where m.server_id = server_id and m.user_id = auth.uid()) or exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()) );

drop policy if exists "Dono pode criar canais" on public.channels;
create policy "Dono pode criar canais"
  on public.channels for insert
  with check ( exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()) );

drop policy if exists "Dono pode editar canais" on public.channels;
create policy "Dono pode editar canais"
  on public.channels for update
  using ( exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()) );

drop policy if exists "Dono pode excluir canais" on public.channels;
create policy "Dono pode excluir canais"
  on public.channels for delete
  using ( exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()) );

-- Membros de servidor
create table if not exists public.members (
  id uuid default uuid_generate_v4() primary key,
  server_id uuid references public.servers(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(server_id, user_id)
);

alter table public.members enable row level security;

drop policy if exists "Membros podem ver membros" on public.members;
create policy "Membros podem ver membros"
  on public.members for select
  using ( exists (select 1 from public.members m where m.server_id = server_id and m.user_id = auth.uid()) or exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()) );

drop policy if exists "Dono pode adicionar membros" on public.members;
create policy "Dono pode adicionar membros"
  on public.members for insert
  with check ( exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()) );

drop policy if exists "Dono pode remover membros" on public.members;
create policy "Dono pode remover membros"
  on public.members for delete
  using ( exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()) );

-- Mensagens
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  attachments jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

drop policy if exists "Membros podem ver mensagens" on public.messages;
create policy "Membros podem ver mensagens"
  on public.messages for select
  using ( exists (select 1 from public.channels c join public.members m on c.server_id = m.server_id where c.id = channel_id and m.user_id = auth.uid()) or exists (select 1 from public.channels c join public.servers s on c.server_id = s.id where c.id = channel_id and s.owner_id = auth.uid()) );

drop policy if exists "Membros podem enviar mensagens" on public.messages;
create policy "Membros podem enviar mensagens"
  on public.messages for insert
  with check ( exists (select 1 from public.channels c join public.members m on c.server_id = m.server_id where c.id = channel_id and m.user_id = auth.uid()) or exists (select 1 from public.channels c join public.servers s on c.server_id = s.id where c.id = channel_id and s.owner_id = auth.uid()) );

drop policy if exists "Usuarios podem deletar suas proprias mensagens" on public.messages;
create policy "Usuarios podem deletar suas proprias mensagens"
  on public.messages for delete
  using ( auth.uid() = user_id );

-- Sessoes de voz
create table if not exists public.voice_sessions (
  id uuid default uuid_generate_v4() primary key,
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  left_at timestamp with time zone
);

alter table public.voice_sessions enable row level security;

drop policy if exists "Membros podem ver sessoes de voz" on public.voice_sessions;
create policy "Membros podem ver sessoes de voz"
  on public.voice_sessions for select
  using ( exists (select 1 from public.channels c join public.members m on c.server_id = m.server_id where c.id = channel_id and m.user_id = auth.uid()) or exists (select 1 from public.channels c join public.servers s on c.server_id = s.id where c.id = channel_id and s.owner_id = auth.uid()) );

drop policy if exists "Usuarios podem criar sessao de voz" on public.voice_sessions;
create policy "Usuarios podem criar sessao de voz"
  on public.voice_sessions for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Usuarios podem atualizar sua propria sessao" on public.voice_sessions;
create policy "Usuarios podem atualizar sua propria sessao"
  on public.voice_sessions for update
  using ( auth.uid() = user_id );

-- ==================== CONTEÚDO PÚBLICO ====================

-- Aparência / Configurações públicas do site
create table if not exists public.appearance (
  id uuid default uuid_generate_v4() primary key,
  discord_invite_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.appearance enable row level security;

drop policy if exists "Qualquer pessoa pode ver appearance" on public.appearance;
create policy "Qualquer pessoa pode ver appearance"
  on public.appearance for select
  using ( true );

drop policy if exists "Apenas admins podem editar appearance insert" on public.appearance;
create policy "Apenas admins podem editar appearance insert"
  on public.appearance for insert
  with check ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

drop policy if exists "Apenas admins podem editar appearance update" on public.appearance;
create policy "Apenas admins podem editar appearance update"
  on public.appearance for update
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

-- Notícias
create table if not exists public.news (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  is_public boolean default true,
  author_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.news enable row level security;

drop policy if exists "Qualquer usuario autenticado pode ver news" on public.news;
create policy "Qualquer usuario autenticado pode ver news"
  on public.news for select
  using ( auth.role() = 'authenticated' );

drop policy if exists "Usuarios autenticados podem criar news" on public.news;
create policy "Usuarios autenticados podem criar news"
  on public.news for insert
  with check ( auth.role() = 'authenticated' );

drop policy if exists "Usuarios podem editar suas proprias news" on public.news;
create policy "Usuarios podem editar suas proprias news"
  on public.news for update
  using ( auth.uid() = author_id or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

-- Boletins / Denúncias anônimas
create table if not exists public.boletins (
  id uuid default uuid_generate_v4() primary key,
  comunicante text not null,
  descricao text not null,
  localizacao text,
  status text default 'Pendente',
  data_fato timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.boletins enable row level security;

drop policy if exists "Qualquer pessoa pode criar boletins" on public.boletins;
create policy "Qualquer pessoa pode criar boletins"
  on public.boletins for insert
  with check ( true );

drop policy if exists "Apenas admins podem ver boletins" on public.boletins;
create policy "Apenas admins podem ver boletins"
  on public.boletins for select
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

drop policy if exists "Apenas admins podem atualizar boletins" on public.boletins;
create policy "Apenas admins podem atualizar boletins"
  on public.boletins for update
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

-- Pedidos de integração / login
create table if not exists public.integration_requests (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  passport_id text not null,
  phone text not null,
  desired_login text not null,
  discord_name text,
  details text,
  status text default 'pendente',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.integration_requests enable row level security;

drop policy if exists "Qualquer pessoa pode criar integration_requests" on public.integration_requests;
create policy "Qualquer pessoa pode criar integration_requests"
  on public.integration_requests for insert
  with check ( true );

drop policy if exists "Apenas admins podem ver integration_requests" on public.integration_requests;
create policy "Apenas admins podem ver integration_requests"
  on public.integration_requests for select
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

drop policy if exists "Apenas admins podem atualizar integration_requests" on public.integration_requests;
create policy "Apenas admins podem atualizar integration_requests"
  on public.integration_requests for update
  using ( exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') );

-- Live Streams
create table if not exists public.live_streams (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  links jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.live_streams enable row level security;

drop policy if exists "Qualquer usuario autenticado pode ver live_streams" on public.live_streams;
create policy "Qualquer usuario autenticado pode ver live_streams"
  on public.live_streams for select
  using ( auth.role() = 'authenticated' );

drop policy if exists "Usuarios autenticados podem criar live_streams" on public.live_streams;
create policy "Usuarios autenticados podem criar live_streams"
  on public.live_streams for insert
  with check ( auth.role() = 'authenticated' );

drop policy if exists "Usuarios podem deletar suas proprias live_streams" on public.live_streams;
create policy "Usuarios podem deletar suas proprias live_streams"
  on public.live_streams for delete
  using ( auth.uid() = user_id );

drop policy if exists "Usuarios podem atualizar suas proprias live_streams" on public.live_streams;
create policy "Usuarios podem atualizar suas proprias live_streams"
  on public.live_streams for update
  using ( auth.uid() = user_id );
