import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      {/* Stack Screen for Chat (will NOT appear in bottom tab bar) */}
      <Stack.Screen name="chat" options={{ headerShown: false }} />

      {/* Stack Screen for the Tab Navigator */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
