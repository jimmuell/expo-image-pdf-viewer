-- Create the documents storage bucket
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Allow anyone to upload to the documents bucket
create policy "allow anon uploads"
on storage.objects
for insert
to anon
with check (bucket_id = 'documents');

-- Allow anyone to read from the documents bucket
create policy "allow anon reads"
on storage.objects
for select
to anon
using (bucket_id = 'documents');
