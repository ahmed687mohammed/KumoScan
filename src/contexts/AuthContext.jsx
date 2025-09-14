import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // تسجيل الدخول بالبريد الإلكتروني وكلمة المرور
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // إنشاء حساب جديد
  async function signup(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // تحديث الملف الشخصي
    await updateProfile(result.user, {
      displayName: displayName
    });

    // إنشاء ملف المستخدم في Firestore
    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid,
      email: email,
      displayName: displayName,
      role: 'user',
      createdAt: new Date(),
      favorites: [],
      readingProgress: {}
    });

    return result;
  }

  // تسجيل الدخول بـ Google
  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    
    // التحقق من وجود ملف المستخدم في Firestore
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    
    if (!userDoc.exists()) {
      // إنشاء ملف المستخدم إذا لم يكن موجوداً
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        role: 'user',
        createdAt: new Date(),
        favorites: [],
        readingProgress: {}
      });
    }

    return result;
  }

  // تسجيل الخروج
  function logout() {
    return signOut(auth);
  }

  // جلب ملف المستخدم من Firestore
  async function getUserProfile(uid) {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? userDoc.data() : null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // جلب ملف المستخدم من Firestore
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    login,
    signup,
    loginWithGoogle,
    logout,
    getUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

