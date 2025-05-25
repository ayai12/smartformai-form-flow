// Import the functions you need from the SDKs you need
import { getFirestore } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDZDglD3gPWKybDQ13pkHIp_8KKvzuv-Cw",
  authDomain: "smartformai-51e03.firebaseapp.com",
  databaseURL: "https://smartformai-51e03-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "smartformai-51e03",
  storageBucket: "smartformai-51e03.firebasestorage.app",
  messagingSenderId: "543654782667",
  appId: "1:543654782667:web:c06a6c66f8a3d682da5d4e",
  measurementId: "G-KWTYTB3LEX"
};

// Initialize Firebase (only initialize once)
let app;
let analytics;
let auth;
let db;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';
const isVercel = isBrowser && (
  window.location.hostname.includes('vercel.app') || 
  process.env.VERCEL || 
  process.env.VERCEL_ENV
);

if (isBrowser) {
  try {
    console.log("Initializing Firebase in browser environment");
    console.log("Detected Vercel:", isVercel ? "Yes" : "No");
    
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized");
    } else {
      app = getApps()[0];
      console.log("Using existing Firebase app");
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Initialize analytics only if supported
    isSupported().then(yes => {
      if (yes) analytics = getAnalytics(app);
    }).catch(e => console.error("Analytics not supported:", e));
    
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
} else {
  console.warn("Firebase initialization skipped (not in browser environment)");
}

const googleProvider = new GoogleAuthProvider();

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export { auth, db };