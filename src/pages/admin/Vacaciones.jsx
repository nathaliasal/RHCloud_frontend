import { useEffect, useMemo, useRef, useState, useDeferredValue } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { AdminLayout } from '@/components/AdminLayout'
import { http } from '@/services/http'
import './Vacaciones.css'

const PAGE_SIZE = 10
const LIST_ENDPOINT = '/api/v1/vacations/'

const STATUS_META = {
  pendiente: { label: 'PENDIENTE', badge: 'vac-badge--warning' },
  aprobado: { label: 'APROBADO', badge: 'vac-badge--success' },
  rechazado: { label: 'RECHAZADO', badge: 'vac-badge--error' },
}

const ACTIVE_META = {
  true: { label: 'ACTIVA', badge: 'vac-badge--accent' },
  false: { label: 'INACTIVA', badge: 'vac-badge--muted' },
}

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

function getVacations(params) {
  return http.get(LIST_ENDPOINT, { params }).then((response) => response.data)
}

function updateVacationStatus(vacationId, body) {
  return http.patch(`/api/v1/vacations/${vacationId}/status`, body).then((response) => response.data)
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

function getEmployeeName(vacation) {
  const persona = vacation.contract?.employee?.user?.persona
  const fullName = [persona?.first_name, persona?.last_name].filter(Boolean).join(' ').trim()

  if (fullName) return fullName
  if (vacation.response_user) return vacation.response_user
  if (vacation.contract?.employee?.user?.email) return vacation.contract.employee.user.email

  return 'Empleado sin nombre'
}

function getEmployeeEmail(vacation) {
  return vacation.contract?.employee?.user?.email ?? 'Sin correo'
}

function getContractName(vacation) {
  return vacation.contract?.contract_name ?? `Contrato #${vacation.contract_id ?? 'N/A'}`
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

function sortVacations(items, sort) {
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

export default function Vacaciones() {
  const queryClient = useQueryClient()
  const rootRef = useRef(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('todos')
  const [activeFilter, setActiveFilter] = useState('todas')
  const [sort, setSort] = useState('inicio-reciente')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [selectedVacation, setSelectedVacation] = useState(null)
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
    ...(activeFilter !== 'todas' && { is_active: activeFilter === 'activas' }),
  }), [activeFilter, page, statusFilter])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['vacaciones-admin', queryParams],
    queryFn: () => getVacations(queryParams),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const approveMutation = useMutation({
    mutationFn: (vacationId) =>
      updateVacationStatus(vacationId, {
        response_status: 'aprobado',
        justification: null,
      }),
    onSuccess: () => {
      setActionError('')
      queryClient.invalidateQueries({ queryKey: ['vacaciones-admin'] })
    },
    onError: (error) => {
      setActionError(normalizeError(error))
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ vacationId, justification }) =>
      updateVacationStatus(vacationId, {
        response_status: 'rechazado',
        justification,
      }),
    onSuccess: () => {
      setActionError('')
      setSelectedVacation(null)
      reset({ justification: '' })
      queryClient.invalidateQueries({ queryKey: ['vacaciones-admin'] })
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
    if (!selectedVacation) {
      reset({ justification: '' })
      return
    }

    reset({ justification: selectedVacation.justification ?? '' })
  }, [reset, selectedVacation])

  useEffect(() => {
    if (isLoading) return

    const ctx = gsap.context(() => {
      gsap.from('.vac-header, .vac-summary, .vac-filters, .vac-table-card', {
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
    const filtered = items.filter((vacation) => {
      if (!deferredSearch) return true

      const haystack = [
        getEmployeeName(vacation),
        getEmployeeEmail(vacation),
        getContractName(vacation),
        vacation.reason,
        vacation.justification,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(deferredSearch)
    })

    return sortVacations(filtered, sort)
  }, [deferredSearch, items, sort])

  const summary = useMemo(() => {
    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      inactive: 0,
    }

    items.forEach((vacation) => {
      if (vacation.response_status === 'pendiente') counts.pending += 1
      if (vacation.response_status === 'aprobado') counts.approved += 1
      if (vacation.response_status === 'rechazado') counts.rejected += 1
      if (!vacation.is_active) counts.inactive += 1
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

  const handleRejectOpen = (vacation) => {
    setActionError('')
    setSelectedVacation(vacation)
  }

  const handleRejectClose = () => {
    setSelectedVacation(null)
    reset({ justification: '' })
  }

  const onRejectSubmit = ({ justification }) => {
    if (!selectedVacation) return

    rejectMutation.mutate({
      vacationId: selectedVacation.id,
      justification,
    })
  }

  return (
    <AdminLayout>
      <div className="vac-page" ref={rootRef}>
        <div className="vac-header">
          <nav className="vac-header__breadcrumb">
            <span>PANEL</span>
            <span className="vac-header__sep">/</span>
            <span className="vac-header__crumb-active">VACACIONES</span>
          </nav>

          <div className="vac-header__row">
            <div>
              <h1 className="vac-header__title">Solicitudes de vacaciones</h1>
              <p className="vac-header__sub">
                Revise, apruebe o rechace las solicitudes enviadas desde la aplicacion movil.
              </p>
            </div>

            <div className="vac-header__note">
              <span className="vac-header__note-label">Total</span>
              <strong className="vac-header__note-value">{total}</strong>
            </div>
          </div>
        </div>

        <div className="vac-summary">
          <div className="vac-summary__card">
            <span className="vac-summary__label">Pendientes en pagina</span>
            <strong className="vac-summary__value">{summary.pending}</strong>
          </div>
          <div className="vac-summary__card">
            <span className="vac-summary__label">Aprobadas en pagina</span>
            <strong className="vac-summary__value">{summary.approved}</strong>
          </div>
          <div className="vac-summary__card">
            <span className="vac-summary__label">Rechazadas en pagina</span>
            <strong className="vac-summary__value">{summary.rejected}</strong>
          </div>
          <div className="vac-summary__card">
            <span className="vac-summary__label">Inactivas en pagina</span>
            <strong className="vac-summary__value">{summary.inactive}</strong>
          </div>
        </div>

        <div className="vac-filters">
          <div className="vac-filters__search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="vac-filters__search-input"
              placeholder="BUSCAR EMPLEADO, CONTRATO O MOTIVO"
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="vac-filters__control">
            <span className="vac-filters__label">ESTADO:</span>
            <select
              className="vac-filters__select"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="todos">TODOS</option>
              <option value="pendiente">PENDIENTE</option>
              <option value="aprobado">APROBADO</option>
              <option value="rechazado">RECHAZADO</option>
            </select>
          </div>

          <div className="vac-filters__control">
            <span className="vac-filters__label">REGISTRO:</span>
            <select
              className="vac-filters__select"
              value={activeFilter}
              onChange={handleActiveFilterChange}
            >
              <option value="todas">TODAS</option>
              <option value="activas">ACTIVAS</option>
              <option value="inactivas">INACTIVAS</option>
            </select>
          </div>

          <div className="vac-filters__control">
            <span className="vac-filters__label">ORDEN:</span>
            <select
              className="vac-filters__select"
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

        <div className="vac-table-card">
          <div className="vac-table-card__header">
            <div>
              <h2 className="vac-table-card__title">Bandeja administrativa</h2>
              <p className="vac-table-card__sub">
                Las acciones afectan directamente el estado del registro en el backend.
              </p>
            </div>
          </div>

          {actionError && <div className="vac-alert vac-alert--error">{actionError}</div>}

          {isLoading ? (
            <div className="vac-state">
              <div className="vac-spinner" />
              <span>Cargando solicitudes...</span>
            </div>
          ) : isError ? (
            <div className="vac-state vac-state--error">
              No fue posible cargar las vacaciones.
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="vac-state">
              No se encontraron solicitudes con los filtros actuales.
            </div>
          ) : (
            <div className="vac-table-wrap">
              <table className="vac-table">
                <thead>
                  <tr>
                    <th>EMPLEADO</th>
                    <th>CONTRATO</th>
                    <th>PERIODO</th>
                    <th>ESTADO</th>
                    <th>REGISTRO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((vacation) => {
                    const statusMeta = STATUS_META[vacation.response_status] ?? STATUS_META.pendiente
                    const activeMeta = ACTIVE_META[String(vacation.is_active)] ?? ACTIVE_META.true
                    const employeeName = getEmployeeName(vacation)
                    const employeeEmail = getEmployeeEmail(vacation)
                    const contractName = getContractName(vacation)
                    const expanded = expandedId === vacation.id
                    const approving = approveMutation.isPending && approveMutation.variables === vacation.id
                    const rejecting = rejectMutation.isPending && rejectMutation.variables?.vacationId === vacation.id
                    const disableApprove = approving || rejecting || vacation.response_status === 'aprobado'
                    const disableReject = approving || rejecting || vacation.response_status === 'rechazado'

                    return (
                      <FragmentRow
                        key={vacation.id}
                        expanded={expanded}
                        row={(
                          <tr className="vac-table__row">
                            <td>
                              <button
                                type="button"
                                className="vac-employee"
                                onClick={() => setExpandedId(expanded ? null : vacation.id)}
                              >
                                <span className="vac-employee__avatar">
                                  {employeeName
                                    .split(' ')
                                    .slice(0, 2)
                                    .map((chunk) => chunk[0])
                                    .join('')
                                    .toUpperCase()}
                                </span>
                                <span className="vac-employee__content">
                                  <span className="vac-employee__name">{employeeName}</span>
                                  <span className="vac-employee__email">{employeeEmail}</span>
                                </span>
                              </button>
                            </td>
                            <td>
                              <div className="vac-contract">
                                <span className="vac-contract__name">{contractName}</span>
                                <span className="vac-contract__meta">ID {vacation.contract_id ?? 'N/A'}</span>
                              </div>
                            </td>
                            <td>
                              <div className="vac-period">
                                <span className="vac-period__range">
                                  {formatDate(vacation.start_date)} - {formatDate(vacation.end_date)}
                                </span>
                                <span className="vac-period__days">
                                  {getDurationDays(vacation.start_date, vacation.end_date)}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={`vac-badge ${statusMeta.badge}`}>{statusMeta.label}</span>
                            </td>
                            <td>
                              <span className={`vac-badge ${activeMeta.badge}`}>{activeMeta.label}</span>
                            </td>
                            <td>
                              <div className="vac-actions">
                                <button
                                  type="button"
                                  className="vac-action-btn vac-action-btn--success"
                                  disabled={disableApprove}
                                  onClick={() => approveMutation.mutate(vacation.id)}
                                >
                                  {approving ? 'Procesando' : 'Aprobar'}
                                </button>
                                <button
                                  type="button"
                                  className="vac-action-btn vac-action-btn--danger"
                                  disabled={disableReject}
                                  onClick={() => handleRejectOpen(vacation)}
                                >
                                  {rejecting ? 'Procesando' : 'Rechazar'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                        detail={(
                          <tr className="vac-table__detail-row">
                            <td colSpan="6">
                              <div className="vac-detail">
                                <div className="vac-detail__grid">
                                  <div className="vac-detail__card">
                                    <span className="vac-detail__label">Motivo</span>
                                    <p className="vac-detail__text">{vacation.reason || 'Sin motivo registrado.'}</p>
                                  </div>
                                  <div className="vac-detail__card">
                                    <span className="vac-detail__label">Justificacion</span>
                                    <p className="vac-detail__text">
                                      {vacation.justification || 'Sin justificacion registrada.'}
                                    </p>
                                  </div>
                                  <div className="vac-detail__card">
                                    <span className="vac-detail__label">Creado por</span>
                                    <p className="vac-detail__text">
                                      {vacation.responsible_user || 'Sin responsable registrado.'}
                                    </p>
                                  </div>
                                  <div className="vac-detail__card">
                                    <span className="vac-detail__label">Respondido por</span>
                                    <p className="vac-detail__text">
                                      {vacation.response_user || 'Aun sin respuesta administrativa.'}
                                    </p>
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
            <div className="vac-pagination">
              <span className="vac-pagination__info">
                MOSTRANDO {visibleItems.length} DE {total} REGISTROS
              </span>

              <div className="vac-pagination__controls">
                <button
                  type="button"
                  className="vac-pagination__btn"
                  disabled={page === 1}
                  onClick={() => setPage((currentPage) => currentPage - 1)}
                >
                  Anterior
                </button>

                {pageNumbers.map((value, index) =>
                  value === '...'
                    ? (
                      <span key={`ellipsis-${index}`} className="vac-pagination__ellipsis">
                        ...
                      </span>
                    )
                    : (
                      <button
                        key={value}
                        type="button"
                        className={`vac-pagination__btn${value === page ? ' vac-pagination__btn--active' : ''}`}
                        onClick={() => setPage(value)}
                      >
                        {value}
                      </button>
                    )
                )}

                <button
                  type="button"
                  className="vac-pagination__btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedVacation && (
          <div className="vac-reject-overlay" onClick={handleRejectClose}>
            <div className="vac-reject-panel" onClick={(event) => event.stopPropagation()}>
              <div className="vac-reject-panel__header">
                <div>
                  <h3 className="vac-reject-panel__title">Rechazar solicitud</h3>
                  <p className="vac-reject-panel__sub">
                    Registre la justificacion para {getEmployeeName(selectedVacation)}.
                  </p>
                </div>

                <button
                  type="button"
                  className="vac-reject-panel__close"
                  onClick={handleRejectClose}
                >
                  Cerrar
                </button>
              </div>

              <form className="vac-reject-form" onSubmit={handleSubmit(onRejectSubmit)}>
                <div className="vac-reject-form__summary">
                  <span>{getContractName(selectedVacation)}</span>
                  <span>
                    {formatDate(selectedVacation.start_date)} - {formatDate(selectedVacation.end_date)}
                  </span>
                </div>

                <label className="vac-reject-form__label" htmlFor="justification">
                  Justificacion
                </label>
                <textarea
                  id="justification"
                  className={`vac-reject-form__textarea${errors.justification ? ' vac-reject-form__textarea--error' : ''}`}
                  rows={5}
                  placeholder="Explique por que esta solicitud no puede ser aprobada."
                  {...register('justification', {
                    required: 'La justificacion es obligatoria para rechazar.',
                  })}
                />
                {errors.justification && (
                  <span className="vac-reject-form__error">{errors.justification.message}</span>
                )}

                <div className="vac-reject-form__actions">
                  <button
                    type="button"
                    className="vac-reject-form__btn vac-reject-form__btn--cancel"
                    onClick={handleRejectClose}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="vac-reject-form__btn vac-reject-form__btn--danger"
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
