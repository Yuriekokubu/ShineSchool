-- Enable read tracking and realtime events for admission notifications.
alter table public.admission_applications
  add column if not exists is_read boolean not null default false;

-- Ensure the admission table is included in Supabase Realtime publication.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'admission_applications'
  ) then
    alter publication supabase_realtime add table public.admission_applications;
  end if;
end
$$;

-- Admin-only read/update policies. Public visitors can still only INSERT.
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

-- Admins can generate signed URLs for private admission photos.
drop policy if exists "Admins can view admission photos" on storage.objects;
create policy "Admins can view admission photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'admission-photos'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
