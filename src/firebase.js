// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBhNwERKdxDacN8_8QaiQQKNpdqDhMp89g",
  authDomain: "roadrescue-1a6ca.firebaseapp.com",
  projectId: "roadrescue-1a6ca",
  storageBucket: "roadrescue-1a6ca.firebasestorage.app",
  messagingSenderId: "463430376284",
  appId: "1:463430376284:web:684d55214b6ad5d513ff99",
  measurementId: "G-HEZWNP196P"
};

// DEBUGGING: This will print your key to the console
console.log("FIREBASE CONFIG LOADING:", firebaseConfig);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);