import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey:  "AIzaSyClKry6uxF_HQRPM0phT1o2MDnMqorfP8M",
  authDomain: "ai-study-planner-114c3.firebaseapp.com",
  projectId: "ai-study-planner-114c3",
  storageBucket: "ai-study-planner-114c3.firebasestorage.app",
  messagingSenderId: "870408717729",
  appId: "1:870408717729:web:776d40cc68b1de3c08f7e0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
