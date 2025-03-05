import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { collection, addDoc, query, onSnapshot, orderBy, doc, getDoc, setDoc } from "firebase/firestore";
import { FIRESTORE_DB, FIREBASE_AUTH } from "../FirebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";

// Define navigation types
type InboxStackParamList = {
  inbox: { senderId: string; senderUsername: string };
};

type InboxScreenNavigationProp = StackNavigationProp<InboxStackParamList, "inbox">;
type InboxScreenRouteProp = RouteProp<InboxStackParamList, "inbox">;

type Conversation = {
  id: string;
  userId: string;
  username: string;
  lastMessage: string;
  timestamp: number;
};

type Message = {
  id: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  text: string;
  timestamp: number;
};

export default function Inbox() {
  const navigation = useNavigation<InboxScreenNavigationProp>();
  const route = useRoute<InboxScreenRouteProp>();
  const { senderId, senderUsername } = route.params || {};

  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user?.uid) {
      const conversationsQuery = query(collection(FIRESTORE_DB, "messages", user.uid, "conversations"));
      const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
        setConversations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Conversation[]);
      });
      return unsubscribe;
    }
  }, [user]);

  useEffect(() => {
    if (user?.uid && senderId) {
      const conversationId = [user.uid, senderId].sort().join("_");
      const messagesQuery = query(
        collection(FIRESTORE_DB, "messages", conversationId, "chats"),
        orderBy("timestamp", "asc")
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[]);
      });
      return unsubscribe;
    }
  }, [user, senderId]);

  const sendMessage = async () => {
    if (!user?.uid) {
      Alert.alert("Login Required", "Please log in to send messages.");
      return;
    }

    if (newMessage.trim() && senderId) {
      const conversationId = [user.uid, senderId].sort().join("_");

      await addDoc(collection(FIRESTORE_DB, "messages", conversationId, "chats"), {
        senderId: user.uid,
        senderUsername: user.displayName || "Unknown User",
        receiverId: senderId,
        text: newMessage,
        timestamp: Date.now(),
      });

      const userConversationRef = doc(FIRESTORE_DB, "messages", user.uid, "conversations", senderId);
      const senderConversationRef = doc(FIRESTORE_DB, "messages", senderId, "conversations", user.uid);

      await setDoc(userConversationRef, { lastMessage: newMessage, timestamp: Date.now() }, { merge: true });
      await setDoc(senderConversationRef, { lastMessage: newMessage, timestamp: Date.now() }, { merge: true });

      setNewMessage("");
    }
  };

  return (
    <View style={styles.container}>
      {senderId ? (
        <>
          <Text style={styles.conversationHeader}>Chat with {senderUsername}</Text>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.messageContainer, item.senderId === user?.uid ? styles.myMessage : styles.theirMessage]}>
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
        </>
      ) : (
        <>
          <Text style={styles.conversationHeader}>Your Conversations</Text>
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => navigation.navigate("inbox", { senderId: item.userId, senderUsername: item.username })}
              >
                <Text style={styles.conversationText}>{item.username}</Text>
                <Text style={styles.lastMessage}>{item.lastMessage}</Text>
              </TouchableOpacity>
            )}
          />
        </>
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
  loginMessage: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
  },
  conversationHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
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
  lastMessage: {
    fontSize: 14,
    color: "#666",
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
