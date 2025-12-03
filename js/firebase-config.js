// Firebase Configuration
// ⚠️ IMPORTANT: Replace these values with your Firebase project settings
// Get these from: https://console.firebase.google.com → Project Settings → Web App

const firebaseConfig = {
  apiKey: "AIzaSyD8AimON1vXMR80oc6WVqeFLfj7Ir2c1B0",
  authDomain: "maruschedule-ccf5a.firebaseapp.com",
  projectId: "maruschedule-ccf5a",
  storageBucket: "maruschedule-ccf5a.firebasestorage.app",
  messagingSenderId: "539907734866",
  appId: "1:539907734866:web:79d6a33cba8ff6dc584e8b",
  measurementId: "G-94LBR71R2E"
};

// Initialize Firebase
let firebaseApp = null;
let auth = null;

try {
  firebaseApp = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
