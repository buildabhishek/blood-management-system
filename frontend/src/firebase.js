import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const cfg = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.REACT_APP_FIREBASE_APP_ID || '',
};

let messaging = null;
if (cfg.apiKey) {
    const app = initializeApp(cfg);
    messaging = getMessaging(app);
}

export const requestToken = async () => {
    if (!messaging) return null;
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return null;
    return getToken(messaging, { vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY });
};

export const listenToMessages = () => {
    if (!messaging) return;
    onMessage(messaging, p => {
        if (Notification.permission === 'granted')
            new Notification(p.notification.title, { body: p.notification.body });
    });
};
