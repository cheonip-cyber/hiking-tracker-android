import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Check, Trash2, Mountain, MapPin, BarChart2 } from 'lucide-react'
import { FIREBASE_ENABLED, db } from '../../services/firebase'
import { updateRoute, updateMemo, deleteHike } from '../../services/hikeService'
import { formatDate, formatDuration } from '../../utils/gps'
import type { HikeRecord } from '../../types'

export default function HikeDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [hike, setHike]                 = useState<HikeRecord | null>(null)
  const [editingRoute, setEditingRoute] = useState(false)
  const [editingMemo, setEditingMemo]   = useState(false)
  const [routeVal, setRouteVal]         = useState('')
  const [memoVal, setMemoVal]           = useState('')
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        if (!FIREBASE_ENABLED || !db) {
          const { getLocalHike } = await import('../../services/idb')
          const data = await getLocalHike(id)
          if (data) { setHike(data); setRouteVal(data.routeEdited || data.routeAuto); setMemoVal(data.memo) }
          return
        }
        const { doc: fsDoc, getDoc } = await import('firebase/firestore')
        const snap = await getDoc(fsDoc(db, 'hikes', id))
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as HikeRecord
          setHike(data); setRouteVal(data.routeEdited || data.routeAuto); setMemoVal(data.memo)
        }
      } finally { setLoading(false) }
    })()
  }, [id])

  const handleSaveRoute = async () => {
    if (!id) return
    await updateRoute(id, routeVal)
    setHike(h => h ? { ...h, routeEdited: routeVal } : h)
    setEditingRoute(false)
  }
  const handleSaveMemo = async () => {
    if (!id) return
    await updateMemo(id, memoVal)
    setHike(h => h ? { ...h, memo: memoVal } : h)
    setEditingMemo(false)
  }
  const handleDelete = async () => {
    if (!id || !confirm('이 기록을 삭제할까요?')) return
    await deleteHike(id)
    navigate('/history', { replace: true })
  }

  if (loading) return (
    <div className="min-h-screen bg-mesh flex items-center justify-center text-green-400/40 text-sm">불러오는 중...</div>
  )
  if (!hike) return (
    <div className="min-h-screen bg-mesh flex items-center justify-center text-green-400/40 text-sm">기록을 찾을 수 없습니다</div>
  )

  const displayRoute = hike.routeEdited || hike.routeAuto
  const stats = [
    { label: '총 거리',    value: `${hike.distance.toFixed(2)} km` },
    { label: '소요 시간',  value: formatDuration(hike.duration) },
    { label: '최고 고도',  value: `${hike.maxElevation} m` },
    { label: '누적 상승',  value: `${hike.elevationGain} m` },
    { label: '평균 속도',  value: `${hike.avgSpeed?.toFixed(1) ?? '-'} km/h` },
    { label: '시간',      value: `${hike.startTime} → ${hike.endTime}` },
  ]

  return (
    <div className="min-h-screen bg-mesh text-white flex flex-col">

      {/* 헤더 */}
      <div className="pt-safe px-4 pb-3">
        <div className="flex items-center justify-between mt-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 glass-hi rounded-xl flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft className="w-4 h-4 text-green-300" />
          </button>
          <div className="text-center">
            <p className="text-gradient font-bold text-base">{formatDate(hike.date)}</p>
          </div>
          <button onClick={handleDelete}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.25)' }}>
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-safe px-4 space-y-3">

        {/* 루트 */}
        <Section
          icon={<MapPin className="w-3.5 h-3.5 text-green-400" />}
          title="이동 루트"
          action={
            editingRoute
              ? <button onClick={handleSaveRoute} className="flex items-center gap-1 text-green-400 text-xs"><Check className="w-3 h-3" />저장</button>
              : <button onClick={() => setEditingRoute(true)} className="flex items-center gap-1 text-green-400/50 text-xs"><Edit2 className="w-3 h-3" />편집</button>
          }
        >
          {editingRoute ? (
            <textarea value={routeVal} onChange={e => setRouteVal(e.target.value)}
              className="input-glass w-full rounded-xl px-3 py-2 text-sm resize-none" rows={2} />
          ) : (
            <p className="text-white/80 text-sm leading-relaxed">
              {displayRoute || <span className="text-green-400/30">루트 미입력</span>}
            </p>
          )}
        </Section>

        {/* 통계 */}
        <Section icon={<BarChart2 className="w-3.5 h-3.5 text-green-400" />} title="통계">
          <div className="grid grid-cols-2 gap-2">
            {stats.map(s => (
              <div key={s.label} className="stat-card py-2.5">
                <span className="text-green-400/40 text-xs">{s.label}</span>
                <span className="text-white font-semibold text-sm mt-0.5">{s.value}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* 메모 */}
        <Section
          icon={<Mountain className="w-3.5 h-3.5 text-green-400" />}
          title="메모"
          action={
            editingMemo
              ? <button onClick={handleSaveMemo} className="flex items-center gap-1 text-green-400 text-xs"><Check className="w-3 h-3" />저장</button>
              : <button onClick={() => setEditingMemo(true)} className="flex items-center gap-1 text-green-400/50 text-xs"><Edit2 className="w-3 h-3" />편집</button>
          }
        >
          {editingMemo ? (
            <textarea value={memoVal} onChange={e => setMemoVal(e.target.value)}
              className="input-glass w-full rounded-xl px-3 py-2 text-sm resize-none" rows={3} />
          ) : (
            <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
              {hike.memo || <span className="text-green-400/30">메모 없음</span>}
            </p>
          )}
        </Section>
      </div>
    </div>
  )
}

function Section({ icon, title, action, children }: {
  icon?: React.ReactNode; title: string; action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {icon}
          <p className="text-green-400/50 text-xs font-semibold uppercase tracking-widest">{title}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
