// Citation: Codes below are created with the assistance of
// OpenAI's ChatGPT (2025).
// Also with the assistance of DeepSeek AI (https://www.deepseek.com).

import { Platform, View, Text, StyleSheet, TouchableOpacity, 
  Dimensions, Image, TextInput, Alert } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { collection, onSnapshot, doc, updateDoc, increment, arrayUnion } from "firebase/firestore";
import React from "react";
import { FIRESTORE_DB, FIREBASE_AUTH } from "../../FirebaseConfig";
import { VideoItem, ItemTag } from "../data/models";
import { useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  Gesture, 
  GestureDetector, 
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, { 
useAnimatedStyle, 
useSharedValue, 
SharedValue,
withTiming, 
runOnJS 
} from "react-native-reanimated";

const { width: winWidth, height: winHeight } = Dimensions.get("window");
const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 500;

// DescriptionOverlay component
function DescriptionOverlay({ video, onClose }: { video: VideoItem; onClose: () => void }) {
  return (
    <View style={styles.overlayContainer}>
      <Text style={styles.overlayDescription}>{video.description}</Text>
      <TouchableOpacity onPress={onClose}>
        <Text style={styles.closeButton}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function Home() 
{
//   const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [activeTab, setActiveTab] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [likes, setLikes] = useState<{ [key: string]: number }>({});
  const [likedVideos, setLikedVideos] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDescription, setShowDescription] = useState(false);
  const videoRef = useRef<Video>(null);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const [filteredVideos, setFilteredVideos] = useState<VideoItem[]>([]);

  const [curPlayingIndex, setCurPlayingIndex] = useState<number | null>(null); // save the index of the current playing video
  const [playStatus, setPlayStatus] = useState<boolean[]>([]);  // store all videos' status
  const [refreshing, setRefreshing] = useState(false);
  
  // Tag filter vars
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [selectedTag, setSelectedTag] = useState<ItemTag | null>(null);
  const navigation = useNavigation();
  const router = useRouter();

  const handleSwipeComplete = (direction: 'left' | 'right' | 'down') => {
    const currentVideo = filteredVideos[currentIndex];
    
    // Handle actions
    if (direction === 'right' && currentVideo) {
      handleLike(currentVideo.id);
    } else if (direction === 'down' && currentVideo) {
      handleSave(currentVideo.id);
    }

    // Move to next video
    setCurrentIndex(prev => (prev + 1) % filteredVideos.length);
  };

  const handleSave = async (videoId: string) => {
    if (!user) {
      Alert.alert("Login Required", "Please log in to save posts");
      return;
    }
    try {
      const userRef = doc(FIRESTORE_DB, "users", user.uid);
      await updateDoc(userRef, {
        savedVideos: arrayUnion(videoId)
      });
    } catch (error) {
      console.error("Error saving video:", error);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ],
    opacity: opacity.value
  })); 
  
  // Gesture Handler
  const panGesture = Gesture.Pan()
    .onStart(() => {
      translateX.value = 0;
      translateY.value = 0;
      opacity.value = 1;
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
      const dragDistance = Math.sqrt(e.translationX ** 2 + e.translationY ** 2);
      opacity.value = Math.max(1 - dragDistance / 400, 0.5);
    })
    .onEnd((e) => {
      const isHorizontal = Math.abs(e.translationX) > Math.abs(e.translationY);
      const isSwipeUp = e.translationY < 0;

      if (isHorizontal || e.translationY > 0) {
        // Handle left/right/down swipes
        let targetX = 0;
        let targetY = 0;
        let direction: 'left' | 'right' | 'down' | null = null;

        if (isHorizontal) {
          if (Math.abs(e.translationX) > SWIPE_THRESHOLD || Math.abs(e.velocityX) > SWIPE_VELOCITY_THRESHOLD) {
            direction = e.translationX > 0 ? 'right' : 'left';
            targetX = e.translationX > 0 ? winWidth * 1.5 : -winWidth * 1.5;
          }
        } else {
          if (e.translationY > SWIPE_THRESHOLD || e.velocityY > SWIPE_VELOCITY_THRESHOLD) {
            direction = 'down';
            targetY = winHeight * 1.5;
          }
        }

        if (direction) {
          translateX.value = withTiming(targetX, { duration: 250 });
          translateY.value = withTiming(targetY, { duration: 250 });
          opacity.value = withTiming(0, { duration: 250 }, () => {
            runOnJS(handleSwipeComplete)(direction!);
          });
        } else {
          translateX.value = withTiming(0);
          translateY.value = withTiming(0);
          opacity.value = withTiming(1);
        }
      } else if (isSwipeUp) {
        // Handle swipe up
        if (Math.abs(e.translationY) > SWIPE_THRESHOLD || Math.abs(e.velocityY) > SWIPE_VELOCITY_THRESHOLD) {
          runOnJS(setShowDescription)(true);
        }
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        opacity.value = withTiming(1);
      }
    });

    const SwipeFeedbackOverlay = ({ translateX, translateY }: { 
      translateX: SharedValue<number>;
      translateY: SharedValue<number>;
    }) => {
      const overlayStyle = useAnimatedStyle(() => {
        const x = translateX.value;
        const y = translateY.value;
        const dragDistance = Math.sqrt(x ** 2 + y ** 2);
        const opacity = Math.min(dragDistance / 100, 1); // More intense opacity
        
        let color = 'transparent';
        if (Math.abs(x) > Math.abs(y)) {
          color = x > 0 ? '#00FF00' : '#FF0000'; // Bright green/red
        } else if (y > 0) {
          color = '#FFFF00'; // Bright yellow
        }
    
        return {
          backgroundColor: color,
          opacity: opacity * 0.7, // Keep some transparency
          mixBlendMode: 'screen', // Creates vibrant overlay effect
        };
      });
    
      return (
        <Animated.View style={[StyleSheet.absoluteFillObject, overlayStyle]} />
      );
    };

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (currentUser) => {
//       setUser(currentUser);
//     });
//     return unsubscribe;
//   }, []);
  const user = FIREBASE_AUTH.currentUser;
  
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    opacity.value = 1;
    videoRef.current?.playAsync();
  }, [currentIndex]);

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
        tags: doc.data().tags || [ItemTag.OTHER],
      }));

      setVideos(videoData);
      setFilteredVideos(videoData);
      setPlayStatus(new Array(videoData.length).fill(false));
    });

    return () => unsubscribe();
  }, []);

  // Handle likes
  const handleLike = async (videoId: string) => {
//     if (!user) {
//       Alert.alert("Login Required", "Please log in to like posts");
//       return;
//     }
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
      pathname: "../chat",
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

  // Add swipe indicator animations
  const SwipeIndicators = ({ translateX, translateY }: { 
    translateX: SharedValue<number>;
    translateY: SharedValue<number>;
  }) => {
    const leftIndicatorStyle = useAnimatedStyle(() => ({
    opacity: Math.min(-translateX.value / 50, 1), // Faster opacity buildup
    transform: [
      { translateX: -30 + translateX.value * 0.2 },
      { scale: 1 + (-translateX.value / 200) } // Add scaling effect
    ],
  }));

  const rightIndicatorStyle = useAnimatedStyle(() => ({
    opacity: Math.min(translateX.value / 50, 1), // Faster opacity buildup
    transform: [
      { translateX: 30 + translateX.value * 0.2 },
      { scale: 1 + (translateX.value / 200) } // Add scaling effect
    ],
  }));

  const downIndicatorStyle = useAnimatedStyle(() => ({
    opacity: Math.min(translateY.value / 50, 1), // Faster opacity buildup
    transform: [
      { translateY: 30 + translateY.value * 0.2 },
      { scale: 1 + (translateY.value / 200) } // Add scaling effect
    ],
  }));
  
  return (
    <>
      <Animated.View style={[styles.swipeIndicatorLeft, leftIndicatorStyle]}>
        <Image
          source={require('../../assets/images/dislike.png')}
          style={styles.indicatorIcon}
        />
      </Animated.View>
      <Animated.View style={[styles.swipeIndicatorRight, rightIndicatorStyle]}>
        <Image
          source={require('../../assets/images/like.png')}
          style={styles.indicatorIcon}
        />
      </Animated.View>
      <Animated.View style={[styles.swipeIndicatorBottom, downIndicatorStyle]}>
        <Image
          source={require('../../assets/images/saved-icon.png')}
          style={styles.indicatorIcon}
        />
      </Animated.View>
    </>
  );
};

  // Filter video by tag
  const filterByTag = (tag: ItemTag | null) => {
    setSelectedTag(tag);
    if (!tag) {
      setFilteredVideos(videos);
    } else {
      const filtered = videos.filter(video => 
        video.tags.includes(tag)
      );
      setFilteredVideos(filtered);
    }
    setShowTagDropdown(false);
  };

  // Pull down to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  const renderVideo = (item: VideoItem, index: number) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.videoContainer}
    >
      <Video
        ref={videoRef}
        source={{ uri: item.videoUrl }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay
      />
    {/* Add swipe feedback overlay */}
    <SwipeFeedbackOverlay translateX={translateX} translateY={translateY} />
    <SwipeIndicators translateX={translateX} translateY={translateY} />
      <View style={styles.overlay}>
        <View style={styles.textContainer}>
          <Text style={styles.videoTitle}>{item.title}</Text>
          <View style={styles.userInfo}>
            <Text style={styles.uploadTime}>
              {new Date(item.uploadTime).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.messageButton} 
            onPress={() => handleMessagePress(item)}
          >
            <Image
              source={require("../../assets/images/DM-icon.png")}
              style={styles.dmIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
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
          {/* Search Bar and tag filter*/}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchBar}
              placeholder="Looking for specific items?"
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            
            <TouchableOpacity 
              onPress={() => setShowTagDropdown(!showTagDropdown)}
              style={styles.filterButton}
            >
              <Image
                source={require("../../assets/images/tag-sort.png")}
                style={styles.filterIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Label drop-down box */}
        {showTagDropdown && (
          <View style={styles.tagDropdown}>
            <TouchableOpacity 
              style={[
                styles.tagItem,
                selectedTag === null && styles.selectedTagItem
              ]}
              onPress={() => filterByTag(null)}
            >
              <Text style={styles.tagText}>All Categories</Text>
            </TouchableOpacity>
            
            {Object.values(ItemTag).map((tag) => (
              <TouchableOpacity 
                key={tag}
                style={[
                  styles.tagItem,
                  selectedTag === tag && styles.selectedTagItem
                ]}
                onPress={() => filterByTag(tag)}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {filteredVideos.length > 0 && currentIndex < filteredVideos.length ? (
              <GestureDetector gesture={panGesture}>
                <Animated.View style={[animatedStyle, styles.videoWrapper]}>
                  {renderVideo(filteredVideos[currentIndex], currentIndex)}
                </Animated.View>
              </GestureDetector>
            ) : (
              <Text style={styles.endText}>No more videos to show</Text>
            )}

        {showDescription && (
          <DescriptionOverlay
            video={filteredVideos[currentIndex]}
            onClose={() => setShowDescription(false)}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#0A0A0A",
      position: 'relative',
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
      paddingHorizontal: 12,
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
      fontSize: 12,
      fontWeight: "600",
    },
    activeTabButtonText: {
      color: "#000",
    },
    // search bar and tag filter
    searchBar: {
      flex: 1,
      height: 40,
      marginLeft: 15,
      paddingHorizontal: 15,
      borderRadius: 20,
      backgroundColor: "#2A2A2A",
      color: "#FFF",
      fontSize: 12,
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 5,
    },
    filterButton: {
      marginLeft: 10,
    },
    filterIcon: {
      width: 15,
      height: 15,
      tintColor: '#FFF',
    },
    tagDropdown: {
      position: 'absolute',
      top: 55,
      right: 0,
      width: 200,
      backgroundColor: '#2A2A2A',
      borderRadius: 8,
      paddingVertical: 8,
      shadowColor: 'white',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 1000,
    },
    tagItem: {
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    tagText: {
      color: '#FFF',
      fontSize: 14,
    },
    selectedTagItem: {
      backgroundColor: '#444',
    },
    // other
    videoContainer: {
      flex: 1,
      backgroundColor: "#000",
    },
    video: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.9,
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
      color: "#FFF",
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
    videoWrapper: {
      flex: 1,
      position: 'relative',
    },
    endText: {
      color: 'white',
      fontSize: 24,
      textAlign: 'center',
      marginTop: 200,
    },

    overlayContainer: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      backgroundColor: 'rgba(0,0,0,0.9)',
      padding: 20,
    },
    overlayTitle: {
      color: 'white',
      fontSize: 24,
      marginBottom: 10,
    },
    overlayDescription: {
      color: 'white',
      fontSize: 16,
    },
    closeButton: {
      color: 'white',
      marginTop: 10,
      textAlign: 'right',
    },

    swipeIndicatorLeft: {
      position: 'absolute',
      left: 100,
      top: '50%',
      backgroundColor: '#FF0000', // Bright red
      opacity: 0.8,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.5)',
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    swipeIndicatorRight: {
      position: 'absolute',
      right: 100,
      top: '50%',
      backgroundColor: '#00FF00', // Bright green
      opacity: 0.8,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.5)',
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    swipeIndicatorBottom: {
      position: 'absolute',
      bottom: 120,
      alignSelf: 'center',
      backgroundColor: '#FFFF00', // Bright yellow
      opacity: 0.8,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.5)',
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    indicatorIcon: {
      width: 40,
      height: 40,
      tintColor: 'white',
    },  
  });
