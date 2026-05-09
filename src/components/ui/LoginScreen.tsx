import { Mountain } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function LoginScreen() {
  const { login } = useAuth()

  return (
    <div className="min-h-screen bg-forest-950 flex flex-col items-center justify-center px-6">
      {/* 로고 */}
      <div className="flex flex-col items-center mb-12">
        <div className="w-20 h-20 rounded-3xl bg-forest-800 flex items-center justify-center mb-4 shadow-xl">
          <Mountain className="w-10 h-10 text-forest-400" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">등산 트래커</h1>
        <p className="text-forest-400 text-sm mt-2">나만의 등산 기록을 시작하세요</p>
      </div>

      {/* 기능 소개 */}
      <div className="w-full space-y-3 mb-10">
        {[
          { emoji: '📍', text: 'GPS 실시간 위치 추적' },
          { emoji: '🗺️', text: '이동 경로 자동 기록' },
          { emoji: '📊', text: '거리 · 고도 · 속도 분석' },
          { emoji: '🔤', text: '등산로 기반 루트 자동 표기' },
        ].map((item) => (
          <div key={item.text} className="flex items-center gap-3 bg-forest-900/60 rounded-2xl px-4 py-3">
            <span className="text-xl">{item.emoji}</span>
            <span className="text-forest-200 text-sm">{item.text}</span>
          </div>
        ))}
      </div>

      {/* Google 로그인 */}
      <button
        onClick={login}
        className="w-full h-14 bg-white rounded-2xl flex items-center justify-center gap-3 font-semibold text-gray-700 shadow-lg active:scale-95 transition-transform"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google로 시작하기
      </button>

      <p className="text-forest-600 text-xs mt-6 text-center">
        로그인 시 이용약관 및 개인정보처리방침에 동의합니다
      </p>
    </div>
  )
}
