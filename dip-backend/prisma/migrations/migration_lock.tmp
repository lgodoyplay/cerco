-- Servidores
create table servers (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  icon_url text,
  owner_id text not null references users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Canais
create table channels (
  id text primary key default gen_random_uuid()::text,
  server_id text not null references servers(id) on delete cascade,
  name text not null,
  type text not null default 'text' check (type in ('text','voice')),
  position int default 0,
  created_at timestamptz default now()
);

-- Mensagens
create table messages (
  id text primary key default gen_random_uuid()::text,
  channel_id text not null references channels(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  content text not null,
  attachments jsonb,
  created_at timestamptz default now()
);

-- Membros de servidor
create table members (
  id text primary key default gen_random_uuid()::text,
  server_id text not null references servers(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  joined_at timestamptz default now(),
  unique(server_id, user_id)
);

-- Sessoes de voz
create table voice_sessions (
  id text primary key default gen_random_uuid()::text,
  channel_id text not null references channels(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  joined_at timestamptz default now(),
  left_at timestamptz
);

-- Indices
create index idx_channels_server on channels(server_id);
create index idx_messages_channel on messages(channel_id);
create index idx_members_server on members(server_id);
create index idx_voice_channel on voice_sessions(channel_id);
create index idx_messages_user on messages(user_id);

-- RLS (habilitar se necessario)
-- alter table servers enable row level security;
-- alter table channels enable row level security;
-- alter table messages enable row level security;
-- alter table members enable row level security;
-- alter table voice_sessions enable row level security;
