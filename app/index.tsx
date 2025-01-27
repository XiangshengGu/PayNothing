import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from "react-native";
import { Video } from 'expo-av';
import { useEffect, useState } from "react";
import { FIRESTORE_DB } from "../FirebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import React from 'react';

export default function Home() {
  const video = React.useRef(null);
  const [videos, setVideos] = useState([]);

  const getData = async () => {
    try {
      const videosCollection = await getDocs(collection(FIRESTORE_DB, "videos"));
      const videoData = [];
      videosCollection.forEach((doc) => {
        const data = doc.data();
        videoData.push({
          id: doc.id,
          title: data.title,
          price: data.price,
          videoUrl: data.video_url,
        });
      });
      setVideos(videoData);
    } catch (error) {
      console.error("Error fetching documents: ", error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const Latest = () => (
    <FlatList
      data={videos}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>Title: {item.title}</Text>
          <Text style={styles.price}>Price: {item.price}</Text>
          <Video
            ref={video}
            style={styles.video}
            source={{ uri: item.videoUrl }}
            useNativeControls
          />
        </View>
      )}
    />
  );

  const Trending = () => (
    <View style={styles.scene}>
      <Text>Trending Videos</Text>
    </View>
  );

  const [activeTab, setActiveTab] = useState("latest"); // To track active tab

  const renderContent = () => {
    switch (activeTab) {
      case "latest":
        return <Latest />;
      case "trending":
        return <Trending />;
      default:
        return <Latest />;
    }
  };

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
            onPress={() => setActiveTab("latest")}
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
            onPress={() => setActiveTab("trending")}
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
          placeholder="Search..."
          placeholderTextColor="white"
        />
      </View>

      {/* Content Area */}
      <View style={styles.contentArea}>{renderContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(255, 255, 255)",
  },
  topBar: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    backgroundColor: "rgba(255, 228, 118, 0.8)",
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
    backgroundColor: "rgba(135, 135, 135, 0.61)",
    color: "rgb(255, 255, 255)",
  },
  contentArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scene: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: 300,
    height: 200,
    backgroundColor: "blue",
  }
});