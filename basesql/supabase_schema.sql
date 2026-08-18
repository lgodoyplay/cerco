-- Tabela de Perfis de Usuários (vinculada ao auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text check (role in ('admin', 'officer', 'viewer')) default 'officer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Tabela de Prisões
create table public.prisoes (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  documento text,
  artigo text not null,
  data_prisao date not null,
  status text default 'Preso',
  foto_principal text,
  fotos_adicionais text[], -- Array de URLs
  local_prisao text,
  conduzido_por text,
  observacoes text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para prisoes
alter table public.prisoes enable row level security;

create policy "Qualquer usuario autenticado pode ver prisoes"
  on prisoes for select
  using ( auth.role() = 'authenticated' );

create policy "Usuarios autenticados podem criar prisoes"
  on prisoes for insert
  with check ( auth.role() = 'authenticated' );

create policy "Usuarios podem editar suas proprias prisoes ou admins"
  on prisoes for update
  using ( auth.uid() = created_by or exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Tabela de Procurados
create table public.procurados (
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

create policy "Qualquer usuario autenticado pode ver procurados"
  on procurados for select
  using ( auth.role() = 'authenticated' );

create policy "Usuarios autenticados podem criar procurados"
  on procurados for insert
  with check ( auth.role() = 'authenticated' );

create policy "Usuarios podem editar procurados"
  on procurados for update
  using ( auth.role() = 'authenticated' );

-- Tabela de Investigações
create table public.investigacoes (
  id uuid default uuid_generate_v4() primary key,
  titulo text not null,
  descricao text,
  status text default 'Em Andamento',
  prioridade text default 'Média',
  responsavel_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.investigacoes enable row level security;

create policy "Qualquer usuario autenticado pode ver investigacoes"
  on investigacoes for select
  using ( auth.role() = 'authenticated' );

create policy "Usuarios autenticados podem criar investigacoes"
  on investigacoes for insert
  with check ( auth.role() = 'authenticated' );

-- Tabela de Provas (Vinculada a Investigações)
create table public.provas (
  id uuid default uuid_generate_v4() primary key,
  investigacao_id uuid references public.investigacoes(id) on delete cascade,
  tipo text not null, -- Foto, Documento, Depoimento
  descricao text,
  arquivo_url text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.provas enable row level security;

create policy "Qualquer usuario autenticado pode ver provas"
  on provas for select
  using ( auth.role() = 'authenticated' );

create policy "Usuarios autenticados podem adicionar provas"
  on provas for insert
  with check ( auth.role() = 'authenticated' );

-- Tabela de Logs do Sistema
create table public.system_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  action text not null,
  details text,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.system_logs enable row level security;

create policy "Admins podem ver logs"
  on system_logs for select
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

create policy "Sistema pode criar logs"
  on system_logs for insert
  with check ( auth.role() = 'authenticated' );

-- ==================== COMUNICAÇÃO INTERNA ====================

-- Servidores
create table public.servers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  icon_url text,
  owner_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.servers enable row level security;

create policy "Membros podem ver servidores"
  on servers for select
  using ( exists (select 1 from members m where m.server_id = id and m.user_id = auth.uid()) or auth.uid() = owner_id );

create policy "Usuarios autenticados podem criar servidores"
  on servers for insert
  with check ( auth.role() = 'authenticated' );

create policy "Dono pode editar servidor"
  on servers for update
  using ( auth.uid() = owner_id );

create policy "Dono pode excluir servidor"
  on servers for delete
  using ( auth.uid() = owner_id );

-- Canais
create table public.channels (
  id uuid default uuid_generate_v4() primary key,
  server_id uuid references public.servers(id) on delete cascade not null,
  name text not null,
  type text not null default 'text' check (type in ('text','voice')),
  position int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.channels enable row level security;

create policy "Membros podem ver canais"
  on channels for select
  using ( exists (select 1 from members m where m.server_id = server_id and m.user_id = auth.uid()) or exists (select 1 from servers s where s.id = server_id and s.owner_id = auth.uid()) );

create policy "Dono pode criar canais"
  on channels for insert
  with check ( exists (select 1 from servers s where s.id = server_id and s.owner_id = auth.uid()) );

create policy "Dono pode editar canais"
  on channels for update
  using ( exists (select 1 from servers s where s.id = server_id and s.owner_id = auth.uid()) );

create policy "Dono pode excluir canais"
  on channels for delete
  using ( exists (select 1 from servers s where s.id = server_id and s.owner_id = auth.uid()) );

-- Membros de servidor
create table public.members (
  id uuid default uuid_generate_v4() primary key,
  server_id uuid references public.servers(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(server_id, user_id)
);

alter table public.members enable row level security;

create policy "Membros podem ver membros"
  on members for select
  using ( exists (select 1 from members m where m.server_id = server_id and m.user_id = auth.uid()) or exists (select 1 from servers s where s.id = server_id and s.owner_id = auth.uid()) );

create policy "Dono pode adicionar membros"
  on members for insert
  with check ( exists (select 1 from servers s where s.id = server_id and s.owner_id = auth.uid()) );

create policy "Dono pode remover membros"
  on members for delete
  using ( exists (select 1 from servers s where s.id = server_id and s.owner_id = auth.uid()) );

-- Mensagens
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  attachments jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

create policy "Membros podem ver mensagens"
  on messages for select
  using ( exists (select 1 from channels c join members m on c.server_id = m.server_id where c.id = channel_id and m.user_id = auth.uid()) or exists (select 1 from channels c join servers s on c.server_id = s.id where c.id = channel_id and s.owner_id = auth.uid()) );

create policy "Membros podem enviar mensagens"
  on messages for insert
  with check ( exists (select 1 from channels c join members m on c.server_id = m.server_id where c.id = channel_id and m.user_id = auth.uid()) or exists (select 1 from channels c join servers s on c.server_id = s.id where c.id = channel_id and s.owner_id = auth.uid()) );

create policy "Usuarios podem deletar suas proprias mensagens"
  on messages for delete
  using ( auth.uid() = user_id );

-- Sessoes de voz
create table public.voice_sessions (
  id uuid default uuid_generate_v4() primary key,
  channel_id uuid references public.channels(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  left_at timestamp with time zone
);

alter table public.voice_sessions enable row level security;

create policy "Membros podem ver sessoes de voz"
  on voice_sessions for select
  using ( exists (select 1 from channels c join members m on c.server_id = m.server_id where c.id = channel_id and m.user_id = auth.uid()) or exists (select 1 from channels c join servers s on c.server_id = s.id where c.id = channel_id and s.owner_id = auth.uid()) );

create policy "Usuarios podem criar sessao de voz"
  on voice_sessions for insert
  with check ( auth.uid() = user_id );

create policy "Usuarios podem atualizar sua propria sessao"
  on voice_sessions for update
  using ( auth.uid() = user_id );


-- STORAGE BUCKETS
-- (Execute isso separadamente ou configure via Interface do Supabase se o SQL não suportar criação de buckets diretamente em algumas versões)
-- insert into storage.buckets (id, name) values ('prisoes', 'prisoes');
-- insert into storage.buckets (id, name) values ('procurados', 'procurados');
-- insert into storage.buckets (id, name) values ('provas', 'provas');

-- POLICIES DE STORAGE
-- create policy "Authenticated users can upload images"
-- on storage.objects for insert
-- with check ( bucket_id in ('prisoes', 'procurados', 'provas') and auth.role() = 'authenticated' );

-- create policy "Authenticated users can select images"
-- on storage.objects for select
-- using ( bucket_id in ('prisoes', 'procurados', 'provas') and auth.role() = 'authenticated' );

-- ==================== CONTEÚDO PÚBLICO ====================

-- Aparência / Configurações públicas do site
create table public.appearance (
  id uuid default uuid_generate_v4() primary key,
  discord_invite_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.appearance enable row level security;

create policy "Qualquer pessoa pode ver appearance"
  on appearance for select
  using ( true );

create policy "Apenas admins podem editar appearance"
  on appearance for insert
  with check ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

create policy "Apenas admins podem editar appearance"
  on appearance for update
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Notícias
create table public.news (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  is_public boolean default true,
  author_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.news enable row level security;

create policy "Qualquer usuario autenticado pode ver news"
  on news for select
  using ( auth.role() = 'authenticated' );

create policy "Usuarios autenticados podem criar news"
  on news for insert
  with check ( auth.role() = 'authenticated' );

create policy "Usuarios podem editar suas proprias news"
  on news for update
  using ( auth.uid() = author_id or exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Boletins / Denúncias anônimas
create table public.boletins (
  id uuid default uuid_generate_v4() primary key,
  comunicante text not null,
  descricao text not null,
  localizacao text,
  status text default 'Pendente',
  data_fato timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.boletins enable row level security;

create policy "Qualquer pessoa pode criar boletins"
  on boletins for insert
  with check ( true );

create policy "Apenas admins podem ver boletins"
  on boletins for select
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

create policy "Apenas admins podem atualizar boletins"
  on boletins for update
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Pedidos de integração / login
create table public.integration_requests (
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

create policy "Qualquer pessoa pode criar integration_requests"
  on integration_requests for insert
  with check ( true );

create policy "Apenas admins podem ver integration_requests"
  on integration_requests for select
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

create policy "Apenas admins podem atualizar integration_requests"
  on integration_requests for update
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Live Streams
create table public.live_streams (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  links text[] not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.live_streams enable row level security;

create policy "Qualquer usuario autenticado pode ver live_streams"
  on live_streams for select
  using ( auth.role() = 'authenticated' );

create policy "Usuarios autenticados podem criar live_streams"
  on live_streams for insert
  with check ( auth.role() = 'authenticated' );

create policy "Usuarios podem deletar suas proprias live_streams"
  on live_streams for delete
  using ( auth.uid() = user_id );

create policy "Usuarios podem atualizar suas proprias live_streams"
  on live_streams for update
  using ( auth.uid() = user_id );
