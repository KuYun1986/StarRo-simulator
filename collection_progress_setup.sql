-- Run once in the Supabase SQL Editor for the project configured in supabase-config.js.
-- Users can only read and write their own collection checkmarks.
create table if not exists public.collection_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint collection_selected_is_array check (jsonb_typeof(selected) = 'array')
);
alter table public.collection_progress enable row level security;
drop policy if exists "collection progress read own" on public.collection_progress;
create policy "collection progress read own" on public.collection_progress
 for select to authenticated using (auth.uid()=user_id);
drop policy if exists "collection progress insert own" on public.collection_progress;
create policy "collection progress insert own" on public.collection_progress
 for insert to authenticated with check (auth.uid()=user_id);
drop policy if exists "collection progress update own" on public.collection_progress;
create policy "collection progress update own" on public.collection_progress
 for update to authenticated using (auth.uid()=user_id)
 with check (auth.uid()=user_id);
revoke all on public.collection_progress from anon;
grant select,insert,update on public.collection_progress to authenticated;
