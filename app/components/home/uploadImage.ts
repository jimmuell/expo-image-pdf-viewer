import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { supabase } from "@/app/lib/supabase";

const BUCKET = "documents";

export type UploadImageResult =
  | { ok: true; path: string }
  | { ok: false; message: string };

async function uploadFromUri(
  uri: string,
  fileName: string | null | undefined,
  mimeType: string | null | undefined
): Promise<UploadImageResult> {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
  const arrayBuffer = decode(base64);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated" };

  const safeName = (fileName || "image.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: mimeType ?? "image/jpeg",
      upsert: false,
    });

  if (error) return { ok: false, message: error.message };
  return { ok: true, path: data.path };
}

/** Opens the native Photos library picker (expo-image-picker). */
export async function uploadImageFromLibrary(): Promise<UploadImageResult> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (result.canceled) return { ok: false, message: "Selection canceled" };

    const { uri, fileName, mimeType } = result.assets[0];
    return uploadFromUri(uri, fileName, mimeType);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return { ok: false, message };
  }
}

/** Opens the Files app filtered to images (expo-document-picker). */
export async function uploadImage(): Promise<UploadImageResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "image/*",
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return { ok: false, message: "Selection canceled" };

    const { uri, name: fileName, mimeType } = result.assets[0];
    return uploadFromUri(uri, fileName, mimeType);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return { ok: false, message };
  }
}
