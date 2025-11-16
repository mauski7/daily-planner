// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// These configuration values will need to be replaced with your actual Firebase config
// You'll get these from the Firebase Console after creating your project
const firebaseConfig = {
  apiKey: "AIzaSyDowKDaGdMeFC1e5TjpqVEinwUv0fnkU6U",
  authDomain: "daily-project-planner.firebaseapp.com",
  projectId: "daily-project-planner",
  storageBucket: "daily-project-planner.firebasestorage.app",
  messagingSenderId: "119167023794",
  appId: "1:119167023794:web:c397d4e022f159cfaa67ab"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Request additional scopes for Google Calendar
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events.readonly');

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Store the Google access token for Calendar API
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    localStorage.setItem('googleAccessToken', token);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('googleAccessToken');
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};
