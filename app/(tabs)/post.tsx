// Citation: Codes below are adapted and modified from Basic Camera Usage in
// Expo Camera Documentation: https://docs.expo.dev/versions/latest/sdk/camera/

import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as Location from "expo-location";
import { Video, ResizeMode } from "expo-av";
import { getThumbnailAsync } from 'expo-video-thumbnails';
import { useState, useRef, useEffect, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Alert, Image, TextInput, ScrollView, FlatList } from "react-native";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { FIREBASE_ST, FIRESTORE_DB } from "../../FirebaseConfig";
import { useUserStore } from "../data/store";
import { useRouter, useFocusEffect } from "expo-router";
import { ItemTag } from "../data/models";
import TagSelector from '../components/TagSelection';

const MAX_TITLE_LENGTH = 40;
const MAX_DESCRIPTION_LENGTH = 150;

export default function Post() {
  const [facing] = useState<CameraType>("back");
  const [permission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  // just auto apply permission for 1 time
  const [hasAutoRequestPermission, setHasAutoRequestPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  // location of the user
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [userCity, setCity] = useState<string>('');
  const [userLocation, setLocation] = useState<Location.LocationObject | null>(null);

  // 1st frame URI of video
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recordingTime, setRecordingTime] = useState(0); // recording time
  // item tag
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { userAuth: storeUserAuth, userData: storeUserData } = useUserStore();
  const router = useRouter();

  // reset all state
  const resetState = () => {
    setHasAutoRequestPermission(false);
    setIsRecording(false);
    setVideoUri(null);
    setThumbnailUri(null);
    setTitle("");
    setDescription("");
    setRecordingTime(0);
    setSelectedTags([]);
  };

  // useFocusEffect to listen focusing
  useFocusEffect(
    useCallback(() => {
      return () => {
          // when lose focusing
          resetState();
      };
    }, [])
  );

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

      // Location (only request permission here)
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus === "granted") {
        setLocationPermissionGranted(true);
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

  if (!permission.granted || !microphonePermission.granted || !locationPermissionGranted) {
    return (
      <View style={styles.blackContainer}>
        <Text style={styles.messageTitle}>
          To record in PayNothing
        </Text>
        <Text style={styles.message}>
          We need your permission to use the camera, microphone, and location.
        </Text>
  
        {/* Camera Permission */}
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
  
        {/* Microphone Permission */}
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
  
        {/* Location Permission */}
        <TouchableOpacity
          onPress={async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === "granted") {
              setLocationPermissionGranted(true);
            } else {
              Alert.alert("Location Required", "You must grant location access to post.");
            }
          }}
          style={[
            styles.permissionButton,
            locationPermissionGranted && styles.permissionButtonGranted,
          ]}
          disabled={locationPermissionGranted}
        >
          <Text style={styles.buttonText}>
            Grant Location Permission{locationPermissionGranted && " √"}
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

          // create thumbUri
          try {
            const { uri: thumbUri } = await getThumbnailAsync(video.uri, {
              time: 1000,
            })
            setThumbnailUri(thumbUri);
            console.log("🎬 Thumbnail generated:", thumbUri);
          } catch (err) {
            console.warn("❌ Failed to generate thumbnail", err);
          }
          
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

  // upload Thumbnail to storage in Firebase
  const uploadThumbnail = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `thumbnails/${Date.now()}.jpg`;
      const storageRef = ref(FIREBASE_ST, filename);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      console.log("✅ Thumbnail uploaded:", downloadURL);
      return downloadURL;
    } catch (error) {
      console.error("❌ Thumbnail upload error:", error);
      return null;
    }
  };

  // create a record in Firestore database
  const saveVideoRecord = async (downloadURL: string, location: Location.LocationObject | null, city: string, thumbnailURL: string | null) => {
    if (!storeUserAuth) {
      Alert.alert("Error", "You must be logged in to post!");
      router.replace({
        pathname: "/profile",
        params: { fromPost: "true", timestamp: Date.now().toString() },
      });
      return;
    }

    try {
      // create a record of the post
      const docRef = await addDoc(collection(FIRESTORE_DB, "videos"), {
        video_url: downloadURL,
        thumbnail_url: thumbnailURL || '',
        title: title || "Untitled Video",
        description: description || "No description",
        upload_time: Date.now(),
        username: storeUserData?.username || "Unknown User",
        likes: 0,
        userId: storeUserAuth.uid || '',
        tags: selectedTags || [ItemTag.OTHER],
        location: location? { latitude: location.coords.latitude, longitude: location.coords.longitude } : null,
        city: city || '',
      });
      console.log("Post Record created:", docRef.id);

      // add the post record to user's info
      const userRef = doc(FIRESTORE_DB, "users", storeUserAuth.uid);
      await updateDoc(userRef, {
        posts: arrayUnion(docRef.id), // use arrayUnion to add new data
      });      
      console.log("User Record Updated:", userRef.id);


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

    // Try to get location (required)
    if (!userLocation || !userCity) {
      Alert.alert("Location Required", "Please tap to retrieve your current location before uploading.");
      return;
    }

    Alert.alert("Uploading", "Please wait ...");

    const downloadURL = await uploadVideo(videoUri);
    const thumbnailURL = thumbnailUri ? await uploadThumbnail(thumbnailUri) : null;
    if (downloadURL) {
      await saveVideoRecord(downloadURL, userLocation, userCity, thumbnailURL);
    }
  };

  // get location and city
  const handleLocationFetch = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync(currentLocation.coords);
  
      setLocation(currentLocation);
  
      // get city
      if (geocode.length > 0) {
        const loc = geocode[0];
        const parts = [];
        if (loc.city) parts.push(loc.city);
        if (loc.region) parts.push(loc.region); // like GA
        setCity(parts.join(", "));
      } else {
        setCity("Unknown Location");
      }
    } catch (error) {
      Alert.alert("Location Error", "Failed to retrieve your current location.");
    }
  }; 

  return (
    <View style={styles.container}>
      {videoUri ? (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.videoPreview}>
            <Video
              source={{ uri: videoUri }}
              style={styles.previewVideo}
              shouldPlay={false}
              resizeMode={ResizeMode.CONTAIN}
            />

            {/* Inputs */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.commonInput}
                placeholder="Enter video title"
                placeholderTextColor="#bbb"
                numberOfLines={1}
                value={title}
                onChangeText={(text) => setTitle(text.slice(0, MAX_TITLE_LENGTH))}
              />
              <View style={styles.underline} >
                <Text style={styles.charCount}>
                  {title.length}/{MAX_TITLE_LENGTH}
                </Text>
              </View>
            </View>
            <View style={[styles.inputContainer, styles.lastInputContainer]}>
              <TextInput
                style={[styles.commonInput, styles.descriptionInput]}
                placeholder="Enter video description"
                placeholderTextColor="#bbb"
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={(text) => setDescription(text.slice(0, MAX_DESCRIPTION_LENGTH))}
              />
              <View style={styles.underline} >
                <Text style={styles.charCount}>
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </Text>
              </View>
            </View>

            {/* Location Display & Click */}
            <View style={styles.locationContainer}>
              <TouchableOpacity onPress={handleLocationFetch}>
                <Text style={styles.locationText}>
                  {userCity ? `📍 ${userCity}` : "📍 Tap to get current location"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tags */}
            <View style={styles.tagSelectorContainer}>
              <TagSelector onTagsSelected={(tags) => setSelectedTags(tags)} />
            </View>

            {/* Buttons at Bottom */}
            <View style={styles.bottomButtonContainer}>
              <TouchableOpacity onPress={() => setVideoUri(null)} style={styles.retakeButton}>
                <Text style={styles.bottomText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpload} style={styles.uploadButton}>
                <Text style={styles.bottomText}>Upload Video</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
                    ? require("../../assets/images/stop-recording.png")
                    : require("../../assets/images/recording.png")
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
  blackContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgb(0, 0, 0)",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgb(255, 255, 255)",
  },
  messageTitle: {
    textAlign: "center",
    paddingBottom: 10,
    color: "rgb(0, 0, 0)",
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
  scrollViewContent: {
    flexGrow: 1,
  },
  videoPreview: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  previewVideo: {
    width: 300,
    height: 200,
    marginVertical: 20,
    shadowColor: 'black',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  inputContainer: {
    width: "90%",
  },
  // give space to bottomButton
  lastInputContainer: {
    marginTop: 10,
  },
  commonInput: {
    padding: 5,
    color: "black",
    fontSize: 14,
  },
  descriptionInput: {
    textAlignVertical: "top",
  },
  charCount: {
    color: "#bbb",
    fontSize: 12,
    textAlign: "right",
  },
  underline: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },

  // location styles
  locationContainer: {
    width: "90%",
    paddingBottom: 20,
    marginTop: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  locationText: {
    color: "#333",
    fontSize: 14,
  },

  // tag styles
  tagSelectorContainer: {
    width: "90%",
    marginTop: 0,
    marginBottom: 20,
  },

  // button styles
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
  bottomButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 20,
    width: "100%",
  },
  retakeButton: {
    backgroundColor: "rgb(230, 230, 230)",
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 5,
    width: "40%",
    height: 40,
  },
  uploadButton: {
    backgroundColor: "rgb(255, 224, 60)",
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 5,
    width: "40%",
    height: 40,
  },
  buttonText: {
    color: "rgb(255, 255, 255)",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  bottomText: {
    color: "rgb(0, 0, 0)",
    fontSize: 16,
    textAlign: "center",
  },
});