// src/services/authService.js
//
// High-level auth functions that coordinate between Firebase Client SDK (auth)
// and our Express backend (API). This is the single source of truth for auth
// operations in the frontend.

import { auth } from "./firebaseClient.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * authService.signup(email, password, firstName, lastName, role)
 *
 * 1. Create user via Firebase (email + password)
 * 2. Get ID token from Firebase
 * 3. Send ID token to backend for user profile creation
 * 4. Return user + token for frontend storage
 */
export const signup = async (email, password, firstName, lastName) => {
  try {
    // Step 1: Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Step 2: Get ID token
    const idToken = await user.getIdToken();

    // Step 3: Send ID token to backend to create user profile
    const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
      email,
      firstName,
      lastName,
      idToken,
    });

    // Step 4: Return user + token
    return {
      success: true,
      user: response.data.user,
      idToken,
    };
  } catch (error) {
    console.error("Signup error:", error);
    throw {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * authService.login(email, password)
 *
 * 1. Sign in user via Firebase (email + password)
 * 2. Get ID token
 * 3. Send to backend for verification + user profile fetch
 * 4. Return user + token for frontend storage
 */
export const login = async (email, password) => {
  try {
    // Step 1: Sign in with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Step 2: Get ID token
    const idToken = await user.getIdToken();

    // Step 3: Send to backend to fetch user profile
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      idToken,
    });

    // Step 4: Return user + token
    return {
      success: true,
      user: response.data.user,
      idToken,
    };
  } catch (error) {
    console.error("Login error:", error);
    throw {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * authService.logout()
 *
 * 1. Notify backend (for audit logging)
 * 2. Sign out from Firebase
 * 3. Clear frontend tokens/session
 */
export const logout = async (idToken) => {
  try {
    // Notify backend (audit logging, token invalidation, etc.)
    if (idToken) {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
    }

    // Sign out from Firebase
    await firebaseSignOut(auth);

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    // Even if backend fails, still sign out locally
    await firebaseSignOut(auth);
    throw {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * authService.getCurrentUser(idToken)
 *
 * Fetch current user's profile from backend.
 * Used after login, signup, or page refresh to restore auth context.
 */
export const getCurrentUser = async (idToken) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    return {
      success: true,
      user: response.data.user,
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    throw {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
};

/**
 * authService.onAuthChange(callback)
 *
 * Listen to Firebase auth state changes (login, logout, sign up).
 * Calls callback(user) whenever auth state changes.
 * Returns an unsubscribe function to stop listening.
 *
 * Used by AuthContext to sync Firebase auth state with React state.
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // User signed in — get ID token
        const idToken = await firebaseUser.getIdToken();
        callback({
          firebaseUser,
          idToken,
        });
      } catch (error) {
        console.error("Error getting ID token:", error);
        callback(null);
      }
    } else {
      // User signed out
      callback(null);
    }
  });
};
