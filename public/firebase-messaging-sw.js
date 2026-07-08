importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyDTTaT92PZBrJ5VdwX14ZqkpaAkBK84w0Q',
  authDomain: 'the-boma-cafe-pos.firebaseapp.com',
  projectId: 'the-boma-cafe-pos',
  storageBucket: 'the-boma-cafe-pos.firebasestorage.app',
  messagingSenderId: '609984155401',
  appId: '1:609984155401:web:7b0135cfc9868b54ae4dd8',
  measurementId: 'G-BHX3RFZ7BV',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'The Boma Café'
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/staff') && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/staff')
      }
    })
  )
})
