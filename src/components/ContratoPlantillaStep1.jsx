import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createContratoPlantilla, updateContratoPlantilla } from '@/services/contratosPlantillas'

export const CONTRACT_TYPES = [
  { value: 'indefinido',          label: 'Indefinido' },
  { value: 'termino_fijo',        label: 'Término fijo' },
  { value: 'obra_o_servicio',     label: 'Obra o servicio' },
  { value: 'prestacion_servicios', label: 'Prestación de servicios' },
  { value: 'aprendizaje',         label: 'Aprendizaje' },
  { value: 'practicas',           label: 'Prácticas' },
]

const PAYMENT_FREQUENCY_TYPES = [
  { value: 'mensual',    label: 'Mensual' },
  { value: 'quincenal',  label: 'Quincenal' },
  { value: 'semanal',    label: 'Semanal' },
]

const WORK_MODE_TYPES = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'remoto',     label: 'Remoto' },
  { value: 'hibrido',    label: 'Híbrido' },
]

const PAYMENT_TYPES = [
  { value: 'transferencia', label: 'Transferencia bancaria' },
  { value: 'efectivo',      label: 'Efectivo' },
  { value: 'cheque',        label: 'Cheque' },
]

const SALARY_TYPES = [
  { value: 'por_horas',   label: 'Por horas' },
  { value: 'por_dias',    label: 'Por días' },
  { value: 'mensual_fijo', label: 'Mensual fijo' },
]

const CURRENCY_TYPES = [
  { value: 'COP', label: 'COP — Peso colombiano' },
  { value: 'USD', label: 'USD — Dólar' },
  { value: 'EUR', label: 'EUR — Euro' },
]

const OVERTIME_PERIODS = [
  { value: 'diario',   label: 'Diario' },
  { value: 'semanal',  label: 'Semanal' },
  { value: 'mensual',  label: 'Mensual' },
]

const FORM_ID = 'cp-step1'

const DEFAULT_VALUES = {
  contract_name: '',
  contract_type: 'indefinido',
  start_date: '',
  end_date: '',
  payment_frequency_type: 'mensual',
  minimun_hours: '',
  work_mode_type: 'presencial',
  payment_type: 'transferencia',
  salary_type: 'por_horas',
  working_hours: '',
  salary_base: '',
  currency_type: 'COP',
  trail_period_days: '',
  vacation_days: '',
  cumulative_vacation_date: false,
  start_cumulative_vacation: '',
  vacation_frecuency_days: '',
  maximun_disable_days: '',
  overtime: '',
  overtime_preriod: 'diario',
  emlpoyee_charge_id: '',
  company_id: '',
}

function normalizeError(error) {
  const detail = error?.response?.data?.detail
  if (Array.isArray(detail)) return detail.map(({ msg }) => msg).join(' ')
  if (typeof detail === 'string') return detail
  if (typeof error?.response?.data?.message === 'string') return error.response.data.message
  return 'No fue posible procesar la solicitud.'
}

