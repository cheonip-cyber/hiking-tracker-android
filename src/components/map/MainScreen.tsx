import { useNavigate } from 'react-router-dom'
import { Mountain, History, User, Navigation } from 'lucide-react'
import MapView from '../map/MapView'
import { useAppStore } from '../../store/appStore'

export default function MainScreen() {
  const navigate = useNavigate()
  const { user, startTracking } = useAppStore()

  const handleStart = () => {
    startTracking()
    navigate('/tracking')
  }

  return (
    <div className="relative w-full h-screen flex flex-col bg-forest-950 overflow-hidden">
      {/* 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-safe pb-2 bg-gradient-to-b from-forest-950/90 to-transparent">
        <div className="flex items-center gap-2">
          <Mountain className="w-6 h-6 text-forest-400" />
          <span className="text-white font-semibold text-lg tracking-tight">등산 트래커</span>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full overflow-hidden border-2 border-forest-500 flex items-center justify-center bg-forest-800"
        >
          {user?.photoURL
            ? <img src={user.photoURL} alt="프로필" className="w-full h-full object-cover" />
            : <User className="w-5 h-5 text-forest-300" />
          }
        </button>
      </div>

      {/* 지도 */}
      <div className="flex-1 relative">
        <MapView className="absolute inset-0" />

        {/* 현재 위치 버튼 */}
        <button
          onClick={() => {
            navigator.geolocation?.getCurrentPosition((pos) => {
              // MapView 내부에서 처리 - 이벤트로 연결 필요 시 ref 사용
            })
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          <Navigation className="w-5 h-5 text-forest-700" />
        </button>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="relative z-20 bg-gradient-to-t from-forest-950 to-transparent pt-8 pb-safe px-6">
        <div className="flex items-center gap-4 mb-6">
          {/* 히스토리 */}
          <button
            onClick={() => navigate('/history')}
            className="flex-1 h-14 rounded-2xl bg-forest-800/80 border border-forest-700 flex items-center justify-center gap-2 text-forest-200 font-medium active:scale-95 transition-transform"
          >
            <History className="w-5 h-5" />
            <span>기록</span>
          </button>

          {/* 시작 버튼 */}
          <button
            onClick={handleStart}
            className="flex-[2] h-14 rounded-2xl bg-forest-500 flex items-center justify-center gap-2 text-white font-bold text-lg shadow-lg shadow-forest-900/50 active:scale-95 transition-transform"
          >
            <Mountain className="w-6 h-6" />
            <span>등산 시작</span>
          </button>
        </div>
      </div>
    </div>
  )
}
