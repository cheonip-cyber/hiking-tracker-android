import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useAppStore } from '../../store/appStore'

interface MapProps {
  className?: string
}

export default function MapView({ className = '' }: MapProps) {
  const mapRef    = useRef<L.Map | null>(null)
  const markerRef = useRef<L.CircleMarker | null>(null)
  const lineRef   = useRef<L.Polyline | null>(null)
  const divRef    = useRef<HTMLDivElement>(null)
  const { session } = useAppStore()

  useEffect(() => {
    if (!divRef.current || mapRef.current) return

    // 컨테이너에 명시적 크기 보장
    divRef.current.style.width  = '100%'
    divRef.current.style.height = '100%'

    const map = L.map(divRef.current, {
      center: [37.5665, 126.9780],
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true, // 성능 개선
    })

    // CartoDB Voyager — API 키 불필요, CORS 없음
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
        detectRetina: true,
      }
    ).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    lineRef.current = L.polyline([], {
      color: '#e8650a', weight: 4, opacity: 0.9,
    }).addTo(map)

    markerRef.current = L.circleMarker([37.5665, 126.9780], {
      radius: 10, fillColor: '#e8650a',
      color: 'rgba(232,101,10,0.35)', weight: 8, fillOpacity: 1,
    }).addTo(map)

    mapRef.current = map

    // ✅ 핵심: 렌더링 완료 후 크기 재계산 (0px 초기화 방지)
    setTimeout(() => {
      map.invalidateSize({ animate: false })

      navigator.geolocation?.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords
        map.setView([latitude, longitude], 15)
        markerRef.current?.setLatLng([latitude, longitude])
      }, () => {
        // GPS 실패 시 서울 기본값 유지
        map.setView([37.5665, 126.9780], 14)
      })
    }, 100)

    // ResizeObserver로 컨테이너 크기 변경 감지
    const ro = new ResizeObserver(() => {
      map.invalidateSize({ animate: false })
    })
    ro.observe(divRef.current)

    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

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
      className={className}
      style={{ width: '100%', height: '100%', minHeight: '200px' }}
    />
  )
}
