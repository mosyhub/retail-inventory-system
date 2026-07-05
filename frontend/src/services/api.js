// src/services/api.js
//
// Centralized Axios instance. Every API call in the app imports THIS
// instead of importing axios directly — that way, base URL, auth token
// attachment, and error handling are all defined in exactly one place.

import axios from "axios";
import { auth } from "./firebaseClient";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor: before every outgoing request, attach the current
 * Firebase user's ID token as a Bearer token. Our Express backend verifies
 * this token (via Admin SDK) to identify who's making the request and what
 * role they have — see Module 2 (Authentication) for the verification side.
 */
api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response interceptor: unwraps errors into a consistent shape so
 * components can do `catch (err) { setError(err.message) }` without
 * digging into err.response.data.message every time.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export default api;
