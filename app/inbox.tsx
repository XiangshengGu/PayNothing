import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import { collection, addDoc, query, onSnapshot, orderBy } from "firebase/firestore";
import { FIRESTORE_DB } from "../FirebaseConfig";

export default function Inbox() {
  const route = useRoute();
  const { senderId } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (senderId) {
      const messagesQuery = query(
        collection(FIRESTORE_DB, "messages", senderId, "chats"),
        orderBy("timestamp", "asc")
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return unsubscribe;
    }
  }, [senderId]);

  const sendMessage = async () => {
    if (newMessage.trim() && senderId) {
      await addDoc(collection(FIRESTORE_DB, "messages", senderId, "chats"), {
        text: newMessage,
        timestamp: Date.now(),
      });
      setNewMessage("");
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text style={styles.message}>{item.text}</Text>}
      />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  message: {
    padding: 10,
    fontSize: 16,
  },
  input: {
    height: 40,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  sendButton: {
    backgroundColor: "blue",
    padding: 10,
    alignItems: "center",
  },
  sendButtonText: {
    color: "white",
    fontSize: 16,
  },
  videoContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
  },
  username: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
