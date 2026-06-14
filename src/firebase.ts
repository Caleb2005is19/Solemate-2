import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Use Vite glob imports to load config if and only if it exists at build time.
// This prevents compilation from crashing when deploying to platforms like Vercel where the config file is not checked in.
const configs = import.meta.glob('../firebase-applet-config*.json', { eager: true });
const configKey = '../firebase-applet-config.json';
const appletConfig = (configs[configKey] as any)?.default || {};

const firebaseConfig: any = {
  apiKey: appletConfig?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: appletConfig?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: appletConfig?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: appletConfig?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: appletConfig?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: appletConfig?.appId || import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: (appletConfig as any)?.firestoreDatabaseId || (appletConfig as any)?.databaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID,
};

if (!firebaseConfig.apiKey) {
  console.error('Firebase API key is missing. Please make sure Firebase is set up or set VITE_FIREBASE_API_KEY.');
}

// Only initialize if apiKey is present to avoid the auth/invalid-api-key error
const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined) : null as any;
export const auth = app ? getAuth(app) : null as any;
export const storage = app ? getStorage(app) : null as any;
export const googleProvider = new GoogleAuthProvider();

import { setSheetsToken } from './services/googleSheetsService';

export const loginWithGoogle = async (requestSheetsScope: unknown = false) => {
  if (!auth) {
    throw new Error("Firebase is not initialized. Please check your VITE_FIREBASE_API_KEY.");
  }
  const needsSheets = requestSheetsScope === true;
  try {
    const provider = new GoogleAuthProvider();
    if (needsSheets) {
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
    }
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken && needsSheets) {
      setSheetsToken(credential.accessToken);
    }
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
  if (!auth) {
    throw new Error("Firebase is not initialized. Please check your VITE_FIREBASE_API_KEY.");
  }
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName: displayName.trim() });
    }
    return result.user;
  } catch (error) {
    console.error("Error creating email account", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!auth) {
    throw new Error("Firebase is not initialized. Please check your VITE_FIREBASE_API_KEY.");
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    return result.user;
  } catch (error) {
    console.error("Error signing in with email", error);
    throw error;
  }
};

export const logout = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
