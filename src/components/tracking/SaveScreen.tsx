import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Edit2, Loader, Mountain, MapPin } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { saveHike } from '../../services/hikeService'
import { generateRouteString } from '../../services/routeGenerator'
import { formatDuration } from '../../utils/gps'
import type { HikeRecord } from '../../types'

export default function SaveScreen() {
  const navigate = useNavigate()
  const { session, user, resetSession } = useAppStore()

  const [routeAuto, setRouteAuto]       = useState('')
  const [routeEdited, setRouteEdited]   = useState('')
  const [editingRoute, setEditingRoute] = useState(false)
  const [memo, setMemo]                 = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving]         = useState(false)

  const now       = new Date()
  const date      = now.toISOString().split('T')[0]
  const startTime = session.startTime ? new Date(session.startTime).toTimeString().slice(0, 5) : '--:--'
  const endTime   = now.toTimeString().slice(0, 5)
  const elapsed   = session.startTime
    ? Math.floor((Date.now() - session.startTime - session.totalPausedMs) / 1000) : 0

  useEffect(() => {
    if (session.points.length < 2) return
    setIsGenerating(true)
    generateRouteString(session.points).then((r) => {
      setRouteAuto(r); setRouteEdited(r)
    }).finally(() => setIsGenerating(false))
  }, [])

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      const hike: HikeRecord = {
        userId: user.uid, date, startTime, endTime,
        duration: elapsed, distance: session.distance,
        maxElevation: session.maxElevation, elevationGain: session.elevationGain,
        avgSpeed: session.avgSpeed, routeAuto,
        routeEdited: routeEdited !== routeAuto ? routeEdited : '',
        memo, photos: [], createdAt: Date.now(),
      }
      await saveHike(hike)
      resetSession()
      navigate('/history', { replace: true })
    } finally { setIsSaving(false) }
  }

  const stats = [
    { label: '거리',    value: `${session.distance.toFixed(2)} km` },
    { label: '소요 시간', value: formatDuration(elapsed) },
    { label: '최고 고도', value: `${session.maxElevation} m` },
    { label: '누적 상승', value: `${session.elevationGain} m` },
    { label: '평균 속도', value: `${session.avgSpeed.toFixed(1)} km/h` },
    { label: '시간',    value: `${startTime} → ${endTime}` },
  ]

  return (
    <div className="min-h-screen bg-mesh text-white flex flex-col">

      {/* 헤더 */}
      <div className="pt-safe px-4 pb-4">
        <div className="glass-hi rounded-3xl p-5 mt-2 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-3 shadow-lg"
            style={{ boxShadow: '0 8px 24px rgba(74,222,128,0.3)' }}>
            <Mountain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gradient mb-1">등산 완료!</h1>
          <p className="text-green-400/50 text-sm">{date}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">

        {/* 결과 요약 */}
        <div className="glass rounded-3xl p-4">
          <p className="text-green-400/50 text-xs font-semibold uppercase tracking-widest mb-3">결과 요약</p>
          <div className="grid grid-cols-2 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="stat-card py-2.5">
                <span className="text-green-400/40 text-xs">{s.label}</span>
                <span className="text-white font-semibold text-sm mt-0.5">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 루트 */}
        <div className="glass rounded-3xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-green-400" />
              <p className="text-green-400/50 text-xs font-semibold uppercase tracking-widest">이동 루트</p>
            </div>
            <button
              onClick={() => setEditingRoute(!editingRoute)}
              className="flex items-center gap-1 text-green-400/60 text-xs active:text-green-300 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              {editingRoute ? '완료' : '편집'}
            </button>
          </div>

          {isGenerating ? (
            <div className="flex items-center gap-2 text-green-400/50 text-sm py-1">
              <Loader className="w-4 h-4 animate-spin" />
              <span>루트 자동 생성 중...</span>
            </div>
          ) : editingRoute ? (
            <textarea
              value={routeEdited}
              onChange={(e) => setRouteEdited(e.target.value)}
              placeholder="예: 수락산역 → 은골계곡 → 정상"
              className="input-glass w-full rounded-xl px-3 py-2 text-sm resize-none"
              rows={2}
            />
          ) : (
            <p className="text-white/80 text-sm leading-relaxed">
              {routeEdited || routeAuto || (
                <span className="text-green-400/30">편집 버튼으로 직접 입력해주세요</span>
              )}
            </p>
          )}
        </div>

        {/* 메모 */}
        <div className="glass rounded-3xl p-4">
          <p className="text-green-400/50 text-xs font-semibold uppercase tracking-widest mb-2.5">메모</p>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="오늘 산행 메모를 남겨보세요"
            className="input-glass w-full rounded-xl px-3 py-2 text-sm resize-none"
            rows={3}
          />
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="px-4 pb-safe pt-3 border-t divider-glass">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary w-full h-14 text-base disabled:opacity-50"
        >
          {isSaving
            ? <><Loader className="w-5 h-5 animate-spin" /><span>저장 중...</span></>
            : <><CheckCircle className="w-5 h-5" /><span className="font-bold">저장하기</span></>
          }
        </button>
      </div>
    </div>
  )
}
