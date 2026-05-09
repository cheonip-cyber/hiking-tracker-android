import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import type { GpsPoint } from '../types'

export function useGpsTracking() {
  const { session, addPoint, user } = useAppStore()
  const watchIdRef = useRef<number | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  // Wake Lock 획득
  const acquireWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return
    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
      console.log('[WakeLock] 화면 유지 활성화')
      wakeLockRef.current.addEventListener('release', () => {
        console.log('[WakeLock] 해제됨')
      })
    } catch (e) {
      console.warn('[WakeLock] 획득 실패:', e)
    }
  }, [])

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release()
      wakeLockRef.current = null
    }
  }, [])

  // GPS 감시 시작
  const startWatch = useCallback(() => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 GPS를 지원하지 않습니다.')
      return
    }

    const settings = user?.settings
    const highAccuracy = !settings?.lowBatteryMode

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const point: GpsPoint = {
          lat:       pos.coords.latitude,
          lng:       pos.coords.longitude,
          alt:       pos.coords.altitude ?? 0,
          speed:     pos.coords.speed ?? 0,
          accuracy:  pos.coords.accuracy,
          timestamp: pos.timestamp,
        }
        addPoint(point)
      },
      (err) => {
        console.error('[GPS] 오류:', err.message)
        if (err.code === err.PERMISSION_DENIED) {
          alert('GPS 권한이 필요합니다.\n설정에서 위치 권한을 허용해주세요.')
        }
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout:            15000,
        maximumAge:         0,
      }
    )

    acquireWakeLock()
  }, [addPoint, acquireWakeLock, user])

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    releaseWakeLock()
  }, [releaseWakeLock])

  // 상태에 따라 자동 시작/중지
  useEffect(() => {
    if (session.status === 'tracking') {
      startWatch()
    } else {
      stopWatch()
    }
    return () => stopWatch()
  }, [session.status])

  // 화면 복귀 시 Wake Lock 재획득
  useEffect(() => {
    const handleVisibility = async () => {
      if (
        document.visibilityState === 'visible' &&
        session.status === 'tracking' &&
        !wakeLockRef.current
      ) {
        await acquireWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [session.status, acquireWakeLock])

  return { startWatch, stopWatch }
}
