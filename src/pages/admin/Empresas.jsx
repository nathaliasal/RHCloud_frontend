import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { AdminLayout } from '@/components/AdminLayout'
import { EmpresaModal } from '@/components/EmpresaModal'
import { getEmpresas, deleteEmpresa, toggleActivacionEmpresa } from '@/services/empresas'
import './Empresas.css'

const PAGE_SIZE = 5

const STATUS_MAP = {
  activa:   { label: 'ACTIVA',   cls: 'emp-badge--success' },
  inactiva: { label: 'INACTIVA', cls: 'emp-badge--error' },
}

const LOGO_COLORS = ['#00E5CC', '#4ADE80', '#FBBF24', '#A78BFA', '#60A5FA', '#F472B6']

function getLogoColor(name) {
  if (!name) return LOGO_COLORS[0]
  return LOGO_COLORS[name.charCodeAt(0) % LOGO_COLORS.length]
}

function normalizeLogoUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

function CompanyLogo({ name, logoUrl }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?'

  const src = normalizeLogoUrl(logoUrl)

  if (src) {
    return (
      <div className="emp-logo">
        <img src={src} alt={name} className="emp-logo__img" onError={e => { e.currentTarget.style.display = 'none' }} />
      </div>
    )
  }

  const color = getLogoColor(name)
  return (
    <div className="emp-logo emp-logo--initials" style={{ background: `${color}1A`, color }}>
      {initials}
    </div>
  )
}

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export default function Empresas() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [sort, setSort] = useState('az')
  const [page, setPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const rootRef = useRef(null)

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteEmpresa(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] })
      setConfirmDelete(null)
    },
  })

  const activacionMutation = useMutation({
    mutationFn: ({ id, isActive }) => toggleActivacionEmpresa(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['empresas'] }),
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
    ...(statusFilter !== 'todos' && { is_active: statusFilter === 'activa' }),
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['empresas', queryParams],
    queryFn: () => getEmpresas(queryParams),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.total_pages ?? 1

  const sorted = [...items].sort((a, b) =>
    sort === 'az'
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name)
  )

  useEffect(() => {
    if (isLoading || sorted.length === 0) return
    const ctx = gsap.context(() => {
      gsap.from('.emp-table tbody tr', {
        opacity: 0, y: 8, duration: 0.3, stagger: 0.04, ease: 'power2.out',
      })
    }, rootRef)
    return () => ctx.revert()
  }, [isLoading, page])

  const pageNumbers = buildPageNumbers(page, totalPages)

  return (
    <AdminLayout>
      <div className="emp-page" ref={rootRef}>

        {/* ── Header ── */}
        <div className="emp-header">
          <nav className="emp-header__breadcrumb">
            <span>PANEL</span>
            <span className="emp-header__sep">›</span>
            <span className="emp-header__crumb-active">GESTIÓN DE EMPRESAS</span>
          </nav>
          <div className="emp-header__row">
            <div>
              <h1 className="emp-header__title">Empresas Registradas</h1>
              <p className="emp-header__sub">
                Administre y audite los registros institucionales dentro del ecosistema RhCloud.
              </p>
            </div>
            <button className="emp-btn-add" onClick={() => setModalOpen(true)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              AÑADIR EMPRESA
            </button>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="emp-filters">
          <div className="emp-filters__search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="emp-filters__search-input"
              placeholder="FILTRAR POR NOMBRE, ID FISCAL O DOMINIO..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="emp-filters__control">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="10" y1="18" x2="14" y2="18" />
            </svg>
            <span className="emp-filters__label">ESTADO:</span>
            <select
              className="emp-filters__select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="todos">TODOS</option>
              <option value="activa">ACTIVA</option>
              <option value="inactiva">INACTIVA</option>
            </select>
            <svg className="emp-filters__chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          <div className="emp-filters__control">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="9" y2="18" />
            </svg>
            <span className="emp-filters__label">ORDEN:</span>
            <select
              className="emp-filters__select"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="az">A-Z</option>
              <option value="za">Z-A</option>
            </select>
            <svg className="emp-filters__chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* ── Table card ── */}
        <div className="emp-table-card">
          {isLoading ? (
            <div className="emp-state">
              <div className="emp-spinner" />
              <span>Cargando empresas...</span>
            </div>
          ) : isError ? (
            <div className="emp-state emp-state--error">
              Error al cargar los datos. Intente de nuevo.
            </div>
          ) : sorted.length === 0 ? (
            <div className="emp-state">
              No se encontraron empresas.
            </div>
          ) : (
            <div className="emp-table-wrap">
              <table className="emp-table">
                <thead>
                  <tr>
                    <th>MARCA</th>
                    <th>NOMBRE DE LA EMPRESA</th>
                    <th>IDENTIDAD FISCAL (TID)</th>
                    <th>ESTADO</th>
                    <th>OPERACIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(item => {
                    const status = item.is_active ? 'activa' : 'inactiva'
                    const { label, cls } = STATUS_MAP[status]
                    const tid = [item.document_type, item.document_number]
                      .filter(Boolean).join('-') || '—'
                    return (
                      <tr key={item.id} className="emp-table__row--clickable" onClick={() => navigate(`/empresas/${item.id}`)}>
                        <td className="emp-table__logo-cell">
                          <CompanyLogo name={item.name} logoUrl={item.logo_url} />
                        </td>
                        <td>
                          <span className="emp-table__name">{item.name}</span>
                          {item.address && (
                            <span className="emp-table__address">{item.address}</span>
                          )}
                        </td>
                        <td className="emp-table__tid">{tid}</td>
                        <td>
                          <span className={`emp-badge ${cls}`}>{label}</span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="emp-row-actions">
                            <button
                              className={`emp-row-btn ${item.is_active ? 'emp-row-btn--warning' : 'emp-row-btn--success'}`}
                              disabled={activacionMutation.isPending}
                              onClick={() => activacionMutation.mutate({ id: item.id, isActive: !item.is_active })}
                            >
                              {item.is_active ? 'Inactivar' : 'Activar'}
                            </button>
                            <button
                              className="emp-row-btn emp-row-btn--danger"
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
            <div className="emp-pagination">
              <span className="emp-pagination__info">
                MOSTRANDO {items.length} DE {total} ENTIDADES
              </span>
              <div className="emp-pagination__controls">
                <button
                  className="emp-pagination__btn"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >‹</button>
                {pageNumbers.map((n, i) =>
                  n === '...'
                    ? <span key={`e${i}`} className="emp-pagination__ellipsis">…</span>
                    : (
                      <button
                        key={n}
                        className={`emp-pagination__btn${n === page ? ' emp-pagination__btn--active' : ''}`}
                        onClick={() => setPage(n)}
                      >{n}</button>
                    )
                )}
                <button
                  className="emp-pagination__btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >›</button>
              </div>
            </div>
          )}
        </div>

      </div>
      {modalOpen && <EmpresaModal onClose={() => setModalOpen(false)} />}

      {confirmDelete && (
        <div className="emp-confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="emp-confirm" onClick={e => e.stopPropagation()}>
            <h3 className="emp-confirm__title">Eliminar empresa</h3>
            <p className="emp-confirm__body">
              ¿Seguro que deseas eliminar <strong>{confirmDelete.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="emp-confirm__actions">
              <button className="emp-confirm__btn emp-confirm__btn--cancel" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </button>
              <button
                className="emp-confirm__btn emp-confirm__btn--danger"
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
