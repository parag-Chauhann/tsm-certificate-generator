import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDSFjtVsQuJH1VgZPTWbAqmFH36kKv60-w",
  authDomain: "certificate-generator-da4c1.firebaseapp.com",
  projectId: "certificate-generator-da4c1",
  storageBucket: "certificate-generator-da4c1.appspot.com",
  messagingSenderId: "912438269961",
  appId: "1:912438269961:web:b150e50252bb2bf624c0d8",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
