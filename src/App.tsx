import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/appStore'
import { useAuth } from './hooks/useAuth'
import { syncPendingHikes } from './services/hikeService'
import LoginScreen    from './components/ui/LoginScreen'
import MainScreen     from './components/map/MainScreen'
import TrackingScreen from './components/tracking/TrackingScreen'
import SaveScreen     from './components/tracking/SaveScreen'
import HistoryScreen  from './components/history/HistoryScreen'
import HikeDetailScreen from './components/history/HikeDetailScreen'

function AppRoutes() {
  const { user } = useAppStore()
  useAuth()

  if (!user) return <LoginScreen />

  return (
    <Routes>
      <Route path="/"             element={<MainScreen />} />
      <Route path="/tracking"     element={<TrackingScreen />} />
      <Route path="/save"         element={<SaveScreen />} />
      <Route path="/history"      element={<HistoryScreen />} />
      <Route path="/history/:id"  element={<HikeDetailScreen />} />
      <Route path="*"             element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  const { setOnline, isOnline } = useAppStore()

  // 네트워크 감지 + 오프라인 대기열 동기화
  useEffect(() => {
    const handleOnline  = () => { setOnline(true);  syncPendingHikes() }
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
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center text-xs py-1.5 font-medium">
          오프라인 모드 · 기록은 로컬에 저장됩니다
        </div>
      )}
      <AppRoutes />
    </BrowserRouter>
  )
}
