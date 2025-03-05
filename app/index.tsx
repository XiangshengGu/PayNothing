import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Image } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { collection, onSnapshot } from "firebase/firestore";
import React from "react";
import { FIRESTORE_DB } from "../FirebaseConfig";
import { useRouter } from "expo-router";
import { doc, updateDoc, increment } from "firebase/firestore";

const { width: winWidth, height: winHeight } = Dimensions.get("window");

type VideoPost = {
  id: string;
  title: string;
  username: string;
  description: string;
  uploadTime: number;
  likes: number;
  videoUrl: string;
};

export default function Home() {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoPost[]>([]);
  const [activeTab, setActiveTab] = useState("latest");
  const [likes, setLikes] = useState<Record<string, number>>({});
  const videoRefs = useRef<(Video | null)[]>([]);
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(FIRESTORE_DB, "videos"), (snapshot) => {
      const videoData: VideoPost[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title || "No Title",
        username: doc.data().username || "Unknown User",
        description: doc.data().description || "No description available",
        uploadTime: doc.data().upload_time || 0,
        likes: doc.data().likes || 0,
        videoUrl: doc.data().video_url || "",
      }));

      setVideos(videoData);
      setFilteredVideos(videoData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let sortedVideos = [...videos];
  
    if (activeTab === "latest") {
      sortedVideos.sort((a, b) => b.uploadTime - a.uploadTime);
    } else if (activeTab === "trending") {
      sortedVideos.sort((a, b) => {
        const likesA = likes[a.id] ?? a.likes ?? 0;  // Ensure likes are correctly retrieved
        const likesB = likes[b.id] ?? b.likes ?? 0;
        return likesB - likesA;
      });
    }
  
    setFilteredVideos(sortedVideos);
  }, [activeTab, videos, likes]); // Add `likes` dependency
  

  const handleLike = async (videoId: string) => {
    try {
      const videoRef = doc(FIRESTORE_DB, "videos", videoId);
      await updateDoc(videoRef, { likes: increment(1) }); // Update Firestore likes
  
      // Optimistically update UI state
      setLikes((prevLikes) => ({
        ...prevLikes,
        [videoId]: (prevLikes[videoId] || 0) + 1,
      }));
    } catch (error) {
      console.error("Error updating like count:", error);
    }
  };

  const handleMessagePress = (video: VideoPost) => {
    router.push({ pathname: "/inbox", params: { senderId: video.id, senderUsername: video.username } });
  };

  const renderVideo = ({ item, index }: { item: VideoPost; index: number }) => (
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
          <Text style={styles.videoTitle}>{item.title}</Text>
          <Text style={styles.username}>Posted by {item.username}</Text>
          <Text style={styles.videoDescription}>{item.description}</Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.messageButton} onPress={() => handleMessagePress(item)}>
            <Text style={styles.buttonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.likeButton} onPress={() => handleLike(item.id)}>
            <Image source={require("../assets/images/like-icon.png")} style={styles.likeIcon} />
            <Text style={styles.likeCount}>{likes[item.id] || item.likes || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "latest" && styles.activeTabButton]}
            onPress={() => setActiveTab("latest")}
          >
            <Text style={[styles.tabButtonText, activeTab === "latest" && styles.activeTabButtonText]}>Latest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "trending" && styles.activeTabButton]}
            onPress={() => setActiveTab("trending")}
          >
            <Text style={[styles.tabButtonText, activeTab === "trending" && styles.activeTabButtonText]}>Trending</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Video List */}
      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.id}
        renderItem={renderVideo}
        pagingEnabled
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  topBar: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
  },
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: "#fff",
  },
  tabButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  activeTabButtonText: {
    color: "#000",
  },
  videoContainer: {
    width: winWidth,
    height: winHeight * 0.75,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  videoTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  username: {
    color: "#ccc",
    fontSize: 14,
  },
  videoDescription: {
    color: "#bbb",
    fontSize: 12,
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  messageButton: {
    backgroundColor: "#007bff",
    padding: 8,
    borderRadius: 5,
    marginRight: 10,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  likeIcon: {
    width: 20,
    height: 20,
  },
  likeCount: {
    color: "#fff",
    marginLeft: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
  },
});
