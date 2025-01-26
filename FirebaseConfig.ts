import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAwMc9Ff_-MAEb7YELoT4bBGvSSkq0o4ec",
  authDomain: "paynothing-a742a.firebaseapp.com",
  projectId: "paynothing-a742a",
  storageBucket: "paynothing-a742a.firebasestorage.app",
  messagingSenderId: "28887485438",
  appId: "1:28887485438:web:ebdb98f94513b2869b4eaf",
  measurementId: "G-JZVL5N7BRH"
};
// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIRESTORE_DB = getFirestore(FIREBASE_APP);