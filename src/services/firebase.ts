import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'

// Firebase 환경변수 존재 여부로 모드 결정
export const FIREBASE_ENABLED = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
)

let app:      FirebaseApp      | null = null
let _auth:    Auth             | null = null
let _db:      Firestore        | null = null
let _storage: FirebaseStorage  | null = null

if (FIREBASE_ENABLED) {
  const firebaseConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  }
  app      = initializeApp(firebaseConfig)
  _auth    = getAuth(app)
  _db      = getFirestore(app)
  _storage = getStorage(app)
  if (typeof window !== 'undefined' && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
    getAnalytics(app)
  }
  console.log('[Firebase] 연결됨 — v2 모드')
} else {
  console.log('[Firebase] 환경변수 없음 — v1 로컬 모드')
}

export const auth           = _auth
export const db             = _db
export const storage        = _storage
export const googleProvider = FIREBASE_ENABLED ? new GoogleAuthProvider() : null
