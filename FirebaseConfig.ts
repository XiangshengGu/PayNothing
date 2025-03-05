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
const firebaseConfig = {
  apiKey: "AIzaSyA4o2bhIDA5W4xiy_e8vIQ1bJY-Ed6r9GI",
  authDomain: "paynothingapp.firebaseapp.com",
  projectId: "paynothingapp",
  storageBucket: "paynothingapp.firebasestorage.app",
  messagingSenderId: "115198796724",
  appId: "1:115198796724:web:6959329825d78b13f788e1",
  measurementId: "G-GX0CM29V3M"
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
