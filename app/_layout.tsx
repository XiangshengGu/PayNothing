import { Tabs, useRouter, useGlobalSearchParams } from "expo-router";
import { Image } from "react-native";
import { useEffect, useState } from "react";

export default function RootLayout() {
  const router = useRouter();
  const params = useGlobalSearchParams(); // This gets parameters when redirected

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          height: 65,
        },
        headerStyle: {
          height: 50,
        },
      }}
      screenListeners={{
        tabPress: (e) => {
          if (e.target.includes("inbox") && !params.senderId) {
            e.preventDefault();
            router.replace("/inbox"); // Go to chat history if no direct message
          }
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: () => (
            <Image source={require("../assets/images/home.png")} style={{ width: 24, height: 24 }} />
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          tabBarLabel: "Post",
          tabBarIcon: () => (
            <Image source={require("../assets/images/post.png")} style={{ width: 30, height: 30 }} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          tabBarLabel: "Inbox",
          tabBarIcon: () => (
            <Image source={require("../assets/images/inbox.png")} style={{ width: 24, height: 24 }} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarLabel: "Chat",
          tabBarIcon: () => (
            <Image source={require("../assets/images/inbox.png")} style={{ width: 24, height: 24 }} />
          ),
        }}
    />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: () => (
            <Image source={require("../assets/images/profile.png")} style={{ width: 30, height: 30 }} />
          ),
        }}
      />
    </Tabs>
  );
}
