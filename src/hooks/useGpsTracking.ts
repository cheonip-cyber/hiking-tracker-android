import { useEffect, useRef, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'
import { useAppStore } from '../store/appStore'
import type { GpsPoint } from '../types'

const IS_NATIVE = Capacitor.isNativePlatform()

export function useGpsTracking() {
  const { session, addPoint, user } = useAppStore()
  const watchIdRef    = useRef<string | number | null>(null)
  const wakeLockRef   = useRef<any>(null)
  const isTrackingRef = useRef(false)
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Wake Lock (PWA 전용) ────────────────────────────
  const acquireWakeLock = useCallback(async () => {
    if (IS_NATIVE || !('wakeLock' in navigator) || wakeLockRef.current) return
    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null
      })
    } catch (e) { console.warn('[WakeLock] 실패:', e) }
  }, [])

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try { await wakeLockRef.current.release() } catch (_) {}
      wakeLockRef.current = null
    }
  }, [])

  // ─── 네이티브 GPS (@capacitor/geolocation) ───────────
  // Android는 포그라운드 서비스 + watchPosition으로 백그라운드 지원
  const startNativeGps = useCallback(async () => {
    try {
      // 권한 요청
      const perm = await Geolocation.requestPermissions()
      console.log('[GPS] 권한:', perm.location)

      const settings     = user?.settings
      const highAccuracy = !settings?.lowBatteryMode

      // watchPosition으로 연속 추적
      watchIdRef.current = await Geolocation.watchPosition(
        {
          enableHighAccuracy: highAccuracy,
          timeout:            20000,
          maximumAge:         3000,
        },
        (pos, err) => {
          if (err || !pos) {
            console.error('[GPS] 오류:', err)
            return
          }
          if (!isTrackingRef.current) return

          const point: GpsPoint = {
            lat:       pos.coords.latitude,
            lng:       pos.coords.longitude,
            alt:       pos.coords.altitude ?? 0,
            speed:     pos.coords.speed ?? 0,
            accuracy:  pos.coords.accuracy,
            timestamp: pos.timestamp,
          }
          addPoint(point)
        }
      )
      console.log('[GPS] 네이티브 watchPosition 시작:', watchIdRef.current)
    } catch (e) {
      console.error('[GPS] 네이티브 시작 실패:', e)
      startWebGps()
    }
  }, [addPoint, user])

  const stopNativeGps = useCallback(async () => {
    if (watchIdRef.current !== null) {
      try {
        await Geolocation.clearWatch({ id: watchIdRef.current as string })
        console.log('[GPS] 네이티브 watchPosition 중지')
      } catch (e) { console.warn('[GPS] 중지 실패:', e) }
      watchIdRef.current = null
    }
  }, [])

  // ─── 웹 GPS (PWA) ────────────────────────────────────
  const startWebGps = useCallback(() => {
    if (!navigator.geolocation) return
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current as number)
      watchIdRef.current = null
    }
    const settings     = user?.settings
    const highAccuracy = !settings?.lowBatteryMode

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!isTrackingRef.current) return
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
        if (err.code === err.TIMEOUT && isTrackingRef.current) {
          setTimeout(() => { if (isTrackingRef.current) startWebGps() }, 2000)
        }
      },
      { enableHighAccuracy: highAccuracy, timeout: 20000, maximumAge: 5000 }
    )
  }, [addPoint, user])

  const stopWebGps = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current as number)
      watchIdRef.current = null
    }
  }, [])

  // ─── 통합 시작/중지 ──────────────────────────────────
  const startTracking = useCallback(async () => {
    isTrackingRef.current = true
    if (IS_NATIVE) {
      await startNativeGps()
    } else {
      startWebGps()
      acquireWakeLock()
    }
  }, [startNativeGps, startWebGps, acquireWakeLock])

  const stopTracking = useCallback(async () => {
    isTrackingRef.current = false
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (IS_NATIVE) {
      await stopNativeGps()
    } else {
      stopWebGps()
      releaseWakeLock()
    }
  }, [stopNativeGps, stopWebGps, releaseWakeLock])

  // ─── 상태 변화 감지 ──────────────────────────────────
  useEffect(() => {
    if (session.status === 'tracking') {
      startTracking()
    } else {
      stopTracking()
    }
    return () => { stopTracking() }
  }, [session.status])

  // ─── PWA 화면 복귀 시 GPS 재시작 ─────────────────────
  useEffect(() => {
    if (IS_NATIVE) return
    const handleVisibility = async () => {
      if (!isTrackingRef.current) return
      if (document.visibilityState === 'visible') {
        await acquireWakeLock()
        setTimeout(() => { if (isTrackingRef.current) startWebGps() }, 500)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [acquireWakeLock, startWebGps])

  return { isNative: IS_NATIVE }
}
