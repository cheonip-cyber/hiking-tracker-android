import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pause, Play, Square, Zap, ZapOff, Activity } from 'lucide-react'
import MapView from '../map/MapView'
import { useAppStore } from '../../store/appStore'
import { useGpsTracking } from '../../hooks/useGpsTracking'
import { formatDuration } from '../../utils/gps'

export default function TrackingScreen() {
  const navigate = useNavigate()
  const { session, pauseTracking, resumeTracking, stopTracking, updateSettings, user } = useAppStore()
  useGpsTracking()

  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lowBattery = user?.settings?.lowBatteryMode ?? false

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (session.status !== 'tracking' || !session.startTime) return
      setElapsed(Math.floor((Date.now() - session.startTime - session.totalPausedMs) / 1000))
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [session.status, session.startTime, session.totalPausedMs])

  const handleStop = () => { stopTracking(); navigate('/save') }
  const handlePauseResume = () => {
    session.status === 'tracking' ? pauseTracking() : resumeTracking()
  }

  const isTracking = session.status === 'tracking'

  return (
    <div className="relative w-full h-screen bg-mesh overflow-hidden flex flex-col">

      {/* 지도 (상단 55%) */}
      <div className="relative flex-1 min-h-0">
        <MapView className="absolute inset-0 w-full h-full" />

        {/* 상태 배지 */}
        <div className="absolute top-safe left-1/2 -translate-x-1/2 z-10 mt-3">
          <div className={`glass-hi px-4 py-1.5 rounded-full flex items-center gap-2 ${
            isTracking ? 'border-orange-500/30' : 'border-amber-400/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isTracking ? 'bg-orange-400 animate-pulse' : 'bg-amber-400'
            }`} />
            <span className="text-xs font-semibold text-white">
              {isTracking ? '기록 중' : '일시정지'}
            </span>
          </div>
        </div>

        {/* 저전력 토글 */}
        <button
          onClick={() => updateSettings({ lowBatteryMode: !lowBattery })}
          className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-xl glass-hi flex items-center justify-center active:scale-90 transition-transform ${
            lowBattery ? 'border-amber-400/40' : ''
          }`}
        >
          {lowBattery
            ? <ZapOff className="w-4 h-4 text-amber-400" />
            : <Zap className="w-4 h-4 text-orange-300" />
          }
        </button>
      </div>

      {/* 통계 패널 (하단 45%) */}
      <div className="z-10 pb-safe px-4 pt-3" style={{
        background: 'linear-gradient(to top, rgba(5,18,10,0.98) 70%, transparent)',
        minHeight: '42vh'
      }}>

        {/* 메인 타이머 */}
        <div className="text-center mb-3">
          <p className="text-xs text-orange-400/50 font-medium tracking-widest uppercase mb-1">소요 시간</p>
          <p className="font-bold tracking-tight" style={{
            fontSize: 'clamp(2.5rem, 12vw, 3.5rem)',
            background: 'linear-gradient(135deg, #fbbf80, #e8650a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {formatDuration(elapsed)}
          </p>
        </div>

        {/* 핵심 3개 지표 */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <StatCard label="거리" value={session.distance.toFixed(2)} unit="km" accent />
          <StatCard label="현재 고도" value={String(session.currentPoint?.alt?.toFixed(0) ?? 0)} unit="m" />
          <StatCard label="평균 속도" value={session.avgSpeed.toFixed(1)} unit="km/h" />
        </div>

        {/* 보조 2개 지표 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <StatCard label="최고 고도" value={String(session.maxElevation)} unit="m" small />
          <StatCard label="누적 상승" value={String(session.elevationGain)} unit="m" small />
        </div>

        {/* GPS 상태 */}
        {isTracking && (
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <Activity className="w-3 h-3 text-orange-400/60" />
            <p className="text-orange-400/50 text-xs">GPS 수신 중 · 화면을 켜두세요</p>
          </div>
        )}

        {/* 컨트롤 */}
        <div className="flex gap-3">
          <button
            onClick={handlePauseResume}
            className="btn-glass flex-1 h-13 text-sm"
            style={{ height: '3.25rem' }}
          >
            {isTracking
              ? <><Pause className="w-4 h-4 text-orange-400" /><span>일시정지</span></>
              : <><Play  className="w-4 h-4 text-orange-400" /><span>재개</span></>
            }
          </button>
          <button
            onClick={handleStop}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl font-semibold text-white active:scale-95 transition-transform"
            style={{
              height: '3.25rem',
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              boxShadow: '0 4px 20px rgba(220,38,38,0.3)'
            }}
          >
            <Square className="w-4 h-4" />
            <span>종료</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, unit, accent, small }: {
  label: string; value: string; unit: string; accent?: boolean; small?: boolean
}) {
  return (
    <div className="stat-card">
      <span className="text-orange-400/50 text-xs mb-0.5">{label}</span>
      <span className={`font-bold leading-none ${small ? 'text-base' : 'text-xl'} ${accent ? 'text-gradient' : 'text-white'}`}>
        {value}
      </span>
      {unit && <span className="text-orange-400/40 text-xs mt-0.5">{unit}</span>}
    </div>
  )
}
