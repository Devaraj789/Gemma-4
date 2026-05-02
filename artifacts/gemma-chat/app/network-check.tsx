import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type TestResult = {
  domain: string;
  url: string;
  status: "pending" | "success" | "failed";
  responseTime: number | null;
  details: string;
};

const TEST_ENDPOINTS = [
  { domain: "Google DNS", url: "https://dns.google/resolve?name=example.com&type=A" },
  { domain: "HuggingFace", url: "https://huggingface.co/robots.txt" },
  { domain: "Cloudflare", url: "https://1.1.1.1/dns-query?name=example.com&type=A" },
  { domain: "GitHub CDN", url: "https://github.githubassets.com/favicons/favicon.png" },
];

export default function NetworkCheckScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const runTests = async () => {
    setRunning(true);
    const initial: TestResult[] = TEST_ENDPOINTS.map((e) => ({
      domain: e.domain,
      url: e.url,
      status: "pending",
      responseTime: null,
      details: "Testing…",
    }));
    setResults(initial);

    const updated = [...initial];
    for (let i = 0; i < TEST_ENDPOINTS.length; i++) {
      const ep = TEST_ENDPOINTS[i];
      const start = Date.now();
      try {
        const res = await fetch(ep.url, { signal: AbortSignal.timeout(8000) });
        const elapsed = Date.now() - start;
        updated[i] = {
          domain: ep.domain,
          url: ep.url,
          status: res.ok || res.status < 500 ? "success" : "failed",
          responseTime: elapsed,
          details: res.ok ? `HTTP ${res.status} · Connected` : `HTTP ${res.status}`,
        };
      } catch (e) {
        updated[i] = {
          domain: ep.domain,
          url: ep.url,
          status: "failed",
          responseTime: null,
          details: e instanceof Error ? e.message : "Connection failed",
        };
      }
      setResults([...updated]);
    }
    setRunning(false);
  };

  const clearResults = () => setResults([]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "web" ? Math.max(insets.top, 16) + 6 : insets.top + 6,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: pressed ? colors.muted : "transparent" }]}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Network Check</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Platform.OS === "web" ? Math.max(insets.bottom, 24) + 16 : insets.bottom + 24,
          gap: 16,
        }}
      >
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Test internet connectivity. Gemma runs fully offline — these checks verify model download capability.
        </Text>

        <View style={styles.btnRow}>
          <Pressable
            onPress={() => void runTests()}
            disabled={running}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: colors.primary, opacity: pressed || running ? 0.7 : 1 },
            ]}
          >
            {running ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="wifi" size={16} color="#fff" />
            )}
            <Text style={styles.btnText}>{running ? "Testing…" : "Start Test"}</Text>
          </Pressable>
          <Pressable
            onPress={clearResults}
            disabled={running}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: colors.secondary, opacity: pressed || running ? 0.7 : 1 },
            ]}
          >
            <Feather name="x" size={16} color={colors.foreground} />
            <Text style={[styles.btnText, { color: colors.foreground }]}>Clear</Text>
          </Pressable>
        </View>

        {results.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {results.map((r, i) => (
              <React.Fragment key={r.domain}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <View style={styles.resultRow}>
                  <View style={styles.resultLeft}>
                    <Text style={[styles.domainText, { color: colors.foreground }]}>{r.domain}</Text>
                    <Text style={[styles.urlText, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {r.url}
                    </Text>
                    <Text style={[styles.detailText, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {r.details}
                    </Text>
                  </View>
                  <View style={styles.resultRight}>
                    {r.status === "pending" ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <View
                          style={[
                            styles.statusPill,
                            {
                              backgroundColor:
                                r.status === "success"
                                  ? colors.success + "20"
                                  : colors.destructive + "20",
                            },
                          ]}
                        >
                          <Feather
                            name={r.status === "success" ? "check-circle" : "x-circle"}
                            size={12}
                            color={r.status === "success" ? colors.success : colors.destructive}
                          />
                          <Text
                            style={[
                              styles.statusText,
                              { color: r.status === "success" ? colors.success : colors.destructive },
                            ]}
                          >
                            {r.status === "success" ? "OK" : "Fail"}
                          </Text>
                        </View>
                        {r.responseTime !== null && (
                          <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
                            {r.responseTime}ms
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        {results.length === 0 && !running && (
          <View style={styles.empty}>
            <Feather name="wifi" size={48} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No tests run yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tap "Start Test" to check your internet connection.
            </Text>
          </View>
        )}

        <View style={[styles.noteCard, { backgroundColor: colors.accent, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.accentForeground} />
          <Text style={[styles.noteText, { color: colors.accentForeground }]}>
            Gemma runs 100% offline. Internet is only needed to download models initially from HuggingFace.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  subtitle: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 20 },
  btnRow: { flexDirection: "row", gap: 12 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
  },
  btnText: { fontSize: 14.5, fontFamily: "Inter_600SemiBold", color: "#fff" },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  divider: { height: StyleSheet.hairlineWidth },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  resultLeft: { flex: 1, gap: 2 },
  resultRight: { alignItems: "flex-end", gap: 4 },
  domainText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  urlText: { fontSize: 11.5, fontFamily: "Inter_400Regular" },
  detailText: { fontSize: 11.5, fontFamily: "Inter_400Regular", lineHeight: 16 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  timeText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  emptyText: { fontSize: 13.5, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  noteText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
