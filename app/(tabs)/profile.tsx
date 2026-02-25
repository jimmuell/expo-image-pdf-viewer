import { Ionicons } from "@expo/vector-icons";
import { Redirect, Stack } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useProfile, useSession } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";
import { useTheme, type ThemeColors, type ThemePreference } from "@/app/lib/theme";

const ROLE_COLORS = (colors: ThemeColors): Record<string, { bg: string; text: string }> => ({
  client:   { bg: colors.card === "#FFFFFF" ? "#E8EDF4" : "#1F2D3D", text: "#1B2D4E" },
  attorney: { bg: colors.card === "#FFFFFF" ? "#F5EEE0" : "#2D2516", text: "#C9A84C" },
  admin:    { bg: colors.card === "#FFFFFF" ? "#E8EDF4" : "#1F2D3D", text: "#1B2D4E" },
});

const AVATAR_COLORS: Record<string, string> = {
  client:   "#1B2D4E",
  attorney: "#C9A84C",
  admin:    "#1B2D4E",
};

const ROLE_LABELS: Record<string, string> = {
  client:   "Client",
  attorney: "Attorney",
  admin:    "Admin",
};

function getInitials(fullName: string | null | undefined, email: string): string {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  const handle = email.split("@")[0];
  const words  = handle.split(/[-_.]/);
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : handle.slice(0, 2).toUpperCase();
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });
}

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }[] = [
  { value: "light",  label: "Light",  icon: "sunny-outline" },
  { value: "dark",   label: "Dark",   icon: "moon-outline" },
  { value: "system", label: "System", icon: "phone-portrait-outline" },
];

export default function ProfileScreen() {
  const { session, loading } = useSession();
  const profile = useProfile();
  const { colors, isDark, preference, setPreference } = useTheme();
  const styles = makeStyles(colors, isDark);

  if (loading) return null;
  if (!session)  return <Redirect href="/(auth)/sign-in" />;

  const role        = profile?.role ?? "client";
  const roleLabel   = ROLE_LABELS[role] ?? role;
  const roleColor   = ROLE_COLORS(colors)[role] ?? ROLE_COLORS(colors).client;
  const avatarColor = AVATAR_COLORS[role] ?? "#1B2D4E";

  const email       = session.user.email ?? "";
  const initials    = getInitials(profile?.full_name, email);
  const memberSince = formatDate(session.user.created_at);

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: () => supabase.auth.signOut() },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Profile" }} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Avatar + identity ────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          {profile?.full_name ? (
            <Text style={styles.displayName}>{profile.full_name}</Text>
          ) : null}

          <Text style={styles.email}>{email}</Text>

          <View style={[styles.rolePill, { backgroundColor: roleColor.bg }]}>
            <Text style={[styles.rolePillText, { color: roleColor.text }]}>
              {roleLabel}
            </Text>
          </View>
        </View>

        {/* ── Account details ──────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <InfoRow label="Email"        value={email}       colors={colors} />
          <InfoRow label="Role"         value={roleLabel}   colors={colors} />
          <InfoRow label="Member since" value={memberSince} colors={colors} last />
        </View>

        {/* ── Appearance ───────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const active = preference === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[styles.themeTile, active && styles.themeTileActive]}
                  onPress={() => setPreference(opt.value)}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={active ? (isDark ? "#C9A84C" : "#1B2D4E") : colors.muted}
                  />
                  <Text style={[styles.themeTileText, active && styles.themeTileTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Sign out ─────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Session</Text>
        <View style={styles.card}>
          <Pressable
            style={({ pressed }) => [styles.signOutRow, pressed && styles.rowPressed]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, last, colors }: { label: string; value: string; last?: boolean; colors: ThemeColors }) {
  return (
    <View style={[
      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
      !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
    ]}>
      <Text style={{ fontSize: 15, color: colors.muted, width: 110, flexShrink: 0 }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 15, color: colors.text, textAlign: "right" }} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      padding: 16,
      gap: 12,
      paddingBottom: 40,
    },

    // Hero card
    heroCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 24,
      alignItems: "center",
      gap: 8,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    avatarText: {
      fontSize: 30,
      fontWeight: "700",
      color: "#fff",
      letterSpacing: 1,
    },
    displayName: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
    },
    email: {
      fontSize: 14,
      color: colors.muted,
    },
    rolePill: {
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 5,
      marginTop: 4,
    },
    rolePillText: {
      fontSize: 13,
      fontWeight: "600",
    },

    // Section label
    sectionLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: 4,
    },

    // Card
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      overflow: "hidden",
    },

    // Theme toggle
    themeRow: {
      flexDirection: "row",
      padding: 12,
      gap: 10,
    },
    themeTile: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    themeTileActive: {
      borderColor: isDark ? "#C9A84C" : "#1B2D4E",
      backgroundColor: isDark ? "#1F3350" : "#E8EDF4",
    },
    themeTileText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.muted,
    },
    themeTileTextActive: {
      color: isDark ? "#C9A84C" : "#1B2D4E",
    },

    // Sign out row
    signOutRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    rowPressed: {
      opacity: 0.6,
    },
    signOutText: {
      fontSize: 15,
      fontWeight: "600",
      color: "#FF3B30",
    },
  });
}
