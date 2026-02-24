import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { useSession } from "@/app/lib/auth";

export default function RootLayout() {
  const { loading } = useSession();
  // Explicitly pre-load the Ionicons font so tab-bar icons are
  // guaranteed to be available before the first paint on Android.
  const [fontsLoaded] = useFonts(Ionicons.font);

  if (loading || !fontsLoaded) return null;
  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="pdf-viewer" options={{ headerBackTitle: "Documents" }} />
      <Stack.Screen name="image-viewer" options={{ headerBackTitle: "Documents" }} />
    </Stack>
  );
}
