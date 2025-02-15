// Citation: Codes below are adapted and modified from Basic Camera Usage in
// Expo Camera Documentation: https://docs.expo.dev/versions/latest/sdk/camera/

import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { useState, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Alert, Image } from "react-native";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";
import { FIREBASE_ST, FIRESTORE_DB } from "../FirebaseConfig";


export default function Post() {
  const [facing] = useState<CameraType>("back");
  const [permission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  // Request Camera/Microphone permissions if not already granted
  if (!permission || !microphonePermission) {
    return <View />;
  }

  if (!permission.granted || !microphonePermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to use the camera and microphone.
        </Text>
        <TouchableOpacity onPress={requestCameraPermission} style={styles.permissionButton}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={requestMicrophonePermission} style={styles.permissionButton}>
          <Text style={styles.buttonText}>Grant Microphone Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Start Recording
  const startRecording = async () => {
    if (cameraRef.current) {
      try {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync({
          maxDuration: 60, // 1-minute max duration
        });

        if (video && video.uri) {
          setVideoUri(video.uri);
          Alert.alert("Recording complete", "Video saved successfully.");
        } else {
          Alert.alert("Recording failed", "Could not save the video.");
        }
      } catch (error) {
        console.error("Failed to record video:", error);
      } finally {
        setIsRecording(false);
      }
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (cameraRef.current) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  // upload video to storage in Firebase
  const uploadVideo = async (uri: string) => {
    try {
      const response = await fetch(uri);
      // convert to binary data
      const blob = await response.blob(); 

      const filename = `videos/${Date.now()}.mp4`;
      const storageRef = ref(FIREBASE_ST, filename);

      // upload to Firebase Storage
      await uploadBytes(storageRef, blob);

      // get public video URL
      const downloadURL = await getDownloadURL(storageRef);

      console.log("Upload the Video Successfully:", downloadURL);

      return downloadURL;
    } catch (error) {
      console.error("Fail to Upload:", error);
      Alert.alert("Fail to Upload", "Can not to upload");
      return null;
    }
  };

  // create a record in Firestore database
  const saveVideoRecord = async (downloadURL: string) => {
    try {
      const docRef = await addDoc(collection(FIRESTORE_DB, "videos"), {
        video_url: downloadURL,
        title: "New Video",
        description: "Please message me for more information",
        upload_time: Date.now(),
        likes: 0,
      });
      console.log("Record created:", docRef.id);
      Alert.alert("Upload successfully", "The video has been saved to the database");
    } catch (error) {
      console.error("Failed to save record:", error);
      Alert.alert("Error", "Unable to save video recording");
    }
  };

  // Handle video upload
  const handleUpload = async () => {
    if (!videoUri) {
      Alert.alert("Error", "Please record a video!");
      return;
    }
  
    Alert.alert("Uploading", "Please wait ...");
  
    const downloadURL = await uploadVideo(videoUri);
    if (downloadURL) {
      await saveVideoRecord(downloadURL);
    }
  };

  return (
    <View style={styles.container}>
      {videoUri ? (
        <View style={styles.videoPreview}>
          <Text style={styles.text}>Video recorded successfully!</Text>
          <TouchableOpacity onPress={handleUpload} style={styles.button}>
            <Text style={styles.buttonText}>Upload Video</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVideoUri(null)} style={styles.button}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <CameraView mode="video" ref={cameraRef} style={styles.camera} facing={facing}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={isRecording ? stopRecording : startRecording}
              style={styles.iconButton}
            >
              <Image
                source={
                  isRecording
                    ? require("../assets/images/stop-recording.png")
                    : require("../assets/images/recording.png")
                }
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgb(0, 0, 0)",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    color: "rgb(255, 255, 255)",
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 20,
    alignItems: "center",
    width: "100%",
  },
  iconButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 75,
    height: 75,
  },
  videoPreview: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "rgb(255, 255, 255)",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  button: {
    backgroundColor: "rgb(0, 60, 255)",
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 10,
    marginVertical: 5,
  },
  buttonText: {
    color: "rgb(255, 255, 255)",
    fontSize: 16,
    fontWeight: "bold",
  },
  permissionButton: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: "rgb(0, 60, 255)",
    borderRadius: 5,
  },
  permissionButtonText: {
    color: "rgb(255, 255, 255)",
    fontSize: 16,
  },
});