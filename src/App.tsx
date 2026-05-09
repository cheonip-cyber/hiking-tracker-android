import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/appStore'
import { useAuth } from './hooks/useAuth'
import { FIREBASE_ENABLED } from './services/firebase'
import { syncPendingHikes } from './services/hikeService'
import LoginScreen      from './components/ui/LoginScreen'
import MainScreen       from './components/map/MainScreen'
import TrackingScreen   from './components/tracking/TrackingScreen'
import SaveScreen       from './components/tracking/SaveScreen'
import HistoryScreen    from './components/history/HistoryScreen'
import HikeDetailScreen from './components/history/HikeDetailScreen'

function AppRoutes() {
  const { user } = useAppStore()
  useAuth()

  // v1: 로컬 사용자 자동 설정이므로 로그인 화면 없이 바로 진입
  // v2: Firebase 미인증 시 로그인 화면 표시
  if (!user) {
    return FIREBASE_ENABLED ? <LoginScreen /> : null
  }

  return (
    <Routes>
      <Route path="/"            element={<MainScreen />} />
      <Route path="/tracking"    element={<TrackingScreen />} />
      <Route path="/save"        element={<SaveScreen />} />
      <Route path="/history"     element={<HistoryScreen />} />
      <Route path="/history/:id" element={<HikeDetailScreen />} />
      <Route path="*"            element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const { setOnline, isOnline } = useAppStore()

  // 네트워크 감지 + 오프라인 대기열 동기화
  useEffect(() => {
    const handleOnline  = () => { setOnline(true); syncPendingHikes() }
    const handleOffline = () => setOnline(false)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline])

  return (
    <BrowserRouter>

      {/* 오프라인 배너 */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-safe pointer-events-none">
          <div className="mx-4 mt-2 px-4 py-1.5 rounded-full text-xs text-amber-300 font-medium"
            style={{ background: 'rgba(180,100,0,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(251,191,36,0.3)' }}>
            ⚡ 오프라인 · 기록은 로컬에 저장됩니다
          </div>
        </div>
      )}
      <AppRoutes />
    </BrowserRouter>
  )
}
