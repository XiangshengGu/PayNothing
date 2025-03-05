import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, User, RecaptchaVerifier, 
         signInWithPhoneNumber, 
         GoogleAuthProvider, 
         signInWithCredential 
        } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional 
// Please insert your Firebase API key, and other necessary fields
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIRESTORE_DB = getFirestore(FIREBASE_APP);
export const FIREBASE_ST = getStorage(FIREBASE_APP);
export const GOOGLE_PROVIDER = new GoogleAuthProvider();
export { firebaseConfig };
export type { User };
export const setupRecaptcha = (containerId: string) => {
  return new RecaptchaVerifier(FIREBASE_AUTH, containerId, {
    size: "invisible",
  });
};
