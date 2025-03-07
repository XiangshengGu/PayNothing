import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { collection, query, onSnapshot, getDoc, doc, where } from "firebase/firestore";
import { FIRESTORE_DB, FIREBASE_AUTH } from "../../FirebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export default function Inbox() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      console.log("Fetching inbox for user:", user.uid);

      // Firestore query: Get messages where the user is either the sender or the receiver
      const messagesQuery = query(
        collection(FIRESTORE_DB, "messages"),
        where("participants", "array-contains", user.uid)  // Fetch only the messages related to current user
      );

      const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
        if (!snapshot.empty) {
          const fetchedConversations = new Map(); // Store only one entry per user

          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const conversationId = data.conversationId;
            const ids = conversationId.split("_");
            const otherUserId = ids.find((id) => id !== user.uid);
            if (!otherUserId) continue; // Skip if unable to find the other user

            // Check if this user is already in the conversations map
            if (!fetchedConversations.has(otherUserId)) {
              fetchedConversations.set(otherUserId, {
                id: conversationId,
                userId: otherUserId,
                username: "Unknown User", // To do: get the actual username here, currently it's just a placeholder
                lastMessage: data.text,
                timestamp: data.timestamp,
              });
            } else {
              // Update only if this message is more recent
              const existingData = fetchedConversations.get(otherUserId);
              if (data.timestamp > existingData.timestamp) {
                fetchedConversations.set(otherUserId, {
                  ...existingData,
                  lastMessage: data.text,
                  timestamp: data.timestamp,
                });
              }
            }
          }

          // Convert Map values to array and sort by most recent message
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
});
