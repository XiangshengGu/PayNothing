import { Platform, View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Image, TextInput } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { FIRESTORE_DB } from "../FirebaseConfig";

type VideoItem = {
  id: string;
  title: string;
  description: string;
  uploadTime: number;
  likes: number;
  videoUrl: string;
  sender: string;
};

// Define the navigation type
type RootStackParamList = {
  inbox: { sender: string };
};
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "inbox">;

const { width: winWidth, height: winHeight } = Dimensions.get("window");
const videoContainerHeight = Platform.OS === "ios" ? winHeight - 44 - 60 - 50 - 64 : winHeight - 24 - 50 - 50 - 64;

export default function Home() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const navigation = useNavigation<NavigationProp>();
  const videoRefs = useRef<(Video | null)[]>([]);

  useEffect(() => {
    const getData = async () => {
      try {
        const videosCollection = await getDocs(collection(FIRESTORE_DB, "videos"));
        const videoData = videosCollection.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          description: doc.data().description || "Please message me for more information.",
          uploadTime: doc.data().upload_time || 0,
          likes: doc.data().likes || 0,
          videoUrl: doc.data().video_url,
          sender: doc.data().username || "Anonymous",
        }));
        setVideos(videoData);
      } catch (error) {
        console.error("Error fetching documents: ", error);
      }
    };
    getData();
  }, []);

  const renderVideo = ({ item, index }: { item: VideoItem; index: number }) => (
    <View style={styles.videoContainer}>
      <Video
        ref={(ref) => (videoRefs.current[index] = ref)}
        source={{ uri: item.videoUrl }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        isLooping
      />
      <View style={styles.overlay}>
        <View style={styles.textContainer}>
          <TouchableOpacity onPress={() => navigation.navigate("inbox", { sender: item.sender })}>
            <Text style={styles.username}>{item.sender}</Text>
          </TouchableOpacity>
          <Text style={styles.videoTitle}>{item.title}</Text>
          <Text style={styles.videoDescription}>{item.description}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={renderVideo}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        style={{ flex: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(0, 0, 0)",
  },
  videoContainer: {
    width: winWidth,
    height: videoContainerHeight,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    width: winWidth,
    height: winHeight,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: 20,
  },
  textContainer: {
    flex: 1,
  },
  username: {
    color: "rgb(255, 200, 0)",
    fontSize: 16,
    fontWeight: "bold",
  },
  videoTitle: {
    color: "rgb(255, 255, 255)",
    fontSize: 18,
    fontWeight: "bold",
  },
  videoDescription: {
    color: "rgb(100, 100, 100)",
    fontSize: 14,
  },
});
