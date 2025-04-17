# PayNothing

A mobile app development project for local bartering.

Users can post their items available to trade locally using **short videos**, enabling visual demonstration without lengthy descriptions or photos. For each video post, other users can play the role of **moderator** to comment and share opinions. The app also includes a **chat system** and encourages meeting in **public places** for safety.

---

## 🚀 Features

- 📹 Video-based item posting (record + upload)
- 🏷️ Tagging and geolocation of video posts
- 💬 Real-time chat and messaging
- 🧑‍⚖️ Moderator-style comment system
- 🔒 Firebase Authentication and Storage

---

## 📦 Installation

### 1. Clone the repository

```bash
git clone https://github.com/XiangshengGu/PayNothing.git
cd paynothing
```

### 2. Install dependencies

Using npm:

```bash
npm install
```

---

## 📱 Running on Android (Local Debug)

> You must have **Android Studio** installed, with emulator or physical device ready.

### 1. Start the Metro bundler

```bash
npx expo start
```

### 2. Run the app on Android

```bash
npx expo run:android
```

> ⚠️ The app will load JavaScript via Metro. Ensure your computer and phone are on the **same network**, or connect via USB with developer mode enabled.

---

## 📦 Building APK for Manual Installation

To generate a standalone `.apk` file that works **without Metro**, run:

```bash
cd android
./gradlew assembleRelease       # on macOS/Linux
gradlew.bat assembleRelease     # on Windows
```

You will find the output file at:

```
android/app/build/outputs/apk/release/app-release.apk
```

> You can copy this APK to your phone and install it manually for testing.

---

## 🛠️ Requirements

- Node.js >= 16
- Java JDK 17+
- Android Studio (with SDKs)
- `JAVA_HOME` must be properly set

---

## ☁️ Backend Services

This project uses Firebase for:

- 🔐 Authentication (Email/Phone/Google)
- ☁️ Firestore for real-time database
- 🗃️ Firebase Storage for video files

> Configuration is stored in `FirebaseConfig.ts`. You must create your own Firebase project and supply credentials.

---

## 📍 Project Stack

- **React Native + Expo**
- **Firebase** (Auth, Firestore, Storage)
- **Zustand** for global state
- **React Navigation** + Expo Router
- **Expo AV / Camera / Location** APIs

---