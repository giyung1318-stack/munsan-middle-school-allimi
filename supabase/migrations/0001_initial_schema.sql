-- Repeat-safe portal schema: user-selected roles are requests only; DB roles stay student until an administrator changes them.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated;

do $$ begin
  create type public.app_role as enum ('student', 'general', 'teacher', 'admin');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  requested_role text not null default 'student' check (requested_role in ('student','teacher','general')),
  role public.app_role not null default 'student',
  teacher_approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "profiles_update_display_name_self" on public.profiles;
create policy "profiles_update_display_name_self" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create or replace function private.can_manage_resources()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid())
    and (p.role = 'admin' or (p.role = 'teacher' and p.teacher_approved)));
$$;
revoke all on function private.can_manage_resources() from public, anon, authenticated;
grant execute on function private.can_manage_resources() to anon, authenticated;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, requested_role, role, teacher_approved)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''),
    case when new.raw_user_meta_data ->> 'requested_role' in ('student','teacher','general') then new.raw_user_meta_data ->> 'requested_role' else 'student' end,
    'student', false)
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();
do $$ begin
  if to_regprocedure('public.handle_new_user()') is not null then
    revoke all on function public.handle_new_user() from public, anon, authenticated;
  end if;
end $$;

create table if not exists public.learning_resources (
  id uuid primary key default gen_random_uuid(), title text not null, description text,
  storage_path text not null unique, category text not null default '학습 자료',
  audience text not null default 'members' check (audience in ('public','members','teachers')),
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);
alter table public.learning_resources enable row level security;
revoke all on public.learning_resources from anon, authenticated;
grant select on public.learning_resources to anon, authenticated;
grant insert, update, delete on public.learning_resources to authenticated;
drop policy if exists "resources_select_by_audience" on public.learning_resources;
create policy "resources_select_by_audience" on public.learning_resources for select to anon, authenticated using (
  audience = 'public' or (auth.uid() is not null and audience = 'members') or
  (auth.uid() is not null and audience = 'teachers' and private.can_manage_resources())
);
drop policy if exists "resources_insert_approved_teachers" on public.learning_resources;
create policy "resources_insert_approved_teachers" on public.learning_resources for insert to authenticated with check (
  created_by = (select auth.uid()) and private.can_manage_resources()
);
drop policy if exists "resources_update_approved_teachers" on public.learning_resources;
create policy "resources_update_approved_teachers" on public.learning_resources for update to authenticated using (
  created_by = (select auth.uid()) and private.can_manage_resources()
) with check (created_by = (select auth.uid()) and private.can_manage_resources());
drop policy if exists "resources_delete_approved_teachers" on public.learning_resources;
create policy "resources_delete_approved_teachers" on public.learning_resources for delete to authenticated using (
  created_by = (select auth.uid()) and private.can_manage_resources()
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('learning-materials','learning-materials',false,20971520,null)
on conflict (id) do update set public = false, file_size_limit = 20971520;
drop policy if exists "learning_materials_read_visible_resources" on storage.objects;
create policy "learning_materials_read_visible_resources" on storage.objects for select to anon, authenticated using (
  bucket_id = 'learning-materials' and exists (select 1 from public.learning_resources r where r.storage_path = name)
);
drop policy if exists "learning_materials_insert_approved_teacher_own_folder" on storage.objects;
create policy "learning_materials_insert_approved_teacher_own_folder" on storage.objects for insert to authenticated with check (
  bucket_id = 'learning-materials' and (storage.foldername(name))[1] = (select auth.uid())::text and private.can_manage_resources()
);
drop policy if exists "learning_materials_delete_approved_teacher_own_folder" on storage.objects;
create policy "learning_materials_delete_approved_teacher_own_folder" on storage.objects for delete to authenticated using (
  bucket_id = 'learning-materials' and (storage.foldername(name))[1] = (select auth.uid())::text and private.can_manage_resources()
);
do $$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
