importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

if (workbox) {
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
}

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
    const notificationTitle = payload.data?.title || 'Habit Forge Notification';
    const count = payload.data?.badgeCount ? parseInt(payload.data.badgeCount, 10) : 0;

    const notificationOptions = {
      body: payload.data?.body || 'You have a new update.',
      icon: payload.data?.icon || '/icons/icon-192.png', // Large icon
      badge: '/icons/badge.png', // Monochrome status bar icon
      data: payload.data,
      actions: payload.data?.actions ? JSON.parse(payload.data.actions) : []
    };

    self.registration.showNotification(notificationTitle, notificationOptions);

    // Set the badging count
    if (count > 0 && navigator.setAppBadge) {
      navigator.setAppBadge(count).catch(e => console.error("Badge error", e));
    }
  } else {
    // If notification payload IS present, the browser shows the notification automatically.
    // But we might still want to update the badge if data is present.
    // However, onBackgroundMessage might not fire if it's a notification-message and app is in background (handled by system).
    // EXCEPT: if the payload contains data-only, it fires. 
    // If it contains both, it sends to system tray, but onBackgroundMessage *might* receive it? 
    // Documentation says: "If the message is a notification message, the SDK displays the notification... `onBackgroundMessage` is NOT called."
    // So we need to put the BADGE logic in the backend-sent Notification Options? 
    // NO, 'badge' in notification options is the ICON, not the number.
    // To set the count, we need code execution. 
    // If we send `notification` payload, we can't run code.
    // WE MUST REMOVE `notification` KEY FROM BACKEND PAYLOAD AND SEND DATA-ONLY NOTIFICATION to have full control in SW?
    // OR we can rely on `badgeCount` in data and hope we can set it when the user clicks? No.

    // STRATEGY CHANGE: The backend sends { notification: ..., data: ... }
    // This means SW onBackgroundMessage is presumably NOT called on Android when in background.
    // This is a problem.
    // However, we can try to set the badge in `notificationclick`? No, that's too late.

    // Wait, the user's issue says "badge is not getting processed".
    // If I want to set the badge number, I MUST use `navigator.setAppBadge()`.
    // I can only do this if I have JS execution.
    // If I send a display message, I get no execution.
    // SO, IF badge count is important, I should switch to DATA-ONLY messages and construct the notification myself in the SW.

    // BUT the backend is currently generating the title/body dynamically.
    // CONSTANT: `notification` object in payload.
    // If I remove `notification` from backend `getNotificationForUser`, I can send everything in `data`.
    // Then `onBackgroundMessage` WILL fire.
    // And this code block `if (!payload.notification)` will verify true.
    // And I can construct the notification AND set the badge.

    // I WILL MODIFY BACKEND TO RETURN NULL for 'notification' key or just omit it, 
    // moving title/body to 'data'.
    // BUT checking the `sw.js` code:
    // It has: `if (!payload.notification) { ... showNotification ... }`
    // So it is already prepared for data-only messages!

    // So my plan needs to include: MODIFY BACKEND TO SEND DATA ONLY.
    // I will do that in the next step. 
    // For now, let's ensure the SW logic actually uses the badge count.

    const count = payload.data?.badgeCount ? parseInt(payload.data.badgeCount, 10) : 0;
    if (count > 0 && navigator.setAppBadge) {
      navigator.setAppBadge(count).catch(e => console.error("Badge error", e));
    }
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
  // Logic: 
  // 1. If Action is 'complete_now' or 'open_app', look for actionLink.
  // 2. If Action is null (Body click), look for link.

  if (event.action === 'complete_now' || event.action === 'open_app') {
    if (event.notification.data && event.notification.data.actionLink) {
      urlToOpen = event.notification.data.actionLink;
    }
  } else {
    // Body Click
    if (event.notification.data && event.notification.data.link) {
      urlToOpen = event.notification.data.link;
    }
  }

  // Handle specific action logic if needed
  if (event.action === 'open_app' || event.action === 'complete_now') {
    // Logic handled via urlToOpen above.
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
