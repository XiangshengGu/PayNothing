import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "firebase/auth";
import { user as UserDataModel } from "./models"; // user data of database in Firestore 

/**
 * To get userAuth and userData
    import { useUserStore } from "../data/store";
    const { userAuth, userData } = useUserStore();
    if (!userAuth) {
    not login
    }
    console.log(userData.username);
 * 
 * 
 * To set userAuth and userData
    const userCredential = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password );
    const loggedInUser = userCredential.user;

    // Get userInfo from Firestore
    const userDoc = await getDoc(doc(FIRESTORE_DB, "users", loggedInUser.uid));
    const userDataFromDB = userDoc.exists()
        ? { 
        username: userDoc.data()?.username || "Unknown User",
        age: userDoc.data()?.age || 0,
        gender: userDoc.data()?.gender || "Unknown",
        }
        : { username: "Unknown User", age: 0, gender: "Unknown" };
    // set global store of user
    setStoreUser(loggedInUser, userDataFromDB);
 */

// define userstare by Zustand
interface UserState {
  userAuth: User | null; // Authentication User of Firebase
  userData: UserDataModel | null; // userinfo in Firestore
  setStoreUser: (user: User | null, userData?: UserDataModel) => void; // set userstate
  logout: () => void; // exit
}

// create Zustand Store
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userAuth: null,
      userData: null,
      setStoreUser: (userAuth, userData) => set({ userAuth, userData: userData || null }),
      logout: () => set({ userAuth: null, userData: null }),
    }),
    { name: "user-storage" } // storage key
  )
);
