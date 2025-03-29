import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { FIREBASE_AUTH } from "../FirebaseConfig";

export default function RootLayout() {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      setIsLoggedIn(!!user);
      setIsAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isAuthChecked) return;

    const inAuthGroup = segments[0] === "auth";

    if (!isLoggedIn && !inAuthGroup) {
      router.replace("/auth");
    }
  }, [isAuthChecked, isLoggedIn, segments]);

  if (!isAuthChecked) return null; // or a splash screen

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Stack Screen for the Tab Navigator */}
      <Stack.Screen name="(tabs)" />

      {/* Stack Screen for Chat (will NOT appear in bottom tab bar) */}
      <Stack.Screen name="chat" options={{ presentation: "modal" }} />

      {/* Stack Screen for the User Authentication */}
      <Stack.Screen name="auth" />
    </Stack>
  );
}
