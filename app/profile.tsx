// Citation: The code below refers to
// Super Easy React Native AUTHENTICATION with Firebase:
// https://www.youtube.com/watch?v=ONAVmsGW6-M
// And from Sample Usage in Expo Location Documentation: 
// https://docs.expo.dev/versions/latest/sdk/location/
// Created with the assistance of DeepSeek AI (https://www.deepseek.com).

import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, FlatList } from "react-native";
import { FIREBASE_AUTH, FIRESTORE_DB, firebaseConfig } from "../FirebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, 
         signOut, User, updateProfile, 
         PhoneAuthProvider, signInWithCredential, 
         GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc, addDoc, getDoc } from "firebase/firestore";
import * as Location from "expo-location";
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

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
  const [yourPosts, setYourPosts] = useState<string[]>(["Your post 1", "Your post 2", "Your post 3", "Your post 4"]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "115198796724-ledugt1lu3uschiqefiighq20dbs4re3.apps.googleusercontent.com", // From Firebase
  });
  
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
        <Text style={styles.title}>Welcome!</Text>

        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseConfig}
          attemptInvisibleVerification
        />

        {/* Social Auth Section */}
        <View style={styles.socialAuthContainer}>
          {/* Phone Authentication */}
          {!verificationId ? (
            <>
              <View style={styles.phoneInputContainer}>
                <TextInput
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  style={styles.phoneInput}
                  keyboardType="phone-pad"
                  placeholderTextColor="#666"
                />
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={async () => {
                    try {
                      const phoneProvider = new PhoneAuthProvider(FIREBASE_AUTH);
                      const vid = await phoneProvider.verifyPhoneNumber(
                        '+1 ' + phoneNumber,
                        recaptchaVerifier.current!
                      );
                      setVerificationId(vid);
                    } catch (error: any) {
                      Alert.alert('Error', error.message);
                    }
                  }}
                >
                  <Text style={styles.verifyButtonText}>Send Code</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <TextInput
                placeholder="Enter verification code"
                value={verificationCode}
                onChangeText={setVerificationCode}
                style={styles.input}
                keyboardType="number-pad"
              />
              <TouchableOpacity
                style={styles.button}
                onPress={async () => {
                  try {
                    if (!verificationId) throw new Error('No verification ID');
                    const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
                    await signInWithCredential(FIREBASE_AUTH, credential);
                    setVerificationId(null);
                  } catch (error: any) {
                    Alert.alert('Error', error.message);
                  }
                }}
              >
                <Text style={styles.buttonText}>Verify Code</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Google Sign-In Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => promptAsync()}
            disabled={!request}
          >
            <Image 
              source={require("../assets/images/google.png")} 
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Email Auth Section */}
        <View style={styles.emailAuthContainer}>
          <Text style={styles.separator}>Or use email address to sign up/sign in</Text>
          
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#666"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#666"
          />

          <View style={styles.emailButtonContainer}>
            <TouchableOpacity 
              style={[styles.emailButton, styles.loginButton]} 
              onPress={handleLogin}
            >
              <Text style={styles.emailButtonText}>Login</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.emailButton, styles.signupButton]} 
              onPress={handleSignUp}
            >
              <Text style={styles.emailButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* App icon at the bottom */}
        <Image 
          source={require("../assets/images/icon.png")} 
          style={styles.appIcon}
        />
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

        <TouchableOpacity onPress={handleUsernameClick}>
          <Text style={styles.editInfoHint}>(You can click on the information above to change it)</Text>
        </TouchableOpacity>
      </View>

      {/* Location Section */}
      <TouchableOpacity onPress={handleEditLocation}>
        <Text style={styles.location}>Location: {location}</Text>
      </TouchableOpacity>

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
    backgroundColor: "#F8F9FA",
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "left",
    marginBottom: 30,
    color: "#2D3436",
    lineHeight: 40,
  },
  appIcon: {
    width: 300,
    height: 300,
    alignSelf: 'center',
    borderRadius: 5,
    marginTop: 50,
    opacity: 0.8,
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
  socialAuthContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#636E72",
    marginBottom: 20,
    textAlign: 'center',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: 15,
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
    paddingHorizontal: 20,
    borderRadius: 10,
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
    borderRadius: 5,
    flexDirection: 'row',
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImageContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    alignSelf: "auto",
  },
  profileTextContainer: {
    flex: 1,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  inputSection: {
    marginBottom: 10,
  },
  inputSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
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