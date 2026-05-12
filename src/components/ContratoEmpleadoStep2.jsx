import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getIncrementos,
  createIncremento,
  updateIncremento,
  deleteIncremento,
} from '@/services/contratosEmpleados'
import { getIncrementos as getTemplateIncrementos } from '@/services/contratosPlantillas'

const INCREMENT_TYPES = [
  { value: 'salario',      label: 'Salario' },
  { value: 'horas_extras', label: 'Horas extras' },
  { value: 'bonificacion', label: 'Bonificación' },
]

const AMOUNT_TYPES = [
  { value: 'porcentaje', label: 'Porcentaje' },
  { value: 'valor_fijo', label: 'Valor fijo' },
]

const APPLICATION_TYPES = [
  { value: 'pre_nomina',  label: 'Pre-nómina (salario base)' },
  { value: 'post_nomina', label: 'Post-nómina (totalidad)' },
]

const INCREMENT_DEFAULTS = {
  increase_type:             'salario',
  amount_type:               'porcentaje',
  amount_value:              '',
  application_increase_type: 'pre_nomina',
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

export function ContratoEmpleadoStep2({ contractId, templateId, onBack, onNext, onFinish }) {
  const queryClient = useQueryClient()
  const [editingIncrement, setEditingIncrement] = useState(null)
  const [incError, setIncError] = useState('')
  const [confirmedIds, setConfirmedIds] = useState(() => new Set())

  const {
    register: regInc,
    handleSubmit: handleIncSubmit,
    reset: resetIncForm,
    formState: { errors: incErrors },
  } = useForm({ defaultValues: INCREMENT_DEFAULTS })

  const { data: incrementosData, isLoading: incrementosLoading } = useQuery({
    queryKey: ['ce-incrementos', contractId],
    queryFn: () => getIncrementos(contractId, { page: 1, page_size: 100 }),
    enabled: !!contractId,
    staleTime: 0,
  })
  const incrementos = incrementosData?.items ?? []

  const { data: templateData } = useQuery({
    queryKey: ['tpl-incrementos', templateId],
    queryFn: () => getTemplateIncrementos(templateId, { page: 1, page_size: 100 }),
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
  })
  const templateIncrementos = templateData?.items ?? []

  const incMutation = useMutation({
    mutationFn: ({ id, body }) => id ? updateIncremento(id, body) : createIncremento(body),
    onSuccess: () => {
      setIncError('')
      resetIncForm(INCREMENT_DEFAULTS)
      setEditingIncrement(null)
      queryClient.invalidateQueries({ queryKey: ['ce-incrementos', contractId] })
    },
    onError: (error) => setIncError(normalizeError(error)),
  })

  const confirmMutation = useMutation({
    mutationFn: ({ _tplId: _ignored, ...body }) => createIncremento(body),
    onSuccess: (_, { _tplId }) => {
      setIncError('')
      setConfirmedIds(prev => new Set([...prev, _tplId]))
      queryClient.invalidateQueries({ queryKey: ['ce-incrementos', contractId] })
    },
    onError: (error) => setIncError(normalizeError(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteIncremento(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ce-incrementos', contractId] }),
    onError: (error) => setIncError(normalizeError(error)),
  })

  const startEdit = (inc) => {
    setEditingIncrement(inc)
    resetIncForm({
      increase_type:             inc.increase_type?.toLowerCase(),
      amount_type:               inc.amount_type?.toLowerCase(),
      amount_value:              String(inc.amount_value),
      application_increase_type: inc.application_increase_type?.toLowerCase(),
      start_date:                inc.start_date ?? '',
      end_date:                  inc.end_date ?? '',
      description:               inc.description ?? '',
      amount:                    String(inc.amount ?? ''),
    })
  }

  const cancelEdit = () => {
    setEditingIncrement(null)
    resetIncForm(INCREMENT_DEFAULTS)
    setIncError('')
  }

  const onIncrementoSubmit = (values) => {
    const baseBody = {
      increase_type:             values.increase_type,
      amount_type:               values.amount_type,
      amount_value:              Number(values.amount_value),
      application_increase_type: values.application_increase_type,
      start_date:                values.start_date,
      end_date:                  values.end_date,
      description:               values.description,
      amount:                    Number(values.amount),
    }
    if (editingIncrement) {
      incMutation.mutate({ id: editingIncrement.id, body: baseBody })
    } else {
      incMutation.mutate({ id: null, body: { ...baseBody, contract_id: contractId } })
    }
  }

  const confirmFromTemplate = (tplInc) => {
    confirmMutation.mutate({
      increase_type:             tplInc.increase_type,
      amount_type:               tplInc.amount_type,
      amount_value:              tplInc.amount_value,
      application_increase_type: tplInc.application_increase_type,
      start_date:                tplInc.start_date,
      end_date:                  tplInc.end_date,
      description:               tplInc.description,
      amount:                    tplInc.amount,
      contract_id:               contractId,
      _tplId:                    tplInc.id,
    })
  }

  return (
    <>
      <div className="cp-modal__body">
        <div className="cp-modal__header">
          <h3 className="cp-modal__title">Incrementos del contrato</h3>
          <p className="cp-modal__sub">
            Configure los incrementos para el contrato (ID {contractId}). Puede agregar múltiples incrementos antes de continuar.
          </p>
        </div>

        <div className="cp-modal__form">
          {templateIncrementos.length > 0 && (
            <>
              <div className="cp-form__section-title">Desde la plantilla</div>
              <div className="cp-inc-list">
                {templateIncrementos.map(inc => {
                  const confirmed = confirmedIds.has(inc.id)
                  return (
                    <div key={inc.id} className="cp-inc-item cp-inc-item--template">
                      <div className="cp-inc-item__top">
                        <div className="cp-inc-item__badges">
                          <span className="cp-badge cp-badge--accent">{labelOf(INCREMENT_TYPES, inc.increase_type)}</span>
                          <span className="cp-badge cp-badge--warning">{labelOf(AMOUNT_TYPES, inc.amount_type)}</span>
                          <span className="cp-badge cp-badge--muted">{labelOf(APPLICATION_TYPES, inc.application_increase_type)}</span>
                        </div>
                        <button
                          type="button"
                          className="cp-action-btn cp-action-btn--success"
                          onClick={() => confirmFromTemplate(inc)}
                          disabled={confirmed || confirmMutation.isPending}
                        >
                          {confirmed ? 'Confirmado' : 'Confirmar'}
                        </button>
                      </div>
                      {inc.description && <p className="cp-inc-item__desc">{inc.description}</p>}
                      <div className="cp-inc-item__meta">
                        <span>Valor: <strong>{inc.amount_value}</strong></span>
                        <span>Monto: <strong>{inc.amount}</strong></span>
                        {(inc.start_date || inc.end_date) && (
                          <span>{inc.start_date ?? '—'} → {inc.end_date ?? '—'}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div className="cp-form__section-title">
            {editingIncrement ? `Editar incremento #${editingIncrement.id}` : 'Agregar incremento'}
          </div>

          {incError && <div className="cp-alert cp-alert--error">{incError}</div>}

          <form id="ce-step2-inc" onSubmit={handleIncSubmit(onIncrementoSubmit)} className="cp-inc-form">
            <div className="cp-form__grid cp-form__grid--4">
              <div className="cp-form__field">
                <label className="cp-form__label">Tipo de incremento *</label>
                <select
                  className={`cp-form__select${incErrors.increase_type ? ' cp-form__input--error' : ''}`}
                  {...regInc('increase_type', { required: 'Requerido' })}
                >
                  {INCREMENT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {incErrors.increase_type && <span className="cp-form__error">{incErrors.increase_type.message}</span>}
              </div>

              <div className="cp-form__field">
                <label className="cp-form__label">Tipo de monto *</label>
                <select
                  className={`cp-form__select${incErrors.amount_type ? ' cp-form__input--error' : ''}`}
                  {...regInc('amount_type', { required: 'Requerido' })}
                >
                  {AMOUNT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {incErrors.amount_type && <span className="cp-form__error">{incErrors.amount_type.message}</span>}
              </div>

              <div className="cp-form__field">
                <label className="cp-form__label">Valor del monto *</label>
                <input
                  type="number" min="0" step="0.01"
                  className={`cp-form__input${incErrors.amount_value ? ' cp-form__input--error' : ''}`}
                  placeholder="0"
                  {...regInc('amount_value', { required: 'Requerido' })}
                />
                {incErrors.amount_value && <span className="cp-form__error">{incErrors.amount_value.message}</span>}
              </div>

              <div className="cp-form__field">
                <label className="cp-form__label">Tipo de aplicación *</label>
                <select
                  className={`cp-form__select${incErrors.application_increase_type ? ' cp-form__input--error' : ''}`}
                  {...regInc('application_increase_type', { required: 'Requerido' })}
                >
                  {APPLICATION_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {incErrors.application_increase_type && <span className="cp-form__error">{incErrors.application_increase_type.message}</span>}
              </div>

              <div className="cp-form__field">
                <label className="cp-form__label">Fecha inicio *</label>
                <input
                  type="date"
                  className={`cp-form__input${incErrors.start_date ? ' cp-form__input--error' : ''}`}
                  {...regInc('start_date', { required: 'Requerido' })}
                />
                {incErrors.start_date && <span className="cp-form__error">{incErrors.start_date.message}</span>}
              </div>

              <div className="cp-form__field">
                <label className="cp-form__label">Fecha fin *</label>
                <input
                  type="date"
                  className={`cp-form__input${incErrors.end_date ? ' cp-form__input--error' : ''}`}
                  {...regInc('end_date', { required: 'Requerido' })}
                />
                {incErrors.end_date && <span className="cp-form__error">{incErrors.end_date.message}</span>}
              </div>

              <div className="cp-form__field">
                <label className="cp-form__label">Descripción *</label>
                <input
                  className={`cp-form__input${incErrors.description ? ' cp-form__input--error' : ''}`}
                  placeholder="Descripción del incremento"
                  {...regInc('description', { required: 'Requerido' })}
                />
                {incErrors.description && <span className="cp-form__error">{incErrors.description.message}</span>}
              </div>

              <div className="cp-form__field">
                <label className="cp-form__label">Monto *</label>
                <input
                  type="number" min="0" step="0.01"
                  className={`cp-form__input${incErrors.amount ? ' cp-form__input--error' : ''}`}
                  placeholder="0"
                  {...regInc('amount', { required: 'Requerido' })}
                />
                {incErrors.amount && <span className="cp-form__error">{incErrors.amount.message}</span>}
              </div>
            </div>

            <div className="cp-inc-form-actions">
              {editingIncrement && (
                <button type="button" className="cp-modal__btn cp-modal__btn--cancel" onClick={cancelEdit}>
                  Cancelar edición
                </button>
              )}
              <button type="submit" className="cp-modal__btn cp-modal__btn--primary" disabled={incMutation.isPending}>
                {incMutation.isPending ? 'Guardando...' : editingIncrement ? 'Actualizar incremento' : 'Guardar incremento'}
              </button>
            </div>
          </form>

          <div className="cp-form__section-title">Incrementos registrados</div>

          {incrementosLoading ? (
            <div className="cp-state" style={{ padding: '1rem 0' }}>
              <div className="cp-spinner" /><span>Cargando...</span>
            </div>
          ) : incrementos.length === 0 ? (
            <p className="cp-inc-empty">No hay incrementos registrados aún.</p>
          ) : (
            <div className="cp-inc-list">
              {incrementos.map(inc => (
                <div key={inc.id} className="cp-inc-item">
                  <div className="cp-inc-item__top">
                    <div className="cp-inc-item__badges">
                      <span className="cp-badge cp-badge--accent">{labelOf(INCREMENT_TYPES, inc.increase_type)}</span>
                      <span className="cp-badge cp-badge--warning">{labelOf(AMOUNT_TYPES, inc.amount_type)}</span>
                      <span className="cp-badge cp-badge--muted">{labelOf(APPLICATION_TYPES, inc.application_increase_type)}</span>
                    </div>
                    <div className="cp-actions">
                      <button type="button" className="cp-action-btn cp-action-btn--warning" onClick={() => startEdit(inc)} disabled={deleteMutation.isPending}>Editar</button>
                      <button type="button" className="cp-action-btn cp-action-btn--danger" onClick={() => deleteMutation.mutate(inc.id)} disabled={deleteMutation.isPending}>Eliminar</button>
                    </div>
                  </div>
                  {inc.description && <p className="cp-inc-item__desc">{inc.description}</p>}
                  <div className="cp-inc-item__meta">
                    <span>Valor: <strong>{inc.amount_value}</strong></span>
                    <span>Monto: <strong>{inc.amount}</strong></span>
                    <span>{inc.start_date} → {inc.end_date}</span>
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
