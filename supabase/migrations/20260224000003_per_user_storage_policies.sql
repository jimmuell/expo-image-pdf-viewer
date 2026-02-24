-- Replace broad authenticated policies with per-user folder policies.
-- Files are stored under {user_id}/{timestamp}-{filename} so the first
-- path segment is always the owner's auth.uid().
drop policy if exists "allow authenticated uploads" on storage.objects;
drop policy if exists "allow authenticated reads" on storage.objects;
drop policy if exists "allow authenticated deletes" on storage.objects;

create policy "users can upload own documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users can read own documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users can delete own documents"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
