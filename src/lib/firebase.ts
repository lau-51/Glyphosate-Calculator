/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Use environment variables for clean configuration with fallback to default project keys
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAgs2fHvmjY97km-Zh30BEeEbH_a5fVlJE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "automated-objective-1v8b6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "automated-objective-1v8b6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "automated-objective-1v8b6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "968594948882",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:968594948882:web:08fb2cb405e0684c1269cb",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
