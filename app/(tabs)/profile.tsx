// Citation: The code below refers to
// Super Easy React Native AUTHENTICATION with Firebase:
// https://www.youtube.com/watch?v=ONAVmsGW6-M
// And from Sample Usage in Expo Location Documentation: 
// https://docs.expo.dev/versions/latest/sdk/location/
// Created with the assistance of DeepSeek AI (https://www.deepseek.com).
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, FlatList } from "react-native";
import { FIREBASE_AUTH, FIRESTORE_DB, firebaseConfig } from "../../FirebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword,
         signOut, User, updateProfile,
         PhoneAuthProvider, signInWithCredential,
         GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc, addDoc, getDoc } from "firebase/firestore";
import * as Location from "expo-location";
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useUserStore } from "../data/store";
import { VideoItem } from "../data/models";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Ionicons } from "@expo/vector-icons";

WebBrowser.maybeCompleteAuthSession();

export default function Profile() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState("newbie");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [gender, setGender] = useState("");
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [age, setAge] = useState("");
  const [isEditingAge, setIsEditingAge] = useState(false);
  const [location, setLocation] = useState("Unknown");
  const [savedPosts, setSavedPosts] = useState<VideoItem[]>([]);
  const [yourPosts, setYourPosts] = useState<VideoItem[]>([]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "115198796724-ledugt1lu3uschiqefiighq20dbs4re3.apps.googleusercontent.com",
    redirectUri: "https://paynothingapp.firebaseapp.com/__/auth/handler",
  });

  const paramOfPage = useLocalSearchParams(); // get route parma
  const { setStoreUser, logout } = useUserStore(); // function of store
  const router = useRouter();

  useEffect(() => {
    if (paramOfPage?.fromPost) {
      Alert.alert("Login Required", "You must log in before posting a video.");
      const { fromPost, ...restParams } = paramOfPage;
      router.replace({
        pathname: "/profile",
        params: restParams
      });
    }
  }, [paramOfPage]);

  // Handle Google Sign-In response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(FIREBASE_AUTH, credential)
        .catch((error) => Alert.alert('Error', error.message));
    }
  }, [response]);

  useEffect(() => {
    const unsubscribe = FIREBASE_AUTH.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(FIRESTORE_DB, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData.username || "");
          setGender(userData.gender || "");
          setAge(userData.age ? userData.age.toString() : "");
          setLocation(userData.location || "Unknown");

          // update store
          const userDataFromDB = {
            username: userDoc.data()?.username || "Unknown User",
            age: userDoc.data()?.age || 0,
            gender: userDoc.data()?.gender || "Unknown",
            posts: userDoc.data()?.posts || [],
            savedVideos: userDoc.data()?.savedVideos || [],
          };
          // console.log('user-auth, user-data', currentUser, userDataFromDB);
          // set global store of user
          setStoreUser(currentUser, userDataFromDB);

          // Fetch posts and saved videos data
          const fetchVideoData = async (videoIds: string[]) => {
            if (!videoIds || videoIds.length === 0) return [];
            
            const videoPromises = videoIds.map(async (videoId) => {
              const videoDoc = await getDoc(doc(FIRESTORE_DB, "videos", videoId));
              if (videoDoc.exists()) {
                const videoTempInfo = videoDoc.data();
                return {
                  id: videoId,
                  title: videoTempInfo?.title || '',
                  username: videoTempInfo?.username || '',
                  userid: videoTempInfo?.userId || '',
                  description: videoTempInfo?.description || '',
                  uploadTime: videoTempInfo?.upload_time || 0,
                  likes: videoTempInfo?.likes || 0,
                  videoUrl: videoTempInfo?.video_url || '',
                  tags: videoTempInfo?.tags || [],
                };
              }
              return null;
            });
            
            const videos = await Promise.all(videoPromises);
            return videos.filter(video => video !== null);
          };
          // Fetch and set posts data
          const posts = userData.posts || [];
          const postsWithData = await fetchVideoData(posts);
          setYourPosts(postsWithData);
          // console.log('ourPosts', postsWithData);

          // Fetch and set saved videos data
          const savedVideos = userData.savedVideos || [];
          const savedVideosWithData = await fetchVideoData(savedVideos);
          setSavedPosts(savedVideosWithData);
          // console.log('savedPosts', savedVideosWithData);
        }
      }
    });
    return unsubscribe; // Cleanup on component unmount
  }, []);

  const handleLogin = async () => {
    try {
      setErrorMessage("");
      setSuccessMessage("");
      const userCredential = await signInWithEmailAndPassword(
        FIREBASE_AUTH,
        email,
        password
      );

      Alert.alert("Login Successful", "Welcome back!");
    } catch (error: any) {
      setErrorMessage("Invalid email or password. Please try again.");
    }
  };

  const handleSignUp = async () => {
    try {
      setErrorMessage("");
      setSuccessMessage("");
      await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
      setSuccessMessage("Account created successfully! Please log in.");
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      logout(); // clear global store
      Alert.alert("Logged Out", "You have been logged out successfully.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleProfilePicturePress = async () => {
    if (!user) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "We need access to your photos to update your profile picture.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!pickerResult.canceled) {
      const uri = pickerResult.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();

      const storage = getStorage();
      const storageRef = ref(storage, `profile-pictures/${user.uid}`);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(user as User, { photoURL: downloadURL });
      setProfileImage(downloadURL);
    }
  };

  useEffect(() => {
    if (user?.photoURL) {
      setProfileImage(user.photoURL);
    }
  }, [user]);

  <Image
    source={profileImage ? { uri: profileImage } : require("../../assets/images/profile.png")}
    style={styles.profileImage}
  />

  const handleEditLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Location permissions are required to set your location."
      );
      return;
    }

    const locationData = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = locationData.coords;

    // Reverse geocoding to get city and state
    const address = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (address.length > 0) {
      const { city, region } = address[0];
      setLocation(`${city}, ${region}`);
    } else {
      setLocation("Location unavailable");
    }
  };

  const handleUpdateUserData = async (field: string, value: string | number) => {
    if (user) {
      try {
        await setDoc(
          doc(FIRESTORE_DB, "users", user.uid),
          { [field]: value },
          { merge: true } // Merge with existing data
        );
        Alert.alert("Success", `${field} has been updated.`);
      } catch (error: any) {
        Alert.alert("Error", error.message);
      }
    }
  };

  const handleGenderClick = () => {
    setIsEditingGender(true);
  };

  const handleAgeClick = () => {
    setIsEditingAge(true);
  };

  const handleEditUsername = async () => {
    if (!isEditingUsername) {
      setIsEditingUsername(true);
      return;
    }

    if (user) {
      try {
        await updateProfile(user, { displayName: username });
        setIsEditingUsername(false);
        Alert.alert("Username Updated", "Your username has been updated.");
      } catch (error: any) {
        Alert.alert("Error", error.message);
      }
    }
  };

  // User Profile
  return (
    <View style={styles.container}>
      {/* Profile Header with Side-by-Side Layout */}
      <View style={styles.profileHeader}>
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={handleProfilePicturePress}
        >
          <Image
            source={profileImage ? { uri: profileImage } : require("../../assets/images/default-profile.png")}
            style={styles.profileImage}
          />
          <View style={styles.editPhotoBadge}>
            <Ionicons name="camera" size={18} color="white" />
          </View>
        </TouchableOpacity>

      {/* Personal Information moved here */}
      <View style={styles.personalInfoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Username:</Text>
          {isEditingUsername ? (
            <TextInput
              style={styles.editableInput}
              value={username}
              onChangeText={setUsername}
              autoFocus
              onSubmitEditing={handleEditUsername}
            />
          ) : (
            <TouchableOpacity
              style={styles.infoValueContainer}
              onPress={() => setIsEditingUsername(true)}
            >
              <Text style={styles.infoValue}>{username}</Text>
              <Ionicons name="pencil" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>

          {/* Gender Input */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender:</Text>
            {isEditingGender ? (
              <TextInput
                style={styles.editableInput}
                value={gender}
                onChangeText={setGender}
                onBlur={() => {
                  handleUpdateUserData("gender", gender);
                  setIsEditingGender(false);
                }}
              />
            ) : (
              <TouchableOpacity
                style={styles.infoValueContainer}
                onPress={handleGenderClick}
              >
                <Text style={styles.infoValue}>{gender || "Add gender"}</Text>
                <Ionicons name="pencil" size={16} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* Age Input */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Age:</Text>
            {isEditingAge ? (
              <TextInput
                style={styles.editableInput}
                value={age}
                keyboardType="numeric"
                onChangeText={setAge}
                onBlur={() => {
                  handleUpdateUserData("age", parseInt(age));
                  setIsEditingAge(false);
                }}
              />
            ) : (
              <TouchableOpacity
                style={styles.infoValueContainer}
                onPress={handleAgeClick}
              >
                <Text style={styles.infoValue}>{age || "Add age"}</Text>
                <Ionicons name="pencil" size={16} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* Location */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <TouchableOpacity
              style={styles.infoValueContainer}
              onPress={handleEditLocation}
            >
              <Text style={styles.infoValue}>{location}</Text>
              <Ionicons name="location" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Posts Sections */}
      <View style={styles.postsContainer}> 
        <Text style={styles.sectionTitle}>Your Posts</Text>
        <FlatList
          data={yourPosts}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          style={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.postItem}>
              <Text style={styles.postText}>{item.title}</Text>
              <Text style={styles.postText}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />

        <Text style={styles.sectionTitle}>Saved Posts</Text>
        <FlatList
          data={savedPosts}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          style={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.postItem}>
              <Text style={styles.postText}>{item.title}</Text>
              <Text style={styles.postText}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
    color: "#2D3436",
    lineHeight: 50,
  },
  appIcon: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    borderRadius: 5,
    opacity: 0.7,
    marginBottom: 10,
  },

  button: {
    backgroundColor: "rgb(144, 200, 13)",
    padding: 15,
    borderRadius: 15,
    marginTop: 15,
    width: '80%',
    alignSelf: 'center',
  },
  buttonText: {
    color: "rgb(255, 255, 255)",
    textAlign: "center",
    fontSize: 16,
  },
  errorText: {
    color: "rgb(255, 0, 0)",
    textAlign: "center",
    marginVertical: 5,
  },
  successText: {
    color: "rgb(0, 255, 81)",
    textAlign: "center",
    marginVertical: 5,
  },
  socialAuthContainer: {
    marginBottom: 30,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    width: '90%', // Added width constraint
    alignSelf: 'center',
  },
  phoneInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  verifyButton: {
    backgroundColor: 'rgb(0, 139, 209)',
    paddingHorizontal: 15,
    borderRadius: 15,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  verifyButtonText: {
    color: 'rgb(255, 255, 255)',
    fontWeight: '600',
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 15,
    flexDirection: 'row',
    width: '80%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  googleIcon: {
    width: 30,
    height: 30,
    marginRight: 12,
  },
  googleButtonText: {
    color: '#2D3436',
    fontSize: 16,
    fontWeight: '600',
    
  },
  separator: {
    textAlign: 'center',
    color: '#636E72',
    marginVertical: 30,
    marginTop: -20,
    fontSize: 16,
    position: 'relative',
  },
  emailAuthContainer: {
    marginTop: 20,
  },
  input: {
    height: 50,
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emailButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    alignSelf: 'center',
    width: '90%',
  },
  emailButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  loginButton: {
    backgroundColor: 'rgb(242, 197, 0)',
  },
  signupButton: {
    backgroundColor: 'rgb(57, 180, 0)',
  },
  emailButtonText: {
    color: 'rgb(255, 255, 255)',
    fontWeight: '600',
    fontSize: 14,
  },
  // Profile section styles
  profileTextContainer: {
    flex: 1,
  },

  username: {
    marginLeft: 10,
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
  },
  usernameInput: {
    borderBottomWidth: 1,
    borderBottomColor: "rgb(0, 0, 0)",
    fontSize: 18,
    marginLeft: 10,
  },
  editableField: {
    fontSize: 16,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  location: {
    fontSize: 16,
    color: "rgb(0, 0, 0)",
    marginTop: 10,
  },
  editInfoHint: {
    fontSize: 12,
    color: "rgb(100, 100, 100)",
  },
  savedPostsContainer: {
    flex: 1,
    marginTop: 30,
  },
  savedPostsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 0,
  },
  savedPostItem: {
    fontSize: 16,
    paddingVertical: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: "white",
    alignItems: 'flex-start',
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 100, // Increased size
    height: 100,
    borderRadius: 50,
    marginRight: 20,
    borderWidth: 2,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  editPhotoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: "#FFA500",
    borderRadius: 12,
    padding: 4,
  },
  personalInfoContainer: {
    flex: 1,
    marginLeft: 20,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  inputSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  infoLabel: {
    width: '35%',
    fontSize: 14,
    color: "#666",
    marginRight: 12,
  },
  infoValueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  editableInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#FFA500",
  },
  postsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 15,
  },
  listContainer: {
    flex: 0, // This prevents the FlatList from expanding
    maxHeight: 200, // Set a maximum height for each list
    marginBottom: 20, // Add some space between the lists
  },
  listContent: {
    flexGrow: 0, // This prevents the content from expanding
  },
  postItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 5,
    backgroundColor: "white",
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    height: 50, // Fixed height for each item
    maxHeight: 50, // Ensure it doesn't grow beyond this
  },
  postText: {
    fontSize: 14,
    color: "#666",
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: "#FFA500",
    borderRadius: 15,
    padding: 10,
    width: '80%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  gridRow: {
    justifyContent: "space-between",
  },
  gridItem: {
    flex: 1,
    margin: 5,
    padding: 10,
    backgroundColor: "rgb(200, 200, 200)",
    borderRadius: 5,
    alignItems: "center",
  },

});
