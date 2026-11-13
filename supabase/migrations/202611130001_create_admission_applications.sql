-- ShineSchool public admission applications
-- Run this migration in Supabase SQL Editor before enabling public submissions.

create table if not exists public.admission_applications (
  id uuid primary key default gen_random_uuid(),
  student_first_name text not null,
  student_last_name text not null,
  age smallint not null check (age between 1 and 25),
  applying_level text not null,
  current_school text,
  parent_first_name text not null,
  parent_last_name text not null,
  relationship text not null default 'ผู้ปกครอง',
  phone text not null,
  email text,
  notes text,
  student_photo_path text,
  status text not null default 'pending' check (status in ('pending', 'contacted', 'reviewing', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.admission_applications enable row level security;

-- Visitors may submit only. Public users cannot read, update, or delete applications.
drop policy if exists "Anyone can submit admission applications" on public.admission_applications;
create policy "Anyone can submit admission applications"
on public.admission_applications
for insert
to anon, authenticated
with check (
  char_length(student_first_name) between 1 and 100
  and char_length(student_last_name) between 1 and 100
  and age between 1 and 25
  and char_length(parent_first_name) between 1 and 100
  and char_length(parent_last_name) between 1 and 100
  and char_length(phone) between 9 and 20
);

-- Only users with the trusted app_metadata role can review applications.
drop policy if exists "Admins can view admission applications" on public.admission_applications;
create policy "Admins can view admission applications"
on public.admission_applications
for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update admission applications" on public.admission_applications;
create policy "Admins can update admission applications"
on public.admission_applications
for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Private bucket: student photos are not publicly readable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('admission-photos', 'admission-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Visitors can upload admission photos" on storage.objects;
create policy "Visitors can upload admission photos"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'admission-photos'
  and (storage.foldername(name))[1] = 'applications'
);

-- No public SELECT, UPDATE, or DELETE policy is created for student photos.
