/**
 * RestroGo v2 — Central App Configuration
 *
 * ✅ ONLY FILE YOU NEED TO EDIT for Firebase setup.
 * Load this AFTER Firebase SDK scripts, BEFORE other scripts.
 *
 * HOW TO USE:
 * 1. Replace the values below with your Firebase project config
 * 2. This script initializes Firebase once for the whole app
 */

(function () {
 const FIREBASE_CONFIG = {
    apiKey:            "YOUR_API_KEY",
    authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL:       "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId:         "YOUR_PROJECT_ID",
    storageBucket:     "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId:             "YOUR_APP_ID"
  };

  // Safe init — won't crash if already initialized
  if (typeof firebase !== "undefined" && !firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
    console.log("[RestroGo] Firebase initialized ✅");
  }

  // Expose config globally (read-only, no secrets exposed beyond what Firebase requires)
  window.RESTROGOV2_CONFIG = {
    appVersion:    "2.0.0",
    basePath:      "/restrogov2",  // Change to "/" if deploying at root
    githubPages:   true,           // Set false if using custom domain
    projectId:     FIREBASE_CONFIG.projectId
  };
})();
