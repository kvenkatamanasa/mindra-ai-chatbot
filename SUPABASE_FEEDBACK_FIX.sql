-- Run this once in Supabase SQL Editor.
-- Safe if the feedback column already exists.

alter table public.messages
add column if not exists feedback text;

alter table public.messages
drop constraint if exists messages_feedback_check;

alter table public.messages
add constraint messages_feedback_check
check (feedback is null or feedback in ('up', 'down'));

create index if not exists messages_feedback_idx
on public.messages(feedback);
