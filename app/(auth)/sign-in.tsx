import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSession } from "@/app/lib/auth";
import { supabase } from "@/app/lib/supabase";

const DEV_ACCOUNTS = [
  { label: "Test Client", email: "test-client@dev.local" },
  { label: "Test Attorney", email: "test-attorney@dev.local" },
] as const;

export default function SignIn() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!sessionLoading && session) {
    return <Redirect href="/" />;
  }

  const signIn = async (e: string, p: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: e, password: p });
    setLoading(false);
    if (error) {
      Alert.alert("Sign in failed", error.message);
      return;
    }
    router.replace("/");
  };

  const handleSignIn = () => signIn(email, password);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Sign In</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#8E8E93"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8E8E93"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </Pressable>
      </View>

      <Pressable onPress={() => router.push("/(auth)/sign-up")} style={styles.footer}>
        <Text style={styles.footerText}>
          Don&apos;t have an account?{" "}
          <Text style={styles.footerLink}>Sign up</Text>
        </Text>
      </Pressable>

      {__DEV__ && (
        <View style={styles.devSection}>
          <Text style={styles.devLabel}>DEV</Text>
          <View style={styles.devRow}>
            {DEV_ACCOUNTS.map(({ label, email: devEmail }) => (
              <Pressable
                key={devEmail}
                style={({ pressed }) => [styles.devButton, pressed && styles.buttonPressed, loading && styles.buttonDisabled]}
                onPress={() => signIn(devEmail, "password123")}
                disabled={loading}
              >
                <Text style={styles.devButtonText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  footerLink: {
    color: "#007AFF",
    fontWeight: "600",
  },
  devSection: {
    marginTop: 32,
    gap: 10,
  },
  devLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8E8E93",
    letterSpacing: 1,
    textAlign: "center",
  },
  devRow: {
    flexDirection: "row",
    gap: 10,
  },
  devButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#C7C7CC",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  devButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3C3C43",
  },
});
