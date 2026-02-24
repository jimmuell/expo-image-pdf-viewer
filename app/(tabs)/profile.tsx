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

const ROLE_LABELS: Record<string, string> = {
  client:   "Client",
  attorney: "Attorney",
  admin:    "Admin",
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  client:   { bg: "#EAF3FF", text: "#007AFF" },
  attorney: { bg: "#F0E6FF", text: "#AF52DE" },
  admin:    { bg: "#FFF3EA", text: "#FF9500" },
};

const AVATAR_COLORS: Record<string, string> = {
  client:   "#007AFF",
  attorney: "#AF52DE",
  admin:    "#FF9500",
};

function getInitials(fullName: string | null | undefined, email: string): string {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  // Derive initials from the email handle: "test-client" → "TC"
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

export default function ProfileScreen() {
  const { session, loading } = useSession();
  const profile = useProfile();

  if (loading) return null;
  if (!session)  return <Redirect href="/(auth)/sign-in" />;

  const role        = profile?.role ?? "client";
  const roleLabel   = ROLE_LABELS[role]  ?? role;
  const roleColor   = ROLE_COLORS[role]  ?? ROLE_COLORS.client;
  const avatarColor = AVATAR_COLORS[role] ?? "#007AFF";

  const email    = session.user.email ?? "";
  const initials = getInitials(profile?.full_name, email);
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
          <InfoRow label="Email"        value={email} />
          <InfoRow label="Role"         value={roleLabel} last={!memberSince} />
          <InfoRow label="Member since" value={memberSince} last />
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

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  scroll: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },

  // Hero card
  heroCard: {
    backgroundColor: "#fff",
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
    color: "#000",
  },
  email: {
    fontSize: 14,
    color: "#8E8E93",
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
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
  },

  // Info card
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  infoLabel: {
    fontSize: 15,
    color: "#8E8E93",
    width: 110,
    flexShrink: 0,
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    textAlign: "right",
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
