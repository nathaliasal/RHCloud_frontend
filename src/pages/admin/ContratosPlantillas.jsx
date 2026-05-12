import { useEffect, useMemo, useRef, useState, useDeferredValue } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { AdminLayout } from '@/components/AdminLayout'
import { ContratoPlantillaModal, CONTRACT_TYPES } from '@/components/ContratoPlantillaModal'
import {
  getContratosPlantillas,
  deleteContratoPlantilla,
  toggleActivacionContratoPlantilla,
  getCargosPublic,
} from '@/services/contratosPlantillas'
import { getEmpresas } from '@/services/empresas'
import './ContratosPlantillas.css'

const PAGE_SIZE = 10

const CONTRACT_TYPE_META = {
  INDEFINIDO:          'cp-badge--accent',
  TERMINOFIJO:         'cp-badge--warning',
  OBRASERVICIO:        'cp-badge--muted',
  PRESTASIONSERVICIOS: 'cp-badge--muted',
  APRENDIZAJE:         'cp-badge--muted',
  PRACTICAS:           'cp-badge--muted',
}

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

function labelFor(list, value) {
  return list.find(opt => opt.value === value)?.label ?? value ?? 'N/A'
}

function formatDate(value) {
  if (!value) return 'N/A'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatCurrency(amount, currency) {
  if (amount == null) return 'N/A'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency ?? 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function normalizeError(error) {
  const detail = error?.response?.data?.detail
  if (Array.isArray(detail)) return detail.map(({ msg }) => msg).join(' ')
  if (typeof detail === 'string') return detail
  if (typeof error?.response?.data?.message === 'string') return error.response.data.message
  return 'No fue posible procesar la solicitud.'
}

export default function ContratosPlantillas() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const rootRef = useRef(null)

  const [page, setPage] = useState(1)
  const [activeFilter, setActiveFilter] = useState('todas')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim().toLowerCase())

  const [showModal, setShowModal] = useState(false)
  const [editingContract, setEditingContract] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [actionError, setActionError] = useState('')

  const queryParams = useMemo(() => ({
    page,
    page_size: PAGE_SIZE,
    ...(activeFilter === 'activos' && { is_active: true }),
    ...(activeFilter === 'inactivos' && { is_active: false }),
  }), [page, activeFilter])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contratos-plantillas', queryParams],
    queryFn: () => getContratosPlantillas(queryParams),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: empresasData } = useQuery({
    queryKey: ['empresas-select'],
    queryFn: () => getEmpresas({ page: 1, page_size: 100 }),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })

  const { data: cargosData } = useQuery({
    queryKey: ['cargos-select'],
    queryFn: getCargosPublic,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })

  const empresas = empresasData?.items ?? []
  const cargos = cargosData?.items ?? []

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteContratoPlantilla(id),
    onSuccess: () => {
      setActionError('')
      setConfirmDelete(null)
      queryClient.invalidateQueries({ queryKey: ['contratos-plantillas'] })
    },
    onError: (error) => {
      setActionError(normalizeError(error))
      setConfirmDelete(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => toggleActivacionContratoPlantilla(id, isActive),
    onSuccess: () => {
      setActionError('')
      queryClient.invalidateQueries({ queryKey: ['contratos-plantillas'] })
    },
    onError: (error) => {
      setActionError(normalizeError(error))
    },
  })

  useEffect(() => {
    if (isLoading) return
    const ctx = gsap.context(() => {
      gsap.from('.cp-header, .cp-summary, .cp-filters, .cp-table-card', {
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
    return items.filter((c) =>
      c.contract_name?.toLowerCase().includes(deferredSearch)
    )
  }, [deferredSearch, items])

  const summary = useMemo(() => {
    const counts = { total: items.length, activos: 0, inactivos: 0 }
    items.forEach((c) => {
      if (c.is_active) counts.activos += 1
      else counts.inactivos += 1
    })
    return counts
  }, [items])

  return (
    <AdminLayout>
      <div className="cp-page" ref={rootRef}>
        <div className="cp-header">
          <nav className="cp-header__breadcrumb">
            <span>PANEL</span>
            <span className="cp-header__sep">/</span>
            <span>CONTRATOS</span>
            <span className="cp-header__sep">/</span>
            <span className="cp-header__crumb-active">PLANTILLAS</span>
          </nav>

          <div className="cp-header__row">
            <div>
              <h1 className="cp-header__title">Plantillas de contratos</h1>
              <p className="cp-header__sub">
                Gestione las plantillas de contratos establecidos. Haga clic en un registro para ver su detalle completo.
              </p>
            </div>

            <div className="cp-header__actions">
              <div className="cp-header__note">
                <span className="cp-header__note-label">Total</span>
                <strong className="cp-header__note-value">{total}</strong>
              </div>
              <button type="button" className="cp-btn-new" onClick={() => setShowModal(true)}>
                + Nuevo contrato
              </button>
            </div>
          </div>
        </div>

        <div className="cp-summary">
          <div className="cp-summary__card">
            <span className="cp-summary__label">En esta página</span>
            <strong className="cp-summary__value">{summary.total}</strong>
          </div>
          <div className="cp-summary__card">
            <span className="cp-summary__label">Activos en página</span>
            <strong className="cp-summary__value cp-summary__value--success">{summary.activos}</strong>
          </div>
          <div className="cp-summary__card">
            <span className="cp-summary__label">Inactivos en página</span>
            <strong className="cp-summary__value cp-summary__value--muted">{summary.inactivos}</strong>
          </div>
        </div>

        <div className="cp-filters">
          <div className="cp-filters__search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="cp-filters__search-input"
              placeholder="BUSCAR POR NOMBRE DE CONTRATO"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          <div className="cp-filters__control">
            <span className="cp-filters__label">ESTADO:</span>
            <select
              className="cp-filters__select"
              value={activeFilter}
              onChange={(e) => { setActiveFilter(e.target.value); setPage(1) }}
            >
              <option value="todas">TODOS</option>
              <option value="activos">ACTIVOS</option>
              <option value="inactivos">INACTIVOS</option>
            </select>
          </div>
        </div>

        <div className="cp-table-card">
          <div className="cp-table-card__header">
            <div>
              <h2 className="cp-table-card__title">Contratos registrados</h2>
              <p className="cp-table-card__sub">
                Haga clic en el nombre del contrato para acceder a su detalle completo.
              </p>
            </div>
          </div>

          {actionError && (
            <div className="cp-alert cp-alert--error">{actionError}</div>
          )}

          {isLoading ? (
            <div className="cp-state">
              <div className="cp-spinner" />
              <span>Cargando contratos...</span>
            </div>
          ) : isError ? (
            <div className="cp-state cp-state--error">
              No fue posible cargar las plantillas de contratos.
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="cp-state">
              No se encontraron contratos con los filtros actuales.
            </div>
          ) : (
            <div className="cp-table-wrap">
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>CONTRATO</th>
                    <th>TIPO</th>
                    <th>SALARIO BASE</th>
                    <th>VIGENCIA</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((contrato) => {
                    const typeBadge = CONTRACT_TYPE_META[contrato.contract_type] ?? 'cp-badge--muted'
                    const toggling = toggleMutation.isPending && toggleMutation.variables?.id === contrato.id
                    const deleting = deleteMutation.isPending && deleteMutation.variables === contrato.id

                    return (
                      <tr
                        key={contrato.id}
                        className="cp-table__row"
                        onClick={() => setEditingContract(contrato)}
                      >
                        <td>
                          <div className="cp-contract-name">
                            <span className="cp-contract-name__text">{contrato.contract_name}</span>
                            <span className="cp-contract-name__id">ID {contrato.id}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`cp-badge ${typeBadge}`}>
                            {labelFor(CONTRACT_TYPES, contrato.contract_type)}
                          </span>
                        </td>
                        <td>
                          <div className="cp-salary">
                            <span className="cp-salary__amount">
                              {formatCurrency(contrato.salary_base, contrato.currency_type)}
                            </span>
                            <span className="cp-salary__currency">{contrato.currency_type}</span>
                          </div>
                        </td>
                        <td>
                          <div className="cp-dates">
                            <span className="cp-dates__from">{formatDate(contrato.start_date)}</span>
                            {contrato.end_date && (
                              <span className="cp-dates__to">hasta {formatDate(contrato.end_date)}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`cp-badge ${contrato.is_active ? 'cp-badge--success' : 'cp-badge--muted'}`}>
                            {contrato.is_active ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="cp-actions">
                            <button
                              type="button"
                              className={`cp-action-btn ${contrato.is_active ? 'cp-action-btn--warning' : 'cp-action-btn--success'}`}
                              disabled={toggling}
                              onClick={() => toggleMutation.mutate({ id: contrato.id, isActive: !contrato.is_active })}
                            >
                              {toggling ? '...' : contrato.is_active ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                              type="button"
                              className="cp-action-btn cp-action-btn--danger"
                              disabled={deleting}
                              onClick={() => { setActionError(''); setConfirmDelete(contrato) }}
                            >
                              {deleting ? '...' : 'Eliminar'}
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
            <div className="cp-pagination">
              <span className="cp-pagination__info">
                MOSTRANDO {visibleItems.length} DE {total} REGISTROS
              </span>
              <div className="cp-pagination__controls">
                <button
                  type="button"
                  className="cp-pagination__btn"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Anterior
                </button>
                {pageNumbers.map((val, i) =>
                  val === '...'
                    ? <span key={`e-${i}`} className="cp-pagination__ellipsis">...</span>
                    : (
                      <button
                        key={val}
                        type="button"
                        className={`cp-pagination__btn${val === page ? ' cp-pagination__btn--active' : ''}`}
                        onClick={() => setPage(val)}
                      >
                        {val}
                      </button>
                    )
                )}
                <button
                  type="button"
                  className="cp-pagination__btn"
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

      <ContratoPlantillaModal
        show={showModal || !!editingContract}
        onClose={() => { setShowModal(false); setEditingContract(null) }}
        empresas={empresas}
        cargos={cargos}
        initialContract={editingContract}
      />

      {/* ── Confirmar eliminación ── */}
      {confirmDelete && (
        <div className="cp-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="cp-confirm" onClick={(e) => e.stopPropagation()}>
            <h3 className="cp-confirm__title">Eliminar contrato</h3>
            <p className="cp-confirm__text">
              ¿Está seguro de eliminar <strong>{confirmDelete.contract_name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="cp-confirm__actions">
              <button
                type="button"
                className="cp-modal__btn cp-modal__btn--cancel"
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="cp-modal__btn cp-modal__btn--danger"
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
