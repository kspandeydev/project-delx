// Firebase configuration placeholder
// Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Simulated Firebase services for demo
// Replace these with real Firebase SDK imports when ready:
// import { initializeApp } from 'firebase/app';
// import { getAuth } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';
// import { getMessaging } from 'firebase/messaging';

class MockAuth {
  constructor() {
    this.currentUser = null;
    this._listeners = [];
  }

  onAuthStateChanged(callback) {
    this._listeners.push(callback);
    const saved = localStorage.getItem('delo_user');
    if (saved) {
      this.currentUser = JSON.parse(saved);
      callback(this.currentUser);
    } else {
      callback(null);
    }
    return () => {
      this._listeners = this._listeners.filter(l => l !== callback);
    };
  }

  async signInWithPhone(phone) {
    const user = {
      uid: 'user_' + Date.now(),
      phone,
      displayName: null,
      email: null,
      photoURL: null,
      provider: 'phone'
    };
    this.currentUser = user;
    localStorage.setItem('delo_user', JSON.stringify(user));
    this._listeners.forEach(l => l(user));
    return user;
  }

  async signInWithGoogle() {
    const user = {
      uid: 'user_' + Date.now(),
      phone: null,
      displayName: 'DELo User',
      email: 'user@delo.app',
      photoURL: null,
      provider: 'google'
    };
    this.currentUser = user;
    localStorage.setItem('delo_user', JSON.stringify(user));
    this._listeners.forEach(l => l(user));
    return user;
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('delo_user');
    localStorage.removeItem('delo_profile');
    this._listeners.forEach(l => l(null));
  }

  async updateProfile(data) {
    this.currentUser = { ...this.currentUser, ...data };
    localStorage.setItem('delo_user', JSON.stringify(this.currentUser));
    this._listeners.forEach(l => l(this.currentUser));
  }
}

class MockFirestore {
  constructor() {
    this.data = this._loadData();
  }

  _loadData() {
    try {
      return JSON.parse(localStorage.getItem('delo_db') || '{}');
    } catch { return {}; }
  }

  _saveData() {
    localStorage.setItem('delo_db', JSON.stringify(this.data));
  }

  collection(name) {
    if (!this.data[name]) this.data[name] = {};
    return {
      add: (doc) => {
        const id = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        this.data[name][id] = { ...doc, id, createdAt: new Date().toISOString() };
        this._saveData();
        return Promise.resolve({ id, ...this.data[name][id] });
      },
      doc: (id) => ({
        get: () => Promise.resolve({ exists: !!this.data[name]?.[id], data: () => this.data[name]?.[id] }),
        set: (doc) => {
          this.data[name][id] = { ...doc, id };
          this._saveData();
          return Promise.resolve();
        },
        update: (doc) => {
          this.data[name][id] = { ...this.data[name]?.[id], ...doc, id };
          this._saveData();
          return Promise.resolve();
        },
        delete: () => {
          delete this.data[name][id];
          this._saveData();
          return Promise.resolve();
        }
      }),
      where: () => ({
        get: () => {
          const docs = Object.values(this.data[name] || {}).map(d => ({ id: d.id, data: () => d }));
          return Promise.resolve({ docs, empty: docs.length === 0 });
        }
      }),
      get: () => {
        const docs = Object.values(this.data[name] || {}).map(d => ({ id: d.id, data: () => d }));
        return Promise.resolve({ docs, empty: docs.length === 0 });
      }
    };
  }
}

export const auth = new MockAuth();
export const db = new MockFirestore();
export const firebaseConfig_ref = firebaseConfig;
export default { auth, db };
