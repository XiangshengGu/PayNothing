import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, SafeAreaView, Image
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, addDoc, query, onSnapshot, orderBy, doc, setDoc, updateDoc, where } from "firebase/firestore";
import { FIRESTORE_DB, FIREBASE_AUTH } from "../FirebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export default function ChatScreen() {
  const router = useRouter();
  const { senderId, senderUsername, receiverId = '' } = useLocalSearchParams();
//   const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (currentUser) => {
//       setUser(currentUser);
//     });
//     return unsubscribe;
//   }, []);
  const user = FIREBASE_AUTH.currentUser;

  useEffect(() => {
    if (user && senderId) {
      const conversationId = [user.uid, senderId].sort().join("_");

      const messagesQuery = query(
        collection(FIRESTORE_DB, "messages"),
        where("conversationId", "==", conversationId),
        orderBy("timestamp", "asc")
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const newMessages = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setMessages(newMessages);

        // Iterate over messages and mark unread ones (sent by the other party) as read.
        newMessages.forEach((msg) => {
          if (msg.senderId !== user.uid && !msg.read) {
            // Update this message document to mark it as read.
            updateDoc(doc(FIRESTORE_DB, "messages", msg.id), { read: true });
          }
        });
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

      await addDoc(collection(FIRESTORE_DB, "messages"), {
        conversationId: conversationId,
        senderId: user.uid,
        senderUsername: user.displayName || "Unknown User",
        receiverId: receiverId,
        text: newMessage,
        timestamp: Date.now(),
        read: false,  // Mark as unread initially (for the recipient)
        participants: [user.uid, senderId],  // Store both user IDs for this conversation
      });

      setNewMessage("");
    }
  };

  const handlePressHeader = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handlePressHeader} style={styles.backButton}>
            <Image 
              source={require("../assets/images/back-arrow.png")} 
              style={styles.icons}
            />
          </TouchableOpacity>
          <Text style={styles.conversationHeader}>Chat with {senderUsername}</Text>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageContainer,
                item.senderId === user.uid ? styles.myMessage : styles.theirMessage,
              ]}
            >
              <Text style={styles.messageText}>{item.text}</Text>
              <Text style={styles.messageTimestamp}>
                {new Date(item.timestamp).toLocaleString()}
              </Text>
            </View>
          )}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 10, paddingBottom: 10 }}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f4f4",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  backButton: {
    position: "absolute",
    left: 10,
    zIndex: 1,
  },
  icons: {
    height: 30,
    width: 30,
  },
  conversationHeader: {
    fontSize: 18,
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginRight: 10,
    borderColor: "#ccc",
  },
  sendButton: {
    backgroundColor: "#007bff",
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
    alignSelf: "flex-start",
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
  messageTimestamp: {
    fontSize: 10,
    color: "white",
    alignSelf: "flex-end",
    marginTop: 4,
  },
});
