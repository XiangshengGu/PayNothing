import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";

const Latest = () => (
  <View style={styles.scene}>
    <Text>Latest Videos</Text>
  </View>
);

const Trending = () => (
  <View style={styles.scene}>
    <Text>Trending Videos</Text>
  </View>
);

export default function Home() {
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
    backgroundColor: "rgb(0, 0, 0)",
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
});