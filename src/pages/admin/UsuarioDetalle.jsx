import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { AdminLayout } from '@/components/AdminLayout'
import { getUsuario, getPerson, getRole } from '@/services/usuarios'
import './UsuarioDetalle.css'

const AVATAR_COLORS = ['#00E5CC', '#4ADE80', '#FBBF24', '#A78BFA', '#60A5FA', '#F472B6']

function getAvatarColor(email) {
  if (!email) return AVATAR_COLORS[0]
  return AVATAR_COLORS[email.charCodeAt(0) % AVATAR_COLORS.length]
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="ud-info-card">
      <span className="ud-info-card__icon">{icon}</span>
      <span className="ud-info-card__label">{label}</span>
      <span className="ud-info-card__value">{value || '—'}</span>
    </div>
  )
}

export default function UsuarioDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const rootRef = useRef(null)

  const { data: user, isLoading: userLoading, isError: userError } = useQuery({
    queryKey: ['usuarios', id],
    queryFn: () => getUsuario(id),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: persona, isLoading: personaLoading } = useQuery({
    queryKey: ['personas', user?.persona_id],
    queryFn: () => getPerson(user.persona_id),
    enabled: !!user?.persona_id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: rol } = useQuery({
    queryKey: ['roles', user?.role_id],
    queryFn: () => getRole(user.role_id),
    enabled: !!user?.role_id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const isLoading = userLoading || (!!user?.persona_id && personaLoading)

  useEffect(() => {
    if (isLoading) return
    const ctx = gsap.context(() => {
      gsap.from('.ud-hero, .ud-section', {
        opacity: 0, y: 14, duration: 0.4, stagger: 0.08, ease: 'power2.out',
      })
    }, rootRef)
    return () => ctx.revert()
  }, [isLoading])

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="ud-state">
          <div className="ud-spinner" />
          <span>Cargando usuario...</span>
        </div>
      </AdminLayout>
    )
  }

  if (userError || !user) {
    return (
      <AdminLayout>
        <div className="ud-state ud-state--error">
          No se pudo cargar la información del usuario.
        </div>
      </AdminLayout>
    )
  }

  const color = getAvatarColor(user.email)
  const fullName = persona
    ? `${persona.first_name} ${persona.last_name}`.trim()
    : null
  const avatarInitial = fullName
    ? fullName[0].toUpperCase()
    : user.email?.[0].toUpperCase() ?? '?'

  const docLabel = persona
    ? [persona.document_type, persona.document_number].filter(Boolean).join(' - ')
    : null

  return (
    <AdminLayout>
      <div className="ud-page" ref={rootRef}>

        {/* ── Breadcrumb ── */}
        <nav className="ud-breadcrumb">
          <button className="ud-breadcrumb__back" onClick={() => navigate('/usuarios')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="ud-breadcrumb__item" onClick={() => navigate('/usuarios')}>PANEL</span>
          <span className="ud-breadcrumb__sep">›</span>
          <span className="ud-breadcrumb__item" onClick={() => navigate('/usuarios')}>GESTIÓN DE USUARIOS</span>
          <span className="ud-breadcrumb__sep">›</span>
          <span className="ud-breadcrumb__current">{fullName ?? user.email}</span>
        </nav>

        {/* ── Hero ── */}
        <div className="ud-hero">
          <div
            className="ud-hero__avatar"
            style={{ background: `${color}1A`, color }}
          >
            {avatarInitial}
          </div>
          <div className="ud-hero__info">
            {fullName && <h1 className="ud-hero__name">{fullName}</h1>}
            <p className="ud-hero__email">{user.email}</p>
            <div className="ud-hero__badges">
              <span className={`ud-badge ${user.is_active ? 'ud-badge--success' : 'ud-badge--error'}`}>
                {user.is_active ? 'ACTIVO' : 'INACTIVO'}
              </span>
              <span className={`ud-badge ${user.is_verified ? 'ud-badge--success' : 'ud-badge--muted'}`}>
                {user.is_verified ? 'VERIFICADO' : 'NO VERIFICADO'}
              </span>
              {user.is_superuser && (
                <span className="ud-badge ud-badge--accent">SUPERUSUARIO</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Información personal ── */}
        {persona && (
          <div className="ud-section">
            <h2 className="ud-section-title">Información Personal</h2>
            <div className="ud-info-grid">
              <InfoCard
                label="Documento"
                value={docLabel}
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                }
              />
              <InfoCard
                label="Fecha de nacimiento"
                value={persona.birth_date}
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                }
              />
              <InfoCard
                label="Género"
                value={persona.gender}
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                }
              />
              <InfoCard
                label="Teléfono"
                value={persona.phone}
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.22 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.55a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                }
              />
              <InfoCard
                label="Dirección"
                value={persona.address}
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                }
              />
              <InfoCard
                label="Email"
                value={persona.email}
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                }
              />
              <InfoCard
                label="Departamento"
                value={persona.code_department}
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                  </svg>
                }
              />
              <InfoCard
                label="Ciudad"
                value={persona.code_city}
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="22" x2="21" y2="22" />
                    <line x1="6" y1="18" x2="6" y2="11" />
                    <line x1="10" y1="18" x2="10" y2="11" />
                    <line x1="14" y1="18" x2="14" y2="11" />
                    <line x1="18" y1="18" x2="18" y2="11" />
                    <polygon points="12 2 20 7 4 7" />
                  </svg>
                }
              />
            </div>
          </div>
        )}

        {/* ── Información de cuenta ── */}
        <div className="ud-section">
          <h2 className="ud-section-title">Información de Cuenta</h2>
          <div className="ud-account-grid">
            <InfoCard
              label="Responsable"
              value={user.responsible_user}
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />
            <InfoCard
              label="Rol"
              value={rol?.name ?? (user.role_id != null ? String(user.role_id) : null)}
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              }
            />
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
