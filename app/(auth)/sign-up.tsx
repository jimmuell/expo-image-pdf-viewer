import { Ionicons } from "@expo/vector-icons";
import { Scale } from "lucide-react-native";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSession } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";
import { useTheme, type ThemeColors } from "@/app/lib/theme";

const GOLD = "#C9A84C";

type Role = "client" | "attorney";

export default function SignUp() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const [fullName, setFullName]         = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPw, setShowPw]             = useState(false);
  const [role, setRole]                 = useState<Role>("client");
  const [loading, setLoading]           = useState(false);

  if (!sessionLoading && session) return <Redirect href="/" />;

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, full_name: fullName.trim() || null } },
    });
    setLoading(false);
    if (error) { Alert.alert("Sign up failed", error.message); return; }
    router.replace("/");
  };

  return (
    <View style={styles.root}>
      {/* ── Branding ─────────────────────────────────────── */}
      <View style={styles.branding}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>
        <View style={styles.brandingCenter}>
          <View style={styles.iconBadge}>
            <Scale size={34} color={GOLD} />
          </View>
          <Text style={styles.appName}>
            <Text style={styles.appNameWhite}>Link</Text>
            <Text style={styles.appNameGold}>To</Text>
            <Text style={styles.appNameWhite}>Lawyers</Text>
          </Text>
          <Text style={styles.tagline}>Join LinkToLawyers today</Text>
        </View>
      </View>

      {/* ── Card ─────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.cardWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.card}
          contentContainerStyle={styles.cardContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.cardTitle}>Create Account</Text>
          <Text style={styles.cardSubtitle}>Fill in your details to get started</Text>

          {/* ── I AM A ─────────────────────────────────────── */}
          <Text style={styles.roleLabel}>I AM A</Text>
          <View style={styles.roleRow}>
            <Pressable
              style={[styles.roleTile, role === "client" && styles.roleTileActive]}
              onPress={() => setRole("client")}
            >
              <Text style={[styles.roleTileText, role === "client" && styles.roleTileTextActive]}>Client</Text>
              <Text style={[styles.roleTileSubtext, role === "client" && styles.roleTileSubtextActive]}>
                I need legal help
              </Text>
            </Pressable>

            <Pressable
              style={[styles.roleTile, role === "attorney" && styles.roleTileActive]}
              onPress={() => setRole("attorney")}
            >
              <Text style={[styles.roleTileText, role === "attorney" && styles.roleTileTextActive]}>Attorney</Text>
              <Text style={[styles.roleTileSubtext, role === "attorney" && styles.roleTileSubtextActive]}>
                I provide legal services
              </Text>
            </Pressable>
          </View>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={colors.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Jane Doe"
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
                autoCorrect={false}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={colors.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="Create a password"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPw}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={8} style={styles.eyeBtn}>
                <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          {/* Create Account button */}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed, loading && styles.btnDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.primaryBtnText}>Create Account</Text>}
          </Pressable>

          {/* Sign in link */}
          <Pressable onPress={() => router.replace("/(auth)/sign-in")} style={styles.switchRow}>
            <Text style={styles.switchText}>
              Already have an account?{"  "}
              <Text style={styles.switchLink}>Sign In</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: isDark ? "#0D1B2E" : "#1B2D4E",
    },

    // Branding
    branding: {
      paddingTop: 56,
      paddingBottom: 28,
      paddingHorizontal: 20,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.15)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    brandingCenter: {
      alignItems: "center",
      gap: 8,
    },
    iconBadge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "rgba(255,255,255,0.12)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    appName: {
      fontSize: 28,
      letterSpacing: 0.5,
    },
    appNameWhite: {
      color: "#fff",
      fontWeight: "800",
    },
    appNameGold: {
      color: "#C9A84C",
      fontWeight: "800",
    },
    tagline: {
      fontSize: 14,
      color: "rgba(255,255,255,0.55)",
    },

    // Card
    cardWrapper: {
      flex: 1,
    },
    card: {
      flex: 1,
      backgroundColor: isDark ? colors.card : colors.bg,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
    },
    cardContent: {
      padding: 28,
      paddingBottom: 48,
      gap: 4,
    },
    cardTitle: {
      fontSize: 26,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 2,
    },
    cardSubtitle: {
      fontSize: 15,
      color: colors.muted,
      marginBottom: 12,
    },

    // Role selector
    roleLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.muted,
      letterSpacing: 1.2,
      marginBottom: 10,
      marginTop: 6,
    },
    roleRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    roleTile: {
      flex: 1,
      backgroundColor: isDark ? colors.bg : "#FFFFFF",
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      paddingVertical: 12,
      paddingHorizontal: 14,
      alignItems: "center",
      gap: 3,
    },
    roleTileActive: {
      backgroundColor: isDark ? "#1F3350" : "#F5EEE0",
      borderColor: isDark ? "#C9A84C" : "#1B2D4E",
    },
    roleTileText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.muted,
    },
    roleTileTextActive: {
      color: isDark ? "#C9A84C" : "#1A1F2E",
    },
    roleTileSubtext: {
      fontSize: 12,
      color: colors.muted,
      textAlign: "center",
    },
    roleTileSubtextActive: {
      color: isDark ? "#C9A84C" : "#1A1F2E",
    },

    // Fields
    fieldGroup: {
      gap: 6,
      marginBottom: 14,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? colors.bg : "#FFFFFF",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      height: 52,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
    },
    inputFlex: {
      flex: 1,
    },
    eyeBtn: {
      padding: 4,
      marginLeft: 6,
    },

    // Buttons
    primaryBtn: {
      backgroundColor: "#1B2D4E",
      borderRadius: 14,
      height: 54,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      marginBottom: 4,
    },
    primaryBtnText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "700",
    },
    btnPressed:  { opacity: 0.82 },
    btnDisabled: { opacity: 0.55 },

    // Switch
    switchRow: {
      alignItems: "center",
      paddingVertical: 4,
    },
    switchText: {
      fontSize: 14,
      color: colors.muted,
    },
    switchLink: {
      color: colors.text,
      fontWeight: "700",
    },
  });
}
