import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { apiGet, getApiBaseUrl } from "./lib/api/client";

type HealthResponse = { status: string; version: string };

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<HealthResponse>("/health");
        if (!cancelled) setHealth(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Could not reach API");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GradRight</Text>
      <Text style={styles.sub}>API: {getApiBaseUrl()}</Text>
      {health ? (
        <Text style={styles.ok}>
          Backend: {health.status} (v{health.version})
        </Text>
      ) : error ? (
        <Text style={styles.err}>{error}</Text>
      ) : (
        <ActivityIndicator size="large" />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  sub: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 16,
    textAlign: "center",
  },
  ok: {
    fontSize: 16,
    color: "#059669",
    textAlign: "center",
  },
  err: {
    fontSize: 14,
    color: "#dc2626",
    textAlign: "center",
  },
});
