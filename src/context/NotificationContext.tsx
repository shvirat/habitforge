import React, { createContext, useContext, useEffect, useState } from 'react';
import { messaging, db } from '../lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

interface NotificationContextType {
    permission: NotificationPermission;
    requestPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);
    const { user } = useAuth();

    const requestPermission = async () => {
        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
                if (!vapidKey) {
                    console.error("VITE_FIREBASE_VAPID_KEY is missing via .env");
                    toast.error("Vapid Key is missing in configuration");
                    return;
                }

                // Wait for Service Worker to be ready
                let tokenOptions: { vapidKey: string; serviceWorkerRegistration?: ServiceWorkerRegistration } = { vapidKey };
                if ('serviceWorker' in navigator) {
                    try {
                        const registration = await navigator.serviceWorker.ready;
                        tokenOptions = { vapidKey, serviceWorkerRegistration: registration };
                    } catch (swError) {
                        console.warn("Service Worker ready check failed, trying default.", swError);
                    }
                }

                const currentToken = await getToken(messaging, tokenOptions);
                if (currentToken) {
                    toast.success("Notifications enabled!");

                    if (user) {
                        await saveTokenToFirestore(user.uid, currentToken);
                    }
                } else {
                    // console.log('No registration token available.');
                }
            }
        } catch (err) {
            console.error('An error occurred while retrieving token. ', err);
            toast.error("Failed to enable notifications.");
        }
    };

    const saveTokenToFirestore = async (uid: string, token: string) => {
        try {
            await setDoc(doc(db, 'users', uid, 'private', 'fcmToken'), {
                token: token,
                updatedAt: new Date(),
                platform: 'web'
            });
            // console.log("Token saved to Firestore");
        } catch (dbError) {
            console.error("Error saving token to DB:", dbError);
        }
    };

    // Effect: Sync token on load if already granted
    useEffect(() => {
        const syncToken = async () => {
            if (permission === 'granted' && user) {
                try {
                    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
                    if (!vapidKey) return;

                    let tokenOptions: { vapidKey: string; serviceWorkerRegistration?: ServiceWorkerRegistration } = { vapidKey };
                    if ('serviceWorker' in navigator) {
                        try {
                            const registration = await navigator.serviceWorker.ready;
                            tokenOptions = { vapidKey, serviceWorkerRegistration: registration };
                        } catch (swError) {
                            console.warn("Service Worker ready check failed, trying default.", swError);
                        }
                    }

                    const currentToken = await getToken(messaging, tokenOptions);
                    if (currentToken) {
                        await saveTokenToFirestore(user.uid, currentToken);
                    }
                } catch (err) {
                    console.error("Error syncing token:", err);
                }
            }
        };
        syncToken();
    }, [permission, user]);

    // Effect: Foreground Message Listener
    useEffect(() => {
        if (messaging) {
            const unsubscribe = onMessage(messaging, (payload) => {
                toast.info(
                    <div>
                        <h4 className='font-bold'>{payload.notification?.title || "Notification"}</h4>
                        <p>{payload.notification?.body}</p>
                    </div>
                );
            });
            return () => unsubscribe();
        }
    }, []);

    return (
        <NotificationContext.Provider value={{ permission, requestPermission }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
