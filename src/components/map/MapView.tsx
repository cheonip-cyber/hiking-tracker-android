import { useEffect, useRef } from 'react'
import { useAppStore } from '../../store/appStore'

declare global {
  interface Window {
    kakao: any
  }
}

interface MapProps {
  className?: string
}

export default function MapView({ className = '' }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const markerRef    = useRef<any>(null)
  const polylineRef  = useRef<any>(null)
  const { session }  = useAppStore()

  useEffect(() => {
    // 카카오맵 SDK 동적 로드
    const loadKakaoMap = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.kakao && window.kakao.maps) { resolve(); return }

        const script = document.createElement('script')
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=3cf2eb5043d5072a4ee5b245d3b7016c&autoload=false`
        script.async = true
        script.onload = () => {
          window.kakao.maps.load(() => resolve())
        }
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    loadKakaoMap().then(() => {
      if (!containerRef.current || mapRef.current) return

      const { kakao } = window

      // 지도 옵션
      const options = {
        center: new kakao.maps.LatLng(37.5665, 126.9780),
        level: 5, // 숫자 낮을수록 확대 (1~14)
      }

      const map = new kakao.maps.Map(containerRef.current, options)
      mapRef.current = map

      // 현재 위치 마커 — 주황색 커스텀
      const markerImg = new kakao.maps.MarkerImage(
        // SVG 데이터 URI로 주황 원형 마커
        'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28">
            <circle cx="14" cy="14" r="10" fill="#e8650a" stroke="rgba(232,101,10,0.35)" stroke-width="4"/>
            <circle cx="14" cy="14" r="4" fill="white"/>
          </svg>
        `),
        new kakao.maps.Size(28, 28),
        { offset: new kakao.maps.Point(14, 14) }
      )

      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(37.5665, 126.9780),
        image: markerImg,
        map,
      })
      markerRef.current = marker

      // 이동 경로 폴리라인 — 주황색
      const polyline = new kakao.maps.Polyline({
        map,
        path: [],
        strokeWeight: 4,
        strokeColor: '#e8650a',
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
      })
      polylineRef.current = polyline

      // 현재 위치로 이동
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          const latlng = new kakao.maps.LatLng(latitude, longitude)
          map.setCenter(latlng)
          map.setLevel(4)
          marker.setPosition(latlng)
        },
        () => {
          // GPS 실패 시 서울 유지
        }
      )
    }).catch((e) => {
      console.error('[KakaoMap] 로드 실패:', e)
    })

    return () => {
      mapRef.current = null
      markerRef.current = null
      polylineRef.current = null
    }
  }, [])

  // GPS 포인트 업데이트
  useEffect(() => {
    const pt = session.currentPoint
    if (!pt || !mapRef.current || !window.kakao) return

    const { kakao } = window
    const latlng = new kakao.maps.LatLng(pt.lat, pt.lng)

    // 마커 이동
    markerRef.current?.setPosition(latlng)
    mapRef.current.panTo(latlng)

    // 경로 업데이트
    if (polylineRef.current && session.points.length > 0) {
      const path = session.points.map(
        (p) => new kakao.maps.LatLng(p.lat, p.lng)
      )
      polylineRef.current.setPath(path)
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
