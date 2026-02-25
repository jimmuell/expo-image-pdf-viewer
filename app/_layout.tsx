import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { useSession } from "@/app/lib/auth";
import { ThemeProvider } from "@/app/lib/theme";

export default function RootLayout() {
  const { loading } = useSession();
  const [fontsLoaded] = useFonts(Ionicons.font);

  if (loading || !fontsLoaded) return null;
  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="pdf-viewer" options={{ headerBackTitle: "Documents" }} />
        <Stack.Screen name="image-viewer" options={{ headerBackTitle: "Documents" }} />
      </Stack>
    </ThemeProvider>
  );
}
