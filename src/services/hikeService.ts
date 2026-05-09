import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, where, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { addPendingHike, getPendingHikes, removePendingHike } from './idb'
import type { HikeRecord } from '../types'

const HIKES_COL = 'hikes'

// 저장 (실패 시 IndexedDB 대기열)
export async function saveHike(hike: HikeRecord): Promise<string> {
  try {
    const ref = await addDoc(collection(db, HIKES_COL), {
      ...hike,
      createdAt: serverTimestamp()
    })
    return ref.id
  } catch (e) {
    console.warn('[Firestore] 저장 실패, 오프라인 대기열 추가:', e)
    return addPendingHike(hike)
  }
}

// 사용자 기록 전체 조회
export async function getHikes(userId: string): Promise<HikeRecord[]> {
  const q = query(
    collection(db, HIKES_COL),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as HikeRecord))
}

// 루트 편집 저장
export async function updateRoute(hikeId: string, routeEdited: string): Promise<void> {
  await updateDoc(doc(db, HIKES_COL, hikeId), { routeEdited })
}

// 메모 수정
export async function updateMemo(hikeId: string, memo: string): Promise<void> {
  await updateDoc(doc(db, HIKES_COL, hikeId), { memo })
}

// 삭제
export async function deleteHike(hikeId: string): Promise<void> {
  await deleteDoc(doc(db, HIKES_COL, hikeId))
}

// 오프라인 대기열 동기화 (네트워크 복구 시 호출)
export async function syncPendingHikes(): Promise<void> {
  const pending = await getPendingHikes()
  for (const hike of pending) {
    try {
      const { localId, ...hikeData } = hike
      await addDoc(collection(db, HIKES_COL), {
        ...hikeData,
        createdAt: serverTimestamp()
      })
      await removePendingHike(localId)
      console.log('[Sync] 대기 기록 동기화 완료:', localId)
    } catch (e) {
      console.warn('[Sync] 동기화 실패:', e)
    }
  }
}
