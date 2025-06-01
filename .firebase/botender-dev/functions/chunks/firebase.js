import { getApps, initializeApp, deleteApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAI, VertexAIBackend } from "firebase/ai";
const VITE_API_KEY = "AIzaSyBjR6iL87F9R8Wa90kQeM7gsgwl_MQ9ON8";
const VITE_AUTH_DOMAIN = "robert-kraut-1234.firebaseapp.com";
const VITE_PROJECT_ID = "robert-kraut-1234";
const VITE_STORAGE_BUCKET = "robert-kraut-1234.appspot.com";
const VITE_MESSAGING_SENDER_ID = "408239274811";
const VITE_APP_ID = "1:408239274811:web:f856cb1c9396dff811551e";
const firebaseConfig = {
  apiKey: VITE_API_KEY,
  authDomain: VITE_AUTH_DOMAIN,
  projectId: VITE_PROJECT_ID,
  storageBucket: VITE_STORAGE_BUCKET,
  messagingSenderId: VITE_MESSAGING_SENDER_ID,
  appId: VITE_APP_ID
};
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
  deleteApp(app);
  app = initializeApp(firebaseConfig);
}
const db = getFirestore(app, "botender");
const ai = getAI(app, { backend: new VertexAIBackend() });
export {
  ai as a,
  db as d
};
