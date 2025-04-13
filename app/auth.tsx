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
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
// import { useUserStore } from "./data/store";

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "115198796724-ledugt1lu3uschiqefiighq20dbs4re3.apps.googleusercontent.com",
    redirectUri: "https://paynothingapp.firebaseapp.com/__/auth/handler",
  });

  const router = useRouter();
  // function of store
  // const { setStoreUser} = useUserStore(); 

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

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(FIREBASE_AUTH, credential).catch((err) =>
        Alert.alert("Google Sign-In Error", err.message)
      );
    }
  }, [response]);

  const handleLogin = async () => {
    try {
      setErrorMessage("");
      setSuccessMessage("");
      await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
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
        age: 0,
        gender: "Unknown",
        posts: [],
        savedVideos: [],
      });
      setSuccessMessage("Account created! Please log in.");
    } catch (error: any) {
      setErrorMessage(error.message);
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

      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification
      />

      {/* Phone Auth */}
      <View style={styles.authSection}>
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
      </View>
      {/* Google Sign-In */}
      <View style={styles.authSection}>
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
