import { useEffect, useMemo, useRef, useState, useDeferredValue } from 'react'
import { useMutation, useQuery, useQueries, useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { AdminLayout } from '@/components/AdminLayout'
import { EmpleadoModal } from '@/components/EmpleadoModal'
import {
  getEmpleados,
  toggleActivacionEmpleado,
  getUsuariosActivos,
  getEmpresasPublic,
  getCargosPublicEmpleados,
} from '@/services/empleados'
import { getPerson } from '@/services/personas'
import './Empleados.css'

const PAGE_SIZE = 10

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

function normalizeError(error) {
  const detail = error?.response?.data?.detail
  if (Array.isArray(detail)) return detail.map(({ msg }) => msg).join(' ')
  if (typeof detail === 'string') return detail
  if (typeof error?.response?.data?.message === 'string') return error.response.data.message
  return 'No fue posible procesar la solicitud.'
}

function fullName(employee) {
  const persona = employee.user?.persona
  if (!persona) return employee.user?.email ?? `Empleado ${employee.id}`
  return `${persona.first_name ?? ''} ${persona.last_name ?? ''}`.trim() || employee.user?.email
}

export default function Empleados() {
  const queryClient = useQueryClient()
  const rootRef = useRef(null)

  const [page, setPage] = useState(1)
  const [activeFilter, setActiveFilter] = useState('todos')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim().toLowerCase())

  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [actionError, setActionError] = useState('')

  const queryParams = useMemo(() => ({
    page,
    page_size: PAGE_SIZE,
    ...(activeFilter === 'activos' && { is_active: true }),
    ...(activeFilter === 'inactivos' && { is_active: false }),
  }), [page, activeFilter])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['empleados', queryParams],
    queryFn: () => getEmpleados(queryParams),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios-activos-select'],
    queryFn: () => getUsuariosActivos({ page: 1, page_size: 100, is_active: true }),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })

  const { data: cargosData } = useQuery({
    queryKey: ['cargos-public-empleados'],
    queryFn: () => getCargosPublicEmpleados({ page: 1, page_size: 100 }),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })

  const { data: empresasData } = useQuery({
    queryKey: ['empresas-public-select'],
    queryFn: () => getEmpresasPublic({ page: 1, page_size: 100 }),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })

  const usuariosRaw = usuariosData?.items ?? []
  const cargos = cargosData?.items ?? []
  const empresas = empresasData?.items ?? []

  const personaQueries = useQueries({
    queries: usuariosRaw.map(u => ({
      queryKey: ['persona', u.persona_id],
      queryFn: () => getPerson(u.persona_id),
      enabled: !!u.persona_id,
      staleTime: 30 * 60 * 1000,
      retry: 1,
    })),
  })

  const usuarios = usuariosRaw.map((u, i) => ({ ...u, persona: personaQueries[i]?.data ?? null }))

  const toggleMutation = useMutation({
    mutationFn: ({ id }) => toggleActivacionEmpleado(id),
    onSuccess: () => {
      setActionError('')
      queryClient.invalidateQueries({ queryKey: ['empleados'] })
    },
    onError: (error) => {
      setActionError(normalizeError(error))
    },
  })

  useEffect(() => {
    if (isLoading) return
    const ctx = gsap.context(() => {
      gsap.from('.em-header, .em-summary, .em-filters, .em-table-card', {
        opacity: 0,
        y: 14,
        duration: 0.4,
        stagger: 0.08,
        ease: 'power2.out',
      })
    }, rootRef)
    return () => ctx.revert()
  }, [isLoading])

  const items = useMemo(() => data?.items ?? [], [data])
  const total = data?.total ?? 0
  const totalPages = data?.total_pages ?? 1
  const pageNumbers = buildPageNumbers(page, totalPages)

  const visibleItems = useMemo(() => {
    if (!deferredSearch) return items
    return items.filter((e) => {
      const name = fullName(e).toLowerCase()
      const email = (e.user?.email ?? '').toLowerCase()
      return name.includes(deferredSearch) || email.includes(deferredSearch)
    })
  }, [deferredSearch, items])

  const summary = useMemo(() => {
    const counts = { total: items.length, activos: 0, inactivos: 0 }
    items.forEach((e) => {
      if (e.is_active) counts.activos += 1
      else counts.inactivos += 1
    })
    return counts
  }, [items])

  return (
    <AdminLayout>
      <div className="em-page" ref={rootRef}>
        <div className="em-header">
          <nav className="em-header__breadcrumb">
            <span>PANEL</span>
            <span className="em-header__sep">/</span>
            <span className="em-header__crumb-active">EMPLEADOS</span>
          </nav>

          <div className="em-header__row">
            <div>
              <h1 className="em-header__title">Empleados</h1>
              <p className="em-header__sub">
                Gestione los empleados registrados en el sistema. Haga clic en un registro para ver o editar su información.
              </p>
            </div>

            <div className="em-header__actions">
              <div className="em-header__note">
                <span className="em-header__note-label">Total</span>
                <strong className="em-header__note-value">{total}</strong>
              </div>
              <button type="button" className="em-btn-new" onClick={() => setShowModal(true)}>
                + Nuevo empleado
              </button>
            </div>
          </div>
        </div>

        <div className="em-summary">
          <div className="em-summary__card">
            <span className="em-summary__label">En esta página</span>
            <strong className="em-summary__value">{summary.total}</strong>
          </div>
          <div className="em-summary__card">
            <span className="em-summary__label">Activos en página</span>
            <strong className="em-summary__value em-summary__value--success">{summary.activos}</strong>
          </div>
          <div className="em-summary__card">
            <span className="em-summary__label">Inactivos en página</span>
            <strong className="em-summary__value em-summary__value--muted">{summary.inactivos}</strong>
          </div>
        </div>

        <div className="em-filters">
          <div className="em-filters__search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="em-filters__search-input"
              placeholder="BUSCAR POR NOMBRE O CORREO"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          <div className="em-filters__control">
            <span className="em-filters__label">ESTADO:</span>
            <select
              className="em-filters__select"
              value={activeFilter}
              onChange={(e) => { setActiveFilter(e.target.value); setPage(1) }}
            >
              <option value="todos">TODOS</option>
              <option value="activos">ACTIVOS</option>
              <option value="inactivos">INACTIVOS</option>
            </select>
          </div>
        </div>

        <div className="em-table-card">
          <div className="em-table-card__header">
            <h2 className="em-table-card__title">Empleados registrados</h2>
            <p className="em-table-card__sub">
              Haga clic en un registro para editar sus datos o ver sus contratos.
            </p>
          </div>

          {actionError && (
            <div className="em-alert em-alert--error">{actionError}</div>
          )}

          {isLoading ? (
            <div className="em-state">
              <div className="em-spinner" />
              <span>Cargando empleados...</span>
            </div>
          ) : isError ? (
            <div className="em-state em-state--error">
              No fue posible cargar los empleados.
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="em-state">
              No se encontraron empleados con los filtros actuales.
            </div>
          ) : (
            <div className="em-table-wrap">
              <table className="em-table">
                <thead>
                  <tr>
                    <th>EMPLEADO</th>
                    <th>CARGO</th>
                    <th>EMPRESA</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((employee) => {
                    const toggling = toggleMutation.isPending && toggleMutation.variables?.id === employee.id

                    return (
                      <tr
                        key={employee.id}
                        className="em-table__row"
                        onClick={() => setEditingEmployee(employee)}
                      >
                        <td>
                          <div className="em-employee-name">
                            <span className="em-employee-name__text">{fullName(employee)}</span>
                            <span className="em-employee-name__sub">
                              {employee.user?.email ?? `ID ${employee.id}`}
                            </span>
                          </div>
                        </td>
                        <td>{employee.charge?.name ?? 'N/A'}</td>
                        <td>{employee.company?.name ?? 'N/A'}</td>
                        <td>
                          <span className={`em-badge ${employee.is_active ? 'em-badge--success' : 'em-badge--muted'}`}>
                            {employee.is_active ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="em-actions">
                            <button
                              type="button"
                              className={`em-action-btn ${employee.is_active ? 'em-action-btn--warning' : 'em-action-btn--success'}`}
                              disabled={toggling}
                              onClick={() => {
                                setActionError('')
                                toggleMutation.mutate({ id: employee.id })
                              }}
                            >
                              {toggling ? '...' : employee.is_active ? 'Desactivar' : 'Activar'}
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
            <div className="em-pagination">
              <span className="em-pagination__info">
                MOSTRANDO {visibleItems.length} DE {total} REGISTROS
              </span>
              <div className="em-pagination__controls">
                <button
                  type="button"
                  className="em-pagination__btn"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Anterior
                </button>
                {pageNumbers.map((val, i) =>
                  val === '...'
                    ? <span key={`e-${i}`} className="em-pagination__ellipsis">...</span>
                    : (
                      <button
                        key={val}
                        type="button"
                        className={`em-pagination__btn${val === page ? ' em-pagination__btn--active' : ''}`}
                        onClick={() => setPage(val)}
                      >
                        {val}
                      </button>
                    )
                )}
                <button
                  type="button"
                  className="em-pagination__btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <EmpleadoModal
        show={showModal || !!editingEmployee}
        onClose={() => { setShowModal(false); setEditingEmployee(null) }}
        usuarios={usuarios}
        cargos={cargos}
        empresas={empresas}
        initialEmployee={editingEmployee}
      />
    </AdminLayout>
  )
}
