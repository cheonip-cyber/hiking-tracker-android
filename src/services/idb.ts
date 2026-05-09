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
  localHikes: {
    key: string
    value: HikeRecord & { localId: string }
    indexes: { 'by-userId': string }
  }
}

let _db: IDBPDatabase<HikingDB> | null = null

async function getDB(): Promise<IDBPDatabase<HikingDB>> {
  if (_db) return _db
  _db = await openDB<HikingDB>('hiking-tracker', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('sessions',     { keyPath: 'id' })
        db.createObjectStore('pendingHikes', { keyPath: 'localId' })
      }
      if (oldVersion < 2) {
        const store = db.createObjectStore('localHikes', { keyPath: 'localId' })
        store.createIndex('by-userId', 'userId')
      }
    }
  })
  return _db
}

// ─── 세션 GPS 임시 저장 ─────────────────────────────
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

// ─── Firebase 대기열 ────────────────────────────────
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

// ─── v1 로컬 hike 저장소 ────────────────────────────
export async function saveLocalHike(hike: HikeRecord): Promise<string> {
  const db = await getDB()
  const localId = `hike_${Date.now()}`
  await db.put('localHikes', { ...hike, localId, id: localId })
  return localId
}

export async function getLocalHikes(userId: string): Promise<HikeRecord[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('localHikes', 'by-userId', userId)
  return all
    .map(h => ({ ...h, id: h.localId } as HikeRecord))
    .sort((a, b) => b.createdAt - a.createdAt)
}

export async function getLocalHike(localId: string): Promise<HikeRecord | null> {
  const db = await getDB()
  const item = await db.get('localHikes', localId)
  return item ? ({ ...item, id: item.localId } as HikeRecord) : null
}

export async function updateLocalHike(localId: string, patch: Partial<HikeRecord>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('localHikes', localId)
  if (!existing) return
  await db.put('localHikes', { ...existing, ...patch })
}

export async function deleteLocalHike(localId: string): Promise<void> {
  const db = await getDB()
  await db.delete('localHikes', localId)
}
