import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHchJq0Fo9TMqN46U-GT8IfR7SPyXtL84",
  authDomain: "localmart-4fd9a.firebaseapp.com",
  projectId: "localmart-4fd9a",
  storageBucket: "localmart-4fd9a.firebasestorage.app",
  messagingSenderId: "627257315391",
  appId: "1:627257315391:web:25917ec2851be83003288a",
  measurementId: "G-68DNY0Q0KV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
