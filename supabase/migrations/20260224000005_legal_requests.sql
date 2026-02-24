-- ============================================================
-- Legal Requests feature
-- ============================================================

-- updated_at trigger helper (idempotent)
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------

create table public.legal_requests (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  client_id    uuid not null references auth.users(id) on delete cascade,
  attorney_id  uuid references auth.users(id) on delete set null,
  case_type    text not null,   -- 'immigration' | 'personal_injury' | 'family_law' | 'criminal' | 'estate' | 'other'
  full_name    text not null,
  phone        text,
  email        text,
  description  text,
  status       text not null default 'draft'  -- 'draft' | 'submitted' | 'in_review' | 'closed'
);

create trigger set_legal_requests_updated_at
  before update on public.legal_requests
  for each row execute function public.handle_updated_at();

create table public.legal_request_documents (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  legal_request_id uuid not null references public.legal_requests(id) on delete cascade,
  uploaded_by      uuid not null references auth.users(id) on delete cascade,
  path             text not null,  -- legal-requests/{request_id}/{uploader_id}/{ts}-{name}
  name             text not null,
  mime_type        text,
  size             bigint
);

-- ----------------------------------------------------------------
-- RLS — legal_requests
-- ----------------------------------------------------------------

alter table public.legal_requests enable row level security;

-- INSERT: client_id must equal the calling user
create policy "clients can create requests"
  on public.legal_requests for insert
  to authenticated
  with check (client_id = auth.uid());

-- SELECT: own request (client) OR assigned to me (attorney) OR unassigned and I am an attorney
create policy "users can view relevant requests"
  on public.legal_requests for select
  to authenticated
  using (
    client_id = auth.uid()
    or attorney_id = auth.uid()
    or (
      attorney_id is null
      and exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'attorney'
      )
    )
  );

-- UPDATE: own request (client) OR assigned to me (attorney) OR claiming unassigned (attorney)
create policy "users can update relevant requests"
  on public.legal_requests for update
  to authenticated
  using (
    client_id = auth.uid()
    or attorney_id = auth.uid()
    or (
      attorney_id is null
      and exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'attorney'
      )
    )
  );

-- ----------------------------------------------------------------
-- RLS — legal_request_documents
-- ----------------------------------------------------------------

alter table public.legal_request_documents enable row level security;

-- SELECT: uploaded by me OR I am the client/attorney on the request
create policy "users can view request documents"
  on public.legal_request_documents for select
  to authenticated
  using (
    uploaded_by = auth.uid()
    or exists (
      select 1 from public.legal_requests lr
      where lr.id = legal_request_id
        and (lr.client_id = auth.uid() or lr.attorney_id = auth.uid())
    )
  );

-- INSERT: uploaded_by = me AND I am client/attorney on the request
create policy "users can add documents to their requests"
  on public.legal_request_documents for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.legal_requests lr
      where lr.id = legal_request_id
        and (lr.client_id = auth.uid() or lr.attorney_id = auth.uid())
    )
  );

-- DELETE: only the uploader can remove their document
create policy "users can delete own request documents"
  on public.legal_request_documents for delete
  to authenticated
  using (uploaded_by = auth.uid());

-- ----------------------------------------------------------------
-- Storage policies (documents bucket, legal-requests/ prefix)
-- Path: legal-requests/{request_id}/{uploader_id}/{timestamp}-{filename}
-- foldername[1] = 'legal-requests'
-- foldername[2] = request_id
-- foldername[3] = uploader_id
-- ----------------------------------------------------------------

-- SELECT: participant on the linked legal request
create policy "legal request participants can read documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'legal-requests'
    and exists (
      select 1 from public.legal_requests
      where id = (storage.foldername(name))[2]::uuid
        and (client_id = auth.uid() or attorney_id = auth.uid())
    )
  );

-- INSERT: participant AND uploader folder matches auth.uid()
create policy "legal request participants can upload documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'legal-requests'
    and (storage.foldername(name))[3] = auth.uid()::text
    and exists (
      select 1 from public.legal_requests
      where id = (storage.foldername(name))[2]::uuid
        and (client_id = auth.uid() or attorney_id = auth.uid())
    )
  );

-- DELETE: only the uploader (foldername[3] = uid)
create policy "legal request uploaders can delete their documents"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'legal-requests'
    and (storage.foldername(name))[3] = auth.uid()::text
  );
