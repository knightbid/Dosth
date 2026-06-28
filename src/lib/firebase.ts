import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export { collection, doc };
