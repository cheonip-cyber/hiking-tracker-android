import { useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../services/firebase'
import { useAppStore } from '../store/appStore'
import type { UserProfile } from '../types'

export function useAuth() {
  const { setUser } = useAppStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) { setUser(null); return }

      const ref = doc(db, 'users', fbUser.uid)
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

  const login = () => signInWithPopup(auth, googleProvider)
  const logout = () => { signOut(auth); setUser(null) }

  return { login, logout }
}
