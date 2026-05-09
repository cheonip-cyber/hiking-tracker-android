import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mountain, ChevronRight, Search, ArrowLeft } from 'lucide-react'
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
    getHikes(user.uid)
      .then(setHikes)
      .finally(() => setLoading(false))
  }, [user])

  const filtered = hikes.filter((h) => {
    const route = h.routeEdited || h.routeAuto
    return (
      route.includes(query) ||
      h.date.includes(query) ||
      h.memo.includes(query)
    )
  })

  return (
    <div className="min-h-screen bg-forest-950 text-white flex flex-col">
      {/* 헤더 */}
      <div className="px-4 pt-safe pb-3 border-b border-forest-800">
        <div className="flex items-center gap-3 mt-4 mb-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5 text-forest-400" />
          </button>
          <h1 className="text-xl font-bold">등산 기록</h1>
        </div>
        {/* 검색 */}
        <div className="flex items-center gap-2 bg-forest-800 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-forest-500 flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="루트, 날짜, 메모 검색"
            className="flex-1 bg-transparent text-white text-sm placeholder-forest-500 outline-none"
          />
        </div>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto pb-safe">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-forest-400">
            불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-forest-500">
            <Mountain className="w-10 h-10 opacity-40" />
            <p className="text-sm">{query ? '검색 결과가 없습니다' : '아직 등산 기록이 없습니다'}</p>
          </div>
        ) : (
          <ul className="divide-y divide-forest-800/50">
            {filtered.map((hike) => (
              <HikeCard
                key={hike.id}
                hike={hike}
                onClick={() => navigate(`/history/${hike.id}`)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function HikeCard({ hike, onClick }: { hike: HikeRecord; onClick: () => void }) {
  const route = hike.routeEdited || hike.routeAuto

  return (
    <li>
      <button
        onClick={onClick}
        className="w-full px-4 py-4 flex items-center gap-3 active:bg-forest-900 transition-colors text-left"
      >
        {/* 아이콘 */}
        <div className="w-12 h-12 rounded-2xl bg-forest-800 flex items-center justify-center flex-shrink-0">
          <Mountain className="w-6 h-6 text-forest-400" />
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">
            {route || '루트 미입력'}
          </p>
          <p className="text-forest-500 text-xs mt-0.5">
            {formatDate(hike.date)}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-forest-300 text-xs">{hike.distance.toFixed(1)} km</span>
            <span className="text-forest-600 text-xs">·</span>
            <span className="text-forest-300 text-xs">{formatDuration(hike.duration)}</span>
            <span className="text-forest-600 text-xs">·</span>
            <span className="text-forest-300 text-xs">{hike.maxElevation}m</span>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-forest-600 flex-shrink-0" />
      </button>
    </li>
  )
}
