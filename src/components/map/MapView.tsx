import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useAppStore } from '../../store/appStore'

// Leaflet 기본 마커 아이콘 수정
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface MapProps {
  className?: string
}

export default function MapView({ className = '' }: MapProps) {
  const mapRef    = useRef<L.Map | null>(null)
  const markerRef = useRef<L.CircleMarker | null>(null)
  const lineRef   = useRef<L.Polyline | null>(null)
  const divRef    = useRef<HTMLDivElement>(null)

  const { session } = useAppStore()

  // 지도 초기화
  useEffect(() => {
    if (!divRef.current || mapRef.current) return

    const map = L.map(divRef.current, {
      center: [37.5665, 126.9780], // 서울 기본
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
    })

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // 줌 버튼 오른쪽 하단
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // 경로 라인
    lineRef.current = L.polyline([], {
      color: '#22c55e',
      weight: 4,
      opacity: 0.85,
    }).addTo(map)

    // 현재 위치 마커
    markerRef.current = L.circleMarker([37.5665, 126.9780], {
      radius: 10,
      fillColor: '#16a34a',
      color: '#ffffff',
      weight: 3,
      fillOpacity: 1,
    }).addTo(map)

    mapRef.current = map

    // 현재 위치로 이동
    navigator.geolocation?.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      map.setView([latitude, longitude], 15)
      markerRef.current?.setLatLng([latitude, longitude])
    })

    return () => { map.remove(); mapRef.current = null }
  }, [])

  // GPS 포인트 업데이트
  useEffect(() => {
    const pt = session.currentPoint
    if (!pt || !mapRef.current) return

    const latlng: L.LatLngExpression = [pt.lat, pt.lng]
    markerRef.current?.setLatLng(latlng)
    mapRef.current.panTo(latlng, { animate: true, duration: 0.5 })

    const pts = session.points.map(p => [p.lat, p.lng] as L.LatLngExpression)
    lineRef.current?.setLatLngs(pts)
  }, [session.currentPoint, session.points])

  return (
    <div
      ref={divRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: 300 }}
    />
  )
}
