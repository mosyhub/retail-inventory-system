// src/context/AuthContext.jsx
//
// Global authentication context. Every component in the app can access:
// - currentUser: { uid, email, firstName, lastName, role }
// - idToken: JWT token for API requests
// - login, signup, logout: auth actions
// - isLoading: whether auth is still initializing
// - isAuthenticated: boolean

import React, { createContext, useContext, useState, useEffect } from "react";
import * as authService from "../services/authService.js";

// Create the context
const AuthContext = createContext(null);

/**
 * AuthProvider: Wraps the app and manages global auth state.
 * 
 * Responsibilities:
 * - Listen to Firebase auth state changes (via onAuthChange)
 * - Manage user data, token, and loading state
 * - Provide login/signup/logout functions
 * - Persist token in localStorage for page refreshes
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // On mount: restore session from localStorage if available, then listen to Firebase
  useEffect(() => {
    let sessionRestored = false;

    // ── Step 1: Immediately restore from localStorage ─────────────────────────
    // This means ProtectedRoute sees a valid user on the VERY FIRST render
    // after login navigation, instead of waiting for Firebase's async init.
    const storedToken = localStorage.getItem("idToken");
    const storedUser  = localStorage.getItem("currentUser");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setIdToken(storedToken);
        setCurrentUser(parsedUser);
        sessionRestored = true;
      } catch (err) {
        console.error("Failed to restore session:", err);
        localStorage.removeItem("idToken");
        localStorage.removeItem("currentUser");
      }
    }

    // If we already have a session, stop showing the loading spinner NOW.
    // Firebase's onAuthChange will still run later to refresh the token if needed.
    if (sessionRestored) {
      setIsLoading(false);
    }

    // ── Step 2: Listen to Firebase auth state changes ─────────────────────────
    const unsubscribe = authService.onAuthChange(async (authData) => {
      try {
        if (authData) {
          const { idToken: token } = authData;

          // Fetch fresh user profile from backend
          const response = await authService.getCurrentUser(token);
          if (response.success) {
            setIdToken(token);
            setCurrentUser(response.user);
            // Keep localStorage in sync
            localStorage.setItem("idToken", token);
            localStorage.setItem("currentUser", JSON.stringify(response.user));
          }
        } else {
          // User signed out — clear everything
          setCurrentUser(null);
          setIdToken(null);
          localStorage.removeItem("idToken");
          localStorage.removeItem("currentUser");
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      } finally {
        // Always clear loading once Firebase has responded
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Signup handler
  const handleSignup = async (email, password, firstName, lastName, role) => {
    try {
      setError(null);
      const result = await authService.signup(email, password, firstName, lastName, role);
      // Auth context will update via onAuthChange listener
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Login handler
  const handleLogin = async (email, password) => {
    try {
      setError(null);
      const result = await authService.login(email, password);
      // Auth context will update via onAuthChange listener
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      setError(null);
      await authService.logout(idToken);
      // Auth context will update via onAuthChange listener
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    currentUser,
    idToken,
    isLoading,
    error,
    isAuthenticated: !!currentUser,
    signup: handleSignup,
    login: handleLogin,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth hook: Access auth context from any component
 *
 * Usage in a component:
 *   const { currentUser, login, logout, isAuthenticated } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
