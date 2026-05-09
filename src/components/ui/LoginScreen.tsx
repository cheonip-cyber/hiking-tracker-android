import { Mountain, MapPin, BarChart2, Route } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function LoginScreen() {
  const { login } = useAuth()

  const features = [
    { icon: <MapPin className="w-4 h-4 text-orange-400" />,    text: 'GPS 실시간 위치 추적' },
    { icon: <Route className="w-4 h-4 text-orange-400" />,     text: '등산로 기반 루트 자동 표기' },
    { icon: <BarChart2 className="w-4 h-4 text-orange-400" />, text: '거리 · 고도 · 속도 분석' },
    { icon: <Mountain className="w-4 h-4 text-orange-400" />,  text: '나만의 등산 기록 히스토리' },
  ]

  return (
    <div className="min-h-screen bg-mesh flex flex-col items-center justify-between px-5 py-safe overflow-hidden">

      {/* 배경 장식 원 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.4) 0%, transparent 70%)' }} />

      {/* 상단 로고 */}
      <div className="flex-1 flex flex-col items-center justify-center pt-12">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #b84208, #7c2d06)',
              boxShadow: '0 20px 60px rgba(220,100,10,0.30), 0 0 0 1px rgba(220,100,10,0.25)'
            }}>
            <Mountain className="w-12 h-12 text-white" />
          </div>
          {/* 빛나는 효과 */}
          <div className="absolute -inset-3 rounded-[2.5rem] opacity-30 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.4) 0%, transparent 70%)' }} />
        </div>

        <h1 className="text-3xl font-bold text-gradient mb-2 tracking-tight">등산 트래커</h1>
        <p className="text-orange-400/50 text-sm mb-10">나만의 등산 기록을 시작하세요</p>

        {/* 기능 소개 */}
        <div className="w-full max-w-sm space-y-2.5 mb-10">
          {features.map((f, i) => (
            <div key={i} className="glass-hi rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(200,80,10,0.15)' }}>
                {f.icon}
              </div>
              <span className="text-white/80 text-sm">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 로그인 버튼 */}
      <div className="w-full max-w-sm pb-4">
        <button
          onClick={login}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-semibold text-gray-800 active:scale-95 transition-transform shadow-xl"
          style={{
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google로 시작하기
        </button>

        <p className="text-orange-400/25 text-xs text-center mt-4">
          로그인 시 이용약관 및 개인정보처리방침에 동의합니다
        </p>
      </div>
    </div>
  )
}
