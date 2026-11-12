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
const firebaseConfig = {
  apiKey: "AIzaSyDiSWNz6HpGEAlPqUPl8nx1G2DMlz1_8b0",
  authDomain: "restrogov2.firebaseapp.com",
  projectId: "restrogov2",
  storageBucket: "restrogov2.firebasestorage.app",
  messagingSenderId: "411405416897",
  appId: "1:411405416897:web:5733716ebdd3a1a91d1740",
  measurementId: "G-PZD1M1C1Z7"
};

  // Safe init — won't crash if already initialized
  if (typeof firebase !== "undefined" && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("[RestroGo] Firebase initialized ✅");
  }

  // Expose config globally (read-only, no secrets exposed beyond what Firebase requires)
  window.RESTROGOV2_CONFIG = {
    appVersion:    "2.0.0",
    basePath:      "/restrogov2",  // Change to "/" if deploying at root
    githubPages:   true,           // Set false if using custom domain
    projectId:     firebaseConfig.projectId
  };
})();
