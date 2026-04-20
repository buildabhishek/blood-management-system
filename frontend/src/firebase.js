import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "blood-management-system-at68",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "",
};

let messaging = null;

const isConfigured = firebaseConfig.apiKey;

if (isConfigured) {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
}

export const requestToken = async () => {
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
    });

    return token;
};

export const listenToMessages = () => {
    if (!messaging) return;

    onMessage(messaging, (payload) => {
        console.log("Message received:", payload);

        new Notification(payload.notification.title, {
            body: payload.notification.body,
        });
    });
};
