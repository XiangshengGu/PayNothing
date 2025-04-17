import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Image, 
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform
} from "react-native";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCredential, PhoneAuthProvider,
  onAuthStateChanged, User, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FIREBASE_AUTH, firebaseConfig, FIRESTORE_DB } from "../FirebaseConfig";
// import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
// import { useUserStore } from "./data/store";

// import * as Google from "expo-auth-session/providers/google";
// import { makeRedirectUri } from "expo-auth-session";

import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  const router = useRouter();
  // function of store
  // const { setStoreUser} = useUserStore(); 

  useEffect(() => {
    const checkBiometricLogin = async () => {
      const enabled = await AsyncStorage.getItem("biometricEnabled");
      if (enabled !== "true") return;
  
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Login with biometrics",
          fallbackLabel: "",
          cancelLabel: "Cancel",
          disableDeviceFallback: true
        });
  
        if (result.success) {
          const savedEmail = await AsyncStorage.getItem("biometricEmail");
          const savedPassword = await AsyncStorage.getItem("biometricPassword");
  
          if (savedEmail && savedPassword) {
            try {
              await signInWithEmailAndPassword(FIREBASE_AUTH, savedEmail, savedPassword);
            } catch (err: any) {
              Alert.alert("Login Error", err.message);
            }
          }
        }
      }
    };
  
    checkBiometricLogin();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (user: User | null) => {
      if (user) {
        // const userDoc = await getDoc(doc(FIRESTORE_DB, "users", user.uid));
        // if (userDoc.exists()) {
        //   // update store
        //   const userDataFromDB = {
        //     username: userDoc.data()?.username || "Unknown User",
        //     age: userDoc.data()?.age || 0,
        //     gender: userDoc.data()?.gender || "Unknown",
        //     posts: userDoc.data()?.posts || [],
        //     savedVideos: userDoc.data()?.savedVideos || [],
        //   };
        //   // console.log('user-auth, user-data', currentUser, userDataFromDB);
        //   // set global store of user
        //   setStoreUser(user, userDataFromDB);
        // }
        router.replace("/(tabs)");
      }
    });
    return unsubscribe;
  }, []);

  const handleBiometricTap = async () => {
    try {
      const enabled = await AsyncStorage.getItem("biometricEnabled");
      if (enabled !== "true") {
        Alert.alert("Biometric Not Enabled", "You must log in normally first to enable Face ID/Fingerprint.");
        return;
      }
  
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
      if (!hasHardware || !isEnrolled) {
        Alert.alert("Unavailable", "Your device does not support biometric login.");
        return;
      }
  
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Login with biometrics",
        fallbackLabel: "",
        cancelLabel: "Cancel",
        disableDeviceFallback: true,
      });
  
      if (result.success) {
        const savedEmail = await AsyncStorage.getItem("biometricEmail");
        const savedPassword = await AsyncStorage.getItem("biometricPassword");
  
        if (savedEmail && savedPassword) {
          await signInWithEmailAndPassword(FIREBASE_AUTH, savedEmail, savedPassword);
        } else {
          Alert.alert("Missing Info", "Stored credentials not found.");
        }
      }
    } catch (err: any) {
      Alert.alert("Biometric Login Failed", err.message);
    }
  };

