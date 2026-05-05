import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { AdminLayout } from '@/components/AdminLayout'
import { UsuarioModal } from '@/components/UsuarioModal'
import { getUsuarios, deleteUsuario, toggleActivacionUsuario } from '@/services/usuarios'
import './Usuarios.css'

const PAGE_SIZE = 10

const STATUS_MAP = {
  activo:   { label: 'ACTIVO',   cls: 'usr-badge--success' },
  inactivo: { label: 'INACTIVO', cls: 'usr-badge--error' },
}

const AVATAR_COLORS = ['#00E5CC', '#4ADE80', '#FBBF24', '#A78BFA', '#60A5FA', '#F472B6']

function getAvatarColor(email) {
  if (!email) return AVATAR_COLORS[0]
  return AVATAR_COLORS[email.charCodeAt(0) % AVATAR_COLORS.length]
}

function UserAvatar({ email }) {
  const initial = email ? email[0].toUpperCase() : '?'
  const color = getAvatarColor(email)
  return (
    <div className="usr-avatar" style={{ background: `${color}1A`, color }}>
      {initial}
    </div>
  )
}

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export default function Usuarios() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [page, setPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const rootRef = useRef(null)

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      setConfirmDelete(null)
    },
  })

  const activacionMutation = useMutation({
    mutationFn: ({ id, isActive }) => toggleActivacionUsuario(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  })

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter])

  const queryParams = {
    page,
    page_size: PAGE_SIZE,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== 'todos' && { is_active: statusFilter === 'activo' }),
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['usuarios', queryParams],
    queryFn: () => getUsuarios(queryParams),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.total_pages ?? 1

  useEffect(() => {
    if (isLoading || items.length === 0) return
    const ctx = gsap.context(() => {
      gsap.from('.usr-table tbody tr', {
        opacity: 0, y: 8, duration: 0.3, stagger: 0.04, ease: 'power2.out',
      })
    }, rootRef)
    return () => ctx.revert()
  }, [isLoading, page])

  const pageNumbers = buildPageNumbers(page, totalPages)

  return (
    <AdminLayout>
      <div className="usr-page" ref={rootRef}>

        {/* ── Header ── */}
        <div className="usr-header">
          <nav className="usr-header__breadcrumb">
            <span>PANEL</span>
            <span className="usr-header__sep">›</span>
            <span className="usr-header__crumb-active">GESTIÓN DE USUARIOS</span>
          </nav>
          <div className="usr-header__row">
            <div>
              <h1 className="usr-header__title">Usuarios del Sistema</h1>
              <p className="usr-header__sub">
                Administre las cuentas de acceso y el estado de los usuarios en la plataforma RhCloud.
              </p>
            </div>
            <button className="usr-btn-add" onClick={() => setModalOpen(true)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              AÑADIR USUARIO
            </button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="usr-filters">
          <div className="usr-filters__search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="usr-filters__search-input"
              placeholder="FILTRAR POR EMAIL..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="usr-filters__control">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="10" y1="18" x2="14" y2="18" />
            </svg>
            <span className="usr-filters__label">ESTADO:</span>
            <select
              className="usr-filters__select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="todos">TODOS</option>
              <option value="activo">ACTIVO</option>
              <option value="inactivo">INACTIVO</option>
            </select>
            <svg className="usr-filters__chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* ── Table card ── */}
        <div className="usr-table-card">
          {isLoading ? (
            <div className="usr-state">
              <div className="usr-spinner" />
              <span>Cargando usuarios...</span>
            </div>
          ) : isError ? (
            <div className="usr-state usr-state--error">
              Error al cargar los datos. Intente de nuevo.
            </div>
          ) : items.length === 0 ? (
            <div className="usr-state">
              No se encontraron usuarios.
            </div>
          ) : (
            <div className="usr-table-wrap">
              <table className="usr-table">
                <thead>
                  <tr>
                    <th>USUARIO</th>
                    <th>ID</th>
                    <th>ESTADO</th>
                    <th>VERIFICADO</th>
                    <th>SUPERUSUARIO</th>
                    <th>RESPONSABLE</th>
                    <th>OPERACIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const status = item.is_active ? 'activo' : 'inactivo'
                    const { label, cls } = STATUS_MAP[status]
                    return (
                      <tr
                        key={item.id}
                        onClick={() => navigate(`/usuarios/${item.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div className="usr-table__user">
                            <UserAvatar email={item.email} />
                            <span className="usr-table__email">{item.email}</span>
                          </div>
                        </td>
                        <td className="usr-table__id">{item.id}</td>
                        <td>
                          <span className={`usr-badge ${cls}`}>{label}</span>
                        </td>
                        <td>
                          <span className={`usr-badge ${item.is_verified ? 'usr-badge--success' : 'usr-badge--muted'}`}>
                            {item.is_verified ? 'SÍ' : 'NO'}
                          </span>
                        </td>
                        <td>
                          <span className={`usr-badge ${item.is_superuser ? 'usr-badge--accent' : 'usr-badge--muted'}`}>
                            {item.is_superuser ? 'SÍ' : 'NO'}
                          </span>
                        </td>
                        <td className="usr-table__responsible">
                          {item.responsible_user ?? '—'}
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="usr-row-actions">
                            <button
                              className={`usr-row-btn ${item.is_active ? 'usr-row-btn--warning' : 'usr-row-btn--success'}`}
                              disabled={activacionMutation.isPending}
                              onClick={() => activacionMutation.mutate({ id: item.id, isActive: !item.is_active })}
                            >
                              {item.is_active ? 'Inactivar' : 'Activar'}
                            </button>
                            <button
                              className="usr-row-btn usr-row-btn--danger"
                              onClick={() => setConfirmDelete(item)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && !isError && total > 0 && (
            <div className="usr-pagination">
              <span className="usr-pagination__info">
                MOSTRANDO {items.length} DE {total} USUARIOS
              </span>
              <div className="usr-pagination__controls">
                <button
                  className="usr-pagination__btn"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >‹</button>
                {pageNumbers.map((n, i) =>
                  n === '...'
                    ? <span key={`e${i}`} className="usr-pagination__ellipsis">…</span>
                    : (
                      <button
                        key={n}
                        className={`usr-pagination__btn${n === page ? ' usr-pagination__btn--active' : ''}`}
                        onClick={() => setPage(n)}
                      >{n}</button>
                    )
                )}
                <button
                  className="usr-pagination__btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >›</button>
              </div>
            </div>
          )}
        </div>

      </div>

      {modalOpen && <UsuarioModal onClose={() => setModalOpen(false)} />}

      {confirmDelete && (
        <div className="usr-confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="usr-confirm" onClick={e => e.stopPropagation()}>
            <h3 className="usr-confirm__title">Eliminar usuario</h3>
            <p className="usr-confirm__body">
              ¿Seguro que deseas eliminar <strong>{confirmDelete.email}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="usr-confirm__actions">
              <button className="usr-confirm__btn usr-confirm__btn--cancel" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </button>
              <button
                className="usr-confirm__btn usr-confirm__btn--danger"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(confirmDelete.id)}
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
