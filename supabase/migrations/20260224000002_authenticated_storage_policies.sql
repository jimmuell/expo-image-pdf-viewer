-- Drop the anon policies now that the app requires authentication
drop policy if exists "allow anon uploads" on storage.objects;
drop policy if exists "allow anon reads" on storage.objects;
drop policy if exists "allow anon deletes" on storage.objects;

-- Allow authenticated users full access to the documents bucket
create policy "allow authenticated uploads"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'documents');

create policy "allow authenticated reads"
on storage.objects
for select
to authenticated
using (bucket_id = 'documents');

create policy "allow authenticated deletes"
on storage.objects
for delete
to authenticated
using (bucket_id = 'documents');
