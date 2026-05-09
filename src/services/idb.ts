import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { HikeRecord, GpsPoint } from '../types'

interface HikingDB extends DBSchema {
  sessions: {
    key: string
    value: {
      id: string
      points: GpsPoint[]
      startTime: number
      savedAt: number
      synced: boolean
    }
  }
  pendingHikes: {
    key: string
    value: HikeRecord & { localId: string }
  }
}

let _db: IDBPDatabase<HikingDB> | null = null

async function getDB(): Promise<IDBPDatabase<HikingDB>> {
  if (_db) return _db
  _db = await openDB<HikingDB>('hiking-tracker', 1, {
    upgrade(db) {
      db.createObjectStore('sessions',     { keyPath: 'id' })
      db.createObjectStore('pendingHikes', { keyPath: 'localId' })
    }
  })
  return _db
}

// 트래킹 중 GPS 포인트 임시 저장 (세션 보호)
export async function saveSessionPoints(sessionId: string, points: GpsPoint[]): Promise<void> {
  try {
    const db = await getDB()
    await db.put('sessions', {
      id: sessionId,
      points,
      startTime: points[0]?.timestamp ?? Date.now(),
      savedAt: Date.now(),
      synced: false
    })
  } catch (e) {
    console.error('[IDB] 세션 저장 실패:', e)
  }
}

export async function getSessionPoints(sessionId: string): Promise<GpsPoint[]> {
  try {
    const db = await getDB()
    const session = await db.get('sessions', sessionId)
    return session?.points ?? []
  } catch {
    return []
  }
}

export async function clearSession(sessionId: string): Promise<void> {
  try {
    const db = await getDB()
    await db.delete('sessions', sessionId)
  } catch (e) {
    console.error('[IDB] 세션 삭제 실패:', e)
  }
}

// Firebase 저장 실패 시 대기열에 추가
export async function addPendingHike(hike: HikeRecord): Promise<string> {
  const db = await getDB()
  const localId = `pending_${Date.now()}`
  await db.put('pendingHikes', { ...hike, localId })
  return localId
}

export async function getPendingHikes(): Promise<(HikeRecord & { localId: string })[]> {
  const db = await getDB()
  return db.getAll('pendingHikes')
}

export async function removePendingHike(localId: string): Promise<void> {
  const db = await getDB()
  await db.delete('pendingHikes', localId)
}
