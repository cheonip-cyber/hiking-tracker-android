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

    const map = L.map(divRef.current, {
      center: [37.5665, 126.9780],
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
    })

    // CartoDB Voyager — 밝은 베이지/회색, 카카오맵 유사 스타일, API키 불필요
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map)

    // 줌 버튼
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // 이동 경로 — 주황색
    lineRef.current = L.polyline([], {
      color:   '#e8650a',
      weight:  4,
      opacity: 0.9,
    }).addTo(map)

    // 현재 위치 마커 — 주황 glow
    markerRef.current = L.circleMarker([37.5665, 126.9780], {
      radius:      10,
      fillColor:   '#e8650a',
      color:       'rgba(232,101,10,0.3)',
      weight:      8,
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
