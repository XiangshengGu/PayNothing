import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { collection, query, onSnapshot, doc, getDoc } from "firebase/firestore";
import { FIRESTORE_DB, FIREBASE_AUTH } from "../FirebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export default function Inbox() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);

  // 1️⃣ Track user authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      }
    });
    return unsubscribe;
  }, []);

  // 2️⃣ Fetch past conversations
  useEffect(() => {
    if (user) {
      const userConversationsRef = collection(FIRESTORE_DB, "conversations", user.uid, "chats");
      const conversationsQuery = query(userConversationsRef);

      const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
        if (!snapshot.empty) {
          setConversations(
            snapshot.docs.map((doc) => ({
              id: doc.id, // The unique conversation ID
              ...doc.data(),
            }))
          );
        } else {
          console.log("No past conversations found.");
        }
      });

      return unsubscribe;
    }
  }, [user]);

  // 3️⃣ Open chat when a conversation is clicked
  const openChat = (selectedUserId, selectedUsername) => {
    if (!user) return;
    router.push({
      pathname: "/chatScreen",
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
