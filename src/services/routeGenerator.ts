import type { GpsPoint } from '../types'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'

// 주요 지점 추출 (출발 / 고도 변곡점 / 최고점 / 도착)
export function extractKeyPoints(points: GpsPoint[]): GpsPoint[] {
  if (points.length === 0) return []
  if (points.length <= 3) return points

  const key: GpsPoint[] = [points[0]]

  // 고도 변곡점 탐지 (스무딩 후)
  const smoothed = points.map((p, i) => {
    const slice = points.slice(Math.max(0, i - 2), i + 3)
    const avg = slice.reduce((s, x) => s + x.alt, 0) / slice.length
    return { ...p, alt: avg }
  })

  let prevDir: 'up' | 'down' | null = null
  for (let i = 1; i < smoothed.length - 1; i++) {
    const diff = smoothed[i].alt - smoothed[i - 1].alt
    const dir: 'up' | 'down' = diff >= 0 ? 'up' : 'down'
    if (prevDir && prevDir !== dir) {
      key.push(points[i])
    }
    prevDir = dir
  }

  // 최고점
  const maxPt = points.reduce((a, b) => (a.alt > b.alt ? a : b))
  if (!key.find(p => p.timestamp === maxPt.timestamp)) key.push(maxPt)

  key.push(points[points.length - 1])

  // 타임스탬프 순 정렬, 최대 8개
  return key
    .sort((a, b) => a.timestamp - b.timestamp)
    .filter((p, i, arr) => i === 0 || p.timestamp !== arr[i - 1].timestamp)
    .slice(0, 8)
}

// OSM Overpass로 등산 지점명 조회
async function queryOsmPointName(lat: number, lng: number): Promise<string | null> {
  const delta = 0.001 // ~100m
  const query = `
    [out:json][timeout:10];
    (
      node["name"]["natural"~"peak|saddle|cave_entrance"](${lat - delta},${lng - delta},${lat + delta},${lng + delta});
      node["name"]["highway"~"trailhead"](${lat - delta},${lng - delta},${lat + delta},${lng + delta});
      node["name"]["tourism"~"viewpoint|information"](${lat - delta},${lng - delta},${lat + delta},${lng + delta});
      node["name"]["amenity"~"shelter|parking"](${lat - delta},${lng - delta},${lat + delta},${lng + delta});
    );
    out body 3;
  `
  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`
    })
    const data = await res.json()
    if (data.elements?.length > 0) {
      // 가장 가까운 노드 선택
      const nearest = data.elements.reduce((a: any, b: any) => {
        const da = Math.hypot(a.lat - lat, a.lon - lng)
        const db = Math.hypot(b.lat - lat, b.lon - lng)
        return da < db ? a : b
      })
      return nearest.tags?.['name:ko'] || nearest.tags?.name || null
    }
  } catch (e) {
    console.warn('[OSM] 쿼리 실패:', e)
  }
  return null
}

// Nominatim fallback
async function queryNominatim(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `${NOMINATIM_URL}?lat=${lat}&lon=${lng}&format=json&accept-language=ko`,
      { headers: { 'User-Agent': 'HikingTrackerApp/1.0' } }
    )
    const data = await res.json()
    return (
      data.namedetails?.name ||
      data.address?.peak ||
      data.address?.natural ||
      data.address?.suburb ||
      data.address?.neighbourhood ||
      null
    )
  } catch {
    return null
  }
}

// 루트 문자열 자동 생성
export async function generateRouteString(points: GpsPoint[]): Promise<string> {
  const keyPoints = extractKeyPoints(points)
  if (keyPoints.length === 0) return ''

  const names: string[] = []

  for (const pt of keyPoints) {
    // 1차: OSM 등산 지점명
    let name = await queryOsmPointName(pt.lat, pt.lng)

    // 2차: Nominatim fallback
    if (!name) {
      name = await queryNominatim(pt.lat, pt.lng)
    }

    if (name && !names.includes(name)) {
      names.push(name)
    }
  }

  if (names.length === 0) return ''
  return names.join(' → ')
}
