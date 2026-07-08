import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getMessaging, Messaging, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

let app: FirebaseApp | null = null
let messaging: Messaging | null = null

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null
  if (app) return app
  if (getApps().length === 0) {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }
  return app
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null
  if (messaging) return messaging
  const supported = await isSupported()
  if (!supported) return null
  const fbApp = getFirebaseApp()
  if (!fbApp) return null
  messaging = getMessaging(fbApp)
  return messaging
}
