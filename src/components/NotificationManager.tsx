import { useEffect, useState } from 'react';
import { messaging, db } from '../lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Bell } from 'lucide-react';

export const NotificationManager = () => {
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const { user } = useAuth(); // Get current user

    const requestPermission = async () => {
        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);

            if (permission === 'granted') {
                const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
                if (!vapidKey) {
                    console.error("VITE_FIREBASE_VAPID_KEY is missing via .env");
                    toast.error("Vapid Key is missing in configuration");
                    console.warn("Please add VITE_FIREBASE_VAPID_KEY to your .env file.");
                    return;
                }

                const currentToken = await getToken(messaging, { vapidKey });
                if (currentToken) {
                    console.log('FCM Token:', currentToken);
                    toast.success("Notifications enabled!");

                    if (user) {
                        // Save token to Firestore
                        try {
                            // Determine a safe place to store it. 'private' subcollection is good.
                            await setDoc(doc(db, 'users', user.uid, 'private', 'fcmToken'), {
                                token: currentToken,
                                updatedAt: new Date(),
                                platform: 'web'
                            });
                            console.log("Token saved to Firestore");
                        } catch (dbError) {
                            console.error("Error saving token to DB:", dbError);
                        }
                    }

                } else {
                    console.log('No registration token available. Request permission to generate one.');
                }
            }
        } catch (err) {
            console.error('An error occurred while retrieving token. ', err);
            toast.error("Failed to enable notifications.");
        }
    };

    useEffect(() => {
        const saveTokenIfGranted = async () => {
            if (notificationPermission === 'granted' && user) {
                try {
                    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
                    if (!vapidKey) return;

                    const currentToken = await getToken(messaging, { vapidKey });
                    if (currentToken) {
                        // Save token to Firestore
                        await setDoc(doc(db, 'users', user.uid, 'private', 'fcmToken'), {
                            token: currentToken,
                            updatedAt: new Date(),
                            platform: 'web'
                        });
                        console.log("Token synced to Firestore");
                    }
                } catch (err) {
                    console.error("Error syncing token:", err);
                }
            }
        };
        saveTokenIfGranted();

        // Handle foreground messages
        if (messaging) {
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Foreground Message received: ', payload);
                toast.info(
                    <div>
                        <h4 className='font-bold'>{payload.notification?.title || "Notification"}</h4>
                        <p>{payload.notification?.body}</p>
                    </div>
                );
            });
            return () => {
                unsubscribe();
            };
        }
    }, [notificationPermission, user]);

    // If permission is already granted or denied, don't show the floating button
    // You might want to show it if denied to allow retrying (though browser blocks it usually)
    // or if 'default' (not yet asked).
    if (notificationPermission !== 'default') return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <button
                onClick={requestPermission}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg flex items-center gap-2 transition-all animate-bounce"
                title="Enable Notifications"
            >
                <Bell size={20} />
                <span className="text-sm font-medium">Enable Notifications</span>
            </button>
        </div>
    );
};
