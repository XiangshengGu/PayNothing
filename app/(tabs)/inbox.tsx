import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { collection, query, onSnapshot, getDoc, doc, where } from "firebase/firestore";
import { FIRESTORE_DB, FIREBASE_AUTH } from "../../FirebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { AdsBanner, InterstitialAdOverlay } from "../components/Ads";

export default function Inbox() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [adType, setAdType] = useState<"banner" | "interstitial" | null>(null);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const user = FIREBASE_AUTH.currentUser;

  useEffect(() => {
    if (!user) return;

    const messagesQuery = query(
      collection(FIRESTORE_DB, "messages"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
      if (snapshot.empty) {
        setConversations([]);
        return;
      }

      // Build map keyed by otherUserId
      const convMap = new Map<string, {
        id: string;
        userId: string;
        lastMessage: string;
        timestamp: number;
        unreadCount: number;
      }>();

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const [a, b] = data.conversationId.split("_");
        const otherUserId = a === user.uid ? b : a;
        if (!otherUserId) return;

        const isUnread = data.senderId !== user.uid && !data.read;
        const existing = convMap.get(otherUserId);

        if (!existing) {
          convMap.set(otherUserId, {
            id: data.conversationId,
            userId: otherUserId,
            lastMessage: data.text,
            timestamp: data.timestamp,
            unreadCount: isUnread ? 1 : 0,
          });
        } else {
          if (data.timestamp > existing.timestamp) {
            existing.lastMessage = data.text;
            existing.timestamp = data.timestamp;
          }
          if (isUnread) existing.unreadCount += 1;
        }
      });

      // Fetch each other‑user’s username
      const convs = await Promise.all(
        Array.from(convMap.values()).map(async (conv) => {
          const userDoc = await getDoc(doc(FIRESTORE_DB, "users", conv.userId));
          return {
            ...conv,
            username: userDoc.exists()
              ? (userDoc.data()?.username as string) || "Undefined Username"
              : "Unknown Username",
          };
        })
      );

      // Sort and set
      convs.sort((a, b) => b.timestamp - a.timestamp);
      setConversations(convs);
    });

    return () => unsubscribe();
  }, [user]);

  // A/B Test
  useEffect(() => {
    const random = Math.random();
    const type = random < 0.5 ? "banner" : "interstitial";
    setAdType(type);
  }, []);

  // show interstitial ads one time
  useEffect(() => {
    if (adType === "interstitial") {
      // wait 500 ms to show
      const timer = setTimeout(() => setShowInterstitial(true), 500);
      return () => clearTimeout(timer);
    }
  }, [adType]);

  const openChat = (selectedUserId, selectedUsername) => {
    if (!user) return;
    router.push({
      pathname: "../chat",
      params: {
        senderId: selectedUserId,
        senderUsername: selectedUsername,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.conversationHeader}>Your Conversations</Text>
      {conversations.length === 0 ? (
        <Text style={styles.noConversations}>No past conversations found.</Text>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conversationItem}
              onPress={() => openChat(item.userId, item.username)}
            >
              <Text style={styles.conversationText}>{item.username}</Text>
              <Text style={styles.conversationInfo}>
                {new Date(item.timestamp).toLocaleString()}
                {item.unreadCount > 0 ? ` · ${item.unreadCount} unread` : ""}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
      {/* banner */}
      {adType === "banner" && (
        <View style={{ alignItems: "center", marginTop: 10 }}>
          <AdsBanner />
        </View>
      )}
      {/* Interstitial */}
      <InterstitialAdOverlay visible={showInterstitial} onClose={() => setShowInterstitial(false)} />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  conversationHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  noConversations: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  conversationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  conversationText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  conversationInfo: {
    fontSize: 12,
    color: "#666",
  },
});
