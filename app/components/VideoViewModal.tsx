import React, { useRef, useState, useEffect } from "react";
import { Modal, View, TouchableOpacity, StyleSheet, Dimensions, Image, Text } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { VideoItem } from "../data/models";

const { width, height } = Dimensions.get("window");

interface VideoModalProps {
  visible: boolean;
  videoToShow: VideoItem | null;
  onClose: () => void;
}

const VideoViewModal: React.FC<VideoModalProps> = ({ visible, videoToShow, onClose }) => {
  const videoRef = useRef<Video>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // auto-playing
  useEffect(() => {
    if (visible && videoToShow && videoRef.current) {
      const playTimeout = setTimeout(() => {
        videoRef.current?.playAsync().then(() => setIsPlaying(true)).catch((e) => {
          console.warn("Playback error:", e);
          setIsPlaying(false);
        });
      }, 500);
      return () => clearTimeout(playTimeout);
    }
  }, [visible, videoToShow]);

  // pause when Modal close
  useEffect(() => {
    if (!visible && videoRef.current) {
      videoRef.current.stopAsync().catch(() => {});
      setIsPlaying(false);
    }
  }, [visible]);

  // pause by user
  const togglePlayback = async () => {
    if (videoRef.current) {
      const status = await videoRef.current.getStatusAsync();
      if (status.isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    }
  };

  if (!videoToShow) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.overlay} onPress={onClose} />

        <View style={styles.videoWrapper}>
          <TouchableOpacity activeOpacity={1} onPress={togglePlayback} style={styles.video}>
            <Video
              ref={videoRef}
              source={{ uri: videoToShow.videoUrl }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              isLooping
              onLoad={() => {
                setIsLoaded(true);
              }}
              onError={(e) => console.log("Video error", e)}
            />
            
            <View style={styles.bottomOverlay}>
              <Text style={styles.videoTitle} numberOfLines={1}>
                {videoToShow.title}
              </Text>
              <Text style={styles.videoDescription} numberOfLines={2}>
                {videoToShow.description}
              </Text>
            </View>

            {!isPlaying && (
              <View style={styles.playIconContainer}>
                <Image
                  source={require("../../assets/images/play-icon.png")}
                  style={styles.playIcon}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  videoWrapper: {
    width: width * 0.9,
    height: height * 0.8,
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // 半透明黑色背景
    zIndex: 5,
  },
  videoTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  videoDescription: {
    color: "white",
    fontSize: 13,
    marginTop: 4,
    opacity: 0.9,
  },

  playIconContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -32 }, { translateY: -32 }],
    zIndex: 10,
  },
  playIcon: {
    width: 64,
    height: 64,
    opacity: 0.9,
  },
});

export default VideoViewModal;
