import type { GpsPoint } from '../types'

// Haversine 거리 계산 (km)
export function haversineKm(a: GpsPoint, b: GpsPoint): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const c =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    sinLng * sinLng
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c))
}

// 총 거리 계산 (km)
export function totalDistance(points: GpsPoint[]): number {
  let dist = 0
  for (let i = 1; i < points.length; i++) {
    dist += haversineKm(points[i - 1], points[i])
  }
  return Math.round(dist * 100) / 100
}

// 고도 스무딩 (이동 평균 5개)
export function smoothAltitude(points: GpsPoint[]): number[] {
  return points.map((_, i) => {
    const slice = points.slice(Math.max(0, i - 2), i + 3)
    return slice.reduce((s, p) => s + p.alt, 0) / slice.length
  })
}

// 누적 상승고도 계산
export function elevationGain(points: GpsPoint[]): number {
  const alts = smoothAltitude(points)
  let gain = 0
  for (let i = 1; i < alts.length; i++) {
    const diff = alts[i] - alts[i - 1]
    if (diff > 0) gain += diff
  }
  return Math.round(gain)
}

// 최고 고도 (스무딩 적용)
export function maxElevation(points: GpsPoint[]): number {
  if (points.length === 0) return 0
  const alts = smoothAltitude(points)
  return Math.round(Math.max(...alts))
}

// 평균 속도 (km/h)
export function avgSpeed(distance: number, durationSec: number): number {
  if (durationSec <= 0) return 0
  return Math.round((distance / (durationSec / 3600)) * 10) / 10
}

// 포인트 저장 여부 판단 (배터리 최적화)
export function shouldRecord(
  prev: GpsPoint | null,
  curr: GpsPoint,
  intervalSec: number,
  accuracyThreshold: number
): boolean {
  // 정확도 필터
  if (curr.accuracy > accuracyThreshold) return false
  if (!prev) return true

  const elapsed = (curr.timestamp - prev.timestamp) / 1000
  const dist = haversineKm(prev, curr) * 1000 // m

  return elapsed >= intervalSec || dist >= 15
}

// 경과 시간 포맷 (hh:mm:ss)
export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

// 날짜 포맷
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}
