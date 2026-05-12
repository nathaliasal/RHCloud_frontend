import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getDeducciones,
  createDeduccion,
  updateDeduccion,
  deleteDeduccion,
} from '@/services/contratosEmpleados'
import { getDeducciones as getTemplateDeducciones } from '@/services/contratosPlantillas'

const DEDUCTION_TYPES = [
  { value: 'salud',                       label: 'Salud' },
  { value: 'pension',                     label: 'Pensión' },
  { value: 'fondo_solidaridad_pensional', label: 'Fondo de solidaridad pensional' },
  { value: 'fondo_subsistencia',          label: 'Fondo de subsistencia' },
  { value: 'sindicato',                   label: 'Sindicato' },
  { value: 'embargo',                     label: 'Embargo' },
  { value: 'otro',                        label: 'Otro' },
]

const AMOUNT_TYPES = [
  { value: 'porcentaje', label: 'Porcentaje' },
  { value: 'valor_fijo', label: 'Valor fijo' },
]

const APPLICATION_TYPES = [
  { value: 'pre_nomina',  label: 'Pre-nómina (salario base)' },
  { value: 'post_nomina', label: 'Post-nómina (totalidad)' },
]

const DEDUCTION_DEFAULTS = {
  deduction_type:            'salud',
  amount_type:               'porcentaje',
  amount_value:              '',
  aplication_deduction_type: 'pre_nomina',
  start_date:                '',
  end_date:                  '',
  description:               '',
  amount:                    '',
}

function normalizeError(error) {
  const detail = error?.response?.data?.detail
  if (Array.isArray(detail)) return detail.map(({ msg }) => msg).join(' ')
  if (typeof detail === 'string') return detail
  if (typeof error?.response?.data?.message === 'string') return error.response.data.message
  return 'No fue posible procesar la solicitud.'
}

function labelOf(list, value) {
  return list.find(o => o.value === value)?.label ?? value ?? '—'
}

