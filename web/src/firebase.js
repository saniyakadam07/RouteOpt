import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCTUq-PbQ5KpMF3W7EeqPPCLlrBHrWhCbg",
  authDomain: "routeopt-f13a8.firebaseapp.com",
  projectId: "routeopt-f13a8",
  storageBucket: "routeopt-f13a8.firebasestorage.app",
  messagingSenderId: "551721762888",
  appId: "1:551721762888:web:64925f1192f232538c587d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);