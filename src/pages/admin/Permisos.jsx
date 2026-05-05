import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { AdminLayout } from '@/components/AdminLayout'
import { http } from '@/services/http'
import './Permisos.css'

const PAGE_SIZE = 10
const LIST_ENDPOINT = '/api/v1/permissions/'

const STATUS_META = {
  pendiente: { label: 'PENDIENTE', badge: 'per-badge--warning' },
  aprobado: { label: 'APROBADO', badge: 'per-badge--success' },
  rechazado: { label: 'RECHAZADO', badge: 'per-badge--error' },
}

const ACTIVE_META = {
  true: { label: 'ACTIVO', badge: 'per-badge--accent' },
  false: { label: 'INACTIVO', badge: 'per-badge--muted' },
}

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

function getPermissions(params) {
  return http.get(LIST_ENDPOINT, { params }).then((response) => response.data)
}

function updatePermissionStatus(permissionId, body) {
  return http.patch(`/api/v1/permissions/${permissionId}/status`, body).then((response) => response.data)
}

function normalizeError(error) {
  const detail = error?.response?.data?.detail

  if (Array.isArray(detail)) {
    return detail.map(({ msg }) => msg).join(' ')
  }

  if (typeof detail === 'string') {
    return detail
  }

  if (typeof error?.response?.data?.message === 'string') {
    return error.response.data.message
  }

  return 'No fue posible procesar la solicitud.'
}

function getEmployeeName(permission) {
  const persona = permission.contract?.employee?.user?.persona
  const fullName = [persona?.first_name, persona?.last_name].filter(Boolean).join(' ').trim()

  if (fullName) return fullName
  if (permission.response_user) return permission.response_user
  if (permission.contract?.employee?.user?.email) return permission.contract.employee.user.email

  return 'Empleado sin nombre'
}

function getEmployeeEmail(permission) {
  return permission.contract?.employee?.user?.email ?? 'Sin correo'
}

function getContractName(permission) {
  return permission.contract?.contract_name ?? `Contrato #${permission.contract_id ?? 'N/A'}`
}

function getPermissionTypeName(permission) {
  return permission.permission_type?.name ?? `Tipo #${permission.permission_type_id ?? 'N/A'}`
}

function getDurationDays(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = end.getTime() - start.getTime()

  if (Number.isNaN(diff)) return 'N/A'

  const days = Math.floor(diff / 86400000) + 1
  return `${days} dia${days === 1 ? '' : 's'}`
}

