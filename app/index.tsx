import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { uploadPdf } from "@/app/components/home/uploadPdf";
import { uploadImage } from "@/app/components/home/uploadImage";
import {
  deleteDocument,
  displayName,
  getSignedUrl,
  listDocuments,
  type Document,
} from "@/app/lib/documents";

const IMAGE_EXTS = /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i;
function isImage(path: string) { return IMAGE_EXTS.test(path); }

export default function Index() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    const docs = await listDocuments();
    setDocuments(docs);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments])
  );

  const doUpload = async (type: "pdf" | "image") => {
    setUploading(true);
    const result = type === "pdf" ? await uploadPdf() : await uploadImage();
    setUploading(false);
    if (result.ok) {
      await loadDocuments();
    } else if (result.message !== "Selection canceled") {
      Alert.alert("Upload failed", result.message);
    }
  };

  const handleUpload = () => {
    Alert.alert("Upload", "What would you like to upload?", [
      { text: "Cancel", style: "cancel" },
      { text: "PDF", onPress: () => doUpload("pdf") },
      { text: "Image", onPress: () => doUpload("image") },
    ]);
  };

  const handleOpen = async (doc: Document) => {
    const url = await getSignedUrl(doc.path);
    if (!url) {
      Alert.alert("Error", "Could not generate document URL.");
      return;
    }

    if (isImage(doc.path)) {
      router.push({ pathname: "/image-viewer", params: { url, name: displayName(doc.name) } });
      return;
    }

    if (Platform.OS === "android") {
      try {
        await WebBrowser.openBrowserAsync(url, {
          showTitle: true,
          enableDefaultShareMenuItem: false,
        });
      } catch {
        Alert.alert(
          "Cannot open document",
          "No compatible browser is installed. Please install Chrome and try again."
        );
      }
      return;
    }

    router.push({
      pathname: "/pdf-viewer",
      params: { url, name: displayName(doc.name) },
    });
  };

  const handleDelete = (doc: Document) => {
    Alert.alert("Delete document", `Delete "${displayName(doc.name)}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingPath(doc.path);
          const result = await deleteDocument(doc.path);
          setDeletingPath(null);
          if (result.ok) {
            setDocuments((prev) => prev.filter((d) => d.path !== doc.path));
          } else {
            Alert.alert("Delete failed", result.message);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Document }) => {
    const isDeleting = deletingPath === item.path;
    return (
      <Pressable
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        onPress={() => handleOpen(item)}
        disabled={isDeleting}
      >
        <Ionicons
          name={isImage(item.path) ? "image-outline" : "document-text-outline"}
          size={24}
          color="#007AFF"
          style={styles.itemIcon}
        />
        <Text style={styles.itemName} numberOfLines={1}>
          {displayName(item.name)}
        </Text>
        {isDeleting ? (
          <ActivityIndicator size="small" color="#FF3B30" />
        ) : (
          <Pressable
            onPress={() => handleDelete(item)}
            hitSlop={8}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </Pressable>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />
      ) : documents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="documents-outline" size={56} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>No documents yet</Text>
          <Text style={styles.emptySubtitle}>Upload a PDF to get started</Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.path}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onRefresh={loadDocuments}
          refreshing={loading}
        />
      )}

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.uploadButton,
            pressed && styles.buttonPressed,
            uploading && styles.buttonDisabled,
          ]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={styles.uploadButtonText}>Upload</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  loader: {
    flex: 1,
    marginTop: 48,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#3C3C43",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8E8E93",
  },
  list: {
    padding: 16,
    gap: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  itemPressed: {
    opacity: 0.75,
  },
  itemIcon: {
    flexShrink: 0,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    color: "#000",
  },
  deleteButton: {
    padding: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: "#F2F2F7",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
