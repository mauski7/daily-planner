// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Request additional scopes for Google Calendar
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events.readonly');

// Force consent screen to show again
googleProvider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline'
});

// Provider for adding additional calendar accounts (forces account selection)
export const googleCalendarProvider = new GoogleAuthProvider();
googleCalendarProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
googleCalendarProvider.addScope('https://www.googleapis.com/auth/calendar.events.readonly');
googleCalendarProvider.setCustomParameters({
  prompt: 'select_account consent',
  access_type: 'offline'
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Store the Google access token for Calendar API
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    if (token) {
      localStorage.setItem('googleAccessToken', token);
      // Store token timestamp to track expiration
      localStorage.setItem('googleTokenTimestamp', Date.now().toString());
    }
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Add a calendar account (forces account selection, returns token without changing Firebase user)
export const addCalendarAccount = async () => {
  try {
    // Use signInWithPopup with account selection - this will temporarily change the auth state
    // but we'll restore it after getting the token
    const currentUser = auth.currentUser;
    const result = await signInWithPopup(auth, googleCalendarProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;

    // Store the new token for calendar use
    if (token) {
      localStorage.setItem('googleAccessToken', token);
      localStorage.setItem('googleTokenTimestamp', Date.now().toString());
    }

    return { token, timestamp: Date.now().toString() };
  } catch (error) {
    console.error("Error adding calendar account:", error);
    throw error;
  }
};

// Refresh Google token by re-authenticating
export const refreshGoogleToken = async () => {
  try {
    // Clear old token
    localStorage.removeItem('googleAccessToken');
    localStorage.removeItem('googleTokenTimestamp');

    // Re-authenticate to get fresh token
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    if (token) {
      localStorage.setItem('googleAccessToken', token);
      localStorage.setItem('googleTokenTimestamp', Date.now().toString());
      return token;
    }
    return null;
  } catch (error) {
    console.error("Error refreshing Google token:", error);
    throw error;
  }
};

// Check if token is likely expired (tokens typically last 1 hour)
export const isTokenExpired = () => {
  const timestamp = localStorage.getItem('googleTokenTimestamp');
  if (!timestamp) return true;

  const tokenAge = Date.now() - parseInt(timestamp);
  const ONE_HOUR = 60 * 60 * 1000;

  // Consider token expired if older than 50 minutes (be conservative)
  return tokenAge > (50 * 60 * 1000);
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
