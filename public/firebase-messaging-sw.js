importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyClKdp34JodfuuKuflPWFOXTuCryIV8O7g",
    authDomain: "habitforge-vjs.firebaseapp.com",
    projectId: "habitforge-vjs",
    storageBucket: "habitforge-vjs.firebasestorage.app",
    messagingSenderId: "395343926685",
    appId: "1:395343926685:web:8893d6f52cb33391af8b74"
});

const messaging = firebase.messaging();

// Optional: specific customization for background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // If the payload has a notification property, the browser will likely show it automatically.
    // If you want to customize it or handle data messages, you can do it here.

    // Example of showing a notification manually if not handled automatically (e.g. data-only message)
    if (!payload.notification) {
        const notificationTitle = payload.data?.title || 'HabitForge Notification';
        const notificationOptions = {
            body: payload.data?.body || 'You have a new update.',
            icon: '/icon.png' // You might want to update this to a valid icon path
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    }
});