function formatDate(value) {
  if (!value) return 'N/A'

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function sortPermissions(items, sort) {
  const sorted = [...items]

  sorted.sort((left, right) => {
    const leftStart = new Date(left.start_date).getTime()
    const rightStart = new Date(right.start_date).getTime()

    if (sort === 'inicio-antiguo') {
      return leftStart - rightStart
    }

    if (sort === 'fin-reciente') {
      return new Date(right.end_date).getTime() - new Date(left.end_date).getTime()
    }

    if (sort === 'empleado-az') {
      return getEmployeeName(left).localeCompare(getEmployeeName(right))
    }

    return rightStart - leftStart
  })

  return sorted
}

export default function Permisos() {
  const queryClient = useQueryClient()
  const rootRef = useRef(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('todos')
  const [activeFilter, setActiveFilter] = useState('todos')
  const [sort, setSort] = useState('inicio-reciente')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [selectedPermission, setSelectedPermission] = useState(null)
  const [actionError, setActionError] = useState('')
  const deferredSearch = useDeferredValue(search.trim().toLowerCase())

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      justification: '',
    },
  })

  const queryParams = useMemo(() => ({
    page,
    page_size: PAGE_SIZE,
    ...(statusFilter !== 'todos' && { response_status: statusFilter }),
    ...(activeFilter !== 'todos' && { is_active: activeFilter === 'activos' }),
  }), [activeFilter, page, statusFilter])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['permisos-admin', queryParams],
    queryFn: () => getPermissions(queryParams),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const approveMutation = useMutation({
    mutationFn: (permissionId) =>
      updatePermissionStatus(permissionId, {
        response_status: 'aprobado',
        justification: null,
      }),
    onSuccess: () => {
      setActionError('')
      queryClient.invalidateQueries({ queryKey: ['permisos-admin'] })
    },
    onError: (error) => {
      setActionError(normalizeError(error))
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ permissionId, justification }) =>
      updatePermissionStatus(permissionId, {
        response_status: 'rechazado',
        justification,
      }),
    onSuccess: () => {
      setActionError('')
      setSelectedPermission(null)
      reset({ justification: '' })
      queryClient.invalidateQueries({ queryKey: ['permisos-admin'] })
    },
    onError: (error) => {
      const detail = error?.response?.data?.detail

      if (Array.isArray(detail)) {
        detail.forEach(({ loc, msg }) => {
          const field = loc[loc.length - 1]
          if (typeof field === 'string') {
            setError(field, { message: msg })
          }
        })
      }

      setActionError(normalizeError(error))
    },
  })

  useEffect(() => {
    if (!selectedPermission) {
      reset({ justification: '' })
      return
    }

    reset({ justification: selectedPermission.justification ?? '' })
  }, [reset, selectedPermission])

  useEffect(() => {
    if (isLoading) return

    const ctx = gsap.context(() => {
      gsap.from('.per-header, .per-summary, .per-filters, .per-table-card', {
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
    const filtered = items.filter((permission) => {
      if (!deferredSearch) return true

      const haystack = [
        getEmployeeName(permission),
        getEmployeeEmail(permission),
        getContractName(permission),
        getPermissionTypeName(permission),
        permission.justification,
        permission.url,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(deferredSearch)
    })

    return sortPermissions(filtered, sort)
  }, [deferredSearch, items, sort])

  const summary = useMemo(() => {
    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      inactive: 0,
    }

    items.forEach((permission) => {
      if (permission.response_status === 'pendiente') counts.pending += 1
      if (permission.response_status === 'aprobado') counts.approved += 1
      if (permission.response_status === 'rechazado') counts.rejected += 1
      if (!permission.is_active) counts.inactive += 1
    })

    return counts
  }, [items])

  const handleSearchChange = (event) => {
    setSearch(event.target.value)
    setPage(1)
  }

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value)
    setPage(1)
  }

  const handleActiveFilterChange = (event) => {
    setActiveFilter(event.target.value)
    setPage(1)
  }

  const handleSortChange = (event) => {
    setSort(event.target.value)
  }

  const handleRejectOpen = (permission) => {
    setActionError('')
    setSelectedPermission(permission)
  }

  const handleRejectClose = () => {
    setSelectedPermission(null)
    reset({ justification: '' })
  }

  const onRejectSubmit = ({ justification }) => {
    if (!selectedPermission) return

    rejectMutation.mutate({
      permissionId: selectedPermission.id,
      justification,
    })
  }

  return (
    <AdminLayout>
      <div className="per-page" ref={rootRef}>
        <div className="per-header">
          <nav className="per-header__breadcrumb">
            <span>PANEL</span>
            <span className="per-header__sep">/</span>
            <span className="per-header__crumb-active">PERMISOS</span>
          </nav>

          <div className="per-header__row">
            <div>
              <h1 className="per-header__title">Solicitudes de permisos</h1>
              <p className="per-header__sub">
                Revise, apruebe o rechace los permisos registrados por los empleados desde la aplicacion movil.
              </p>
            </div>

            <div className="per-header__note">
              <span className="per-header__note-label">Total</span>
              <strong className="per-header__note-value">{total}</strong>
            </div>
          </div>
        </div>

        <div className="per-summary">
          <div className="per-summary__card">
            <span className="per-summary__label">Pendientes en pagina</span>
            <strong className="per-summary__value">{summary.pending}</strong>
          </div>
          <div className="per-summary__card">
            <span className="per-summary__label">Aprobados en pagina</span>
            <strong className="per-summary__value">{summary.approved}</strong>
          </div>
          <div className="per-summary__card">
            <span className="per-summary__label">Rechazados en pagina</span>
            <strong className="per-summary__value">{summary.rejected}</strong>
          </div>
          <div className="per-summary__card">
            <span className="per-summary__label">Inactivos en pagina</span>
            <strong className="per-summary__value">{summary.inactive}</strong>
          </div>
        </div>

        <div className="per-filters">
          <div className="per-filters__search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="per-filters__search-input"
              placeholder="BUSCAR EMPLEADO, CONTRATO O TIPO DE PERMISO"
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="per-filters__control">
            <span className="per-filters__label">ESTADO:</span>
            <select
              className="per-filters__select"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="todos">TODOS</option>
              <option value="pendiente">PENDIENTE</option>
              <option value="aprobado">APROBADO</option>
              <option value="rechazado">RECHAZADO</option>
            </select>
          </div>

          <div className="per-filters__control">
            <span className="per-filters__label">REGISTRO:</span>
            <select
              className="per-filters__select"
              value={activeFilter}
              onChange={handleActiveFilterChange}
            >
              <option value="todos">TODOS</option>
              <option value="activos">ACTIVOS</option>
              <option value="inactivos">INACTIVOS</option>
            </select>
          </div>

          <div className="per-filters__control">
            <span className="per-filters__label">ORDEN:</span>
            <select
              className="per-filters__select"
              value={sort}
              onChange={handleSortChange}
            >
              <option value="inicio-reciente">INICIO RECIENTE</option>
              <option value="inicio-antiguo">INICIO ANTIGUO</option>
              <option value="fin-reciente">FIN RECIENTE</option>
              <option value="empleado-az">EMPLEADO A-Z</option>
            </select>
          </div>
        </div>

        <div className="per-table-card">
          <div className="per-table-card__header">
            <div>
              <h2 className="per-table-card__title">Bandeja administrativa</h2>
              <p className="per-table-card__sub">
                Cada cambio de estado actualiza inmediatamente el permiso en el backend.
              </p>
            </div>
          </div>

          {actionError && <div className="per-alert per-alert--error">{actionError}</div>}

          {isLoading ? (
            <div className="per-state">
              <div className="per-spinner" />
              <span>Cargando solicitudes...</span>
            </div>
          ) : isError ? (
            <div className="per-state per-state--error">
              No fue posible cargar los permisos.
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="per-state">
              No se encontraron solicitudes con los filtros actuales.
            </div>
          ) : (
            <div className="per-table-wrap">
              <table className="per-table">
                <thead>
                  <tr>
                    <th>EMPLEADO</th>
                    <th>TIPO</th>
                    <th>PERIODO</th>
                    <th>ESTADO</th>
                    <th>REGISTRO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((permission) => {
                    const statusMeta = STATUS_META[permission.response_status] ?? STATUS_META.pendiente
                    const activeMeta = ACTIVE_META[String(permission.is_active)] ?? ACTIVE_META.true
                    const employeeName = getEmployeeName(permission)
                    const employeeEmail = getEmployeeEmail(permission)
                    const permissionTypeName = getPermissionTypeName(permission)
                    const contractName = getContractName(permission)
                    const expanded = expandedId === permission.id
                    const approving = approveMutation.isPending && approveMutation.variables === permission.id
                    const rejecting = rejectMutation.isPending && rejectMutation.variables?.permissionId === permission.id
                    const disableApprove = approving || rejecting || permission.response_status === 'aprobado'
                    const disableReject = approving || rejecting || permission.response_status === 'rechazado'

                    return (
                      <FragmentRow
                        key={permission.id}
                        expanded={expanded}
                        row={(
                          <tr className="per-table__row">
                            <td>
                              <button
                                type="button"
                                className="per-employee"
                                onClick={() => setExpandedId(expanded ? null : permission.id)}
                              >
                                <span className="per-employee__avatar">
                                  {employeeName
                                    .split(' ')
                                    .slice(0, 2)
                                    .map((chunk) => chunk[0])
                                    .join('')
                                    .toUpperCase()}
                                </span>
                                <span className="per-employee__content">
                                  <span className="per-employee__name">{employeeName}</span>
                                  <span className="per-employee__email">{employeeEmail}</span>
                                </span>
                              </button>
                            </td>
                            <td>
                              <div className="per-type">
                                <span className="per-type__name">{permissionTypeName}</span>
                                <span className="per-type__meta">{contractName}</span>
                              </div>
                            </td>
                            <td>
                              <div className="per-period">
                                <span className="per-period__range">
                                  {formatDate(permission.start_date)} - {formatDate(permission.end_date)}
                                </span>
                                <span className="per-period__days">
                                  {getDurationDays(permission.start_date, permission.end_date)}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={`per-badge ${statusMeta.badge}`}>{statusMeta.label}</span>
                            </td>
                            <td>
                              <span className={`per-badge ${activeMeta.badge}`}>{activeMeta.label}</span>
                            </td>
                            <td>
                              <div className="per-actions">
                                <button
                                  type="button"
                                  className="per-action-btn per-action-btn--success"
                                  disabled={disableApprove}
                                  onClick={() => approveMutation.mutate(permission.id)}
                                >
                                  {approving ? 'Procesando' : 'Aprobar'}
                                </button>
                                <button
                                  type="button"
                                  className="per-action-btn per-action-btn--danger"
                                  disabled={disableReject}
                                  onClick={() => handleRejectOpen(permission)}
                                >
                                  {rejecting ? 'Procesando' : 'Rechazar'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                        detail={(
                          <tr className="per-table__detail-row">
                            <td colSpan="6">
                              <div className="per-detail">
                                <div className="per-detail__grid">
                                  <div className="per-detail__card">
                                    <span className="per-detail__label">Contrato</span>
                                    <p className="per-detail__text">{contractName}</p>
                                  </div>
                                  <div className="per-detail__card">
                                    <span className="per-detail__label">Justificacion</span>
                                    <p className="per-detail__text">
                                      {permission.justification || 'Sin justificacion registrada.'}
                                    </p>
                                  </div>
                                  <div className="per-detail__card">
                                    <span className="per-detail__label">Creado por</span>
                                    <p className="per-detail__text">
                                      {permission.responsible_user || 'Sin responsable registrado.'}
                                    </p>
                                  </div>
                                  <div className="per-detail__card">
                                    <span className="per-detail__label">Respondido por</span>
                                    <p className="per-detail__text">
                                      {permission.response_user || 'Aun sin respuesta administrativa.'}
                                    </p>
                                  </div>
                                  <div className="per-detail__card per-detail__card--full">
                                    <span className="per-detail__label">Soporte</span>
                                    {permission.url ? (
                                      <a
                                        href={permission.url}
                                        className="per-detail__link"
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        Abrir soporte
                                      </a>
                                    ) : (
                                      <p className="per-detail__text">Sin soporte cargado.</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && !isError && total > 0 && (
            <div className="per-pagination">
              <span className="per-pagination__info">
                MOSTRANDO {visibleItems.length} DE {total} REGISTROS
              </span>

              <div className="per-pagination__controls">
                <button
                  type="button"
                  className="per-pagination__btn"
                  disabled={page === 1}
                  onClick={() => setPage((currentPage) => currentPage - 1)}
                >
                  Anterior
                </button>

                {pageNumbers.map((value, index) =>
                  value === '...'
                    ? (
                      <span key={`ellipsis-${index}`} className="per-pagination__ellipsis">
                        ...
                      </span>
                    )
                    : (
                      <button
                        key={value}
                        type="button"
                        className={`per-pagination__btn${value === page ? ' per-pagination__btn--active' : ''}`}
                        onClick={() => setPage(value)}
                      >
                        {value}
                      </button>
                    )
                )}

                <button
                  type="button"
                  className="per-pagination__btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedPermission && (
          <div className="per-reject-overlay" onClick={handleRejectClose}>
            <div className="per-reject-panel" onClick={(event) => event.stopPropagation()}>
              <div className="per-reject-panel__header">
                <div>
                  <h3 className="per-reject-panel__title">Rechazar solicitud</h3>
                  <p className="per-reject-panel__sub">
                    Registre la justificacion para {getEmployeeName(selectedPermission)}.
                  </p>
                </div>

                <button
                  type="button"
                  className="per-reject-panel__close"
                  onClick={handleRejectClose}
                >
                  Cerrar
                </button>
              </div>

              <form className="per-reject-form" onSubmit={handleSubmit(onRejectSubmit)}>
                <div className="per-reject-form__summary">
                  <span>{getPermissionTypeName(selectedPermission)}</span>
                  <span>{getContractName(selectedPermission)}</span>
                  <span>
                    {formatDate(selectedPermission.start_date)} - {formatDate(selectedPermission.end_date)}
                  </span>
                </div>

                <label className="per-reject-form__label" htmlFor="justification">
                  Justificacion
                </label>
                <textarea
                  id="justification"
                  className={`per-reject-form__textarea${errors.justification ? ' per-reject-form__textarea--error' : ''}`}
                  rows={5}
                  placeholder="Explique por que esta solicitud no puede ser aprobada."
                  {...register('justification', {
                    required: 'La justificacion es obligatoria para rechazar.',
                  })}
                />
                {errors.justification && (
                  <span className="per-reject-form__error">{errors.justification.message}</span>
                )}

                <div className="per-reject-form__actions">
                  <button
                    type="button"
                    className="per-reject-form__btn per-reject-form__btn--cancel"
                    onClick={handleRejectClose}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="per-reject-form__btn per-reject-form__btn--danger"
                    disabled={rejectMutation.isPending}
                  >
                    {rejectMutation.isPending ? 'Guardando' : 'Confirmar rechazo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function FragmentRow({ row, detail, expanded }) {
  return (
    <>
      {row}
      {expanded ? detail : null}
    </>
  )
}
