-- Drop the manually-created starter profiles table if present, then
-- recreate it with the role column. On a fresh db reset this runs cleanly.
drop table if exists public.profiles cascade;
drop type if exists public.user_role cascade;

create type public.user_role as enum ('client', 'attorney', 'admin');

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        public.user_role not null default 'client',
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users can read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- Trigger: auto-create profile on signup, reading role from user metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    coalesce(
      (new.raw_user_meta_data->>'role')::public.user_role,
      'client'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
