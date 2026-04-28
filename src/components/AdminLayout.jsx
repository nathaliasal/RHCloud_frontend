import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import './AdminLayout.css'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Panel de Control',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: '/empresas',
    label: 'Empresas',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: '/contratos/plantillas',
    label: 'Plantillas de Contratos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    to: '/usuarios',
    label: 'Empleados',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: '/vacaciones',
    label: 'Vacaciones',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    to: '/permisos',
    label: 'Permisos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
]

export function AdminLayout({ children }) {
  const { user, clearUser } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('rhcloud.web.auth')
    localStorage.removeItem('rhcloud.tokens')
    clearUser()
    navigate('/login', { replace: true })
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : (user?.email?.[0] ?? 'A').toUpperCase()

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="var(--color-accent)" fillOpacity="0.15" />
              <path
                d="M18 8C12.477 8 8 12.477 8 18s4.477 10 10 10 10-4.477 10-10S23.523 8 18 8zm0 3a7 7 0 110 14A7 7 0 0118 11zm0 2a5 5 0 100 10A5 5 0 0018 13z"
                fill="var(--color-accent)"
              />
              <circle cx="18" cy="14" r="2" fill="var(--color-accent)" />
            </svg>
          </div>
          <div className="admin-sidebar__brand-text">
            <span className="admin-sidebar__brand-name">RHCloud</span>
            <span className="admin-sidebar__brand-sub">Centro de control de RR.HH.</span>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`
              }
            >
              <span className="admin-sidebar__link-icon">{icon}</span>
              <span className="admin-sidebar__link-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="admin-sidebar__logout" onClick={handleLogout}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar sesión
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Buscar en el sistema..."
              className="admin-topbar__search-input"
            />
          </div>

          <div className="admin-topbar__actions">
            <button className="admin-topbar__icon-btn" title="Notificaciones">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <button className="admin-topbar__icon-btn" title="Configuración">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <button className="admin-topbar__icon-btn" title="Ayuda">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>

            <div className="admin-topbar__user">
              <div className="admin-topbar__user-info">
                <span className="admin-topbar__user-name">
                  {user?.full_name ?? user?.email ?? 'Admin'}
                </span>
                <span className="admin-topbar__user-role">Admin Principal</span>
              </div>
              <div className="admin-topbar__avatar">{initials}</div>
            </div>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}
