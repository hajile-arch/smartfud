// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBsNv_fuTREOz1luMaa2UmcjAcXhZBd2kw",
  authDomain: "smartfud-a1c53.firebaseapp.com",
  projectId: "smartfud-a1c53",
  storageBucket: "smartfud-a1c53.firebasestorage.app",
  messagingSenderId: "143199947760",
  appId: "1:143199947760:web:2e17d17d3f2d42403d6b35",
  measurementId: "G-1220QCWHH8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
