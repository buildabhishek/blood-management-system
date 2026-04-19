import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

// Replace these values with your actual Firebase project config.
// Get them from: Firebase Console → Project Settings → General → Your Apps
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "blood-management-system-at68",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "",
};

let messaging = null;

// Only initialize Firebase if a real API key is configured
const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0;

if (isConfigured) {
    try {
        const app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
    } catch (e) {
        console.warn("Firebase init failed — push notifications disabled:", e.message);
    }
} else {
    console.info("Firebase not configured — push notifications disabled. Set REACT_APP_FIREBASE_* env vars to enable.");
}

export { messaging };

export const requestToken = async () => {
    if (!messaging) return null;
    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return null;
        const token = await getToken(messaging, {
            vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY || "",
        });
        return token;
    } catch (e) {
        console.warn("FCM token request failed:", e.message);
        return null;
    }
};
