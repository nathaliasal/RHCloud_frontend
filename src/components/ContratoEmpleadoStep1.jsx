import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getContrato, createContrato, updateContrato } from '@/services/contratosEmpleados'

const CONTRACT_TYPES = [
  { value: 'indefinido',           label: 'Indefinido' },
  { value: 'termino_fijo',         label: 'Término fijo' },
  { value: 'obra_o_servicio',      label: 'Obra o servicio' },
  { value: 'prestacion_servicios', label: 'Prestación de servicios' },
  { value: 'aprendizaje',          label: 'Aprendizaje' },
  { value: 'practicas',            label: 'Prácticas' },
]

const PAYMENT_FREQUENCY_TYPES = [
  { value: 'mensual',   label: 'Mensual' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'semanal',   label: 'Semanal' },
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
  { value: 'por_horas',    label: 'Por horas' },
  { value: 'por_dias',     label: 'Por días' },
  { value: 'mensual_fijo', label: 'Mensual fijo' },
]

const CURRENCY_TYPES = [
  { value: 'COP', label: 'COP — Peso colombiano' },
  { value: 'USD', label: 'USD — Dólar' },
  { value: 'EUR', label: 'EUR — Euro' },
]

const OVERTIME_PERIODS = [
  { value: 'diario',  label: 'Diario' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensual', label: 'Mensual' },
]

const CONTRACT_STATUSES = [
  { value: 'activo',   label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'vencido',  label: 'Vencido' },
]

const FORM_ID = 'ce-step1'

const DEFAULT_VALUES = {
  contract_name:                      '',
  contract_type:                      'indefinido',
  start_date:                         '',
  end_date:                           '',
  payment_frequency_type:             'mensual',
  minimun_hours:                      '',
  work_mode_type:                     'presencial',
  payment_type:                       'transferencia',
  salary_type:                        'por_horas',
  working_hours:                      '',
  salary_base:                        '',
  currency_type:                      'COP',
  trail_period_days:                  '',
  vacation_days:                      '',
  cumulative_vacation:                false,
  start_cumulative_vacation:          '',
  vacation_frequency_days:            '',
  maximun_disability_days:            '',
  overtime:                           '',
  overtime_preriod:                   'diario',
  contract_status:                    'activo',
  modificalbe_contract:               true,
  contract_termination_justification: '',
}

function normalizeError(error) {
  const detail = error?.response?.data?.detail
  if (Array.isArray(detail)) return detail.map(({ msg }) => msg).join(' ')
  if (typeof detail === 'string') return detail
  if (typeof error?.response?.data?.message === 'string') return error.response.data.message
  return 'No fue posible procesar la solicitud.'
}

function templateToForm(t) {
  return {
    contract_name:                      t.contract_name ?? '',
    contract_type:                      t.contract_type ?? 'indefinido',
    start_date:                         '',
    end_date:                           '',
    payment_frequency_type:             t.payment_frequency_type ?? 'mensual',
    minimun_hours:                      t.minimun_hours ?? '',
    work_mode_type:                     t.work_mode_type ?? 'presencial',
    payment_type:                       t.payment_type ?? 'transferencia',
    salary_type:                        t.salary_type ?? 'por_horas',
    working_hours:                      t.working_hours ?? '',
    salary_base:                        t.salary_base ?? '',
    currency_type:                      t.currency_type ?? 'COP',
    trail_period_days:                  t.trail_period_days ?? '',
    vacation_days:                      t.vacation_days ?? '',
    cumulative_vacation:                t.cumulative_vacation_date ?? false,
    start_cumulative_vacation:          t.start_cumulative_vacation ?? '',
    vacation_frequency_days:            t.vacation_frecuency_days ?? '',
    maximun_disability_days:            t.maximun_disable_days ?? '',
    overtime:                           t.overtime ?? '',
    overtime_preriod:                   t.overtime_preriod ?? 'diario',
    contract_status:                    'activo',
    modificalbe_contract:               true,
    contract_termination_justification: '',
  }
}

export function ContratoEmpleadoStep1({ employee, initialTemplate, existingContract, onSuccess, onCancel }) {
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
  const cumulative = watch('cumulative_vacation')

  const { data: fullContract, isLoading: isLoadingContract } = useQuery({
    queryKey: ['contrato-detail', existingContract?.id],
    queryFn: () => getContrato(existingContract.id),
    enabled: !!existingContract?.id,
    staleTime: 0,
  })

  useEffect(() => {
    const src = fullContract ?? (existingContract?.id ? null : existingContract)
    if (src) {
      reset({
        contract_name:                      src.contract_name ?? '',
        contract_type:                      src.contract_type ?? 'indefinido',
        start_date:                         src.start_date ?? '',
        end_date:                           src.end_date ?? '',
        payment_frequency_type:             src.payment_frequency_type ?? 'mensual',
        minimun_hours:                      src.minimun_hours ?? '',
        work_mode_type:                     src.work_mode_type ?? 'presencial',
        payment_type:                       src.payment_type ?? 'transferencia',
        salary_type:                        src.salary_type ?? 'por_horas',
        working_hours:                      src.working_hours ?? '',
        salary_base:                        src.salary_base ?? '',
        currency_type:                      src.currency_type ?? 'COP',
        trail_period_days:                  src.trail_period_days ?? '',
        vacation_days:                      src.vacation_days ?? '',
        cumulative_vacation:                src.cumulative_vacation ?? false,
        start_cumulative_vacation:          src.start_cumulative_vacation ?? '',
        vacation_frequency_days:            src.vacation_frequency_days ?? '',
        maximun_disability_days:            src.maximun_disability_days ?? '',
        overtime:                           src.overtime ?? '',
        overtime_preriod:                   src.overtime_preriod ?? 'diario',
        contract_status:                    src.contract_status ?? 'activo',
        modificalbe_contract:               src.modificalbe_contract ?? true,
        contract_termination_justification: src.contract_termination_justification ?? '',
      })
    } else if (!existingContract && initialTemplate) {
      reset(templateToForm(initialTemplate))
    }
  }, [fullContract, existingContract, initialTemplate, reset])

  const handleApiError = (error) => {
    const detail = error?.response?.data?.detail
    if (Array.isArray(detail)) {
      detail.forEach(({ loc, msg }) => {
        const field = loc[loc.length - 1]
        if (typeof field === 'string') setError(field, { message: msg })
      })
    }
  }

  const createMutation = useMutation({
    mutationFn: createContrato,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['empleado-contratos', employee.id] })
      onSuccess(data)
    },
    onError: handleApiError,
  })

  const updateMutation = useMutation({
    mutationFn: (body) => updateContrato(existingContract.id, body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['empleado-contratos', employee.id] })
      onSuccess(data)
    },
    onError: handleApiError,
  })

  const isPending = createMutation.isPending || updateMutation.isPending
  const mutError = createMutation.error ?? updateMutation.error

  const buildBody = (values) => ({
    contract_name:                      values.contract_name,
    contract_type:                      values.contract_type,
    start_date:                         values.start_date,
    end_date:                           contractType === 'indefinido' ? null : (values.end_date || null),
    payment_frequency_type:             values.payment_frequency_type,
    minimun_hours:                      Number(values.minimun_hours) || 0,
    work_mode_type:                     values.work_mode_type,
    payment_type:                       values.payment_type,
    salary_type:                        values.salary_type,
    working_hours:                      Number(values.working_hours) || 0,
    salary_base:                        Number(values.salary_base) || 0,
    currency_type:                      values.currency_type,
    trail_period_days:                  Number(values.trail_period_days) || 0,
    vacation_days:                      Number(values.vacation_days) || 0,
    cumulative_vacation:                Boolean(values.cumulative_vacation),
    start_cumulative_vacation:          values.start_cumulative_vacation || null,
    vacation_frequency_days:            Number(values.vacation_frequency_days) || 0,
    maximun_disability_days:            Number(values.maximun_disability_days) || 0,
    overtime:                           Number(values.overtime) || 0,
    overtime_preriod:                   values.overtime_preriod,
    contract_status:                    values.contract_status,
    modificalbe_contract:               Boolean(values.modificalbe_contract),
    contract_termination_justification: values.contract_termination_justification || null,
    employee_id:                        employee.id,
    employee_charge_id:                 employee.charge_id,
  })

  const onSubmit = (values) => {
    const body = buildBody(values)
    if (existingContract) {
      updateMutation.mutate(body)
    } else {
      createMutation.mutate(body)
    }
  }

  if (isLoadingContract) {
    return (
      <div className="cp-modal__body">
        <div className="cp-state" style={{ padding: '3rem 0' }}>
          <div className="cp-spinner" /><span>Cargando contrato...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="cp-modal__body">
        <div className="cp-modal__header">
          <h3 className="cp-modal__title">Generalidades del contrato</h3>
          <p className="cp-modal__sub">
            Complete la información base del contrato. Los datos están precargados desde la plantilla seleccionada.
          </p>
        </div>

        <form id={FORM_ID} className="cp-modal__form" onSubmit={handleSubmit(onSubmit)}>
          {mutError && (
            <div className="cp-alert cp-alert--error">{normalizeError(mutError)}</div>
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
              <label className="cp-form__label">Estado del contrato *</label>
              <select className="cp-form__select" {...register('contract_status')}>
                {CONTRACT_STATUSES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
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

            <div className="cp-form__field cp-form__field--checkbox">
              <label className="cp-form__checkbox-label">
                <input
                  type="checkbox"
                  className="cp-form__checkbox"
                  {...register('modificalbe_contract')}
                />
                Contrato modificable
              </label>
            </div>
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
                type="number" min="0" className="cp-form__input" placeholder="0"
                {...register('working_hours')}
              />
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Horas mínimas</label>
              <input
                type="number" min="0" className="cp-form__input" placeholder="0"
                {...register('minimun_hours')}
              />
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Horas extra</label>
              <input
                type="number" min="0" className="cp-form__input" placeholder="0"
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
                type="number" min="0" className="cp-form__input" placeholder="0"
                {...register('trail_period_days')}
              />
            </div>
          </div>

          <div className="cp-form__section-title">Vacaciones e incapacidades</div>
          <div className="cp-form__grid cp-form__grid--3">
            <div className="cp-form__field">
              <label className="cp-form__label">Días de vacaciones</label>
              <input
                type="number" min="0" className="cp-form__input" placeholder="0"
                {...register('vacation_days')}
              />
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Frecuencia vacaciones (días)</label>
              <input
                type="number" min="0" className="cp-form__input" placeholder="0"
                {...register('vacation_frequency_days')}
              />
            </div>

            <div className="cp-form__field">
              <label className="cp-form__label">Días máx. incapacidad</label>
              <input
                type="number" min="0" className="cp-form__input" placeholder="0"
                {...register('maximun_disability_days')}
              />
            </div>

            <div className="cp-form__field cp-form__field--checkbox">
              <label className="cp-form__checkbox-label">
                <input
                  type="checkbox"
                  className="cp-form__checkbox"
                  {...register('cumulative_vacation')}
                />
                Vacaciones acumulables
              </label>
            </div>

            {cumulative && (
              <div className="cp-form__field">
                <label className="cp-form__label">Inicio acumulación</label>
                <input
                  type="date" className="cp-form__input"
                  {...register('start_cumulative_vacation')}
                />
              </div>
            )}
          </div>

          {existingContract && (
            <>
              <div className="cp-form__section-title">Terminación</div>
              <div className="cp-form__grid cp-form__grid--2">
                <div className="cp-form__field cp-form__field--span2">
                  <label className="cp-form__label">Justificación de terminación</label>
                  <input
                    className="cp-form__input"
                    placeholder="Opcional — razón de terminación del contrato"
                    {...register('contract_termination_justification')}
                  />
                </div>
              </div>
            </>
          )}
        </form>
      </div>

      <div className="cp-modal__footer">
        <button type="button" className="cp-modal__btn cp-modal__btn--cancel" onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="submit"
          form={FORM_ID}
          className="cp-modal__btn cp-modal__btn--primary"
          disabled={isPending}
        >
          {isPending ? 'Guardando...' : existingContract ? 'Actualizar y continuar →' : 'Crear contrato →'}
        </button>
      </div>
    </>
  )
}
