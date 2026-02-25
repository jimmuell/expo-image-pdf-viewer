import { Ionicons } from "@expo/vector-icons";
import { Redirect, Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useProfile, useSession } from "@/app/lib/auth";
import {
  caseTypeLabel,
  listLegalRequests,
  STATUS_COLORS,
  STATUS_LABELS,
  type LegalRequest,
} from "@/app/lib/legal-requests";
import { useTheme, type ThemeColors } from "@/app/lib/theme";

export default function LegalRequestsScreen() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const profile = useProfile();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [requests, setRequests] = useState<LegalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await listLegalRequests();
    setRequests(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (sessionLoading) {
    return <ActivityIndicator style={styles.loader} size="large" color="#1B2D4E" />;
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const renderItem = ({ item }: { item: LegalRequest }) => (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      onPress={() => router.push({ pathname: "/legal-requests/[id]", params: { id: item.id } })}
    >
      <View style={styles.itemMain}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.full_name}
        </Text>
        <Text style={styles.itemSubtitle}>{caseTypeLabel(item.case_type)}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] ?? "#8A8F9D" }]}>
        <Text style={styles.badgeText}>{STATUS_LABELS[item.status] ?? item.status}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );

  // Attorney view: two sections
  if (profile?.role === "attorney" || profile?.role === "admin") {
    const available = requests.filter((r) => r.attorney_id === null);
    const myCases = requests.filter(
      (r) => r.attorney_id === session.user.id
    );

    const sections = [
      { title: "Available", data: available },
      { title: "My Cases", data: myCases },
    ];

    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Legal Requests" }} />
        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color="#1B2D4E" />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{section.title}</Text>
              </View>
            )}
            renderSectionFooter={({ section }) =>
              section.data.length === 0 ? (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>None</Text>
                </View>
              ) : null
            }
            contentContainerStyle={styles.list}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        )}
      </View>
    );
  }

  // Client view: own requests + FAB
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Legal Requests" }} />
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#1B2D4E" />
      ) : requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={56} color={colors.muted} />
          <Text style={styles.emptyTitle}>No requests yet</Text>
          <Text style={styles.emptySubtitle}>Tap + to submit a new legal request</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push("/legal-requests/new")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    loader: {
      flex: 1,
      marginTop: 48,
    },
    list: {
      padding: 16,
      gap: 10,
      paddingBottom: 100,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 10,
    },
    itemPressed: {
      opacity: 0.75,
    },
    itemMain: {
      flex: 1,
      gap: 2,
    },
    itemTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    itemSubtitle: {
      fontSize: 13,
      color: colors.muted,
    },
    badge: {
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
    },
    sectionHeader: {
      paddingTop: 8,
      paddingBottom: 4,
    },
    sectionHeaderText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    emptySection: {
      paddingBottom: 8,
    },
    emptySectionText: {
      fontSize: 14,
      color: colors.muted,
      fontStyle: "italic",
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
      color: colors.subtext,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.muted,
    },
    fab: {
      position: "absolute",
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#1B2D4E",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    fabPressed: {
      opacity: 0.8,
    },
  });
}
