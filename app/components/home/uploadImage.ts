import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { supabase } from "@/app/lib/supabase";

const BUCKET = "documents";

export type UploadImageResult =
  | { ok: true; path: string }
  | { ok: false; message: string };

export async function uploadImage(): Promise<UploadImageResult> {
  try {
    const pickResult = await DocumentPicker.getDocumentAsync({
      type: "image/*",
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (pickResult.canceled) {
      return { ok: false, message: "Selection canceled" };
    }

    const { uri, name, mimeType } = pickResult.assets[0];
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });
    const arrayBuffer = decode(base64);

    const safeName = (name || "image.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}-${safeName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType: mimeType ?? "image/jpeg",
        upsert: false,
      });

    if (error) {
      return { ok: false, message: error.message };
    }

    return { ok: true, path: data.path };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return { ok: false, message };
  }
}
