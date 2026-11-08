-- 狐隱 KOGAKURE：第一階段，人員名帖與管理權限
-- Run once in Supabase SQL Editor. Publishable key is safe for the browser; never use service_role client-side.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

create or replace function public.is_site_admin()
returns boolean language sql stable security definer set search_path = public
as $$
 select exists(select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

drop policy if exists "admin can read own membership" on public.admin_users;
create policy "admin can read own membership" on public.admin_users
 for select to authenticated using (user_id = (select auth.uid()));
-- No public INSERT/UPDATE/DELETE policy. Add admins manually through the Supabase SQL Editor.

create table if not exists public.staff (
 id uuid primary key default gen_random_uuid(),
 display_name text not null check (char_length(display_name) between 1 and 60),
 role text not null default '接待者',
 tagline text not null default '',
 bio text not null default '',
 image_url text,
 thumbnail_url text,
 theme_color text not null default '#82c8bc' check(theme_color ~ '^#[0-9a-fA-F]{6}$'),
 effect text not null default 'foxfire' check(effect in ('foxfire','sakura','starlight','gold','none')),
 socials jsonb not null default '[]'::jsonb check(jsonb_typeof(socials)='array'),
 services text[] not null default '{}',
 is_published boolean not null default false,
 sort_order integer not null default 100,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists staff_public_order_idx on public.staff(is_published,sort_order);
alter table public.staff enable row level security;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path=public as $$
begin
 new.updated_at=now();
 return new;
end; $$;
drop trigger if exists staff_updated_at on public.staff;
create trigger staff_updated_at before update on public.staff
 for each row execute function public.set_updated_at();

drop policy if exists "public sees published staff" on public.staff;
create policy "public sees published staff" on public.staff
 for select to anon,authenticated using (is_published = true or (select public.is_site_admin()));
drop policy if exists "admins create staff" on public.staff;
create policy "admins create staff" on public.staff
 for insert to authenticated with check ((select public.is_site_admin()));
drop policy if exists "admins update staff" on public.staff;
create policy "admins update staff" on public.staff
 for update to authenticated using ((select public.is_site_admin())) with check ((select public.is_site_admin()));
drop policy if exists "admins delete staff" on public.staff;
create policy "admins delete staff" on public.staff
 for delete to authenticated using ((select public.is_site_admin()));

grant usage on schema public to anon,authenticated;
grant select on public.staff to anon,authenticated;
grant insert,update,delete on public.staff to authenticated;
grant select on public.admin_users to authenticated;
grant execute on function public.is_site_admin() to anon,authenticated;

-- Public images are cache-friendly. Only authenticated admins may upload/update/delete.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('staff-media','staff-media',true,12582912,ARRAY['image/webp','image/png','image/jpeg','image/avif']::text[])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "staff-media admin insert" on storage.objects;
create policy "staff-media admin insert" on storage.objects
 for insert to authenticated with check (bucket_id='staff-media' and name like 'staff/%' and (select public.is_site_admin()));
drop policy if exists "staff-media admin update" on storage.objects;
create policy "staff-media admin update" on storage.objects
 for update to authenticated using (bucket_id='staff-media' and (select public.is_site_admin()))
 with check (bucket_id='staff-media' and (select public.is_site_admin()));
drop policy if exists "staff-media admin delete" on storage.objects;
create policy "staff-media admin delete" on storage.objects
 for delete to authenticated using (bucket_id='staff-media' and (select public.is_site_admin()));
-- Admin user setup (after creating a user in Authentication > Users):
-- insert into public.admin_users(user_id) values ('PASTE_AUTH_USER_UUID_HERE');
