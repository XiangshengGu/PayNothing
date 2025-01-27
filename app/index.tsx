// Citation: Codes below are created with the assistance of
// OpenAI's ChatGPT (2025).

import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Image, TextInput } from "react-native";
import { Video } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { FIRESTORE_DB } from "../FirebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import React from "react";

const { width, height } = Dimensions.get("window");

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [activeTab, setActiveTab] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [likes, setLikes] = useState({});
  const videoRefs = useRef([]);

  // Fetch video posts from Firestore
  const getData = async () => {
    try {
      const videosCollection = await getDocs(collection(FIRESTORE_DB, "videos"));
      const videoData = [];
      videosCollection.forEach((doc) => {
        const data = doc.data();
        videoData.push({
          id: doc.id,
          title: data.title,
          description: data.description || "Please message me for more information.",
          uploadTime: data.upload_time, // Assuming timestamp is stored
          likes: data.likes || 0,
          videoUrl: data.video_url,
        });
      });
      setVideos(videoData);
      setFilteredVideos(videoData);
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  // Handle likes
  const handleLike = (id) => {
    setLikes((prevLikes) => ({
      ...prevLikes,
      [id]: (prevLikes[id] || 0) + 1,
    }));
  };

  // Sort videos based on active tab
  const sortVideos = () => {
    let sortedVideos = [...videos];
    if (activeTab === "latest") {
      sortedVideos.sort((a, b) => b.uploadTime - a.uploadTime);
    } else if (activeTab === "trending") {
      sortedVideos.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    setFilteredVideos(sortedVideos);
  };

  // Filter videos by search query
  const handleSearch = (query) => {
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
  const handleViewableItemsChanged = ({ viewableItems }) => {
    videoRefs.current.forEach((ref, index) => {
      if (ref) {
        if (viewableItems.some((item) => item.key === filteredVideos[index]?.id)) {
          ref.playAsync();
        } else {
          ref.pauseAsync();
        }
      }
    });
  };

  const renderVideo = ({ item, index }) => (
    <View style={styles.videoContainer}>
      {/* Video Component */}
      <Video
        ref={(ref) => (videoRefs.current[index] = ref)}
        source={{ uri: item.videoUrl }}
        style={styles.video}
        resizeMode="cover"
        isLooping
        onPlaybackStatusUpdate={(status) => {
          if (status.didJustFinish) {
            videoRefs.current[index].replayAsync();
          }
        }}
      />
      {/* Title and Description */}
      <View style={styles.overlay}>
        <View style={styles.textContainer}>
          <Text style={styles.videoTitle}>{item.title}</Text>
          <Text style={styles.videoDescription}>{item.description}</Text>
        </View>
        {/* Like Button */}
        <TouchableOpacity
          style={styles.likeContainer}
          onPress={() => handleLike(item.id)}
        >
          <Image
            source={require("../assets/images/like-icon.png")}
            style={styles.likeIcon}
          />
          <Text style={styles.likeCount}>
            {likes[item.id] || item.likes || 0}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top bar with tabs and search bar */}
      <View style={styles.topBar}>
        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "latest" && styles.activeTabButton,
            ]}
            onPress={() => {
              setActiveTab("latest");
              sortVideos();
            }}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "latest" && styles.activeTabButtonText,
              ]}
            >
              Latest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "trending" && styles.activeTabButton,
            ]}
            onPress={() => {
              setActiveTab("trending");
              sortVideos();
            }}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "trending" && styles.activeTabButtonText,
              ]}
            >
              Trending
            </Text>
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(0, 0, 0)",
  },
  topBar: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    backgroundColor: "#rgba(255, 200, 0, 0.77)",
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
    backgroundColor: "rgb(255, 255, 255)",
  },
  tabButtonText: {
    color: "rgb(255, 255, 255)",
    fontSize: 16,
  },
  activeTabButtonText: {
    color: "rgb(0, 0, 0)",
  },
  searchBar: {
    flex: 1,
    height: 40,
    marginLeft: 10,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "rgb(255, 255, 255)",
    color: "rgb(0, 0, 0)",
  },
  videoContainer: {
    width,
    height,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    width,
    height,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: 20,
  },
  textContainer: {
    flex: 1,
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
  likeContainer: {
    alignItems: "center",
  },
  likeIcon: {
    width: 30,
    height: 30,
  },
  likeCount: {
    color: "rgb(255, 255, 255)",
    fontSize: 14,
    marginTop: 5,
  },
});