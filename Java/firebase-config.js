// firebase-config.js - Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCmWe5bJF9m6gRE4sg5WaiCs6wPrE21Qmg",
  authDomain: "frostbyte-test-6f9ae.firebaseapp.com",
  projectId: "frostbyte-test-6f9ae",
  storageBucket: "frostbyte-test-6f9ae.firebasestorage.app",
  messagingSenderId: "958508912848",
  appId: "1:958508912848:web:301b2cfa7d01d3185a8ed5",
  measurementId: "G-QMHETXHVJY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set session-only persistence
setPersistence(auth, browserSessionPersistence).catch(console.error);

export { app, auth };


