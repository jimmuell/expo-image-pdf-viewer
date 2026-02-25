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

export default function SignIn() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);

  if (!sessionLoading && session) return <Redirect href="/" />;

  const signIn = async (e: string, p: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: e, password: p });
    setLoading(false);
    if (error) { Alert.alert("Sign in failed", error.message); return; }
    router.replace("/");
  };

  return (
    <View style={styles.root}>
      {/* ── Branding ─────────────────────────────────────── */}
      <View style={styles.branding}>
        <View style={styles.iconBadge}>
          <Scale size={34} color={GOLD} />
        </View>
        <Text style={styles.appName}>
          <Text style={styles.appNameWhite}>Link</Text>
          <Text style={styles.appNameGold}>To</Text>
          <Text style={styles.appNameWhite}>Lawyers</Text>
        </Text>
        <Text style={styles.tagline}>Your legal solution starts here</Text>
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
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>Sign in to continue</Text>

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
                placeholder="Enter your password"
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

          {/* Sign In button */}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed, loading && styles.btnDisabled]}
            onPress={() => signIn(email, password)}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.primaryBtnText}>Sign In</Text>}
          </Pressable>

          {/* Or divider */}
          <Text style={styles.orDivider}>or</Text>

          {/* Sign up link */}
          <Pressable onPress={() => router.push("/(auth)/sign-up")} style={styles.switchRow}>
            <Text style={styles.switchText}>
              Don&apos;t have an account?{"  "}
              <Text style={styles.switchLink}>Create one</Text>
            </Text>
          </Pressable>

          {/* DEV quick sign-in */}
          {__DEV__ && (
            <View style={styles.devSection}>
              <View style={styles.devDivider} />
              <Text style={styles.devLabel}>DEV — Quick Sign In</Text>
              <View style={styles.devRow}>
                <Pressable
                  style={({ pressed }) => [styles.devBtn, styles.devBtnClient, pressed && styles.btnPressed, loading && styles.btnDisabled]}
                  onPress={() => signIn("test-client@dev.local", "password123")}
                  disabled={loading}
                >
                  <Ionicons name="person-outline" size={16} color="#fff" />
                  <Text style={styles.devBtnText}>Client</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.devBtn, styles.devBtnAttorney, pressed && styles.btnPressed, loading && styles.btnDisabled]}
                  onPress={() => signIn("test-attorney@dev.local", "password123")}
                  disabled={loading}
                >
                  <Ionicons name="briefcase-outline" size={16} color="#fff" />
                  <Text style={styles.devBtnText}>Attorney</Text>
                </Pressable>
              </View>
            </View>
          )}
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
      alignItems: "center",
      paddingTop: 64,
      paddingBottom: 36,
      gap: 10,
    },
    iconBadge: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "rgba(255,255,255,0.12)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    appName: {
      fontSize: 32,
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
      fontSize: 15,
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
      marginBottom: 16,
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
    btnPressed: { opacity: 0.82 },
    btnDisabled: { opacity: 0.55 },

    // Or / switch
    orDivider: {
      textAlign: "center",
      color: colors.muted,
      fontSize: 14,
      marginVertical: 12,
    },
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

    // DEV section
    devSection: {
      marginTop: 24,
      gap: 12,
    },
    devDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    devLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.muted,
      letterSpacing: 1.2,
      textAlign: "center",
    },
    devRow: {
      flexDirection: "row",
      gap: 12,
    },
    devBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 48,
      borderRadius: 12,
    },
    devBtnClient: {
      backgroundColor: "#C9A84C",
    },
    devBtnAttorney: {
      backgroundColor: "#1B2D4E",
    },
    devBtnText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
    },
  });
}
