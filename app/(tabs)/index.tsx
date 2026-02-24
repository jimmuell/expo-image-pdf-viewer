import { Ionicons } from "@expo/vector-icons";
import { Redirect, Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useProfile, useSession } from "@/app/lib/auth";
import { listLegalRequests, type LegalRequest } from "@/app/lib/legal-requests";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export default function HomeScreen() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const profile = useProfile();
  const [requests, setRequests] = useState<LegalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await listLegalRequests();
    setRequests(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (sessionLoading) {
    return <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />;
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const isAttorney = profile?.role === "attorney" || profile?.role === "admin";
  const handle = (session.user.email ?? "").split("@")[0];

  // ── Attorney stats ──────────────────────────────────────────────
  const available  = requests.filter((r) => r.attorney_id === null).length;
  const myInReview = requests.filter((r) => r.attorney_id === session.user.id && r.status === "in_review").length;
  const myClosed   = requests.filter((r) => r.attorney_id === session.user.id && r.status === "closed").length;
  const myTotal    = requests.filter((r) => r.attorney_id === session.user.id).length;

  // ── Client stats ────────────────────────────────────────────────
  const drafts    = requests.filter((r) => r.status === "draft").length;
  const submitted = requests.filter((r) => r.status === "submitted").length;
  const inReview  = requests.filter((r) => r.status === "in_review").length;
  const closed    = requests.filter((r) => r.status === "closed").length;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Home" }} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Greeting card ─────────────────────────────────────── */}
        <View style={styles.greetingCard}>
          <View style={styles.greetingAvatar}>
            <Ionicons
              name={isAttorney ? "briefcase" : "person"}
              size={26}
              color="#007AFF"
            />
          </View>
          <View style={styles.greetingText}>
            <Text style={styles.greetingWelcome}>Welcome back</Text>
            <Text style={styles.greetingHandle}>{handle}</Text>
          </View>
          <View style={[styles.rolePill, isAttorney ? styles.rolePillAttorney : styles.rolePillClient]}>
            <Text style={[styles.rolePillText, isAttorney ? styles.rolePillTextAttorney : styles.rolePillTextClient]}>
              {isAttorney ? "Attorney" : "Client"}
            </Text>
          </View>
        </View>

        {/* ── Stats ─────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>
          {isAttorney ? "Case Overview" : "My Requests"}
        </Text>

        {loading ? (
          <View style={styles.grid}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.statCard, styles.statCardSkeleton]} />
            ))}
          </View>
        ) : isAttorney ? (
          <View style={styles.grid}>
            <StatCard label="Available"  value={available}  icon="mail-unread-outline"      color="#007AFF" />
            <StatCard label="In Review"  value={myInReview} icon="hourglass-outline"         color="#FF9500" />
            <StatCard label="Closed"     value={myClosed}   icon="checkmark-circle-outline"  color="#34C759" />
            <StatCard label="My Cases"   value={myTotal}    icon="briefcase-outline"          color="#AF52DE" />
          </View>
        ) : (
          <View style={styles.grid}>
            <StatCard label="Drafts"     value={drafts}    icon="document-outline"           color="#8E8E93" />
            <StatCard label="Submitted"  value={submitted} icon="paper-plane-outline"        color="#007AFF" />
            <StatCard label="In Review"  value={inReview}  icon="hourglass-outline"          color="#FF9500" />
            <StatCard label="Closed"     value={closed}    icon="checkmark-circle-outline"   color="#34C759" />
          </View>
        )}

        {/* ── Quick actions ──────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Quick Actions</Text>

        {!isAttorney && (
          <ActionRow
            icon="add-circle-outline"
            iconBg="#EAF3FF"
            iconColor="#007AFF"
            title="New Legal Request"
            subtitle="Submit a new case for review"
            onPress={() => router.push("/legal-requests/new")}
          />
        )}

        <ActionRow
          icon={isAttorney ? "briefcase-outline" : "list-outline"}
          iconBg={isAttorney ? "#EAF3FF" : "#FFF3EA"}
          iconColor={isAttorney ? "#007AFF" : "#FF9500"}
          title={isAttorney ? "Legal Requests" : "My Cases"}
          subtitle={isAttorney ? "View available and active cases" : "Track all your legal requests"}
          onPress={() => router.push("/legal-requests")}
        />

      </ScrollView>
    </View>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: IoniconName;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBg, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionRow({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  onPress,
}: {
  icon: IoniconName;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
      onPress={onPress}
    >
      <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.actionBody}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
    </Pressable>
  );
}

// ── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  loader: {
    flex: 1,
    marginTop: 48,
  },
  scroll: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },

  // Greeting
  greetingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  greetingAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  greetingText: {
    flex: 1,
    gap: 2,
  },
  greetingWelcome: {
    fontSize: 12,
    color: "#8E8E93",
  },
  greetingHandle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  rolePill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rolePillClient: {
    backgroundColor: "#EAF3FF",
  },
  rolePillAttorney: {
    backgroundColor: "#F0E6FF",
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  rolePillTextClient: {
    color: "#007AFF",
  },
  rolePillTextAttorney: {
    color: "#AF52DE",
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

  // Stats grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47.5%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  statCardSkeleton: {
    height: 110,
    backgroundColor: "#E5E5EA",
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
    lineHeight: 36,
  },
  statLabel: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
  },

  // Action rows
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  actionRowPressed: {
    opacity: 0.75,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBody: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  actionSubtitle: {
    fontSize: 13,
    color: "#8E8E93",
  },
});
