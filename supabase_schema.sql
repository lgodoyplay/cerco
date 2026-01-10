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
