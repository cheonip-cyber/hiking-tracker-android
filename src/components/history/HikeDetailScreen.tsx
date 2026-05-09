import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Check, Trash2, Mountain } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { updateRoute, updateMemo, deleteHike } from '../../services/hikeService'
import { formatDate, formatDuration } from '../../utils/gps'
import type { HikeRecord } from '../../types'

export default function HikeDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [hike, setHike]               = useState<HikeRecord | null>(null)
  const [editingRoute, setEditingRoute] = useState(false)
  const [editingMemo, setEditingMemo]   = useState(false)
  const [routeVal, setRouteVal]         = useState('')
  const [memoVal, setMemoVal]           = useState('')
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    if (!id) return
    getDoc(doc(db, 'hikes', id))
      .then((snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as HikeRecord
          setHike(data)
          setRouteVal(data.routeEdited || data.routeAuto)
          setMemoVal(data.memo)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleSaveRoute = async () => {
    if (!id) return
    await updateRoute(id, routeVal)
    setHike((h) => h ? { ...h, routeEdited: routeVal } : h)
    setEditingRoute(false)
  }

  const handleSaveMemo = async () => {
    if (!id) return
    await updateMemo(id, memoVal)
    setHike((h) => h ? { ...h, memo: memoVal } : h)
    setEditingMemo(false)
  }

  const handleDelete = async () => {
    if (!id || !confirm('이 기록을 삭제할까요?')) return
    await deleteHike(id)
    navigate('/history', { replace: true })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-forest-950 flex items-center justify-center text-forest-400">
        불러오는 중...
      </div>
    )
  }

  if (!hike) {
    return (
      <div className="min-h-screen bg-forest-950 flex items-center justify-center text-forest-400">
        기록을 찾을 수 없습니다.
      </div>
    )
  }

  const displayRoute = hike.routeEdited || hike.routeAuto

  return (
    <div className="min-h-screen bg-forest-950 text-white flex flex-col">
      {/* 헤더 */}
      <div className="px-4 pt-safe pb-4 border-b border-forest-800 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 mt-4">
          <ArrowLeft className="w-5 h-5 text-forest-400" />
        </button>
        <h1 className="text-lg font-bold mt-4">{formatDate(hike.date)}</h1>
        <button onClick={handleDelete} className="p-1 -mr-1 mt-4">
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-safe px-4 py-4 space-y-4">

        {/* 루트 */}
        <Section
          title="이동 루트"
          action={
            editingRoute
              ? <button onClick={handleSaveRoute} className="flex items-center gap-1 text-forest-400 text-xs"><Check className="w-3 h-3" />저장</button>
              : <button onClick={() => setEditingRoute(true)} className="flex items-center gap-1 text-forest-400 text-xs"><Edit2 className="w-3 h-3" />편집</button>
          }
        >
          {editingRoute ? (
            <textarea
              value={routeVal}
              onChange={(e) => setRouteVal(e.target.value)}
              className="w-full bg-forest-800 rounded-xl px-3 py-2 text-white text-sm resize-none outline-none focus:ring-1 focus:ring-forest-500"
              rows={2}
            />
          ) : (
            <p className="text-white text-sm leading-relaxed flex items-center gap-2">
              <Mountain className="w-4 h-4 text-forest-400 flex-shrink-0" />
              {displayRoute || <span className="text-forest-500">루트 미입력</span>}
            </p>
          )}
        </Section>

        {/* 통계 */}
        <Section title="통계">
          <div className="grid grid-cols-2 gap-3">
            <StatItem label="총 거리" value={`${hike.distance.toFixed(2)} km`} />
            <StatItem label="소요 시간" value={formatDuration(hike.duration)} />
            <StatItem label="최고 고도" value={`${hike.maxElevation} m`} />
            <StatItem label="누적 상승" value={`${hike.elevationGain} m`} />
            <StatItem label="평균 속도" value={`${hike.avgSpeed?.toFixed(1) ?? '-'} km/h`} />
            <StatItem label="시작 → 종료" value={`${hike.startTime} → ${hike.endTime}`} />
          </div>
        </Section>

        {/* 메모 */}
        <Section
          title="메모"
          action={
            editingMemo
              ? <button onClick={handleSaveMemo} className="flex items-center gap-1 text-forest-400 text-xs"><Check className="w-3 h-3" />저장</button>
              : <button onClick={() => setEditingMemo(true)} className="flex items-center gap-1 text-forest-400 text-xs"><Edit2 className="w-3 h-3" />편집</button>
          }
        >
          {editingMemo ? (
            <textarea
              value={memoVal}
              onChange={(e) => setMemoVal(e.target.value)}
              className="w-full bg-forest-800 rounded-xl px-3 py-2 text-white text-sm resize-none outline-none focus:ring-1 focus:ring-forest-500"
              rows={3}
            />
          ) : (
            <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
              {hike.memo || <span className="text-forest-500">메모 없음</span>}
            </p>
          )}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, action, children }: {
  title: string; action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="bg-forest-900 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-forest-400 text-xs font-semibold uppercase tracking-wider">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-forest-500 text-xs block">{label}</span>
      <span className="text-white font-semibold text-sm">{value}</span>
    </div>
  )
}
