create policy "allow anon deletes"
on storage.objects
for delete
to anon
using (bucket_id = 'documents');
