// src/services/firebaseClient.js
//
// Single source of truth for connecting to Firebase from the frontend.
// Every other file imports { auth } from here — never calls
// initializeApp() itself.
//
// IMPORTANT ARCHITECTURE:
// - This CLIENT SDK is used ONLY for authentication (sign in, sign out, ID token).
// - Client SDK cannot access Firestore directly (would bypass server-side permissions).
// - ALL data operations (products, sales, inventory) go through the Express backend.
// - The backend uses the ADMIN SDK and handles all business logic + access control.
//
// Auth flow:
//   1. Firebase Client Auth → verify credentials → get ID token
//   2. Send ID token to Express backend
//   3. Backend verifies token + checks Firestore for user data
//   4. Backend returns user profile + metadata
//   5. Frontend stores token in memory + localStorage for persistent sessions
//   6. All API calls include token in Authorization header

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
