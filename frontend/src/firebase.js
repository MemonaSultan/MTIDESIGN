// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDgbLpfMmUoQtN6sAwaaC28wHYFVnqOWYY",
  authDomain: "mit1-46695.firebaseapp.com",
  projectId: "mit1-46695",
  storageBucket: "mit1-46695.firebasestorage.app",
  messagingSenderId: "898811462241",
  appId: "1:898811462241:web:009b6bec2850fa5fac6020",
  measurementId: "G-XHZSVFZEG2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();