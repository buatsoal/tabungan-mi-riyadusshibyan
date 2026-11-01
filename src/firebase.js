import { initializeApp } from "firebase/app";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBxDyuj38gtcoC8U9ayLva9y5b7sAGCClY",
  authDomain: "tabungan-mi-riyadusshiby-c9f85.firebaseapp.com",
  projectId: "tabungan-mi-riyadusshiby-c9f85",
  storageBucket: "tabungan-mi-riyadusshiby-c9f85.firebasestorage.app",
  messagingSenderId: "198533046899",
  appId: "1:198533046899:web:fb0d3222b00410d4f74006"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export { serverTimestamp };
