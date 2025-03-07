import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Stack Screen for the Tab Navigator */}
      <Stack.Screen name="(tabs)" />

      {/* Stack Screen for Chat (will NOT appear in bottom tab bar) */}
      <Stack.Screen name="chat" options={{ presentation: "modal" }} />
    </Stack>
  );
}
