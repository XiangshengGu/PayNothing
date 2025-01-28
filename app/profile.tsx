// Citation: The code below refers to
// Super Easy React Native AUTHENTICATION with Firebase:
// https://www.youtube.com/watch?v=ONAVmsGW6-M
// And from Sample Usage in Expo Location Documentation: 
// https://docs.expo.dev/versions/latest/sdk/location/

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, FlatList } from "react-native";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../FirebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, updateProfile } from "firebase/auth";
import { doc, setDoc, addDoc } from "firebase/firestore";
import * as Location from "expo-location";

export default function Profile() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [username, setUsername] = useState("newbie");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [gender, setGender] = useState("");
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [age, setAge] = useState("");
  const [isEditingAge, setIsEditingAge] = useState(false);
  const [location, setLocation] = useState("Unknown");
  const [savedPosts, setSavedPosts] = useState<string[]>(["Saved post 1", "Saved post 2", "Saved post 3", "Saved post 4"]);
  const [yourPosts, setYourPosts] = useState<string[]>(["Your post 1", "Your post 2", "Your post 3"]);

  useEffect(() => {
    const unsubscribe = FIREBASE_AUTH.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(FIRESTORE_DB, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUsername(userData.username || "newbie");
          setGender(userData.gender || "");
          setAge(userData.age ? userData.age.toString() : "");
          setLocation(userData.location || "Unknown");
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
      Alert.alert("Logged Out", "You have been logged out successfully.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

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

  const handleUsernameClick = () => {
    setIsEditingUsername(true);
  }

  const handleGenderClick = () => {
    setIsEditingGender(true);
  };

  const handleAgeClick = () => {
    setIsEditingAge(true);
  };

  if (!user) {
    // Authentication Form
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to PayNothing!</Text>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => setEmail(text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={(text) => setPassword(text)}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // User Profile
  return (
    <View style={styles.container}>
      {/* Username Edit Section */}
      <View style={styles.profileHeader}>
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={handleUsernameClick}
        >
          <Image
            source={require("../assets/images/default-profile.png")}
            style={styles.profileImage}
          />
        </TouchableOpacity>

        <View style={styles.profileTextContainer}>
          {isEditingUsername ? (
            <TextInput
              style={styles.usernameInput}
              value={username}
              onChangeText={(text) => setUsername(text)}
              onBlur={() => {
                handleUpdateUserData("username", username);
                setIsEditingUsername(false);
              }}
            />
          ) : (
            <Text style={styles.username} onPress={handleUsernameClick}>
              {username}
            </Text>
          )}
        </View>
      </View>

      {/* Gender Edit Section */}
      <View style={styles.inputSection}>
        <Text style={styles.inputSectionTitle}>Personal Information</Text>

        {isEditingGender ? (
          <TextInput
            style={styles.input}
            value={gender}
            onChangeText={(text) => setGender(text)}
            onBlur={() => {
              handleUpdateUserData("gender", gender);
              setIsEditingGender(false);
            }}
          />
        ) : (
          <Text style={styles.editableField} onPress={handleGenderClick}>
            Gender: {gender || "Add your gender"}
          </Text>
        )}

        {isEditingAge ? (
          <TextInput
            style={styles.input}
            value={age}
            keyboardType="numeric"
            onChangeText={(text) => setAge(text)}
            onBlur={() => {
              handleUpdateUserData("age", parseInt(age));
              setIsEditingAge(false);
            }}
          />
        ) : (
          <Text style={styles.editableField} onPress={handleAgeClick}>
            Age: {age || "Add your age"}
          </Text>
        )}
      </View>

      {/* Location Section */}
      <View style={styles.inputSection}>
        <Text style={styles.location}>Location: {location}</Text>
      </View>

      {/* Saved Posts */}
      <View style={styles.savedPostsContainer}>
        <Text style={styles.savedPostsTitle}>Saved Posts</Text>
        <FlatList
          data={savedPosts}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <Text style={styles.savedPostItem}>{item}</Text>
            </View>
          )}
        />
      </View>

      {/* Your Posts */}
      <View style={styles.savedPostsContainer}>
        <Text style={styles.savedPostsTitle}>Your Posts</Text>
        <FlatList
          data={yourPosts}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <Text style={styles.savedPostItem}>{item}</Text>
            </View>
          )}
        />
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "rgb(228, 228, 228)",
      padding: 20,
    },
    title: {
      fontSize: 50,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 40,
      color: "rgb(144, 200, 13)",
    },
    input: {
      height: 50,
      borderColor: "rgba(69, 69, 69, 0.56)",
      borderWidth: 3,
      borderRadius: 5,
      padding: 10,
      marginVertical: 15,
    },
    button: {
      backgroundColor: "rgb(144, 200, 13)",
      padding: 15,
      borderRadius: 5,
      marginTop: 15,
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
    profileHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    profileImageContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 20,
    },
    profileTextContainer: {
      flex: 1,
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    username: {
      marginLeft: 10,
      marginTop: 10,
      fontSize: 18,
      fontWeight: "bold",
    },
    usernameHint: {
      marginLeft: 10,
      fontSize: 12,
      color: "rgb(100, 100, 100)",
    },
    usernameInput: {
      borderBottomWidth: 1,
      borderBottomColor: "rgb(0, 0, 0)",
      fontSize: 18,
      marginLeft: 10,
    },
    location: {
      fontSize: 16,
      fontWeight: "bold",
      color: "rgb(0, 0, 0)",
      marginLeft: 10,
      marginTop: 10,
    },
    savedPostsContainer: {
      flex: 1,
      marginTop: 30,
    },
    savedPostsTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
    },
    savedPostItem: {
      fontSize: 16,
      paddingVertical: 5,
    },
    logoutButton: {
      backgroundColor: "rgba(255, 188, 32, 0.7)",
      padding: 15,
      borderRadius: 5,
      marginTop: 20,
    },
    logoutButtonText: {
      color: "rgb(255, 255, 255)",
      textAlign: "center",
      fontWeight: "bold",
      fontSize: 16,
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