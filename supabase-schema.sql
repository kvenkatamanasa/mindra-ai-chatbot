-- Run this once in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  model text,
  feedback text check (feedback in ('up','down')),
  created_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory text not null,
  created_at timestamptz not null default now()
);

create index if not exists conversations_user_updated_idx on public.conversations(user_id, updated_at desc);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index if not exists memories_user_created_idx on public.memories(user_id, created_at desc);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.memories enable row level security;

drop policy if exists conversations_owner on public.conversations;
create policy conversations_owner on public.conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists messages_owner on public.messages;
create policy messages_owner on public.messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists memories_owner on public.memories;
create policy memories_owner on public.memories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
