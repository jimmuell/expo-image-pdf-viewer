import { supabase } from "./supabase";

const BUCKET = "documents";

export type Document = {
  name: string;
  path: string;
  size: number | null;
};

export async function listDocuments(): Promise<Document[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.storage.from(BUCKET).list(user.id, {
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error || !data) return [];
  return data
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((file) => ({
      name: file.name,
      path: `${user.id}/${file.name}`,
      size: file.metadata?.size ?? null,
    }));
}

export async function getSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function deleteDocument(
  path: string
): Promise<{ ok: boolean; message?: string }> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export function displayName(path: string): string {
  return path.replace(/^\d+-/, "");
}