const handleLogin = async () => {
  try {
    setErrorMessage("");
    setSuccessMessage("");
    await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);

    if (rememberMe) {
      await AsyncStorage.setItem("rememberedEmail", email);
    } else {
      await AsyncStorage.removeItem("rememberedEmail");
    }

    const enableBiometric = await LocalAuthentication.authenticateAsync({
      promptMessage: "Login with Face ID or Fingerprint",
      fallbackLabel: "", // hides fallback option
      cancelLabel: "Cancel",
      disableDeviceFallback: true // this disables passcode fallback
    });

    if (enableBiometric.success) {
    await AsyncStorage.setItem("biometricEmail", email);
    await AsyncStorage.setItem("biometricPassword", password);
    await AsyncStorage.setItem("biometricEnabled", "true");
    }
  } catch (error: any) {
    setErrorMessage("Invalid email or password. Please try again.");
  }
};

  const handleSignUp = async () => {
    try {
      setErrorMessage("");
      setSuccessMessage("");
      const userCredential = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
      const user = userCredential.user;
      // create new user
      await setDoc(doc(FIRESTORE_DB, "users", user.uid), {
        username: email.split("@")[0] || 'Unknown User',
        age: 18,
        gender: "Unknown",
        location: "",
        posts: [],
        savedVideos: [],
      });

      setSuccessMessage("Account created! Please log in.");
      if (rememberMe) {
        await AsyncStorage.setItem("rememberedEmail", email);
      } else {
        await AsyncStorage.removeItem("rememberedEmail");
      }
  
      const enableBiometric = await LocalAuthentication.authenticateAsync({
        promptMessage: "Enable biometric login?",
        cancelLabel: "No",
      });
  
      if (enableBiometric.success) {
        await AsyncStorage.setItem("biometricEmail", email);
        await AsyncStorage.setItem("biometricPassword", password);
        await AsyncStorage.setItem("biometricEnabled", "true");
      }
    } catch (error: any) {
      setErrorMessage("Invalid email or password. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
  >
    <ScrollView 
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Welcome to PayNothing</Text>

      {/* <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification
      /> */}

      {/* Phone Auth */}
      {/* <View style={styles.authSection}>
      {!verificationId ? (
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
                  "+1 " + phoneNumber,
                  recaptchaVerifier.current!
                );
                setVerificationId(vid);
              } catch (error: any) {
                Alert.alert("Error", error.message);
              }
            }}
          >
            <Text style={styles.verifyButtonText}>Send Code</Text>
          </TouchableOpacity>
        </View>
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
                if (!verificationId) throw new Error("No verification ID");
                const credential = PhoneAuthProvider.credential(
                  verificationId,
                  verificationCode
                );
                await signInWithCredential(FIREBASE_AUTH, credential);
                setVerificationId(null);
              } catch (error: any) {
                Alert.alert("Error", error.message);
              }
            }}
          >
            <Text style={styles.buttonText}>Verify Code</Text>
          </TouchableOpacity>
        </>
      )}
      </View> */}
      {/* Email / Password Auth */}
      <View style={styles.emailAuthContainer}>
        <Text style={styles.separator}>Or use email</Text>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <TextInput
          placeholder="Email address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#666"
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#666"
          style={styles.input}
        />

        <View style={styles.emailButtonContainer}>
          <TouchableOpacity style={[styles.emailButton, styles.loginButton]} onPress={handleLogin}>
            <Text style={styles.emailButtonText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.emailButton, styles.signupButton]} onPress={handleSignUp}>
            <Text style={styles.emailButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }}>
        <TouchableOpacity
          onPress={handleBiometricTap}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#eee",
            padding: 8,
            borderRadius: 8
          }}
        >
          <Image
            source={require("../assets/images/biometric.png")}
            style={{ width: 24, height: 24, marginRight: 6 }}
          />
          <Text>Biometric Login</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <TouchableOpacity
          style={{
            height: 20,
            width: 20,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: "#888",
            backgroundColor: rememberMe ? "#4caf50" : "#fff",
            marginRight: 8,
          }}
          onPress={() => setRememberMe(!rememberMe)}
        />
        <Text style={{ color: "#444" }}>Remember me</Text>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 90,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 60,
    color: "#2D3436",
  },
  authSection: {
    marginBottom: 5,
  },
  phoneInputContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  verifyButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: "center",
  },
  verifyButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  googleButton: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleButtonText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
  },
  emailAuthContainer: {
    marginTop: 10,
    gap: 15, // Add gap between elements
    marginBottom: 30,
  },
  separator: {
    textAlign: "center",
    marginVertical: 20,
    color: "#aaa",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  successText: {
    color: "green",
    textAlign: "center",
    marginBottom: 10,
  },
  emailButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10, // Add gap between buttons
  },
  emailButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
  },
  loginButton: {
    backgroundColor: "#f2c500",
  },
  signupButton: {
    backgroundColor: "#57cc99",
  },
  emailButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
