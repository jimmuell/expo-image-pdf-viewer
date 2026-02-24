import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Documents" }} />
      <Stack.Screen name="pdf-viewer" options={{ headerBackTitle: "Documents" }} />
      <Stack.Screen name="image-viewer" options={{ headerBackTitle: "Documents" }} />
    </Stack>
  );
}
