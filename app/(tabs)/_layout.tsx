import { Tabs, useRouter  } from "expo-router";
import { Image } from "react-native";
import { useUserStore } from "../data/store";

export default function TabLayout() {
  const { userAuth } = useUserStore();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { height: 65 },
        headerStyle: { height: 50 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: () => (
            <Image source={require("../../assets/images/home.png")} style={{ width: 24, height: 24 }} />
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        listeners={{
          tabPress: (e) => {
            if (!userAuth) {
              e.preventDefault();
              router.replace({
                pathname: "/profile",
                params: { fromPost: "true", timestamp: Date.now().toString() },
              });
            }
          },
        }}
        options={{
          tabBarLabel: "Post",
          tabBarIcon: () => (
            <Image source={require("../../assets/images/post.png")} style={{ width: 30, height: 30 }} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          tabBarLabel: "Inbox",
          tabBarIcon: () => (
            <Image source={require("../../assets/images/inbox.png")} style={{ width: 24, height: 24 }} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: () => (
            <Image source={require("../../assets/images/profile.png")} style={{ width: 30, height: 30 }} />
          ),
        }}
      />
    </Tabs>
  );
}
