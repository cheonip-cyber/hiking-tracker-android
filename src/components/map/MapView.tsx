import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAppStore } from '../../store/appStore'

declare global {
  interface Window { kakao: any }
}

interface MapProps { className?: string }

const IS_NATIVE = Capacitor.isNativePlatform()

// ─── 카카오맵 (PWA) ──────────────────────────────────
function useKakaoMap(
  containerRef: React.RefObject<HTMLDivElement>,
  mapRef: React.MutableRefObject<any>,
  markerRef: React.MutableRefObject<any>,
  polylineRef: React.MutableRefObject<any>,
) {
  useEffect(() => {
    const load = () => new Promise<void>((resolve, reject) => {
      if (window.kakao?.maps) { resolve(); return }
      const s = document.createElement('script')
      s.src = '//dapi.kakao.com/v2/maps/sdk.js?appkey=b509cd1334b54f071ae6010f56d9eb19&autoload=false'
      s.async = true
      s.onload = () => window.kakao.maps.load(resolve)
      s.onerror = reject
      document.head.appendChild(s)
    })

    load().then(() => {
      if (!containerRef.current || mapRef.current) return
      const { kakao } = window
      const map = new kakao.maps.Map(containerRef.current, {
        center: new kakao.maps.LatLng(37.5665, 126.9780),
        level: 5,
      })
      mapRef.current = map

      const markerImg = new kakao.maps.MarkerImage(
        'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28">
            <circle cx="14" cy="14" r="10" fill="#e8650a" stroke="rgba(232,101,10,0.35)" stroke-width="4"/>
            <circle cx="14" cy="14" r="4" fill="white"/>
          </svg>`),
        new kakao.maps.Size(28, 28),
        { offset: new kakao.maps.Point(14, 14) }
      )
      markerRef.current = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(37.5665, 126.9780),
        image: markerImg, map,
      })
      polylineRef.current = new kakao.maps.Polyline({
        map, path: [],
        strokeWeight: 4, strokeColor: '#e8650a',
        strokeOpacity: 0.9, strokeStyle: 'solid',
      })
      navigator.geolocation?.getCurrentPosition((pos) => {
        const latlng = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude)
        map.setCenter(latlng); map.setLevel(4)
        markerRef.current?.setPosition(latlng)
      })
    }).catch(e => console.error('[KakaoMap] 로드 실패:', e))

    return () => { mapRef.current = null; markerRef.current = null; polylineRef.current = null }
  }, [])
}

// ─── Leaflet 지도 (네이티브 Android) ─────────────────
function useLeafletMap(
  divRef: React.RefObject<HTMLDivElement>,
  mapRef: React.MutableRefObject<any>,
  markerRef: React.MutableRefObject<any>,
  lineRef: React.MutableRefObject<any>,
) {
  useEffect(() => {
    if (!divRef.current || mapRef.current) return

    divRef.current.style.width  = '100%'
    divRef.current.style.height = '100%'

    const map = L.map(divRef.current, {
      center: [37.5665, 126.9780], zoom: 14,
      zoomControl: false, preferCanvas: true,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    lineRef.current = L.polyline([], {
      color: '#e8650a', weight: 4, opacity: 0.9,
    }).addTo(map)

    markerRef.current = L.circleMarker([37.5665, 126.9780], {
      radius: 10, fillColor: '#e8650a',
      color: 'rgba(232,101,10,0.35)', weight: 8, fillOpacity: 1,
    }).addTo(map)

    mapRef.current = map

    setTimeout(() => {
      map.invalidateSize({ animate: false })
      navigator.geolocation?.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords
        map.setView([latitude, longitude], 15)
        markerRef.current?.setLatLng([latitude, longitude])
      }, () => map.setView([37.5665, 126.9780], 14))
    }, 300)

    const ro = new ResizeObserver(() => map.invalidateSize({ animate: false }))
    ro.observe(divRef.current)

    return () => { ro.disconnect(); map.remove(); mapRef.current = null }
  }, [])
}

// ─── 메인 컴포넌트 ────────────────────────────────────
export default function MapView({ className = '' }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const markerRef    = useRef<any>(null)
  const polylineRef  = useRef<any>(null)
  const { session }  = useAppStore()

  // 플랫폼에 따라 지도 초기화
  if (IS_NATIVE) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLeafletMap(containerRef, mapRef, markerRef, polylineRef)
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useKakaoMap(containerRef, mapRef, markerRef, polylineRef)
  }

  // GPS 포인트 업데이트
  useEffect(() => {
    const pt = session.currentPoint
    if (!pt || !mapRef.current) return

    if (IS_NATIVE) {
      // Leaflet
      const latlng: L.LatLngExpression = [pt.lat, pt.lng]
      markerRef.current?.setLatLng(latlng)
      mapRef.current.panTo(latlng, { animate: true, duration: 0.5 })
      const pts = session.points.map(p => [p.lat, p.lng] as L.LatLngExpression)
      polylineRef.current?.setLatLngs(pts)
    } else {
      // 카카오맵
      if (!window.kakao) return
      const latlng = new window.kakao.maps.LatLng(pt.lat, pt.lng)
      markerRef.current?.setPosition(latlng)
      mapRef.current.panTo(latlng)
      if (session.points.length > 0) {
        const path = session.points.map(p => new window.kakao.maps.LatLng(p.lat, p.lng))
        polylineRef.current?.setPath(path)
      }
    }
  }, [session.currentPoint, session.points])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', minHeight: '200px' }}
    />
  )
}
