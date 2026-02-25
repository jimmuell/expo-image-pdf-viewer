import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/app/lib/theme";

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? "#C9A84C" : "#1B2D4E",
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.hairline,
        },
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShadowVisible: isDark,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="legal-requests"
        options={{
          title: "Legal Requests",
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "briefcase" : "briefcase-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
