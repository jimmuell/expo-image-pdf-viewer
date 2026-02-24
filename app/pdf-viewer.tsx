import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function PDFViewer() {
  const { url, name } = useLocalSearchParams<{ url: string; name: string }>();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: name ?? "Document" }} />
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        startInLoadingState
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
