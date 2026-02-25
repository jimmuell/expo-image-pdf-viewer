import { supabase } from "./supabase";

const BUCKET = "documents";

export type LegalRequest = {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  attorney_id: string | null;
  case_type: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  description: string | null;
  status: string;
};

export type RequestDocument = {
  id: string;
  created_at: string;
  legal_request_id: string;
  uploaded_by: string;
  path: string;
  name: string;
  mime_type: string | null;
  size: number | null;
};

export type CreateRequestInput = {
  case_type: string;
  full_name: string;
  phone?: string;
  email?: string;
  description?: string;
};

// ── Case type helpers ────────────────────────────────────────────

export const CASE_TYPES: { value: string; label: string }[] = [
  { value: "immigration", label: "Immigration" },
  { value: "personal_injury", label: "Personal Injury" },
  { value: "family_law", label: "Family Law" },
  { value: "criminal", label: "Criminal" },
  { value: "estate", label: "Estate" },
  { value: "other", label: "Other" },
];

export function caseTypeLabel(value: string): string {
  return CASE_TYPES.find((t) => t.value === value)?.label ?? value;
}

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In Review",
  closed: "Closed",
};

export const STATUS_COLORS: Record<string, string> = {
  draft:     "#8A8F9D",
  submitted: "#1B2D4E",
  in_review: "#C9A84C",
  closed:    "#3A7D4E",
};

// ── Data functions ───────────────────────────────────────────────

export async function listLegalRequests(): Promise<LegalRequest[]> {
  const { data, error } = await supabase
    .from("legal_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as LegalRequest[];
}

export async function getLegalRequest(id: string): Promise<LegalRequest | null> {
  const { data, error } = await supabase
    .from("legal_requests")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as LegalRequest;
}

export async function createLegalRequest(
  input: CreateRequestInput
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated" };

  const { data, error } = await supabase
    .from("legal_requests")
    .insert({
      client_id: user.id,
      status: "draft",
      case_type: input.case_type,
      full_name: input.full_name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      description: input.description ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, message: error?.message ?? "Failed to create request" };
  return { ok: true, id: data.id };
}

export async function submitLegalRequest(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await supabase
    .from("legal_requests")
    .update({ status: "submitted" })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function claimLegalRequest(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated" };

  const { error } = await supabase
    .from("legal_requests")
    .update({ attorney_id: user.id, status: "in_review" })
    .eq("id", id)
    .is("attorney_id", null);

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function listRequestDocuments(
  requestId: string
): Promise<RequestDocument[]> {
  const { data, error } = await supabase
    .from("legal_request_documents")
    .select("*")
    .eq("legal_request_id", requestId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as RequestDocument[];
}

export async function deleteRequestDocument(
  doc: RequestDocument
): Promise<{ ok: boolean; message?: string }> {
  // Remove from storage first
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([doc.path]);
  if (storageError) return { ok: false, message: storageError.message };

  // Then remove DB row
  const { error: dbError } = await supabase
    .from("legal_request_documents")
    .delete()
    .eq("id", doc.id);
  if (dbError) return { ok: false, message: dbError.message };

  return { ok: true };
}

export async function getRequestDocumentUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}
