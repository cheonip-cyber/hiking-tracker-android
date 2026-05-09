import { useNavigate } from 'react-router-dom'
import { Mountain, History, Navigation, User } from 'lucide-react'
import MapView from '../map/MapView'
import { useAppStore } from '../../store/appStore'
import { FIREBASE_ENABLED } from '../../services/firebase'

export default function MainScreen() {
  const navigate = useNavigate()
  const { user, startTracking } = useAppStore()

  const handleStart = () => {
    startTracking()
    navigate('/tracking')
  }

  return (
    <div className="relative w-full h-screen bg-mesh overflow-hidden">

      {/* 배경 지도 (전체 화면) */}
      <div className="absolute inset-0">
        <MapView className="w-full h-full" />
      </div>

      {/* 상단 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-safe px-4 pb-3">
        <div className="glass-hi rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
              <Mountain className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-gradient font-bold text-base leading-tight">등산 트래커</p>
              <p className="text-green-400/60 text-xs">
                {FIREBASE_ENABLED ? '클라우드 연동' : '로컬 저장 모드'}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full overflow-hidden border-2 flex items-center justify-center transition-transform active:scale-90"
            style={{ borderColor: 'var(--glass-border-hi)' }}
          >
            {user?.photoURL
              ? <img src={user.photoURL} alt="프로필" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-green-900/60 flex items-center justify-center">
                  <User className="w-4 h-4 text-green-300" />
                </div>
            }
          </button>
        </div>
      </div>

      {/* 현재 위치 버튼 */}
      <button
        className="absolute right-4 z-20 glass-hi w-11 h-11 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
        onClick={() => {
          navigator.geolocation?.getCurrentPosition((pos) => {
            // MapView 내부에서 처리
          })
        }}
      >
        <Navigation className="w-5 h-5 text-green-300" />
      </button>

      {/* 하단 액션 패널 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe px-4 pt-2">
        <div className="glass rounded-3xl p-4 mb-2">

          {/* 오늘 날짜 */}
          <p className="text-green-400/50 text-xs text-center mb-3 font-medium tracking-widest uppercase">
            {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>

          {/* 버튼 그룹 */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/history')}
              className="btn-glass flex-1 h-14 text-sm"
            >
              <History className="w-4 h-4 text-green-400" />
              <span>기록</span>
            </button>

            <button
              onClick={handleStart}
              className="btn-primary flex-[2] h-14 text-base"
            >
              <Mountain className="w-5 h-5" />
              <span className="font-bold">등산 시작</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
