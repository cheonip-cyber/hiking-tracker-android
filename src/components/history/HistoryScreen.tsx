import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mountain, ChevronRight, Search, ArrowLeft, TrendingUp, Clock, Route, Home } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { getHikes } from '../../services/hikeService'
import { formatDate, formatDuration } from '../../utils/gps'
import type { HikeRecord } from '../../types'

export default function HistoryScreen() {
  const navigate = useNavigate()
  const { user } = useAppStore()

  const [hikes, setHikes]     = useState<HikeRecord[]>([])
  const [query, setQuery]     = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getHikes(user.uid).then(setHikes).finally(() => setLoading(false))
  }, [user])

  const filtered = hikes.filter((h) => {
    const route = h.routeEdited || h.routeAuto
    return route.includes(query) || h.date.includes(query) || h.memo.includes(query)
  })

  // 요약 통계
  const totalDist = hikes.reduce((s, h) => s + h.distance, 0)
  const totalTime = hikes.reduce((s, h) => s + h.duration, 0)

  return (
    <div className="min-h-screen bg-mesh text-white flex flex-col">

      {/* 헤더 */}
      <div className="pt-safe px-4 pb-3">
        <div className="flex items-center gap-3 mt-3 mb-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 glass-hi rounded-xl flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft className="w-4 h-4 text-orange-300" />
          </button>
          <h1 className="text-xl font-bold text-gradient flex-1">등산 기록</h1>
          <span className="text-orange-400/40 text-sm">{hikes.length}회</span>
          <button onClick={() => navigate('/')}
            className="w-9 h-9 glass-hi rounded-xl flex items-center justify-center active:scale-90 transition-transform">
            <Home className="w-4 h-4 text-orange-300" />
          </button>
        </div>

        {/* 요약 통계 */}
        {hikes.length > 0 && (
          <div className="glass rounded-2xl p-3 grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Route className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-orange-400/40 text-xs">총 거리</p>
                <p className="text-white font-semibold text-sm">{totalDist.toFixed(1)} km</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-orange-400/40 text-xs">총 시간</p>
                <p className="text-white font-semibold text-sm">{formatDuration(totalTime)}</p>
              </div>
            </div>
          </div>
        )}

        {/* 검색 */}
        <div className="glass-hi rounded-2xl flex items-center gap-2 px-3 py-2.5">
          <Search className="w-4 h-4 text-orange-400/50 flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="루트, 날짜, 메모 검색"
            className="flex-1 bg-transparent text-white text-sm placeholder-green-400/30 outline-none"
          />
        </div>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto pb-safe px-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-orange-400/40 text-sm">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-16 h-16 glass rounded-3xl flex items-center justify-center">
              <Mountain className="w-8 h-8 text-orange-400/30" />
            </div>
            <p className="text-orange-400/40 text-sm">
              {query ? '검색 결과가 없습니다' : '아직 등산 기록이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {filtered.map((hike) => (
              <HikeCard key={hike.id} hike={hike} onClick={() => navigate(`/history/${hike.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function HikeCard({ hike, onClick }: { hike: HikeRecord; onClick: () => void }) {
  const route = hike.routeEdited || hike.routeAuto

  return (
    <button
      onClick={onClick}
      className="glass w-full rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform text-left"
    >
      {/* 아이콘 */}
      <div className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center"
        style={{ background: 'rgba(200,80,10,0.15)', border: '1px solid rgba(220,100,10,0.25)' }}>
        <Mountain className="w-6 h-6 text-orange-400" />
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm truncate mb-0.5">
          {route || <span className="text-orange-400/30">루트 미입력</span>}
        </p>
        <p className="text-orange-400/40 text-xs mb-1.5">{formatDate(hike.date)}</p>
        <div className="flex items-center gap-2">
          <span className="text-orange-300/70 text-xs font-medium">{hike.distance.toFixed(1)} km</span>
          <span className="w-1 h-1 rounded-full bg-orange-400/20" />
          <span className="text-orange-300/70 text-xs">{formatDuration(hike.duration)}</span>
          <span className="w-1 h-1 rounded-full bg-orange-400/20" />
          <span className="text-orange-300/70 text-xs flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" />{hike.maxElevation}m
          </span>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-orange-400/30 flex-shrink-0" />
    </button>
  )
}
