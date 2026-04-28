import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { AdminLayout } from '@/components/AdminLayout'
import './Dashboard.css'

const STATS = [
  {
    id: 'empleados',
    label: 'Total Empleados',
    value: '1,284',
    badge: { text: '+12% ↑', type: 'success' },
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
    label: 'Contratos Pendientes',
    value: '42',
    badge: { text: 'Urgente', type: 'warning' },
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
    label: 'Solicitudes Activas',
    value: '156',
    badge: { text: 'Hoy', type: 'accent' },
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
]

const MONTHLY_DATA = [
  { month: 'ENE', value: 72 },
  { month: 'FEB', value: 88 },
  { month: 'MAR', value: 110 },
  { month: 'ABR', value: 95 },
  { month: 'MAY', value: 118 },
  { month: 'JUN', value: 104 },
  { month: 'JUL', value: 130 },
]

const ACTIVITY = [
  {
    id: 1,
    initials: 'MR',
    color: '#4ADE80',
    text: (
      <>
        <strong>Marco Rossi</strong> firmó su{' '}
        <span className="dash-activity__link">Contrato de Empleo</span>
      </>
    ),
    time: 'HACE 2 MINUTOS',
    dot: 'success',
  },
  {
    id: 2,
    initials: 'EV',
    color: '#FBBF24',
    text: (
      <>
        <strong>Elena Vance</strong> solicitó{' '}
        <span className="dash-activity__link">3 días libres</span>
      </>
    ),
    time: 'HACE 14 MINUTOS',
    dot: 'warning',
  },
  {
    id: 3,
    initials: 'TS',
    color: '#00E5CC',
    text: (
      <>
        <strong>Nueva Empresa</strong> añadida:{' '}
        <span className="dash-activity__link">TechSphere Global</span>
      </>
    ),
    time: 'HACE 1 HORA',
    dot: 'accent',
  },
  {
    id: 4,
    initials: 'SJ',
    color: '#FF6B6B',
    text: (
      <>
        <strong>Sarah Jenkins</strong> rechazó{' '}
        <span className="dash-activity__link">actualización de permisos</span>
      </>
    ),
    time: 'HACE 2 HORAS',
    dot: 'error',
  },
]

const EMPLOYEES = [
  {
    id: 1,
    initials: 'JD',
    color: '#4ADE80',
    name: 'Jane Doe',
    email: 'jane.doe@techsphere.com',
    department: 'Diseño de Producto',
    status: 'ACTIVO',
    statusType: 'success',
    contract: 'Permanente Tiempo Completo',
  },
  {
    id: 2,
    initials: 'MK',
    color: '#FBBF24',
    name: 'Mike Knight',
    email: 'mike.knight@techsphere.com',
    department: 'Ingeniería',
    status: 'DE VACACIONES',
    statusType: 'warning',
    contract: 'Contratista',
  },
  {
    id: 3,
    initials: 'AL',
    color: '#00E5CC',
    name: 'Ana López',
    email: 'ana.lopez@techsphere.com',
    department: 'Recursos Humanos',
    status: 'ACTIVO',
    statusType: 'success',
    contract: 'Permanente Tiempo Completo',
  },
  {
    id: 4,
    initials: 'CR',
    color: '#A78BFA',
    name: 'Carlos Ruiz',
    email: 'carlos.ruiz@techsphere.com',
    department: 'Finanzas',
    status: 'ACTIVO',
    statusType: 'success',
    contract: 'Medio Tiempo',
  },
]

function LineChart({ data }) {
  const W = 520
  const H = 160
  const PAD = { top: 16, right: 16, bottom: 28, left: 32 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const max = Math.max(...data.map((d) => d.value))
  const min = Math.min(...data.map((d) => d.value)) - 10

  const x = (i) => PAD.left + (i / (data.length - 1)) * chartW
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
      <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

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
          fill="rgba(237,244,255,0.35)"
          fontFamily="var(--font-primary)"
          fontWeight={d.month === 'MAR' ? '700' : '400'}
          fillOpacity={d.month === 'MAR' ? 1 : 0.7}
        >
          {d.month}
        </text>
      ))}
    </svg>
  )
}

export default function Dashboard() {
  const [chartMode, setChartMode] = useState('mensual')
  const rootRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.dash-stat-card', { opacity: 0, y: 18, duration: 0.45, stagger: 0.08, ease: 'power3.out' })
      gsap.from('.dash-row, .dash-table-card', { opacity: 0, y: 12, duration: 0.4, delay: 0.3, ease: 'power2.out' })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <AdminLayout>
      <div className="dashboard" ref={rootRef}>
        <div className="dash-stats">
          {STATS.map((s) => (
            <div key={s.id} className="dash-stat-card">
              <div className="dash-stat-card__top">
                <span className="dash-stat-card__icon">{s.icon}</span>
                {s.badge && (
                  <span className={`dash-badge dash-badge--${s.badge.type}`}>{s.badge.text}</span>
                )}
              </div>
              <p className="dash-stat-card__label">{s.label}</p>
              <p className="dash-stat-card__value">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="dash-row">
          <div className="dash-chart-card">
            <div className="dash-chart-card__header">
              <div>
                <h2 className="dash-chart-card__title">Contrataciones Mensuales</h2>
                <p className="dash-chart-card__sub">Tendencias de empleo para el año fiscal actual</p>
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
              <LineChart data={MONTHLY_DATA} />
            </div>
          </div>

          <div className="dash-activity-card">
            <div className="dash-activity-card__header">
              <h2 className="dash-activity-card__title">Actividad Reciente</h2>
              <button className="dash-activity-card__link">Ver Todo</button>
            </div>
            <div className="dash-activity__list">
              {ACTIVITY.map((item) => (
                <div key={item.id} className="dash-activity__item">
                  <div
                    className="dash-activity__avatar"
                    style={{ background: `${item.color}22`, color: item.color }}
                  >
                    {item.initials}
                  </div>
                  <div className="dash-activity__body">
                    <p className="dash-activity__text">{item.text}</p>
                    <span className="dash-activity__time">{item.time}</span>
                  </div>
                  <span className={`dash-activity__dot dash-activity__dot--${item.dot}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dash-table-card">
          <div className="dash-table-card__header">
            <h2 className="dash-table-card__title">Resumen de Empleados Activos</h2>
            <button className="dash-table-card__cta">+ Nuevo Empleado</button>
          </div>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Departamento</th>
                  <th>Estado</th>
                  <th>Contrato</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {EMPLOYEES.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div className="dash-table__employee">
                        <div
                          className="dash-table__emp-avatar"
                          style={{ background: `${emp.color}22`, color: emp.color }}
                        >
                          {emp.initials}
                        </div>
                        <div>
                          <span className="dash-table__emp-name">{emp.name}</span>
                          <span className="dash-table__emp-email">{emp.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="dash-table__dept">{emp.department}</td>
                    <td>
                      <span className={`dash-badge dash-badge--${emp.statusType}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="dash-table__contract">{emp.contract}</td>
                    <td>
                      <button className="dash-table__action-btn" title="Opciones">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
