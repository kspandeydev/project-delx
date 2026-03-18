import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, updateProfile, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, updateDoc, deleteDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const isUsingMockDB = false;

// Facade API for Auth
export const authAPI = {
  async signUpEmail(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  },
  async signInEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  },
  async signInGoogle() {
    return signInWithPopup(auth, new GoogleAuthProvider());
  },
  onAuthChange(cb) {
    return onAuthStateChanged(auth, cb);
  },
  async updateUserName(name) {
    if (auth.currentUser) {
      return updateProfile(auth.currentUser, { displayName: name });
    }
  },
  async logOut() {
    return signOut(auth);
  }
};

// Facade API for DB
export const dbAPI = {
  async getDoc(col, id) {
    return getDoc(doc(db, col, id));
  },
  async setDoc(col, id, data) {
    return setDoc(doc(db, col, id), data);
  },
  async addDoc(col, data) {
    return addDoc(collection(db, col), data);
  },
  async updateDoc(col, id, data) {
    return updateDoc(doc(db, col, id), data);
  },
  async deleteDoc(col, id) {
    return deleteDoc(doc(db, col, id));
  },
  async queryDocs(col, field, val) {
    return getDocs(query(collection(db, col), where(field, '==', val)));
  },
  async getAllDocs(col) {
    return getDocs(collection(db, col));
  },
  onSnapshot
};
