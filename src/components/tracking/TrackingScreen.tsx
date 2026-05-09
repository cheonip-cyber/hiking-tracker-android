import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pause, Play, Square, Zap, ZapOff } from 'lucide-react'
import MapView from '../map/MapView'
import { useAppStore } from '../../store/appStore'
import { useGpsTracking } from '../../hooks/useGpsTracking'
import { formatDuration } from '../../utils/gps'

export default function TrackingScreen() {
  const navigate = useNavigate()
  const { session, pauseTracking, resumeTracking, stopTracking, updateSettings, user } = useAppStore()
  const { } = useGpsTracking()

  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lowBattery = user?.settings?.lowBatteryMode ?? false

  // 타이머
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (session.status !== 'tracking' || !session.startTime) return
      const raw = Date.now() - session.startTime - session.totalPausedMs
      setElapsed(Math.floor(raw / 1000))
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [session.status, session.startTime, session.totalPausedMs])

  const handleStop = () => {
    stopTracking()
    navigate('/save')
  }

  const handlePauseResume = () => {
    if (session.status === 'tracking') pauseTracking()
    else resumeTracking()
  }

  return (
    <div className="relative w-full h-screen flex flex-col bg-forest-950 overflow-hidden">

      {/* 지도 (상단 60%) */}
      <div className="relative" style={{ height: '58vh' }}>
        <MapView className="absolute inset-0" />

        {/* 상태 배지 */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 ${
            session.status === 'tracking'
              ? 'bg-forest-500 text-white'
              : 'bg-amber-500 text-white'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              session.status === 'tracking' ? 'bg-white animate-pulse' : 'bg-white'
            }`} />
            {session.status === 'tracking' ? '기록 중' : '일시정지'}
          </span>
        </div>

        {/* 저전력 모드 토글 */}
        <button
          onClick={() => updateSettings({ lowBatteryMode: !lowBattery })}
          className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
            lowBattery ? 'bg-amber-500' : 'bg-white/90'
          }`}
          title={lowBattery ? '저전력 모드 ON' : '저전력 모드 OFF'}
        >
          {lowBattery
            ? <ZapOff className="w-4 h-4 text-white" />
            : <Zap className="w-4 h-4 text-forest-700" />
          }
        </button>
      </div>

      {/* 통계 패널 (하단 42%) */}
      <div className="flex-1 bg-forest-950 px-4 pt-4 pb-safe flex flex-col">

        {/* 핵심 지표 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard label="거리" value={`${session.distance.toFixed(2)}`} unit="km" />
          <StatCard label="시간" value={formatDuration(elapsed)} unit="" large />
          <StatCard label="고도" value={`${session.currentPoint?.alt?.toFixed(0) ?? 0}`} unit="m" />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="최고 고도" value={`${session.maxElevation}`} unit="m" small />
          <StatCard label="상승" value={`${session.elevationGain}`} unit="m" small />
          <StatCard label="평균 속도" value={`${session.avgSpeed.toFixed(1)}`} unit="km/h" small />
        </div>

        {/* Wake Lock 안내 */}
        {session.status === 'tracking' && (
          <p className="text-center text-forest-500 text-xs mb-4">
            GPS 정확도를 위해 화면을 켜두세요
          </p>
        )}

        {/* 컨트롤 버튼 */}
        <div className="flex items-center gap-4 mt-auto">
          <button
            onClick={handlePauseResume}
            className="flex-1 h-14 rounded-2xl bg-forest-800 border border-forest-700 flex items-center justify-center gap-2 text-forest-200 font-semibold active:scale-95 transition-transform"
          >
            {session.status === 'tracking'
              ? <><Pause className="w-5 h-5" /><span>일시정지</span></>
              : <><Play className="w-5 h-5" /><span>재개</span></>
            }
          </button>
          <button
            onClick={handleStop}
            className="flex-1 h-14 rounded-2xl bg-red-600 flex items-center justify-center gap-2 text-white font-bold active:scale-95 transition-transform"
          >
            <Square className="w-5 h-5" />
            <span>종료</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label, value, unit, large, small
}: {
  label: string, value: string, unit: string, large?: boolean, small?: boolean
}) {
  return (
    <div className="bg-forest-900 rounded-2xl p-3 flex flex-col items-center justify-center">
      <span className="text-forest-400 text-xs mb-1">{label}</span>
      <span className={`text-white font-bold leading-none ${large ? 'text-2xl' : small ? 'text-lg' : 'text-xl'}`}>
        {value}
      </span>
      {unit && <span className="text-forest-400 text-xs mt-0.5">{unit}</span>}
    </div>
  )
}
