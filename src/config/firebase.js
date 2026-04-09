import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // 1. Tambahkan import ini
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDcn6nbuofJ__8DVmS4p8GiyKVo_bT_EDU",
  authDomain: "wfh-kpu-sekadau.firebaseapp.com",
  projectId: "wfh-kpu-sekadau",
  storageBucket: "wfh-kpu-sekadau.firebasestorage.app",
  messagingSenderId: "263776099874",
  appId: "1:263776099874:web:a633486dfc91da2357f47b",
  measurementId: "G-9SCKH5LVXE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 2. Inisialisasi Firestore
const db = getFirestore(app);
const auth = getAuth(app);
// 3. Ekspor db agar bisa dipakai di App.jsx
export { app, analytics, db, auth };