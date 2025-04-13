import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { collection, query, onSnapshot, getDoc, doc, where } from "firebase/firestore";
import { FIRESTORE_DB, FIREBASE_AUTH } from "../../FirebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export default function Inbox() {
  const router = useRouter();
//   const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (currentUser) => {
//       if (currentUser) {
//         setUser(currentUser);
//       }
//     });
//     return unsubscribe;
//   }, []);
  const user = FIREBASE_AUTH.currentUser;

  useEffect(() => {
    if (user) {
      console.log("Fetching inbox for user:", user.uid);

      // Query: Get messages where the current user is a participant
      const messagesQuery = query(
        collection(FIRESTORE_DB, "messages"),
        where("participants", "array-contains", user.uid)
      );

      const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
        if (!snapshot.empty) {
          const fetchedConversations = new Map<string, {
            id: string;
            userId: string;
            username: string;
            lastMessage: string;
            timestamp: number;
            unreadCount: number;
          }>();

          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const conversationId = data.conversationId;
            const ids = conversationId.split("_");
            const otherUserId = ids.find((id) => id !== user.uid);
            if (!otherUserId) return;

            // Check if the message is unread (i.e. sent by the other user and not read)
            const isUnread = data.senderId !== user.uid && !data.read;

            if (!fetchedConversations.has(otherUserId)) {
              fetchedConversations.set(otherUserId, {
                id: conversationId,
                userId: otherUserId,
                username: "Unknown User", // You can later update this with actual data
                lastMessage: data.text,
                timestamp: data.timestamp,
                unreadCount: isUnread ? 1 : 0,
              });
            } else {
              const existingData = fetchedConversations.get(otherUserId)!;
              // Update the last message if the current one is newer
              if (data.timestamp > existingData.timestamp) {
                existingData.lastMessage = data.text;
                existingData.timestamp = data.timestamp;
              }
              // Accumulate unread messages count
              if (isUnread) {
                existingData.unreadCount = (existingData.unreadCount || 0) + 1;
              }
              fetchedConversations.set(otherUserId, existingData);
            }
          });

          // Convert Map values to array and sort by most recent message timestamp.
          const sortedConversations = Array.from(fetchedConversations.values()).sort(
            (a, b) => b.timestamp - a.timestamp
          );

          console.log("Fetched conversations:", sortedConversations);
          setConversations(sortedConversations);
        } else {
          console.log("No past conversations found.");
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

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
