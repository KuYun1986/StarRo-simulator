-- 繁星仙境模擬器｜管理後台 Supabase 初始化
-- 執行前：把 YOUR_ADMIN_EMAIL 改成你的管理員 Email（要和 Supabase Auth 使用者相同）

create table if not exists public.site_config (
  id text primary key,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_config enable row level security;

-- 前台只讀：任何人可讀設定
create policy "public can read starro config"
on public.site_config for select
to anon, authenticated
using (true);

-- 管理員寫入：只有指定 Email 登入後可新增 / 修改 / 刪除
create policy "starro admin insert"
on public.site_config for insert
to authenticated
with check ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL');

create policy "starro admin update"
on public.site_config for update
to authenticated
using ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL')
with check ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL');

create policy "starro admin delete"
on public.site_config for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL');

insert into public.site_config(id,config)
values ('main','{}'::jsonb)
on conflict (id) do nothing;
