import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
  uploadRequestImage,
  uploadRequestImageFromLibrary,
  uploadRequestPdf,
} from "@/app/components/legal-requests/uploadRequestDocument";
import { useProfile, useSession } from "@/app/lib/auth";
import {
  caseTypeLabel,
  claimLegalRequest,
  deleteRequestDocument,
  getLegalRequest,
  getRequestDocumentUrl,
  listRequestDocuments,
  STATUS_COLORS,
  STATUS_LABELS,
  type LegalRequest,
  type RequestDocument,
} from "@/app/lib/legal-requests";
import { useTheme, type ThemeColors } from "@/app/lib/theme";

const IMAGE_EXTS = /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i;
function isImage(name: string) { return IMAGE_EXTS.test(name); }

export default function LegalRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useSession();
  const profile = useProfile();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [request, setRequest] = useState<LegalRequest | null>(null);
  const [docs, setDocs] = useState<RequestDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const [req, docList] = await Promise.all([
      getLegalRequest(id),
      listRequestDocuments(id),
    ]);
    setRequest(req);
    setDocs(docList);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1B2D4E" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Request not found.</Text>
      </View>
    );
  }

  const isParticipant =
    session &&
    (request.client_id === session.user.id || request.attorney_id === session.user.id);

  const isAttorney = profile?.role === "attorney" || profile?.role === "admin";
  const canClaim = isAttorney && request.attorney_id === null;

  const handleClaim = () => {
    Alert.alert("Claim Case", "Take on this case as the attorney of record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Claim",
        onPress: async () => {
          setClaiming(true);
          const result = await claimLegalRequest(request.id);
          setClaiming(false);
          if (result.ok) {
            await load();
          } else {
            Alert.alert("Error", result.message);
          }
        },
      },
    ]);
  };

  const handleAddDocument = () => {
    Alert.alert("Add Document", "What would you like to upload?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "PDF",
        onPress: async () => {
          setUploading(true);
          const result = await uploadRequestPdf(request.id);
          setUploading(false);
          if (result.ok) {
            await load();
          } else if (result.message !== "Selection canceled") {
            Alert.alert("Upload failed", result.message);
          }
        },
      },
      {
        text: "Image",
        onPress: async () => {
          setUploading(true);
          const result = await uploadRequestImage(request.id);
          setUploading(false);
          if (result.ok) {
            await load();
          } else if (result.message !== "Selection canceled") {
            Alert.alert("Upload failed", result.message);
          }
        },
      },
      {
        text: "Choose Photo",
        onPress: async () => {
          setUploading(true);
          const result = await uploadRequestImageFromLibrary(request.id);
          setUploading(false);
          if (result.ok) {
            await load();
          } else if (result.message !== "Selection canceled") {
            Alert.alert("Upload failed", result.message);
          }
        },
      },
    ]);
  };

  const handleOpenDoc = async (doc: RequestDocument) => {
    const url = await getRequestDocumentUrl(doc.path);
    if (!url) {
      Alert.alert("Error", "Could not generate document URL.");
      return;
    }

    if (isImage(doc.name)) {
      router.push({ pathname: "/image-viewer", params: { url, name: doc.name.replace(/^\d+-/, "") } });
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

    router.push({ pathname: "/pdf-viewer", params: { url, name: doc.name.replace(/^\d+-/, "") } });
  };

  const handleDeleteDoc = (doc: RequestDocument) => {
    Alert.alert("Delete document", `Delete "${doc.name.replace(/^\d+-/, "")}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingDocId(doc.id);
          const result = await deleteRequestDocument(doc);
          setDeletingDocId(null);
          if (result.ok) {
            setDocs((prev) => prev.filter((d) => d.id !== doc.id));
          } else {
            Alert.alert("Delete failed", result.message);
          }
        },
      },
    ]);
  };

  const statusColor = STATUS_COLORS[request.status] ?? "#8A8F9D";
  const statusLabel = STATUS_LABELS[request.status] ?? request.status;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: caseTypeLabel(request.case_type),
          headerBackTitle: "Requests",
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status badge */}
        <View style={styles.statusRow}>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{statusLabel}</Text>
          </View>
        </View>

        {/* Case details */}
        <View style={styles.card}>
          <DetailRow label="Case Type" value={caseTypeLabel(request.case_type)} colors={colors} />
          <DetailRow label="Client" value={request.full_name} colors={colors} />
          {request.phone ? <DetailRow label="Phone" value={request.phone} colors={colors} /> : null}
          {request.email ? <DetailRow label="Email" value={request.email} colors={colors} /> : null}
          {request.description ? (
            <DetailRow label="Description" value={request.description} multiline colors={colors} />
          ) : null}
        </View>

        {/* Documents section */}
        <Text style={styles.sectionTitle}>Documents</Text>

        {docs.length === 0 ? (
          <View style={styles.emptyDocs}>
            <Text style={styles.emptyDocsText}>No documents attached</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {docs.map((doc, index) => {
              const isDeleting = deletingDocId === doc.id;
              const canDelete = session && doc.uploaded_by === session.user.id;
              const isUploader = session && doc.uploaded_by === session.user.id;

              return (
                <View
                  key={doc.id}
                  style={[
                    styles.docItem,
                    index < docs.length - 1 && styles.docItemBorder,
                  ]}
                >
                  <Pressable
                    style={styles.docItemMain}
                    onPress={() => handleOpenDoc(doc)}
                    disabled={isDeleting}
                  >
                    <Ionicons
                      name={isImage(doc.name) ? "image-outline" : "document-text-outline"}
                      size={20}
                      color="#1B2D4E"
                    />
                    <View style={styles.docInfo}>
                      <Text style={styles.docName} numberOfLines={1}>
                        {doc.name.replace(/^\d+-/, "")}
                      </Text>
                      <Text style={styles.docUploader}>
                        {isUploader ? "You can delete this document" : "You CAN NOT delete this document"}
                      </Text>
                    </View>
                  </Pressable>

                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                  ) : canDelete ? (
                    <Pressable
                      onPress={() => handleDeleteDoc(doc)}
                      hitSlop={8}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {/* Add document button (participants only) */}
        {isParticipant && (
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
              uploading && styles.buttonDisabled,
            ]}
            onPress={handleAddDocument}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#1B2D4E" size="small" />
            ) : (
              <>
                <Ionicons name="attach-outline" size={18} color="#1B2D4E" />
                <Text style={styles.secondaryButtonText}>Add Document</Text>
              </>
            )}
          </Pressable>
        )}

        {/* Claim button (attorneys on unassigned requests) */}
        {canClaim && (
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              claiming && styles.buttonDisabled,
            ]}
            onPress={handleClaim}
            disabled={claiming}
          >
            {claiming ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Claim Case</Text>
              </>
            )}
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({
  label,
  value,
  multiline,
  colors,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  colors: ThemeColors;
}) {
  return (
    <View style={[
      { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline, gap: 12 },
      multiline ? { alignItems: "flex-start", flexDirection: "column", gap: 4 } : { flexDirection: "row", alignItems: "center" },
    ]}>
      <Text style={{ fontSize: 13, color: colors.muted, width: 90, flexShrink: 0 }}>{label}</Text>
      <Text style={[{ fontSize: 15, color: colors.text }, multiline ? {} : { flex: 1 }]}>
        {value}
      </Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    errorText: {
      fontSize: 16,
      color: colors.muted,
    },
    scrollContent: {
      padding: 16,
      gap: 12,
      paddingBottom: 40,
    },
    statusRow: {
      flexDirection: "row",
    },
    badge: {
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    badgeText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "600",
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 10,
      overflow: "hidden",
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: 4,
    },
    emptyDocs: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 20,
      alignItems: "center",
    },
    emptyDocsText: {
      fontSize: 14,
      color: colors.muted,
    },
    docItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
    },
    docItemBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    docItemMain: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    docInfo: {
      flex: 1,
      gap: 2,
    },
    docName: {
      fontSize: 14,
      color: colors.text,
    },
    docUploader: {
      fontSize: 12,
      color: colors.muted,
    },
    deleteButton: {
      padding: 4,
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#1B2D4E",
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 4,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.card,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: "#1B2D4E",
      marginTop: 4,
    },
    secondaryButtonText: {
      color: "#1B2D4E",
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
}
