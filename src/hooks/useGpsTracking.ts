import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import type { GpsPoint } from '../types'

export function useGpsTracking() {
  const { session, addPoint, user } = useAppStore()
  const watchIdRef  = useRef<number | null>(null)
  const wakeLockRef = useRef<any>(null)
  const isTrackingRef = useRef(false) // 화면 꺼짐 후 재시작 판단용

  // ─── Wake Lock ───────────────────────────────────────
  const acquireWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return
    if (wakeLockRef.current) return // 이미 보유 중
    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
      console.log('[WakeLock] 활성화')

      // Wake Lock 해제 시 자동 재획득 시도
      wakeLockRef.current.addEventListener('release', async () => {
        console.log('[WakeLock] 해제됨')
        wakeLockRef.current = null
        // 화면이 다시 켜질 때 재획득은 visibilitychange에서 처리
      })
    } catch (e) {
      console.warn('[WakeLock] 획득 실패:', e)
    }
  }, [])

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try { await (wakeLockRef.current as any).release() } catch (_) {}
      wakeLockRef.current = null
    }
  }, [])

  // ─── GPS watchPosition 시작 ───────────────────────────
  const startGpsWatch = useCallback(() => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 GPS를 지원하지 않습니다.')
      return
    }

    // 기존 watch 정리 후 재시작
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    const settings    = user?.settings
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
        // 타임아웃 오류 시 자동 재시작
        if (err.code === err.TIMEOUT && isTrackingRef.current) {
          console.warn('[GPS] 타임아웃 → 재시작')
          setTimeout(() => {
            if (isTrackingRef.current) startGpsWatch()
          }, 2000)
        }
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout:            20000,
        maximumAge:         5000, // 5초 캐시 허용 (백그라운드 복귀 시 즉시 값 반환)
      }
    )
    console.log('[GPS] watchPosition 시작:', watchIdRef.current)
  }, [addPoint, user])

  const stopGpsWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      console.log('[GPS] watchPosition 중지')
    }
  }, [])

  // ─── 트래킹 시작/중지 ────────────────────────────────
  const startTracking = useCallback(() => {
    isTrackingRef.current = true
    startGpsWatch()
    acquireWakeLock()
  }, [startGpsWatch, acquireWakeLock])

  const stopTracking = useCallback(() => {
    isTrackingRef.current = false
    stopGpsWatch()
    releaseWakeLock()
  }, [stopGpsWatch, releaseWakeLock])

  // ─── 상태 변화 감지 ──────────────────────────────────
  useEffect(() => {
    if (session.status === 'tracking') {
      startTracking()
    } else {
      stopTracking()
    }
    return () => stopTracking()
  }, [session.status])

  // ─── 화면 꺼짐/켜짐 처리 (핵심) ──────────────────────
  useEffect(() => {
    const handleVisibility = async () => {
      if (!isTrackingRef.current) return

      if (document.visibilityState === 'hidden') {
        // 화면 꺼짐: GPS watch는 유지 시도, Wake Lock만 해제됨
        console.log('[Visibility] 화면 꺼짐 — GPS 유지 시도')
      } else {
        // 화면 켜짐: Wake Lock 재획득 + GPS 재시작 (Android에서 끊길 수 있음)
        console.log('[Visibility] 화면 켜짐 — GPS 재시작')
        await acquireWakeLock()

        // GPS watch가 살아있는지 확인 후 재시작
        // (Android Chrome은 백그라운드에서 watchPosition이 중단됨)
        setTimeout(() => {
          if (isTrackingRef.current) {
            startGpsWatch()
          }
        }, 500)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [acquireWakeLock, startGpsWatch])

  // ─── 네트워크 복귀 시 GPS 재확인 ────────────────────
  useEffect(() => {
    const handleOnline = () => {
      if (isTrackingRef.current) {
        console.log('[Network] 온라인 복귀 → GPS 재시작')
        startGpsWatch()
      }
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [startGpsWatch])

  return { startTracking, stopTracking }
}