export function ContratoPlantillaStep1({ empresas, cargos, existingContract, onSuccess, onCancel }) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setError,
    watch,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: DEFAULT_VALUES })

  const contractType = watch('contract_type')
  const cumulative = watch('cumulative_vacation_date')

  useEffect(() => {
    if (!existingContract) return
    reset({
      contract_name:             existingContract.contract_name,
      contract_type:             existingContract.contract_type,
      start_date:                existingContract.start_date ?? '',
      end_date:                  existingContract.end_date ?? '',
      payment_frequency_type:    existingContract.payment_frequency_type,
      minimun_hours:             existingContract.minimun_hours ?? '',
      work_mode_type:            existingContract.work_mode_type,
      payment_type:              existingContract.payment_type,
      salary_type:               existingContract.salary_type,
      working_hours:             existingContract.working_hours ?? '',
      salary_base:               existingContract.salary_base ?? '',
      currency_type:             existingContract.currency_type,
      trail_period_days:         existingContract.trail_period_days ?? '',
      vacation_days:             existingContract.vacation_days ?? '',
      cumulative_vacation_date:  existingContract.cumulative_vacation_date ?? false,
      start_cumulative_vacation: existingContract.start_cumulative_vacation ?? '',
      vacation_frecuency_days:   existingContract.vacation_frecuency_days ?? '',
      maximun_disable_days:      existingContract.maximun_disable_days ?? '',
      overtime:                  existingContract.overtime ?? '',
      overtime_preriod:          existingContract.overtime_preriod,
      emlpoyee_charge_id:        existingContract.emlpoyee_charge_id ?? '',
      company_id:                existingContract.company_id ?? '',
    })
  }, [existingContract, reset])

  const handleError = (error) => {
    const detail = error?.response?.data?.detail
    if (Array.isArray(detail)) {
      detail.forEach(({ loc, msg }) => {
        const field = loc[loc.length - 1]
        if (typeof field === 'string') setError(field, { message: msg })
      })
    }
  }

  const createMutation = useMutation({
    mutationFn: createContratoPlantilla,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contratos-plantillas'] })
      onSuccess(data)
    },
    onError: handleError,
  })

  const updateMutation = useMutation({
    mutationFn: (body) => updateContratoPlantilla(existingContract.id, body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contratos-plantillas'] })
      onSuccess(data)
    },
    onError: handleError,
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const buildBody = (values) => ({
    ...values,
    minimun_hours:             Number(values.minimun_hours) || 0,
    working_hours:             Number(values.working_hours) || 0,
    salary_base:               Number(values.salary_base) || 0,
    trail_period_days:         Number(values.trail_period_days) || 0,
    vacation_days:             Number(values.vacation_days) || 0,
    vacation_frecuency_days:   Number(values.vacation_frecuency_days) || 0,
    maximun_disable_days:      Number(values.maximun_disable_days) || 0,
    overtime:                  Number(values.overtime) || 0,
    emlpoyee_charge_id:        Number(values.emlpoyee_charge_id),
    company_id:                Number(values.company_id),
    cumulative_vacation_date:  Boolean(values.cumulative_vacation_date),
    end_date:                  contractType === 'indefinido' ? null : (values.end_date || null),
    start_cumulative_vacation: values.start_cumulative_vacation || null,
  })

  const onSubmit = (values) => {
    const body = buildBody(values)
    if (existingContract) {
      updateMutation.mutate(body)
    } else {
      createMutation.mutate(body)
    }
  }

  return (
    <>
      <div className="cp-modal__body">
        <div className="cp-modal__header">
          <h3 className="cp-modal__title">Generalidades del contrato</h3>
          <p className="cp-modal__sub">Complete la información base del contrato establecido.</p>
        </div>

        <form id={FORM_ID} className="cp-modal__form" onSubmit={handleSubmit(onSubmit)}>
          {(createMutation.isError || updateMutation.isError) && (
            <div className="cp-alert cp-alert--error">
              {normalizeError(createMutation.error ?? updateMutation.error)}
            </div>
          )}

          <div className="cp-form__section-title">Identificación</div>
          <div className="cp-form__grid cp-form__grid--2">
            <div className="cp-form__field cp-form__field--span2">
              <label className="cp-form__label">Nombre del contrato *</label>
              <input
                className={`cp-form__input${errors.contract_name ? ' cp-form__input--error' : ''}`}
                placeholder="Ej. Contrato operario jornada completa"
                {...register('contract_name', { required: 'Requerido' })}
              />
              {errors.contract_name && <span className="cp-form__error">{errors.contract_name.message}</span>}
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Tipo de contrato *</label>
              <select
                className={`cp-form__select${errors.contract_type ? ' cp-form__input--error' : ''}`}
                {...register('contract_type', { required: 'Requerido' })}
              >
                {CONTRACT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {errors.contract_type && <span className="cp-form__error">{errors.contract_type.message}</span>}
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Empresa *</label>
              <select
                className={`cp-form__select${errors.company_id ? ' cp-form__input--error' : ''}`}
                {...register('company_id', { required: 'Requerido' })}
              >
                <option value="">Seleccione empresa</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.name ?? e.company_name ?? `Empresa ${e.id}`}</option>)}
              </select>
              {errors.company_id && <span className="cp-form__error">{errors.company_id.message}</span>}
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Cargo *</label>
              <select
                className={`cp-form__select${errors.emlpoyee_charge_id ? ' cp-form__input--error' : ''}`}
                {...register('emlpoyee_charge_id', { required: 'Requerido' })}
              >
                <option value="">Seleccione cargo</option>
                {cargos.map(c => <option key={c.id} value={c.id}>{c.name ?? c.charge_name ?? `Cargo ${c.id}`}</option>)}
              </select>
              {errors.emlpoyee_charge_id && <span className="cp-form__error">{errors.emlpoyee_charge_id.message}</span>}
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Fecha de inicio *</label>
              <input
                type="date"
                className={`cp-form__input${errors.start_date ? ' cp-form__input--error' : ''}`}
                {...register('start_date', { required: 'Requerido' })}
              />
              {errors.start_date && <span className="cp-form__error">{errors.start_date.message}</span>}
            </div>

            {contractType !== 'indefinido' && (
              <div className="cp-form__field">
                <label className="cp-form__label">Fecha de fin</label>
                <input
                  type="date"
                  className="cp-form__input"
                  {...register('end_date')}
                />
              </div>
            )}
          </div>

          <div className="cp-form__section-title">Remuneración</div>
          <div className="cp-form__grid cp-form__grid--3">
            <div className="cp-form__field">
              <label className="cp-form__label">Salario base *</label>
              <input
                type="number"
                min="0"
                className={`cp-form__input${errors.salary_base ? ' cp-form__input--error' : ''}`}
                placeholder="0"
                {...register('salary_base', { required: 'Requerido' })}
              />
              {errors.salary_base && <span className="cp-form__error">{errors.salary_base.message}</span>}
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Moneda *</label>
              <select className="cp-form__select" {...register('currency_type')}>
                {CURRENCY_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Tipo de salario *</label>
              <select className="cp-form__select" {...register('salary_type')}>
                {SALARY_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Frecuencia de pago *</label>
              <select className="cp-form__select" {...register('payment_frequency_type')}>
                {PAYMENT_FREQUENCY_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Tipo de pago *</label>
              <select className="cp-form__select" {...register('payment_type')}>
                {PAYMENT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="cp-form__section-title">Jornada laboral</div>
          <div className="cp-form__grid cp-form__grid--3">
            <div className="cp-form__field">
              <label className="cp-form__label">Modalidad *</label>
              <select className="cp-form__select" {...register('work_mode_type')}>
                {WORK_MODE_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Horas de trabajo</label>
              <input
                type="number"
                min="0"
                className="cp-form__input"
                placeholder="0"
                {...register('working_hours')}
              />
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Horas mínimas</label>
              <input
                type="number"
                min="0"
                className="cp-form__input"
                placeholder="0"
                {...register('minimun_hours')}
              />
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Horas extra</label>
              <input
                type="number"
                min="0"
                className="cp-form__input"
                placeholder="0"
                {...register('overtime')}
              />
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Período horas extra</label>
              <select className="cp-form__select" {...register('overtime_preriod')}>
                {OVERTIME_PERIODS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Días de período de prueba</label>
              <input
                type="number"
                min="0"
                className="cp-form__input"
                placeholder="0"
                {...register('trail_period_days')}
              />
            </div>
          </div>

          <div className="cp-form__section-title">Vacaciones e incapacidades</div>
          <div className="cp-form__grid cp-form__grid--3">
            <div className="cp-form__field">
              <label className="cp-form__label">Días de vacaciones</label>
              <input
                type="number"
                min="0"
                className="cp-form__input"
                placeholder="0"
                {...register('vacation_days')}
              />
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Frecuencia vacaciones (días)</label>
              <input
                type="number"
                min="0"
                className="cp-form__input"
                placeholder="0"
                {...register('vacation_frecuency_days')}
              />
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Días máx. incapacidad</label>
              <input
                type="number"
                min="0"
                className="cp-form__input"
                placeholder="0"
                {...register('maximun_disable_days')}
              />
            </div>

            <div className="cp-form__field cp-form__field--checkbox">
              <label className="cp-form__checkbox-label">
                <input
                  type="checkbox"
                  className="cp-form__checkbox"
                  {...register('cumulative_vacation_date')}
                />
                Vacaciones acumulables
              </label>
            </div>

            {cumulative && (
              <div className="cp-form__field">
                <label className="cp-form__label">Inicio acumulación</label>
                <input
                  type="date"
                  className="cp-form__input"
                  {...register('start_cumulative_vacation')}
                />
              </div>
            )}
          </div>
        </form>
      </div>

      <div className="cp-modal__footer">
        <button
          type="button"
          className="cp-modal__btn cp-modal__btn--cancel"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          form={FORM_ID}
          className="cp-modal__btn cp-modal__btn--primary"
          disabled={isPending}
        >
          {isPending ? 'Guardando...' : existingContract ? 'Actualizar y continuar →' : 'Siguiente →'}
        </button>
      </div>
    </>
  )
}
