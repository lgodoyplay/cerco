-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text default 'officer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'officer');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- PRISOES (Arrests)
create table public.prisoes (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  alcunha text,
  documento text,
  data_nascimento date,
  mae text,
  pai text,
  artigo text,
  pena text,
  regime text,
  data_prisao timestamp with time zone default now(),
  local_prisao text,
  conduzido_por text,
  origem_bo text,
  foto_principal text,
  foto_corpo text,
  observacoes text,
  status text default 'Preso',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users
);

alter table public.prisoes enable row level security;

create policy "Prisoes viewable by authenticated users" on public.prisoes
  for select to authenticated using (true);

create policy "Prisoes insertable by authenticated users" on public.prisoes
  for insert to authenticated with check (true);

create policy "Prisoes updatable by authenticated users" on public.prisoes
  for update to authenticated using (true);

create policy "Prisoes deletable by authenticated users" on public.prisoes
  for delete to authenticated using (true);

-- Public read access for prisoes (for public page)
create policy "Prisoes public view" on public.prisoes
  for select to anon using (true);


-- PROCURADOS (Wanted)
create table public.procurados (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  alcunha text,
  documento text,
  motivo text,
  periculosidade text,
  recompensa text,
  observacoes text,
  status text default 'Procurado',
  foto_principal text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users
);

alter table public.procurados enable row level security;

create policy "Procurados viewable by authenticated users" on public.procurados
  for select to authenticated using (true);

create policy "Procurados insertable by authenticated users" on public.procurados
  for insert to authenticated with check (true);

create policy "Procurados updatable by authenticated users" on public.procurados
  for update to authenticated using (true);

create policy "Procurados deletable by authenticated users" on public.procurados
  for delete to authenticated using (true);

-- Public read access for procurados
create policy "Procurados public view" on public.procurados
  for select to anon using (true);


-- INVESTIGACOES (Investigations)
create table public.investigacoes (
  id uuid default uuid_generate_v4() primary key,
  titulo text not null,
  descricao text,
  prioridade text,
  status text default 'Em Andamento',
  data_inicio timestamp with time zone default now(),
  data_fim timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users
);

alter table public.investigacoes enable row level security;

create policy "Investigacoes viewable by authenticated users" on public.investigacoes
  for select to authenticated using (true);

create policy "Investigacoes insertable by authenticated users" on public.investigacoes
  for insert to authenticated with check (true);

create policy "Investigacoes updatable by authenticated users" on public.investigacoes
  for update to authenticated using (true);


-- PROVAS (Evidence)
create table public.provas (
  id uuid default uuid_generate_v4() primary key,
  investigacao_id uuid references public.investigacoes not null,
  tipo text,
  descricao text,
  arquivo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users
);

alter table public.provas enable row level security;

create policy "Provas viewable by authenticated users" on public.provas
  for select to authenticated using (true);

create policy "Provas insertable by authenticated users" on public.provas
  for insert to authenticated with check (true);


-- SYSTEM LOGS
create table public.system_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  action text,
  details text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.system_logs enable row level security;

create policy "Logs viewable by authenticated users" on public.system_logs
  for select to authenticated using (true);

create policy "Logs insertable by authenticated users" on public.system_logs
  for insert to authenticated with check (true);


-- SYSTEM SETTINGS
create table public.system_settings (
  key text primary key,
  value jsonb
);

alter table public.system_settings enable row level security;

create policy "Settings viewable by authenticated users" on public.system_settings
  for select to authenticated using (true);

create policy "Settings updatable by authenticated users" on public.system_settings
  for insert to authenticated with check (true);

create policy "Settings updatable by authenticated users update" on public.system_settings
  for update to authenticated using (true);


-- STORAGE BUCKETS (Must be created in Storage Dashboard, but policies can be here if buckets exist)
-- Note: You must create buckets 'prisoes', 'procurados', 'provas' in the dashboard first.
-- Below are generic policies assuming buckets exist.

-- Policy for 'prisoes' bucket
-- insert into storage.buckets (id, name) values ('prisoes', 'prisoes');
-- create policy "Public Access Prisoes" on storage.objects for select using ( bucket_id = 'prisoes' );
-- create policy "Auth Upload Prisoes" on storage.objects for insert with check ( bucket_id = 'prisoes' and auth.role() = 'authenticated' );

-- Policy for 'procurados' bucket
-- insert into storage.buckets (id, name) values ('procurados', 'procurados');
-- create policy "Public Access Procurados" on storage.objects for select using ( bucket_id = 'procurados' );
-- create policy "Auth Upload Procurados" on storage.objects for insert with check ( bucket_id = 'procurados' and auth.role() = 'authenticated' );

-- Policy for 'provas' bucket
-- insert into storage.buckets (id, name) values ('provas', 'provas');
-- create policy "Auth Access Provas" on storage.objects for select using ( bucket_id = 'provas' and auth.role() = 'authenticated' );
-- create policy "Auth Upload Provas" on storage.objects for insert with check ( bucket_id = 'provas' and auth.role() = 'authenticated' );
