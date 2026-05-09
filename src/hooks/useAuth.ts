import { useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { FIREBASE_ENABLED, auth, googleProvider, db } from '../services/firebase'
import { useAppStore } from '../store/appStore'
import type { UserProfile } from '../types'

const LOCAL_USER: UserProfile = {
  uid:      'local_user',
  name:     '로컬 사용자',
  email:    '',
  photoURL: '',
  settings: {
    gpsInterval:       10,
    lowBatteryMode:    false,
    accuracyThreshold: 30,
  }
}

export function useAuth() {
  const { setUser } = useAppStore()

  useEffect(() => {
    // v1: Firebase 없음 → 로컬 사용자로 즉시 진입
    if (!FIREBASE_ENABLED || !auth || !db) {
      setUser(LOCAL_USER)
      return
    }

    // v2: Firebase 인증
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) { setUser(null); return }

      const ref  = doc(db!, 'users', fbUser.uid)
      const snap = await getDoc(ref)

      if (snap.exists()) {
        setUser(snap.data() as UserProfile)
      } else {
        const newUser: UserProfile = {
          uid:      fbUser.uid,
          name:     fbUser.displayName ?? '등산객',
          email:    fbUser.email ?? '',
          photoURL: fbUser.photoURL ?? '',
          settings: {
            gpsInterval:       10,
            lowBatteryMode:    false,
            accuracyThreshold: 30,
          }
        }
        await setDoc(ref, newUser)
        setUser(newUser)
      }
    })
    return () => unsub()
  }, [setUser])

  const login = () => {
    if (!FIREBASE_ENABLED || !auth || !googleProvider) return
    signInWithPopup(auth, googleProvider)
  }

  const logout = () => {
    if (FIREBASE_ENABLED && auth) signOut(auth)
    setUser(null)
  }

  return { login, logout, isFirebaseMode: FIREBASE_ENABLED }
}
