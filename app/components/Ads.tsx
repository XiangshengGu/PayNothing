// components/Ads.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
} from "react-native";

const screenWidth = Dimensions.get("window").width;

// Banner
export const AdsBanner = () => (
  <View style={styles.bannerContainer}>
    <View style={styles.adLabel}>
      <Text style={styles.adLabelText}>Ad</Text>
    </View>
    <View style={styles.bannerContent}>
      <Text style={styles.bannerTitle}>💡 Boost Your Visibility!</Text>
      <Text style={styles.bannerDesc}>Promote your listing to reach more users today.</Text>
    </View>
  </View>
);

// Interstitial
export const InterstitialAdOverlay = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
        <View style={styles.interstitialBox}>
          <Text style={styles.interstitialTitle}>🔥 Limited Time Offer!</Text>
          <Text style={styles.interstitialDesc}>
            Upgrade to premium for 50% off. Click below to learn more.
          </Text>
          <TouchableOpacity style={styles.ctaButton} onPress={() => alert("Ad clicked!")}>
            <Text style={styles.ctaText}>Learn More</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    width: screenWidth - 40,
    borderRadius: 8,
    backgroundColor: "#f4f4f4",
    padding: 12,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  adLabel: {
    backgroundColor: "#ffce00",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 10,
  },
  adLabelText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000",
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  bannerDesc: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  interstitialBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 350,
    alignItems: "center",
    position: "relative",
  },
  interstitialTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  interstitialDesc: {
    fontSize: 14,
    textAlign: "center",
    color: "#555",
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  closeText: {
    fontSize: 18,
    color: "#999",
  },
});
