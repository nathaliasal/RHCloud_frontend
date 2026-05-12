import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AdminLayout } from '@/components/AdminLayout'
import { getDashboardStats } from '@/services/dashboard'
import { getNotifications } from '@/services/notificaciones'
import './Dashboard.css'

const STAT_META = [
  {
    id: 'empleados',
    label: 'Total Empleados',
    key: 'total_employees',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'contratos',
    label: 'Contratos Activos',
    key: 'total_active_contracts',
    badge: { text: 'Activos', type: 'success' },
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    id: 'solicitudes',
    label: 'Solicitudes Pendientes',
    key: 'total_pending_vacations_permissions',
    badge: { text: 'Pendientes', type: 'warning' },
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
]

function eventColor(eventType) {
  const t = (eventType ?? '').toUpperCase()
  if (t.includes('VACATION') || t.includes('VACACION')) return '#FBBF24'
  if (t.includes('PERMISO') || t.includes('PERMISSION') || t.includes('LEAVE')) return '#00E5CC'
  return '#A78BFA'
}

function eventInitials(eventType, title) {
  if (eventType) {
    const parts = eventType.split('_').filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (title ?? 'NT').slice(0, 2).toUpperCase()
}

function relativeTime(value) {
  if (!value) return ''
  const diff = Date.now() - new Date(value).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'HACE UN MOMENTO'
  if (mins < 60) return `HACE ${mins} MIN`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `HACE ${hours} H`
  const days = Math.floor(hours / 24)
  return `HACE ${days} DÍA${days > 1 ? 'S' : ''}`
}

function LineChart({ data }) {
  if (!data || data.length === 0) return null

  const W = 520
  const H = 160
  const PAD = { top: 16, right: 16, bottom: 28, left: 32 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const values = data.map((d) => d.value)
  const rawMax = Math.max(...values)
  const rawMin = Math.min(...values)
  const range = rawMax === rawMin ? 1 : rawMax - rawMin
  const max = rawMax + range * 0.1
  const min = rawMin - range * 0.1

  const x = (i) =>
    data.length === 1
      ? PAD.left + chartW / 2
      : PAD.left + (i / (data.length - 1)) * chartW
  const y = (v) => PAD.top + chartH - ((v - min) / (max - min)) * chartH

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.value)}`)
    .join(' ')

  const areaPath =
    `M ${x(0)} ${y(data[0].value)} ` +
    data.slice(1).map((d, i) => `L ${x(i + 1)} ${y(d.value)}`).join(' ') +
    ` L ${x(data.length - 1)} ${PAD.top + chartH} L ${x(0)} ${PAD.top + chartH} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dash-chart__svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={PAD.left}
          x2={PAD.left + chartW}
          y1={PAD.top + chartH * t}
          y2={PAD.top + chartH * t}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      ))}

      <path d={areaPath} fill="url(#chartGrad)" />
      <path
        d={linePath}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.value)} r="3.5" fill="var(--color-accent)" />
      ))}

      {data.map((d, i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 6}
          textAnchor="middle"
          fontSize="10"
          fill="rgba(237,244,255,0.5)"
          fontFamily="var(--font-primary)"
        >
          {d.label}
        </text>
      ))}
    </svg>
  )
}

export default function Dashboard() {
  const [chartMode, setChartMode] = useState('mensual')
  const rootRef = useRef(null)
  const navigate = useNavigate()

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', chartMode],
    queryFn: () => getDashboardStats(chartMode === 'semanal' ? { weekly: true } : {}),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: notiData, isLoading: notiLoading } = useQuery({
    queryKey: ['notificaciones', { page: 1, page_size: 5 }],
    queryFn: () => getNotifications({ page: 1, page_size: 5 }),
    staleTime: 30_000,
    retry: 1,
    refetchInterval: 30_000,
  })

  const chartData = (statsData?.contracts_by_date ?? []).map((d) => ({
    label: d.month_name,
    value: d.contract_count,
  }))

  const activityItems = notiData?.items ?? []

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.dash-stat-card', { opacity: 0, y: 18, duration: 0.45, stagger: 0.08, ease: 'power3.out' })
      gsap.from('.dash-row', { opacity: 0, y: 12, duration: 0.4, delay: 0.3, ease: 'power2.out' })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <AdminLayout>
      <div className="dashboard" ref={rootRef}>
        <div className="dash-stats">
          {STAT_META.map((s) => (
            <div key={s.id} className="dash-stat-card">
              <div className="dash-stat-card__top">
                <span className="dash-stat-card__icon">{s.icon}</span>
                {s.badge && (
                  <span className={`dash-badge dash-badge--${s.badge.type}`}>{s.badge.text}</span>
                )}
              </div>
              <p className="dash-stat-card__label">{s.label}</p>
              <p className="dash-stat-card__value">
                {statsLoading ? '—' : (statsData?.[s.key] ?? 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="dash-row">
          <div className="dash-chart-card">
            <div className="dash-chart-card__header">
              <div>
                <h2 className="dash-chart-card__title">Contrataciones por Período</h2>
                <p className="dash-chart-card__sub">Contratos registrados en el período seleccionado</p>
              </div>
              <div className="dash-chart-toggle">
                <button
                  className={`dash-chart-toggle__btn${chartMode === 'semanal' ? ' dash-chart-toggle__btn--active' : ''}`}
                  onClick={() => setChartMode('semanal')}
                >
                  Semanal
                </button>
                <button
                  className={`dash-chart-toggle__btn${chartMode === 'mensual' ? ' dash-chart-toggle__btn--active' : ''}`}
                  onClick={() => setChartMode('mensual')}
                >
                  Mensual
                </button>
              </div>
            </div>
            <div className="dash-chart__body">
              {statsLoading ? (
                <p className="dash-chart__loading">Cargando...</p>
              ) : (
                <LineChart data={chartData} />
              )}
            </div>
          </div>

          <div className="dash-activity-card">
            <div className="dash-activity-card__header">
              <h2 className="dash-activity-card__title">Actividad Reciente</h2>
              <button className="dash-activity-card__link" onClick={() => navigate('/notificaciones')}>
                Ver Todo
              </button>
            </div>
            <div className="dash-activity__list">
              {notiLoading ? (
                <p className="dash-chart__loading">Cargando...</p>
              ) : activityItems.length === 0 ? (
                <p className="dash-chart__loading">Sin notificaciones recientes.</p>
              ) : (
                activityItems.map((n) => {
                  const color = eventColor(n.event_type)
                  return (
                    <div key={n.id} className="dash-activity__item">
                      <div
                        className="dash-activity__avatar"
                        style={{ background: `${color}22`, color }}
                      >
                        {eventInitials(n.event_type, n.title)}
                      </div>
                      <div className="dash-activity__body">
                        <p className="dash-activity__text">
                          <strong>{n.title}</strong>
                          {n.message && <> — <span className="dash-activity__link">{n.message}</span></>}
                        </p>
                        <span className="dash-activity__time">{relativeTime(n.created_at)}</span>
                      </div>
                      <span className={`dash-activity__dot dash-activity__dot--${n.is_read ? 'accent' : 'warning'}`} />
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
