import { useState, useDeferredValue } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getContratosPlantillas, getContratoPlantilla } from '@/services/contratosPlantillas'
import '@/pages/admin/ContratosPlantillas.css'

const PAGE_SIZE = 8

const CONTRACT_TYPE_LABELS = {
  indefinido:             'Indefinido',
  termino_fijo:           'Término fijo',
  obra_o_servicio:        'Obra o servicio',
  prestacion_servicios:   'Prestación de servicios',
  aprendizaje:            'Aprendizaje',
  practicas:              'Prácticas',
}

function formatCurrency(amount, currency) {
  if (amount == null) return 'N/A'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency ?? 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export function PlantillaPickerModal({ show, onClose, onSelect }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim())

  const { data, isLoading, isError } = useQuery({
    queryKey: ['plantillas-picker', page, deferredSearch],
    queryFn: () => getContratosPlantillas({
      page,
      page_size: PAGE_SIZE,
      is_active: true,
      ...(deferredSearch && { contract_name: deferredSearch }),
    }),
    enabled: show,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.total_pages ?? 1
  const pageNumbers = buildPageNumbers(page, totalPages)

  const selectMutation = useMutation({
    mutationFn: (id) => getContratoPlantilla(id),
    onSuccess: (fullTemplate) => onSelect(fullTemplate),
  })

  if (!show) return null

  const handleSelect = (template) => {
    selectMutation.mutate(template.id)
  }

  return (
    <div className="cp-overlay" style={{ zIndex: 140 }} onClick={onClose}>
      <div
        className="cp-modal"
        style={{ maxWidth: 720 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.4rem 1.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="cp-modal__title">Seleccionar plantilla de contrato</h3>
          <p className="cp-modal__sub" style={{ marginTop: '0.2rem' }}>
            Elija una plantilla activa para precargar los datos del nuevo contrato.
          </p>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.55rem',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 9, padding: '0.6rem 0.9rem', marginTop: '0.85rem',
            color: 'rgba(237,244,255,0.3)',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: '0.75rem', fontFamily: 'var(--font-primary)',
                color: 'var(--color-text)', width: '100%', letterSpacing: '0.03em',
              }}
              placeholder="BUSCAR POR NOMBRE DE PLANTILLA"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="cp-modal__body">
          {isLoading ? (
            <div className="cp-state"><div className="cp-spinner" /><span>Cargando plantillas...</span></div>
          ) : isError ? (
            <div className="cp-state" style={{ color: 'var(--color-error)' }}>
              No fue posible cargar las plantillas.
            </div>
          ) : items.length === 0 ? (
            <div className="cp-state">No hay plantillas activas disponibles.</div>
          ) : (
            <table className="cp-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>NOMBRE</th>
                  <th>TIPO</th>
                  <th>SALARIO BASE</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => {
                  const isSelecting = selectMutation.isPending && selectMutation.variables === t.id
                  return (
                    <tr
                      key={t.id}
                      className="cp-table__row"
                      onClick={() => !selectMutation.isPending && handleSelect(t)}
                    >
                      <td>
                        <div className="cp-contract-name">
                          <span className="cp-contract-name__text">{t.contract_name}</span>
                          <span className="cp-contract-name__id">ID {t.id}</span>
                        </div>
                      </td>
                      <td>
                        <span className="cp-badge cp-badge--accent">
                          {CONTRACT_TYPE_LABELS[t.contract_type] ?? t.contract_type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.82rem' }}>
                        {formatCurrency(t.salary_base, t.currency_type)}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="cp-action-btn cp-action-btn--accent"
                          disabled={selectMutation.isPending}
                          onClick={() => handleSelect(t)}
                        >
                          {isSelecting ? '...' : 'Seleccionar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination + footer */}
        {!isLoading && !isError && total > PAGE_SIZE && (
          <div className="cp-pagination" style={{ padding: '0.75rem 1rem' }}>
            <span className="cp-pagination__info">
              {total} PLANTILLAS ACTIVAS
            </span>
            <div className="cp-pagination__controls">
              <button type="button" className="cp-pagination__btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Ant.</button>
              {pageNumbers.map((val, i) =>
                val === '...'
                  ? <span key={`e-${i}`} className="cp-pagination__ellipsis">...</span>
                  : (
                    <button key={val} type="button"
                      className={`cp-pagination__btn${val === page ? ' cp-pagination__btn--active' : ''}`}
                      onClick={() => setPage(val)}
                    >{val}</button>
                  )
              )}
              <button type="button" className="cp-pagination__btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sig.</button>
            </div>
          </div>
        )}

        <div className="cp-modal__footer">
          <button type="button" className="cp-modal__btn cp-modal__btn--cancel" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
