import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ImageViewer() {
  const { url, name } = useLocalSearchParams<{ url: string; name: string }>();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: name ?? "Image" }} />
      <Image source={{ uri: url }} style={styles.image} contentFit="contain" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  image: {
    flex: 1,
  },
});
