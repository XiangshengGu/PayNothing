// Citation: Codes below are adapted and modified from 
// Super Easy React Native AUTHENTICATION with Firebase:
// https://www.youtube.com/watch?v=ONAVmsGW6-M
// And from Sample Usage in Expo Location Documentation: 
// https://docs.expo.dev/versions/latest/sdk/location/

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, FlatList } from "react-native";
import { FIREBASE_AUTH } from "../FirebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, updateProfile } from "firebase/auth";
import * as Location from "expo-location";

export default function Profile() {
const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [location, setLocation] = useState("Unknown");
  const [username, setUsername] = useState("newbie");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [savedPosts, setSavedPosts] = useState<string[]>(["Saved post 1","Saved post 2","Saved post 3","Saved post 4"]);

  useEffect(() => {
    const unsubscribe = FIREBASE_AUTH.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.displayName) {
        setUsername(currentUser.displayName);
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
      {/* Top Section */}
      <View style={styles.profileHeader}>
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={handleEditUsername}
        >
          <Image
            source={require("../assets/images/default-profile.png")}
            style={styles.profileImage}
          />
          {isEditingUsername ? (
            <TextInput
              style={styles.usernameInput}
              value={username}
              onChangeText={(text) => setUsername(text)}
              onSubmitEditing={handleEditUsername}
            />
          ) : (
            <Text style={styles.username}>{username}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleEditLocation}>
          <Text style={styles.location}>{location}</Text>
        </TouchableOpacity>
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
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    username: {
      marginLeft: 10,
      fontSize: 18,
      fontWeight: "bold",
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
    },
    savedPostsContainer: {
      flex: 1,
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