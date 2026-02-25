import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  uploadRequestImage,
  uploadRequestImageFromLibrary,
  uploadRequestPdf,
} from "@/app/components/legal-requests/uploadRequestDocument";
import {
  CASE_TYPES,
  caseTypeLabel,
  createLegalRequest,
  listRequestDocuments,
  submitLegalRequest,
  type RequestDocument,
} from "@/app/lib/legal-requests";
import { useTheme, type ThemeColors } from "@/app/lib/theme";

export default function NewRequestScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [step, setStep] = useState<1 | 2>(1);

  const [caseType, setCaseType] = useState("immigration");
  const [fullName, setFullName] = useState(__DEV__ ? "Jane Doe" : "");
  const [phone, setPhone] = useState(__DEV__ ? "(555) 867-5309" : "");
  const [email, setEmail] = useState(__DEV__ ? "test-client@dev.local" : "");
  const [description, setDescription] = useState(
    __DEV__ ? "I have been on a work visa for 5 years and need help with renewal before it expires next month." : ""
  );

  const [draftId, setDraftId] = useState<string | null>(null);
  const [docs, setDocs] = useState<RequestDocument[]>([]);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (step !== 2) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setStep(1);
      return true;
    });
    return () => sub.remove();
  }, [step]);

  const pickCaseType = () => {
    Alert.alert(
      "Case Type",
      "Select the type of legal matter",
      [
        ...CASE_TYPES.map((t) => ({
          text: t.label,
          onPress: () => setCaseType(t.value),
        })),
        { text: "Cancel", style: "cancel" as const },
      ]
    );
  };

  const handleNext = async () => {
    if (!fullName.trim()) {
      Alert.alert("Required", "Please enter your full name.");
      return;
    }
    setCreating(true);
    const result = await createLegalRequest({
      case_type: caseType,
      full_name: fullName.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      description: description.trim() || undefined,
    });
    setCreating(false);
    if (!result.ok) {
      Alert.alert("Error", result.message);
      return;
    }
    setDraftId(result.id);
    setStep(2);
  };

  const loadDocs = async (id: string) => {
    const data = await listRequestDocuments(id);
    setDocs(data);
  };

  const handleAddDocument = () => {
    if (!draftId) return;
    Alert.alert("Add Document", "What would you like to upload?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "PDF",
        onPress: async () => {
          setUploading(true);
          const result = await uploadRequestPdf(draftId);
          setUploading(false);
          if (result.ok) {
            await loadDocs(draftId);
          } else if (result.message !== "Selection canceled") {
            Alert.alert("Upload failed", result.message);
          }
        },
      },
      {
        text: "Image",
        onPress: async () => {
          setUploading(true);
          const result = await uploadRequestImage(draftId);
          setUploading(false);
          if (result.ok) {
            await loadDocs(draftId);
          } else if (result.message !== "Selection canceled") {
            Alert.alert("Upload failed", result.message);
          }
        },
      },
      {
        text: "Choose Photo",
        onPress: async () => {
          setUploading(true);
          const result = await uploadRequestImageFromLibrary(draftId);
          setUploading(false);
          if (result.ok) {
            await loadDocs(draftId);
          } else if (result.message !== "Selection canceled") {
            Alert.alert("Upload failed", result.message);
          }
        },
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!draftId) return;
    setSubmitting(true);
    const result = await submitLegalRequest(draftId);
    setSubmitting(false);
    if (!result.ok) {
      Alert.alert("Error", result.message);
      return;
    }
    router.replace({ pathname: "/legal-requests/[id]", params: { id: draftId } });
  };

  const IMAGE_EXTS = /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: step === 1 ? "New Request" : "Add Documents",
          gestureEnabled: step !== 2,
          headerLeft:
            step === 2
              ? () => (
                  <Pressable onPress={() => setStep(1)} hitSlop={8}>
                    <Ionicons name="chevron-back" size={24} color="#1B2D4E" />
                  </Pressable>
                )
              : undefined,
        }}
      />

      {/* ── Step 1: Details ── */}
      {step === 1 && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Case Type</Text>
          <Pressable
            style={({ pressed }) => [styles.picker, pressed && styles.pickerPressed]}
            onPress={pickCaseType}
          >
            <Text style={styles.pickerText}>{caseTypeLabel(caseType)}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.muted} />
          </Pressable>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full legal name"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="(555) 000-0000"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            returnKeyType="next"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Briefly describe your situation…"
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              creating && styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </Pressable>
        </ScrollView>
      )}

      {/* ── Step 2: Documents ── */}
      {step === 2 && draftId && (
        <View style={styles.step2}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {docs.length === 0 ? (
              <View style={styles.emptyDocs}>
                <Ionicons name="attach-outline" size={40} color={colors.muted} />
                <Text style={styles.emptyDocsText}>No documents added yet</Text>
                <Text style={styles.emptyDocsSubtext}>
                  You can skip this step and add documents later
                </Text>
              </View>
            ) : (
              docs.map((doc) => (
                <View key={doc.id} style={styles.docItem}>
                  <Ionicons
                    name={IMAGE_EXTS.test(doc.name) ? "image-outline" : "document-text-outline"}
                    size={22}
                    color="#1B2D4E"
                  />
                  <Text style={styles.docName} numberOfLines={1}>
                    {doc.name.replace(/^\d+-/, "")}
                  </Text>
                </View>
              ))
            )}

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
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                submitting && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Submit Request</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scrollContent: {
      padding: 16,
      gap: 6,
      paddingBottom: 40,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.3,
      marginTop: 8,
      marginBottom: 2,
    },
    picker: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginBottom: 4,
    },
    pickerPressed: {
      opacity: 0.75,
    },
    pickerText: {
      fontSize: 15,
      color: colors.text,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      marginBottom: 4,
    },
    multiline: {
      height: 110,
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#1B2D4E",
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 12,
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
      marginTop: 12,
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
    step2: {
      flex: 1,
    },
    emptyDocs: {
      alignItems: "center",
      paddingVertical: 32,
      gap: 8,
    },
    emptyDocsText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.subtext,
    },
    emptyDocsSubtext: {
      fontSize: 13,
      color: colors.muted,
      textAlign: "center",
    },
    docItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
      marginBottom: 6,
    },
    docName: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    footer: {
      padding: 16,
      backgroundColor: colors.bg,
    },
  });
}
