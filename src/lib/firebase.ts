import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "studio-2672200785-9956d",
  "appId": "1:42881975703:web:182a027d5bcddac71a70d2",
  "apiKey": "AIzaSyCHK7wB9pFQ1PCK6pKKm0IJRhH6Sbttel0",
  "authDomain": "studio-2672200785-9956d.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "42881975703"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// Conecta a la base de datos específica 'rafaga-db'
const db = getFirestore(app, 'rafaga-db');

export { db };
