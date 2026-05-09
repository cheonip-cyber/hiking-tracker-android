import { create } from 'zustand'
import type { TrackingSession, GpsPoint, UserProfile, UserSettings } from '../types'
import { shouldRecord, totalDistance, maxElevation, elevationGain, avgSpeed } from '../utils/gps'
import { saveSessionPoints } from '../services/idb'

const SESSION_ID = 'current_session'

interface AppState {
  // 사용자
  user: UserProfile | null
  setUser: (user: UserProfile | null) => void
  updateSettings: (settings: Partial<UserSettings>) => void

  // 트래킹
  session: TrackingSession
  startTracking: () => void
  pauseTracking: () => void
  resumeTracking: () => void
  addPoint: (point: GpsPoint) => void
  stopTracking: () => TrackingSession
  resetSession: () => void

  // 네트워크
  isOnline: boolean
  setOnline: (v: boolean) => void
}

const defaultSession: TrackingSession = {
  status: 'idle',
  startTime: null,
  pausedAt: null,
  totalPausedMs: 0,
  points: [],
  distance: 0,
  maxElevation: 0,
  elevationGain: 0,
  avgSpeed: 0,
  currentPoint: null,
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateSettings: (settings) =>
    set((s) =>
      s.user
        ? { user: { ...s.user, settings: { ...s.user.settings, ...settings } } }
        : s
    ),

  session: { ...defaultSession },

  startTracking: () =>
    set({
      session: {
        ...defaultSession,
        status: 'tracking',
        startTime: Date.now(),
      }
    }),

  pauseTracking: () =>
    set((s) => ({
      session: { ...s.session, status: 'paused', pausedAt: Date.now() }
    })),

  resumeTracking: () =>
    set((s) => ({
      session: {
        ...s.session,
        status: 'tracking',
        totalPausedMs:
          s.session.totalPausedMs + (Date.now() - (s.session.pausedAt ?? Date.now())),
        pausedAt: null,
      }
    })),

  addPoint: (point) => {
    const { session, user } = get()
    if (session.status !== 'tracking') return

    const settings = user?.settings ?? { gpsInterval: 10, accuracyThreshold: 30, lowBatteryMode: false }
    const interval = settings.lowBatteryMode ? 30 : settings.gpsInterval
    const prev = session.points[session.points.length - 1] ?? null

    if (!shouldRecord(prev, point, interval, settings.accuracyThreshold)) return

    const newPoints = [...session.points, point]
    const dist = totalDistance(newPoints)
    const elapsed =
      (Date.now() - (session.startTime ?? Date.now()) - session.totalPausedMs) / 1000

    const newSession: TrackingSession = {
      ...session,
      points: newPoints,
      distance: dist,
      maxElevation: maxElevation(newPoints),
      elevationGain: elevationGain(newPoints),
      avgSpeed: avgSpeed(dist, elapsed),
      currentPoint: point,
    }
    set({ session: newSession })

    // 50포인트마다 IndexedDB 백업
    if (newPoints.length % 50 === 0) {
      saveSessionPoints(SESSION_ID, newPoints)
    }
  },

  stopTracking: () => {
    const { session } = get()
    const finished: TrackingSession = { ...session, status: 'finished' }
    set({ session: finished })
    return finished
  },

  resetSession: () => set({ session: { ...defaultSession } }),

  isOnline: navigator.onLine,
  setOnline: (v) => set({ isOnline: v }),
}))
