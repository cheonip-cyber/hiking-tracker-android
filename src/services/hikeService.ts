import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, where, orderBy, serverTimestamp
} from 'firebase/firestore'
import { FIREBASE_ENABLED, db } from './firebase'
import {
  addPendingHike, getPendingHikes, removePendingHike,
  saveLocalHike, getLocalHikes, updateLocalHike, deleteLocalHike
} from './idb'
import type { HikeRecord } from '../types'

const HIKES_COL = 'hikes'

// ─── 저장 ───────────────────────────────────────────
export async function saveHike(hike: HikeRecord): Promise<string> {
  // v1: 로컬 IndexedDB
  if (!FIREBASE_ENABLED || !db) {
    return saveLocalHike(hike)
  }
  // v2: Firebase (실패 시 대기열)
  try {
    const ref = await addDoc(collection(db, HIKES_COL), {
      ...hike,
      createdAt: serverTimestamp()
    })
    return ref.id
  } catch (e) {
    console.warn('[Firestore] 저장 실패 → 로컬 대기열:', e)
    return addPendingHike(hike)
  }
}

// ─── 전체 조회 ──────────────────────────────────────
export async function getHikes(userId: string): Promise<HikeRecord[]> {
  if (!FIREBASE_ENABLED || !db) {
    return getLocalHikes(userId)
  }
  const q = query(
    collection(db, HIKES_COL),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as HikeRecord))
}

// ─── 루트 편집 ──────────────────────────────────────
export async function updateRoute(hikeId: string, routeEdited: string): Promise<void> {
  if (!FIREBASE_ENABLED || !db) {
    await updateLocalHike(hikeId, { routeEdited })
    return
  }
  await updateDoc(doc(db, HIKES_COL, hikeId), { routeEdited })
}

// ─── 메모 수정 ──────────────────────────────────────
export async function updateMemo(hikeId: string, memo: string): Promise<void> {
  if (!FIREBASE_ENABLED || !db) {
    await updateLocalHike(hikeId, { memo })
    return
  }
  await updateDoc(doc(db, HIKES_COL, hikeId), { memo })
}

// ─── 삭제 ───────────────────────────────────────────
export async function deleteHike(hikeId: string): Promise<void> {
  if (!FIREBASE_ENABLED || !db) {
    await deleteLocalHike(hikeId)
    return
  }
  await deleteDoc(doc(db, HIKES_COL, hikeId))
}

// ─── 오프라인 대기열 동기화 (v2 전환 시) ───────────
export async function syncPendingHikes(): Promise<void> {
  if (!FIREBASE_ENABLED || !db) return
  const pending = await getPendingHikes()
  for (const hike of pending) {
    try {
      const { localId, ...hikeData } = hike
      await addDoc(collection(db, HIKES_COL), {
        ...hikeData,
        createdAt: serverTimestamp()
      })
      await removePendingHike(localId)
      console.log('[Sync] 동기화 완료:', localId)
    } catch (e) {
      console.warn('[Sync] 동기화 실패:', e)
    }
  }
}
