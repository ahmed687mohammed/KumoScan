// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCaQ8dOkXvtCPtw-caB9voceTzHD5AUT94",
  authDomain: "kumoscan-9a38c.firebaseapp.com",
  databaseURL: "https://kumoscan-9a38c-default-rtdb.firebaseio.com",
  projectId: "kumoscan-9a38c",
  storageBucket: "kumoscan-9a38c.firebasestorage.app",
  messagingSenderId: "701087394999",
  appId: "1:701087394999:web:ab826a366664e807d4f132"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;

