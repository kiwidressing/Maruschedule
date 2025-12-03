// Firebase Configuration
// ⚠️ IMPORTANT: Replace these values with your Firebase project settings
// Get these from: https://console.firebase.google.com → Project Settings → Web App

const firebaseConfig = {
  apiKey: "AIzaSyD8AimON1vXMR80oc6WVqeFLfj7Ir2c1B0",
  authDomain: "maruschedule-ccf5a.firebaseapp.com",
  projectId: "maruschedule-ccf5a",
  storageBucket: "maruschedule-ccf5a.firebasestorage.app",
  messagingSenderId: "539907734866",
  appId: "1:539907734866:web:9ea9c96a6bfd92a7584e8b",
  measurementId: "G-G5QDPC1S5E"
};

// Initialize Firebase
let firebaseApp = null;
let auth = null;
let db = null;

try {
  firebaseApp = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
  console.log('✅ Firebase initialized successfully');
  console.log('✅ Firestore initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
