import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, addDoc, query, onSnapshot, orderBy, doc, setDoc } from "firebase/firestore";
import { FIRESTORE_DB, FIREBASE_AUTH } from "../FirebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export default function ChatScreen() {
  const router = useRouter();
  const { senderId, senderUsername } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user && senderId) {
      const conversationId = [user.uid, senderId].sort().join("_");
      const messagesQuery = query(
        collection(FIRESTORE_DB, "messages", conversationId, "chats"),
        orderBy("timestamp", "asc")
      );
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      });
      return unsubscribe;
    }
  }, [user, senderId]);

  const sendMessage = async () => {
    if (!user) {
      Alert.alert("Login Required", "Please log in to send messages.");
      return;
    }

    if (newMessage.trim()) {
      const conversationId = [user.uid, senderId].sort().join("_");

      // Store the message in Firestore
      await addDoc(collection(FIRESTORE_DB, "messages", conversationId, "chats"), {
        senderId: user.uid,
        senderUsername: user.displayName || "Unknown User",
        receiverId: senderId,
        text: newMessage,
        timestamp: Date.now(),
      });

      const userConversationRef = doc(FIRESTORE_DB, "conversations", user.uid, "chats", senderId);
      await setDoc(userConversationRef, {
        userId: senderId,
        username: senderUsername,
        lastMessage: newMessage,
        timestamp: Date.now(),
      }, { merge: true });

      const receiverConversationRef = doc(FIRESTORE_DB, "conversations", senderId, "chats", user.uid);
      await setDoc(receiverConversationRef, {
        userId: user.uid,
        username: user.displayName || "Unknown User",
        lastMessage: newMessage,
        timestamp: Date.now(),
      }, { merge: true });

      setNewMessage("");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.conversationHeader}>Chat with {senderUsername}</Text>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.messageContainer, item.senderId === user.uid ? styles.myMessage : styles.theirMessage]}>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
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
  inputContainer: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 5,
  },
  sendButtonText: {
    color: "white",
    fontSize: 16,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: "80%",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007bff",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#ccc",
  },
  messageText: {
    color: "white",
    fontSize: 16,
  },
});
