import { Fragment, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import {
  getHorarios,
  createHorario,
  updateHorario,
  deleteHorario,
} from '@/services/contratosEmpleados'
import { getHorarios as getTemplateHorarios } from '@/services/contratosPlantillas'

const WEEK_DAYS = [
  { value: 'lunes',     label: 'Lunes' },
  { value: 'martes',    label: 'Martes' },
  { value: 'miercoles', label: 'Miérc.' },
  { value: 'jueves',    label: 'Jueves' },
  { value: 'viernes',   label: 'Viernes' },
  { value: 'sabado',    label: 'Sáb.' },
  { value: 'domingo',   label: 'Dom.' },
]

const SCHEDULE_DEFAULTS = { week_day: 'lunes', start_time: '', end_time: '' }

function timeToMin(timeStr) {
  if (!timeStr) return 0
  const [h, m] = String(timeStr).slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

function formatTime(timeStr) {
  if (!timeStr) return '—'
  return String(timeStr).slice(0, 5)
}

function formatSlot(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${min % 60 === 0 ? '00' : '30'}`
}

function normalizeError(error) {
  const detail = error?.response?.data?.detail
  if (Array.isArray(detail)) return detail.map(({ msg }) => msg).join(' ')
  if (typeof detail === 'string') return detail
  if (typeof error?.response?.data?.message === 'string') return error.response.data.message
  return 'No fue posible procesar la solicitud.'
}

function getSlotInfo(slotMin, schedules) {
  const match = schedules.find(h => {
    const start = Math.floor(timeToMin(h.start_time) / 30) * 30
    const end   = Math.ceil(timeToMin(h.end_time) / 30) * 30
    return start <= slotMin && slotMin < end
  })
  if (!match) return null
  const start = Math.floor(timeToMin(match.start_time) / 30) * 30
  const end   = Math.ceil(timeToMin(match.end_time) / 30) * 30
  return {
    schedule: match,
    isFirst:  slotMin === start,
    isLast:   slotMin + 30 >= end,
  }
}

function labelOf(list, value) {
  return list.find(o => o.value === value)?.label ?? value ?? '—'
}

export function ContratoEmpleadoStep4({ contractId, templateId, onBack, onFinish }) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [editingHorario, setEditingHorario] = useState(null)
  const [schedError, setSchedError] = useState('')
  const [confirmedIds, setConfirmedIds] = useState(() => new Set())

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: SCHEDULE_DEFAULTS })

  const { data: horarios = [], isLoading } = useQuery({
    queryKey: ['ce-horarios', contractId],
    queryFn: () => getHorarios(contractId),
    enabled: !!contractId,
    staleTime: 0,
  })

  const { data: templateData } = useQuery({
    queryKey: ['tpl-horarios', templateId],
    queryFn: () => getTemplateHorarios(templateId, { page: 1, page_size: 100 }),
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
  })
  const templateHorarios = templateData?.items ?? []

  const mutation = useMutation({
    mutationFn: ({ id, body }) => id ? updateHorario(id, body) : createHorario(body),
    onSuccess: () => {
      setSchedError('')
      reset(SCHEDULE_DEFAULTS)
      setEditingHorario(null)
      queryClient.invalidateQueries({ queryKey: ['ce-horarios', contractId] })
    },
    onError: (error) => setSchedError(normalizeError(error)),
  })

  const confirmMutation = useMutation({
    mutationFn: ({ _tplId: _ignored, ...body }) => createHorario(body),
    onSuccess: (_, { _tplId }) => {
      setSchedError('')
      setConfirmedIds(prev => new Set([...prev, _tplId]))
      queryClient.invalidateQueries({ queryKey: ['ce-horarios', contractId] })
    },
    onError: (error) => setSchedError(normalizeError(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteHorario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ce-horarios', contractId] }),
    onError: (error) => setSchedError(normalizeError(error)),
  })

  const startEdit = (h) => {
    setEditingHorario(h)
    reset({ week_day: h.week_day, start_time: formatTime(h.start_time), end_time: formatTime(h.end_time) })
  }

  const cancelEdit = () => {
    setEditingHorario(null)
    reset(SCHEDULE_DEFAULTS)
    setSchedError('')
  }

  const onSubmit = (values) => {
    const base = {
      week_day:         values.week_day,
      start_time:       values.start_time,
      end_time:         values.end_time,
      is_active:        true,
      responsible_user: user?.email ?? '',
    }
    if (editingHorario) {
      mutation.mutate({ id: editingHorario.id, body: { ...base, contract_id: contractId } })
    } else {
      mutation.mutate({ id: null, body: { ...base, contract_id: contractId } })
    }
  }

  const confirmFromTemplate = (tplH) => {
    confirmMutation.mutate({
      week_day:         tplH.week_day,
      start_time:       formatTime(tplH.start_time),
      end_time:         formatTime(tplH.end_time),
      is_active:        true,
      responsible_user: user?.email ?? '',
      contract_id:      contractId,
      _tplId:           tplH.id,
    })
  }

  const scheduleByDay = WEEK_DAYS.reduce((acc, d) => {
    acc[d.value] = horarios.filter(h => h.week_day === d.value)
    return acc
  }, {})

  const occupiedSet = new Set()
  horarios.forEach(h => {
    const start = Math.floor(timeToMin(h.start_time) / 30) * 30
    const end   = Math.ceil(timeToMin(h.end_time) / 30) * 30
    for (let t = start; t < end; t += 30) occupiedSet.add(t)
  })
  const sortedSlots = Array.from(occupiedSet).sort((a, b) => a - b)

  return (
    <>
      <div className="cp-modal__body">
        <div className="cp-modal__header">
          <h3 className="cp-modal__title">Horarios del contrato</h3>
          <p className="cp-modal__sub">
            Configure los horarios semanales para el contrato (ID {contractId}).
          </p>
        </div>

        <div className="cp-modal__form">
          {templateHorarios.length > 0 && (
            <>
              <div className="cp-form__section-title">Desde la plantilla</div>
              <div className="cp-inc-list">
                {templateHorarios.map(h => {
                  const confirmed = confirmedIds.has(h.id)
                  return (
                    <div key={h.id} className="cp-inc-item cp-inc-item--template">
                      <div className="cp-inc-item__top">
                        <div className="cp-inc-item__badges">
                          <span className="cp-badge cp-badge--accent">{labelOf(WEEK_DAYS, h.week_day)}</span>
                        </div>
                        <button
                          type="button"
                          className="cp-action-btn cp-action-btn--success"
                          onClick={() => confirmFromTemplate(h)}
                          disabled={confirmed || confirmMutation.isPending}
                        >
                          {confirmed ? 'Confirmado' : 'Confirmar'}
                        </button>
                      </div>
                      <div className="cp-inc-item__meta">
                        <span>Inicio: <strong>{formatTime(h.start_time)}</strong></span>
                        <span>Fin: <strong>{formatTime(h.end_time)}</strong></span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div className="cp-form__section-title">
            {editingHorario ? `Editar horario #${editingHorario.id}` : 'Agregar horario'}
          </div>

          {schedError && <div className="cp-alert cp-alert--error">{schedError}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="cp-inc-form">
            <div className="cp-form__grid cp-form__grid--3">
              <div className="cp-form__field">
                <label className="cp-form__label">Día de la semana *</label>
                <select
                  className={`cp-form__select${errors.week_day ? ' cp-form__input--error' : ''}`}
                  {...register('week_day', { required: 'Requerido' })}
                >
                  {WEEK_DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
                {errors.week_day && <span className="cp-form__error">{errors.week_day.message}</span>}
              </div>

              <div className="cp-form__field">
                <label className="cp-form__label">Hora inicio *</label>
                <input
                  type="time"
                  className={`cp-form__input${errors.start_time ? ' cp-form__input--error' : ''}`}
                  {...register('start_time', { required: 'Requerido' })}
                />
                {errors.start_time && <span className="cp-form__error">{errors.start_time.message}</span>}
              </div>

              <div className="cp-form__field">
                <label className="cp-form__label">Hora fin *</label>
                <input
                  type="time"
                  className={`cp-form__input${errors.end_time ? ' cp-form__input--error' : ''}`}
                  {...register('end_time', { required: 'Requerido' })}
                />
                {errors.end_time && <span className="cp-form__error">{errors.end_time.message}</span>}
              </div>
            </div>

            <div className="cp-inc-form-actions">
              {editingHorario && (
                <button type="button" className="cp-modal__btn cp-modal__btn--cancel" onClick={cancelEdit}>
                  Cancelar edición
                </button>
              )}
              <button type="submit" className="cp-modal__btn cp-modal__btn--primary" disabled={mutation.isPending}>
                {mutation.isPending ? 'Guardando...' : editingHorario ? 'Actualizar horario' : 'Guardar horario'}
              </button>
            </div>
          </form>

          <div className="cp-form__section-title">Vista semanal</div>

          {isLoading ? (
            <div className="cp-state" style={{ padding: '1rem 0' }}>
              <div className="cp-spinner" /><span>Cargando...</span>
            </div>
          ) : horarios.length === 0 ? (
            <p className="cp-inc-empty">No hay horarios registrados aún.</p>
          ) : (
            <div className="cp-cal">
              <div className="cp-cal__row cp-cal__row--head">
                <div className="cp-cal__corner" />
                {WEEK_DAYS.map(d => (
                  <div key={d.value} className="cp-cal__day-head">{d.label}</div>
                ))}
              </div>
              {sortedSlots.map((slotMin, idx) => {
                const gapBefore = idx > 0 && sortedSlots[idx - 1] + 30 < slotMin
                return (
                  <Fragment key={slotMin}>
                    {gapBefore && <div className="cp-cal__gap"><span>···</span></div>}
                    <div className="cp-cal__row">
                      <div className="cp-cal__time-cell">{formatSlot(slotMin)}</div>
                      {WEEK_DAYS.map(d => {
                        const info = getSlotInfo(slotMin, scheduleByDay[d.value])
                        if (!info) return <div key={d.value} className="cp-cal__cell" />
                        const { schedule: h, isFirst, isLast } = info
                        const cls = [
                          'cp-cal__cell', 'cp-cal__cell--active',
                          isFirst && 'cp-cal__cell--first',
                          isLast  && 'cp-cal__cell--last',
                          !h.is_active && 'cp-cal__cell--inactive',
                        ].filter(Boolean).join(' ')
                        return (
                          <div key={d.value} className={cls}>
                            {isFirst && <span className="cp-cal__cell-label">{formatTime(h.start_time)}</span>}
                            <div className="cp-cal__cell-actions">
                              <button type="button" className="cp-action-btn cp-action-btn--warning" onClick={() => startEdit(h)} disabled={deleteMutation.isPending} title="Editar">✎</button>
                              <button type="button" className="cp-action-btn cp-action-btn--danger" onClick={() => deleteMutation.mutate(h.id)} disabled={deleteMutation.isPending} title="Eliminar">✕</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Fragment>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="cp-modal__footer">
        <button type="button" className="cp-modal__btn cp-modal__btn--cancel" onClick={onBack}>← Anterior</button>
        <button type="button" className="cp-modal__btn cp-modal__btn--primary" onClick={onFinish}>Finalizar</button>
      </div>
    </>
  )
}
