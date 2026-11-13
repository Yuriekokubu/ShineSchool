-- ShineSchool student directory
-- Run this migration in Supabase SQL Editor before using student management.

create sequence if not exists public.students_student_code_seq start with 1 increment by 1;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_code text not null unique default ('sh' || lpad(nextval('public.students_student_code_seq'::regclass)::text, 5, '0')),
  first_name text not null,
  last_name text not null,
  class_name text not null,
  room text,
  status text not null default 'กำลังศึกษา'
    check (status in ('กำลังศึกษา', 'พักการเรียน')),
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_student_code_not_blank check (char_length(trim(student_code)) > 0),
  constraint students_first_name_not_blank check (char_length(trim(first_name)) > 0),
  constraint students_last_name_not_blank check (char_length(trim(last_name)) > 0)
);

create index if not exists students_class_name_idx on public.students (class_name);
create index if not exists students_status_idx on public.students (status);
create index if not exists students_created_at_idx on public.students (created_at desc);

create or replace function public.set_students_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_students_updated_at on public.students;
create trigger set_students_updated_at
before update on public.students
for each row execute function public.set_students_updated_at();

alter table public.students enable row level security;

drop policy if exists "Admins can view students" on public.students;
create policy "Admins can view students"
on public.students for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can insert students" on public.students;
create policy "Admins can insert students"
on public.students for insert
to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update students" on public.students;
create policy "Admins can update students"
on public.students for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can delete students" on public.students;
create policy "Admins can delete students"
on public.students for delete
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-photos',
  'student-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Admins can view student photos" on storage.objects;
create policy "Admins can view student photos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'student-photos'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Admins can upload student photos" on storage.objects;
create policy "Admins can upload student photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'student-photos'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

drop policy if exists "Admins can delete student photos" on storage.objects;
create policy "Admins can delete student photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'student-photos'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);