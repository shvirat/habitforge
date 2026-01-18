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

messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Received background message ', payload);
  if (!payload.notification) {
    const notificationTitle = payload.data?.title || 'HabitForge Notification';
    const notificationOptions = {
      body: payload.data?.body || 'You have a new update.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png', // Using the same icon for badge
      data: payload.data, // Pass data along
      actions: payload.data?.actions ? JSON.parse(payload.data.actions) : []
    };

    // Try to construct actions if not passed explicitly but suggested by payload content?
    // Actually the backend sends `webpush.notification.actions`, which the browser handles automatically if `payload.notification` is present.
    // But here we are handling data-only messages manually.
    // The backend script seems to send `notification` AND `data`. 
    // If `notification` is present, this handler is NOT called by default unless the window is in background? 
    // Actually `onBackgroundMessage` is for when the app is in background.
    // If `notification` payload is present, the browser handles it.
    // If we want to customize, we might need to rely on data-only or just let browser handle it.
    // The previous code had a check `if (!payload.notification)`.

    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});

self.addEventListener("fetch", () => { });
