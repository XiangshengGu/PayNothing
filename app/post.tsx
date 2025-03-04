// Citation: Codes below are adapted and modified from Basic Camera Usage in
// Expo Camera Documentation: https://docs.expo.dev/versions/latest/sdk/camera/

import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { useState, useRef, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Alert, Image, TextInput } from "react-native";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";
import { FIREBASE_ST, FIRESTORE_DB } from "../FirebaseConfig";

export default function Post() {
  const [facing] = useState<CameraType>("back");
  const [permission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  // just auto apply permission for 1 time
  const [hasAutoRequestPermission, setHasAutoRequestPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recordingTime, setRecordingTime] = useState(0); // recording time

  // apply for permissions directly
  useEffect(() => {
    const requestPermissions = async () => {
      if (hasAutoRequestPermission || !permission || !microphonePermission) return;

      // For camera
      if (!permission.granted) {
        await requestCameraPermission();
      }
      // For microphone
      if (!microphonePermission.granted) {
        await requestMicrophonePermission();
      }
      
      // has applied one time
      setHasAutoRequestPermission(true);
    };

    requestPermissions();
  }, [permission, microphonePermission]);

  // listen to isRecording to set timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecording) {
      // add 1 for each second
      interval = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
      setRecordingTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Request Camera/Microphone permissions if not already granted
  if (!permission || !microphonePermission) {
    return <View />;
  }

  if (!permission.granted || !microphonePermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageTitle}>
          To record in PayNothing
        </Text>
        <Text style={styles.message}>
          We need your permission to use the camera and microphone.
        </Text>
        <TouchableOpacity
          onPress={requestCameraPermission}
          style={[
            styles.permissionButton,
            permission.granted && styles.permissionButtonGranted,
          ]}
          disabled={permission.granted} // if granted,disabled
        >
          <Text style={styles.buttonText}>
            Grant Camera Permission{permission.granted && " √"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={requestMicrophonePermission}
          style={[
            styles.permissionButton,
            microphonePermission.granted && styles.permissionButtonGranted,
          ]}
          disabled={microphonePermission.granted} // if granted,disabled
        >
          <Text style={styles.buttonText}>
            Grant Microphone Permission{microphonePermission.granted && " √"}
          </Text>
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
        title: title || "Untitled Video",
        description: description || "No description",
        upload_time: Date.now(),
        username: "Unknown User",
        likes: 0,
      });
      console.log("Record created:", docRef.id);

      Alert.alert("Upload successfully", "The video has been saved to the database", [
        {
          text: "OK",
          onPress: () => setVideoUri(null), // restet videoUri (return to camera page) if click "OK"
        },
      ]);
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
          <TextInput
            style={styles.input}
            placeholder="Enter video title"
            placeholderTextColor="#bbb"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Enter video description"
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />
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
            {isRecording && (
              <Text style={styles.timerText}>{recordingTime}s</Text>
            )}
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
  messageTitle: {
    textAlign: "center",
    paddingBottom: 10,
    color: "rgb(255, 255, 255)",
    fontSize: 20,
  },
  message: {
    textAlign: "center",
    paddingHorizontal: 10,
    paddingBottom: 30,
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
  input: {
    width: "80%",
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    backgroundColor: "#222",
    color: "white",
    fontSize: 16,
  },
  descriptionInput: {
    height: 60,
    textAlignVertical: "top",
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
    textAlign: "center",
  },
  permissionButton: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: "rgb(41, 41, 41)",
    borderRadius: 5,
    width: "70%",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgb(41, 41, 41)",
  },
  permissionButtonGranted: {
    backgroundColor: "transparent",
  },
  permissionButtonText: {
    color: "rgb(255, 255, 255)",
    fontSize: 16,
  },
  timerText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10, // on the recording button
  },
});