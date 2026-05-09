// GPS 포인트 (트래킹 중 메모리에만 사용)
export interface GpsPoint {
  lat: number
  lng: number
  alt: number
  speed: number
  accuracy: number
  timestamp: number
}

// Firestore 저장 구조 (path 배열 없음)
export interface HikeRecord {
  id?: string
  userId: string
  date: string           // YYYY-MM-DD
  startTime: string      // HH:mm
  endTime: string        // HH:mm
  duration: number       // 초
  distance: number       // km
  maxElevation: number   // m
  elevationGain: number  // m
  avgSpeed: number       // km/h
  routeAuto: string      // 자동 생성 루트
  routeEdited: string    // 사용자 편집 루트
  memo: string
  photos: string[]       // Firebase Storage URL
  createdAt: number
}

// 트래킹 상태
export type TrackingStatus = 'idle' | 'tracking' | 'paused' | 'finished'

// 실시간 트래킹 세션 (메모리)
export interface TrackingSession {
  status: TrackingStatus
  startTime: number | null
  pausedAt: number | null
  totalPausedMs: number
  points: GpsPoint[]       // 종료 후 버려짐
  distance: number         // km
  maxElevation: number     // m
  elevationGain: number    // m
  avgSpeed: number         // km/h
  currentPoint: GpsPoint | null
}

// 사용자
export interface UserProfile {
  uid: string
  name: string
  email: string
  photoURL: string
  settings: UserSettings
}

export interface UserSettings {
  gpsInterval: number        // 초 (기본 10)
  lowBatteryMode: boolean    // true = 30초
  accuracyThreshold: number  // m (기본 30)
}

// Overpass API 응답
export interface OverpassNode {
  type: 'node'
  id: number
  lat: number
  lon: number
  tags?: Record<string, string>
}

export interface OverpassElement {
  type: string
  id: number
  lat?: number
  lon?: number
  tags?: Record<string, string>
}
