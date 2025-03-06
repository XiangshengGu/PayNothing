// Citation: Codes below are created with the assistance of
// OpenAI's ChatGPT (2025).
// Also with the assistance of DeepSeek AI (https://www.deepseek.com).

import { Platform, View, Text, StyleSheet, TouchableOpacity, 
         FlatList, Dimensions, Image, TextInput, ViewToken, Alert } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { collection, onSnapshot, doc, updateDoc, increment} from "firebase/firestore";
import React from "react";
import { FIRESTORE_DB, FIREBASE_AUTH } from "../FirebaseConfig";
import { VideoItem } from "./data/models";
import { useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";

const { width: winWidth, height: winHeight } = Dimensions.get("window");
// adjust by OS, 60 search bar, 50 navig bar, 65 each page titlebar
const videoContainerHeight = Platform.OS === "ios" ? winHeight - 44 - 60 - 50 - 64 : winHeight - 24 - 50 - 50 - 64;


export default function Home() 
{
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeTab, setActiveTab] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVideos, setFilteredVideos] = useState<VideoItem[]>([]);
  const [likes, setLikes] = useState<{ [key: string]: number }>({});
  const [likedVideos, setLikedVideos] = useState<string[]>([]);
  const videoRefs = useRef<(Video | null)[]>([]);
  const [curPlayingIndex, setCurPlayingIndex] = useState<number | null>(null); // save the index of the current playing video
  const [playStatus, setPlayStatus] = useState<boolean[]>([]);  // store all videos' status
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);
  
  // Fetch video posts from Firestore with real-time updates
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(FIRESTORE_DB, "videos"), (snapshot) => {
      const videoData: VideoItem[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        username: doc.data().username || "Unknown User",
        description: doc.data().description || "Please message me for more information.",
        uploadTime: doc.data().upload_time || 0,
        likes: doc.data().likes || 0,
        videoUrl: doc.data().video_url,
      }));

      setVideos(videoData);
      setFilteredVideos(videoData);
      setPlayStatus(new Array(videoData.length).fill(false));
    });

    return () => unsubscribe();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Stop all videos when the screen is no longer focused
      return () => {
        videoRefs.current.forEach((ref) => {
          ref?.pauseAsync();  // Pause all videos when navigating away from the screen
        });
        setPlayStatus(new Array(videoRefs.current.length).fill(false));
      };
    }, [])
  );

  // Handle likes
  const handleLike = async (videoId: string) => {
    if (!user) {
      Alert.alert("Login Required", "Please log in to like posts");
      return;
    }
    try {
      const videoRef = doc(FIRESTORE_DB, "videos", videoId);
      const isLiked = likedVideos.includes(videoId);
      const incrementValue = isLiked ? -1 : 1;

      await updateDoc(videoRef, { likes: increment(incrementValue) });
      
      setLikedVideos(prev => 
        isLiked ? prev.filter(id => id !== videoId) : [...prev, videoId]
      );

      setLikes(prev => ({
        ...prev,
        [videoId]: (prev[videoId] || 0) + incrementValue
      }));
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleMessagePress = (video: VideoItem) => {
    if (!user) {
      Alert.alert("Login Required", "Please log in to send messages");
      return;
    }
    router.push({ 
      pathname: "/inbox", 
      params: { senderId: video.id, senderUsername: video.username } 
    });
  };

  // Sort videos based on active tab
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

  // Filter videos by search query
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredVideos(videos);
    } else {
      const filtered = videos.filter((video) =>
        video.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredVideos(filtered);
    }
  };

  // Handle video playback
  const handleViewableItemsChanged = ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    videoRefs.current.forEach((ref, index) => {
      if (ref) {
        if (viewableItems.some((item) => item.key === filteredVideos[index]?.id)) {
          ref.playAsync();
          setCurPlayingIndex(index);
          setPlayStatus((prev) => prev.map((v, i) => (i === index ? true : false)));
        } else {
          ref.pauseAsync();
        }
      }
    });
  };

  // toggle to Play or Pause
  const togglePlayPause = (index: number) => {
    const isPlaying = playStatus[index];
    if (isPlaying) {
      videoRefs.current[index]?.pauseAsync();
    } else {
      videoRefs.current[index]?.playAsync();
    }
    setPlayStatus((prev) => prev.map((v, i) => (i === index ? !isPlaying : v)));
  };

  // Pull down to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  const renderVideo = ({ item, index }: { item: VideoItem; index: number }) => (
    <TouchableOpacity 
      activeOpacity={0.9} 
      style={styles.videoContainer}
      onPress={() => togglePlayPause(index)}
    >
      <Video
        ref={(ref) => (videoRefs.current[index] = ref)}
        source={{ uri: item.videoUrl }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        isLooping
      />

      {/* Pause overlay */}
      {!playStatus[index] && (
        <View style={styles.pauseOverlay}>
          <Image
            source={require("../assets/images/play-icon.png")}
            style={styles.playIcon}
          />
        </View>
      )}

      <View style={styles.overlay}>
        <View style={styles.textContainer}>
          <Text style={styles.videoTitle}>{item.title}</Text>
          <View style={styles.userInfo}>
            <Text style={styles.username}>@{item.username}</Text>
            <Text style={styles.uploadTime}>
              {new Date(item.uploadTime).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.videoDescription}>{item.description}</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.likeContainer} 
            onPress={() => handleLike(item.id)}
          >
            <Image
              source={likedVideos.includes(item.id) 
                ? require("../assets/images/filled-like.png") 
                : require("../assets/images/empty-like.png")}
              style={styles.likeIcon}
            />
            <Text style={styles.likeCount}>
              {likes[item.id] || item.likes || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.messageButton} 
            onPress={() => handleMessagePress(item)}
          >
            <Image
              source={require("../assets/images/DM-icon.png")}
              style={styles.dmIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Top bar with sort tabs and search bar */}
      <View style={styles.topBar}>
        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "latest" && styles.activeTabButton,
            ]}
            onPress={() => {
              setActiveTab("latest"); // setVideos();
            }}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === "latest" && styles.activeTabButtonText,
              ]}
            >Latest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "trending" && styles.activeTabButton,
            ]}
            onPress={() => { 
              setActiveTab("trending"); // sortVideos();
            }}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === "trending" && styles.activeTabButtonText,
              ]}
            >Trending</Text>
          </TouchableOpacity>
        </View>
        {/* Search Bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Looking for specific items?"
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Video List */}
      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.id}
        renderItem={renderVideo}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          viewAreaCoveragePercentThreshold: 80,
        }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        style={{ flex: 1 }}
      />
    </View>
  );
}

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#0A0A0A",
    },
    topBar: {
      height: 60,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      backgroundColor: "#1A1A1A",
      borderBottomWidth: 1,
      borderBottomColor: "#333",
      opacity: 0.8,
    },
    tabContainer: {
      flexDirection: "row",
      backgroundColor: "#2A2A2A",
      borderRadius: 25,
      padding: 3,
    },
    tabButton: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
    },
    activeTabButton: {
      backgroundColor: "#FFF",
      shadowColor: "#FFF",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
    },
    tabButtonText: {
      color: "#999",
      fontSize: 14,
      fontWeight: "600",
    },
    activeTabButtonText: {
      color: "#000",
    },
    searchBar: {
      flex: 1,
      height: 40,
      marginLeft: 15,
      paddingHorizontal: 15,
      borderRadius: 20,
      backgroundColor: "#2A2A2A",
      color: "#FFF",
      fontSize: 14,
    },
    videoContainer: {
      width: winWidth,
      height: videoContainerHeight,
      backgroundColor: "#000",
    },
    video: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.9,
    },
    pauseOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    playIcon: {
      width: 60,
      height: 60,
      opacity: 0.7,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 20,
      paddingTop: 40,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    videoTitle: {
      color: "#FFF",
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 8,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    username: {
      color: "#FFF",
      fontSize: 14,
      fontWeight: "600",
      marginRight: 10,
    },
    uploadTime: {
      color: "#AAA",
      fontSize: 12,
    },
    videoDescription: {
      color: "#DDD",
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 15,
    },
    actionsContainer: {
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginLeft: 15,
    },
    messageButton: {
      marginBottom: 25,
      padding: 10,
    },
    dmIcon: {
      width: 28,
      height: 28,
    },
    likeContainer: {
      alignItems: "center",
      marginBottom: 20,
    },
    likeIcon: {
      width: 28,
      height: 28,
    },
    likeCount: {
      color: "#FFF",
      fontSize: 12,
      marginTop: 4,
      fontWeight: '600',
    },
  });