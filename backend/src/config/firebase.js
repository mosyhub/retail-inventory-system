import { createRequire } from "module";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

dotenv.config();

// Get the directory of this file (for ES modules)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "../..");

/**
 * We support two ways of supplying credentials, because local development
 * and cloud deployment (Render, Railway, etc.) handle files differently:
 *
 *   1. FIREBASE_SERVICE_ACCOUNT_PATH -> path to the downloaded JSON file (local dev)
 *   2. FIREBASE_SERVICE_ACCOUNT_JSON -> the JSON contents as a single env var string (deployment)
 *
 * If NEITHER is configured (e.g. you skipped Firebase setup for now while
 * building other modules), we fall back to a "dummy" initialization so the
 * server can still boot and routes can still be wired up — but any actual
 * Firestore/Auth call will fail until real credentials are added.
 */

let serviceAccount = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  // Deployment-style: credentials passed as a JSON string in an env var
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log("✅ Service account from environment variable loaded");
  } catch (err) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", err.message);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  // Local dev style: credentials read from a downloaded JSON file
  // Build the full path from project root (backend folder)
  const credPath = path.join(PROJECT_ROOT, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

  console.log(`🔍 Looking for service account at: ${credPath}`);
  
  try {
    if (fs.existsSync(credPath)) {
      const rawFile = fs.readFileSync(credPath, "utf-8");
      serviceAccount = JSON.parse(rawFile);
      console.log("✅ Service account file loaded and parsed successfully");
    } else {
      console.error(`❌ Service account file NOT found at: ${credPath}`);
    }
  } catch (err) {
    console.error(`❌ Error loading service account file: ${err.message}`);
  }
}

let firebaseReady = false;
let adminApp = null;

if (serviceAccount && serviceAccount.type === "service_account") {
  try {
    adminApp = admin.initializeApp({
      credential: admin.cert(serviceAccount),
    });
    firebaseReady = true;
    console.log("✅ Firebase Admin SDK initialized successfully.");
  } catch (err) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", err.message);
    process.exit(1);
  }
} else {
  // No credentials found — this is expected if you haven't set up Firebase yet.
  // We deliberately do NOT call admin.initializeApp() here, because doing so
  // with zero arguments still throws as soon as .firestore()/.auth() are
  // accessed. Instead, we leave firebaseReady = false and export proxy
  // objects below that throw a clear, friendly error only when actually USED
  // — not on import. This lets the rest of the server boot and routes get
  // wired up even before real credentials exist.
  console.warn(
    "⚠️  Firebase Admin SDK NOT initialized — no service account found.\n" +
      "   Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in .env\n" +
      "   The server will run, but Firestore/Auth-dependent routes will fail until configured."
  );
}

/**
 * Builds a Proxy that throws a clear, descriptive error the moment any
 * method is called on it — instead of a cryptic "X is not a function".
 * Used only when Firebase isn't configured yet, so developers get a helpful
 * message instead of a crash on server boot.
 */
function createUnconfiguredProxy(serviceName) {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(
          `Firebase ${serviceName} was called, but Firebase Admin SDK is not configured. ` +
            `Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in backend/.env`
        );
      },
    }
  );
}

const db = firebaseReady ? getFirestore() : createUnconfiguredProxy("Firestore");
const auth = firebaseReady ? getAuth() : createUnconfiguredProxy("Auth");

export { admin, db, auth, firebaseReady };
