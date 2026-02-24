-- Attorneys can see documents on any case they can see (including unassigned),
-- matching the existing legal_requests SELECT policy.

-- ── legal_request_documents ─────────────────────────────────────────────────

drop policy if exists "users can view request documents" on public.legal_request_documents;

create policy "users can view request documents"
  on public.legal_request_documents for select
  to authenticated
  using (
    uploaded_by = auth.uid()
    or exists (
      select 1 from public.legal_requests lr
      where lr.id = legal_request_id
        and (
          lr.client_id   = auth.uid()
          or lr.attorney_id = auth.uid()
          or (
            lr.attorney_id is null
            and exists (
              select 1 from public.profiles
              where id = auth.uid() and role = 'attorney'
            )
          )
        )
    )
  );

-- ── storage.objects ──────────────────────────────────────────────────────────

drop policy if exists "legal request participants can read documents" on storage.objects;

create policy "legal request participants can read documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'legal-requests'
    and exists (
      select 1 from public.legal_requests
      where id = (storage.foldername(name))[2]::uuid
        and (
          client_id   = auth.uid()
          or attorney_id = auth.uid()
          or (
            attorney_id is null
            and exists (
              select 1 from public.profiles
              where id = auth.uid() and role = 'attorney'
            )
          )
        )
    )
  );
