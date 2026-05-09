import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Edit2, Loader, ChevronRight } from 'lucide-react'
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

  const now = new Date()
  const date = now.toISOString().split('T')[0]
  const startTime = session.startTime
    ? new Date(session.startTime).toTimeString().slice(0, 5)
    : '--:--'
  const endTime = now.toTimeString().slice(0, 5)

  // 루트 자동 생성
  useEffect(() => {
    if (session.points.length < 2) return
    setIsGenerating(true)
    generateRouteString(session.points)
      .then((route) => {
        setRouteAuto(route)
        setRouteEdited(route)
      })
      .finally(() => setIsGenerating(false))
  }, [])

  const elapsed = session.startTime
    ? Math.floor((Date.now() - session.startTime - session.totalPausedMs) / 1000)
    : 0

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      const hike: HikeRecord = {
        userId:        user.uid,
        date,
        startTime,
        endTime,
        duration:      elapsed,
        distance:      session.distance,
        maxElevation:  session.maxElevation,
        elevationGain: session.elevationGain,
        avgSpeed:      session.avgSpeed,
        routeAuto,
        routeEdited:   routeEdited !== routeAuto ? routeEdited : '',
        memo,
        photos:        [],
        createdAt:     Date.now(),
      }
      await saveHike(hike)
      resetSession()
      navigate('/history', { replace: true })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-forest-950 text-white flex flex-col">
      {/* 헤더 */}
      <div className="px-4 pt-safe pb-4 border-b border-forest-800">
        <h1 className="text-xl font-bold text-center mt-4">등산 완료! 🎉</h1>
        <p className="text-center text-forest-400 text-sm mt-1">{date}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* 결과 요약 */}
        <div className="bg-forest-900 rounded-2xl p-4">
          <h2 className="text-forest-400 text-xs font-semibold uppercase tracking-wider mb-3">결과 요약</h2>
          <div className="grid grid-cols-2 gap-3">
            <ResultRow label="거리" value={`${session.distance.toFixed(2)} km`} />
            <ResultRow label="소요 시간" value={formatDuration(elapsed)} />
            <ResultRow label="최고 고도" value={`${session.maxElevation} m`} />
            <ResultRow label="누적 상승" value={`${session.elevationGain} m`} />
            <ResultRow label="평균 속도" value={`${session.avgSpeed.toFixed(1)} km/h`} />
            <ResultRow label="시작 → 종료" value={`${startTime} → ${endTime}`} />
          </div>
        </div>

        {/* 루트 */}
        <div className="bg-forest-900 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-forest-400 text-xs font-semibold uppercase tracking-wider">이동 루트</h2>
            <button
              onClick={() => setEditingRoute(!editingRoute)}
              className="flex items-center gap-1 text-forest-400 text-xs active:text-forest-200"
            >
              <Edit2 className="w-3 h-3" />
              {editingRoute ? '완료' : '편집'}
            </button>
          </div>

          {isGenerating ? (
            <div className="flex items-center gap-2 text-forest-400 text-sm">
              <Loader className="w-4 h-4 animate-spin" />
              <span>루트 자동 생성 중...</span>
            </div>
          ) : editingRoute ? (
            <textarea
              value={routeEdited}
              onChange={(e) => setRouteEdited(e.target.value)}
              placeholder="예: 수락산역 → 은골계곡 → 정상"
              className="w-full bg-forest-800 rounded-xl px-3 py-2 text-white text-sm resize-none outline-none focus:ring-1 focus:ring-forest-500"
              rows={2}
            />
          ) : (
            <p className="text-white text-sm leading-relaxed">
              {routeEdited || routeAuto || (
                <span className="text-forest-500">루트를 편집 버튼으로 직접 입력해주세요</span>
              )}
            </p>
          )}
        </div>

        {/* 메모 */}
        <div className="bg-forest-900 rounded-2xl p-4">
          <h2 className="text-forest-400 text-xs font-semibold uppercase tracking-wider mb-2">메모</h2>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="오늘 산행 메모를 남겨보세요"
            className="w-full bg-forest-800 rounded-xl px-3 py-2 text-white text-sm resize-none outline-none focus:ring-1 focus:ring-forest-500"
            rows={3}
          />
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="px-4 pb-safe pt-3 border-t border-forest-800">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-14 rounded-2xl bg-forest-500 flex items-center justify-center gap-2 text-white font-bold text-base disabled:opacity-60 active:scale-95 transition-transform"
        >
          {isSaving
            ? <><Loader className="w-5 h-5 animate-spin" /><span>저장 중...</span></>
            : <><CheckCircle className="w-5 h-5" /><span>저장하기</span></>
          }
        </button>
      </div>
    </div>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-forest-500 text-xs">{label}</span>
      <span className="text-white font-semibold text-sm">{value}</span>
    </div>
  )
}
