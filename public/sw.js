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

self.addEventListener('notificationclick', function (event) {
  console.log('[sw.js] Notification click received.', event);
  event.notification.close();

  // "open_app" action or general click
  // The backend sends link in `fcm_options.link` which might surface in `event.notification.data.fcm_options.link` 
  // OR plain `event.notification.data.link` depending on how it was constructed manually in `onBackgroundMessage`.

  // Strategy:
  // 1. Check specific action buttons
  // 2. Fallback to general click (body)
  // 3. Find URL from data or default to /dashboard

  let urlToOpen = '/dashboard'; // Default

  // Check if there is a link in the notification data
  if (event.notification.data && event.notification.data.fcm_options && event.notification.data.fcm_options.link) {
    urlToOpen = event.notification.data.fcm_options.link;
  } else if (event.notification.data && event.notification.data.link) {
    urlToOpen = event.notification.data.link;
  }

  // Handle specific action logic if needed
  if (event.action === 'open_app' || event.action === 'complete_now') {
    // Just open the URL found above.
    // If action is specific 'complete_now', maybe force /fixer?
    // But the backend already sends specific link for the specific user situation.
  }

  // Open the URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // If window is already open, focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // Check if the client is suitable (same origin) and is what we want
        if (client.url && 'focus' in client) {
          // If the URL matches exactly or is acceptable, focus. 
          // For now, just bringing ANY window to focus and navigating might be easier.
          // Or matching the origin.
          if (new URL(client.url).origin === self.location.origin) {
            return client.focus().then(c => {
              if ('navigate' in c) {
                return c.navigate(urlToOpen);
              }
            });
          }
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener("fetch", () => { });