export function ContratoEmpleadoStep3({ contractId, templateId, onBack, onNext, onFinish }) {
  const queryClient = useQueryClient()
  const [editingDeduccion, setEditingDeduccion] = useState(null)
  const [dedError, setDedError] = useState('')
  const [confirmedIds, setConfirmedIds] = useState(() => new Set())

  const {
    register: regDed,
    handleSubmit: handleDedSubmit,
    reset: resetDedForm,
    formState: { errors: dedErrors },
  } = useForm({ defaultValues: DEDUCTION_DEFAULTS })

  const { data: deduccionesData, isLoading: deduccionesLoading } = useQuery({
    queryKey: ['ce-deducciones', contractId],
    queryFn: () => getDeducciones(contractId, { page: 1, page_size: 100 }),
    enabled: !!contractId,
    staleTime: 0,
  })
  const deducciones = deduccionesData?.items ?? []

  const { data: templateData } = useQuery({
    queryKey: ['tpl-deducciones', templateId],
    queryFn: () => getTemplateDeducciones(templateId, { page: 1, page_size: 100 }),
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
  })
  const templateDeducciones = templateData?.items ?? []

  const dedMutation = useMutation({
    mutationFn: ({ id, body }) => id ? updateDeduccion(id, body) : createDeduccion(body),
    onSuccess: () => {
      setDedError('')
      resetDedForm(DEDUCTION_DEFAULTS)
      setEditingDeduccion(null)
      queryClient.invalidateQueries({ queryKey: ['ce-deducciones', contractId] })
    },
    onError: (error) => setDedError(normalizeError(error)),
  })

  const confirmMutation = useMutation({
    mutationFn: ({ _tplId: _ignored, ...body }) => createDeduccion(body),
    onSuccess: (_, { _tplId }) => {
      setDedError('')
      setConfirmedIds(prev => new Set([...prev, _tplId]))
      queryClient.invalidateQueries({ queryKey: ['ce-deducciones', contractId] })
    },
    onError: (error) => setDedError(normalizeError(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDeduccion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ce-deducciones', contractId] }),
    onError: (error) => setDedError(normalizeError(error)),
  })

  const startEdit = (ded) => {
    setEditingDeduccion(ded)
    resetDedForm({
      deduction_type:            ded.deduction_type ?? 'salud',
      amount_type:               ded.amount_type?.toLowerCase() ?? 'porcentaje',
      amount_value:              String(ded.amount_value),
      aplication_deduction_type: ded.aplication_deduction_type?.toLowerCase() ?? 'pre_nomina',
      start_date:                ded.start_date ?? '',
      end_date:                  ded.end_date ?? '',
      description:               ded.description ?? '',
      amount:                    String(ded.amount ?? ''),
    })
  }

  const cancelEdit = () => {
    setEditingDeduccion(null)
    resetDedForm(DEDUCTION_DEFAULTS)
    setDedError('')
  }

  const onDeduccionSubmit = (values) => {
    const baseBody = {
      deduction_type:            values.deduction_type,
      amount_type:               values.amount_type,
      amount_value:              Number(values.amount_value),
      aplication_deduction_type: values.aplication_deduction_type,
      start_date:                values.start_date || undefined,
      end_date:                  values.end_date || undefined,
      description:               values.description || undefined,
      amount:                    values.amount !== '' ? Number(values.amount) : undefined,
    }
    if (editingDeduccion) {
      dedMutation.mutate({ id: editingDeduccion.id, body: baseBody })
    } else {
      dedMutation.mutate({ id: null, body: { ...baseBody, contract_id: contractId } })
    }
  }

  const confirmFromTemplate = (tplDed) => {
    confirmMutation.mutate({
      deduction_type:            tplDed.deduction_type,
      amount_type:               tplDed.amount_type,
      amount_value:              tplDed.amount_value,
      aplication_deduction_type: tplDed.aplication_deduction_type,
      start_date:                tplDed.start_date || undefined,
      end_date:                  tplDed.end_date || undefined,
      description:               tplDed.description || undefined,
      amount:                    tplDed.amount != null ? tplDed.amount : undefined,
      contract_id:               contractId,
      _tplId:                    tplDed.id,
    })
  }

  return (
    <>
      <div className="cp-modal__body">
        <div className="cp-modal__header">
          <h3 className="cp-modal__title">Deducciones del contrato</h3>
          <p className="cp-modal__sub">
            Configure las deducciones para el contrato (ID {contractId}). Puede agregar múltiples deducciones antes de continuar.
          </p>
        </div>

        <div className="cp-modal__form">
          {templateDeducciones.length > 0 && (
            <>
              <div className="cp-form__section-title">Desde la plantilla</div>
              <div className="cp-inc-list">
                {templateDeducciones.map(ded => {
                  const confirmed = confirmedIds.has(ded.id)
                  return (
                    <div key={ded.id} className="cp-inc-item cp-inc-item--template">
                      <div className="cp-inc-item__top">
                        <div className="cp-inc-item__badges">
                          <span className="cp-badge cp-badge--accent">{labelOf(DEDUCTION_TYPES, ded.deduction_type)}</span>
                          <span className="cp-badge cp-badge--warning">{labelOf(AMOUNT_TYPES, ded.amount_type)}</span>
                          <span className="cp-badge cp-badge--muted">{labelOf(APPLICATION_TYPES, ded.aplication_deduction_type)}</span>
                        </div>
                        <button
                          type="button"
                          className="cp-action-btn cp-action-btn--success"
                          onClick={() => confirmFromTemplate(ded)}
                          disabled={confirmed || confirmMutation.isPending}
                        >
                          {confirmed ? 'Confirmado' : 'Confirmar'}
                        </button>
                      </div>
                      {ded.description && <p className="cp-inc-item__desc">{ded.description}</p>}
                      <div className="cp-inc-item__meta">
                        <span>Valor: <strong>{ded.amount_value}</strong></span>
                        <span>Monto: <strong>{ded.amount}</strong></span>
                        {(ded.start_date || ded.end_date) && (
                          <span>{ded.start_date ?? '—'} → {ded.end_date ?? '—'}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div className="cp-form__section-title">
            {editingDeduccion ? `Editar deducción #${editingDeduccion.id}` : 'Agregar deducción'}
          </div>

          {dedError && <div className="cp-alert cp-alert--error">{dedError}</div>}

          <form id="ce-step3-ded" onSubmit={handleDedSubmit(onDeduccionSubmit)} className="cp-inc-form">
            <div className="cp-form__grid cp-form__grid--4">
              <div className="cp-form__field">
                <label className="cp-form__label">Tipo de deducción *</label>
                <select
                  className={`cp-form__select${dedErrors.deduction_type ? ' cp-form__input--error' : ''}`}
                  {...regDed('deduction_type', { required: 'Requerido' })}
                >
                  {DEDUCTION_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {dedErrors.deduction_type && <span className="cp-form__error">{dedErrors.deduction_type.message}</span>}
              </div>

              <div className="cp-form__field">
                <label className="cp-form__label">Tipo de monto *</label>
                <select
                  className={`cp-form__select${dedErrors.amount_type ? ' cp-form__input--error' : ''}`}
                  {...regDed('amount_type', { required: 'Requerido' })}
                >
                  {AMOUNT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {dedErrors.amount_type && <span className="cp-form__error">{dedErrors.amount_type.message}</span>}
              </div>

              <div className="cp-form__field">
                <label className="cp-form__label">Valor del monto *</label>
                <input
                  type="number" min="0" step="0.01"
                  className={`cp-form__input${dedErrors.amount_value ? ' cp-form__input--error' : ''}`}
                  placeholder="0"
                  {...regDed('amount_value', { required: 'Requerido' })}
                />
                {dedErrors.amount_value && <span className="cp-form__error">{dedErrors.amount_value.message}</span>}
              </div>

              <div className="cp-form__field">
                <label className="cp-form__label">Tipo de aplicación *</label>
                <select
                  className={`cp-form__select${dedErrors.aplication_deduction_type ? ' cp-form__input--error' : ''}`}
                  {...regDed('aplication_deduction_type', { required: 'Requerido' })}
                >
                  {APPLICATION_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {dedErrors.aplication_deduction_type && <span className="cp-form__error">{dedErrors.aplication_deduction_type.message}</span>}
              </div>

              <div className="cp-form__field">
                <label className="cp-form__label">Fecha inicio</label>
                <input type="date" className="cp-form__input" {...regDed('start_date')} />
              </div>

              <div className="cp-form__field">
                <label className="cp-form__label">Fecha fin</label>
                <input type="date" className="cp-form__input" {...regDed('end_date')} />
              </div>

              <div className="cp-form__field">
                <label className="cp-form__label">Descripción</label>
                <input
                  className="cp-form__input"
                  placeholder="Descripción de la deducción"
                  {...regDed('description')}
                />
              </div>

              <div className="cp-form__field">
                <label className="cp-form__label">Monto calculado</label>
                <input
                  type="number" min="0" step="0.01"
                  className="cp-form__input"
                  placeholder="0"
                  {...regDed('amount')}
                />
              </div>
            </div>

            <div className="cp-inc-form-actions">
              {editingDeduccion && (
                <button type="button" className="cp-modal__btn cp-modal__btn--cancel" onClick={cancelEdit}>
                  Cancelar edición
                </button>
              )}
              <button type="submit" className="cp-modal__btn cp-modal__btn--primary" disabled={dedMutation.isPending}>
                {dedMutation.isPending ? 'Guardando...' : editingDeduccion ? 'Actualizar deducción' : 'Guardar deducción'}
              </button>
            </div>
          </form>

          <div className="cp-form__section-title">Deducciones registradas</div>

          {deduccionesLoading ? (
            <div className="cp-state" style={{ padding: '1rem 0' }}>
              <div className="cp-spinner" /><span>Cargando...</span>
            </div>
          ) : deducciones.length === 0 ? (
            <p className="cp-inc-empty">No hay deducciones registradas aún.</p>
          ) : (
            <div className="cp-inc-list">
              {deducciones.map(ded => (
                <div key={ded.id} className="cp-inc-item">
                  <div className="cp-inc-item__top">
                    <div className="cp-inc-item__badges">
                      <span className="cp-badge cp-badge--accent">{labelOf(DEDUCTION_TYPES, ded.deduction_type)}</span>
                      <span className="cp-badge cp-badge--warning">{labelOf(AMOUNT_TYPES, ded.amount_type)}</span>
                      <span className="cp-badge cp-badge--muted">{labelOf(APPLICATION_TYPES, ded.aplication_deduction_type)}</span>
                    </div>
                    <div className="cp-actions">
                      <button type="button" className="cp-action-btn cp-action-btn--warning" onClick={() => startEdit(ded)} disabled={deleteMutation.isPending}>Editar</button>
                      <button type="button" className="cp-action-btn cp-action-btn--danger" onClick={() => deleteMutation.mutate(ded.id)} disabled={deleteMutation.isPending}>Eliminar</button>
                    </div>
                  </div>
                  {ded.description && <p className="cp-inc-item__desc">{ded.description}</p>}
                  <div className="cp-inc-item__meta">
                    <span>Valor: <strong>{ded.amount_value}</strong></span>
                    <span>Monto: <strong>{ded.amount}</strong></span>
                    {(ded.start_date || ded.end_date) && (
                      <span>{ded.start_date ?? '—'} → {ded.end_date ?? '—'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="cp-modal__footer">
        <button type="button" className="cp-modal__btn cp-modal__btn--cancel" onClick={onBack}>← Anterior</button>
        <button type="button" className="cp-modal__btn cp-modal__btn--cancel" onClick={onNext}>Siguiente →</button>
        <button type="button" className="cp-modal__btn cp-modal__btn--primary" onClick={onFinish}>Finalizar</button>
      </div>
    </>
  )
}
