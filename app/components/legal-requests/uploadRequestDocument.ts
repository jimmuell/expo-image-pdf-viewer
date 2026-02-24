import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { supabase } from "@/app/lib/supabase";

const BUCKET = "documents";

export type UploadRequestDocumentResult =
  | { ok: true; doc: { id: string; path: string; name: string } }
  | { ok: false; message: string };

async function uploadToRequest(
  requestId: string,
  uri: string,
  fileName: string | null | undefined,
  mimeType: string | null | undefined
): Promise<UploadRequestDocumentResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated" };

  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
  const arrayBuffer = decode(base64);

  const safeName = (fileName || "document").replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `legal-requests/${requestId}/${user.id}/${Date.now()}-${safeName}`;

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: mimeType ?? "application/octet-stream",
      upsert: false,
    });

  if (storageError) return { ok: false, message: storageError.message };

  const { data, error: dbError } = await supabase
    .from("legal_request_documents")
    .insert({
      legal_request_id: requestId,
      uploaded_by: user.id,
      path,
      name: safeName,
      mime_type: mimeType ?? null,
      size: null,
    })
    .select("id, path, name")
    .single();

  if (dbError || !data) {
    // Best-effort cleanup: remove the uploaded file
    await supabase.storage.from(BUCKET).remove([path]);
    return { ok: false, message: dbError?.message ?? "Failed to record document" };
  }

  return { ok: true, doc: data as { id: string; path: string; name: string } };
}

/** Opens Files app filtered to PDFs and uploads to the request. */
export async function uploadRequestPdf(
  requestId: string
): Promise<UploadRequestDocumentResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return { ok: false, message: "Selection canceled" };
    const { uri, name, mimeType } = result.assets[0];
    return uploadToRequest(requestId, uri, name, mimeType ?? "application/pdf");
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Upload failed" };
  }
}

/** Opens Files app filtered to images and uploads to the request. */
export async function uploadRequestImage(
  requestId: string
): Promise<UploadRequestDocumentResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "image/*",
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return { ok: false, message: "Selection canceled" };
    const { uri, name, mimeType } = result.assets[0];
    return uploadToRequest(requestId, uri, name, mimeType ?? "image/jpeg");
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Upload failed" };
  }
}

/** Opens the Photos library and uploads the selected image to the request. */
export async function uploadRequestImageFromLibrary(
  requestId: string
): Promise<UploadRequestDocumentResult> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (result.canceled) return { ok: false, message: "Selection canceled" };
    const { uri, fileName, mimeType } = result.assets[0];
    return uploadToRequest(requestId, uri, fileName, mimeType ?? "image/jpeg");
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Upload failed" };
  }
}
