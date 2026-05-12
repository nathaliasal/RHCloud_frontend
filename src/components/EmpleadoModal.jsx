import { useEffect, useLayoutEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createEmpleado,
  updateEmpleado,
  getContratosEmpleado,
} from '@/services/empleados'
import { PlantillaPickerModal } from '@/components/PlantillaPickerModal'
import { ContratoEmpleadoModal } from '@/components/ContratoEmpleadoModal'

const PAGE_SIZE_CONTRACTS = 8

const CONTRACT_TYPE_LABELS = {
  indefinido:             'Indefinido',
  termino_fijo:           'Término fijo',
  obra_o_servicio:        'Obra o servicio',
  prestacion_servicios:   'Prestación de servicios',
  aprendizaje:            'Aprendizaje',
  practicas:              'Prácticas',
}

const CONTRACT_STATUS_CLASS = {
  activo:   'em-badge--success',
  inactivo: 'em-badge--muted',
  vencido:  'em-badge--error',
}

function formatDate(value) {
  if (!value) return 'N/A'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(date)
}

function formatCurrency(amount) {
  if (amount == null) return 'N/A'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(amount)
}

function normalizeError(error) {
  const detail = error?.response?.data?.detail
  if (Array.isArray(detail)) return detail.map(({ msg }) => msg).join(' ')
  if (typeof detail === 'string') return detail
  if (typeof error?.response?.data?.message === 'string') return error.response.data.message
  return 'No fue posible procesar la solicitud.'
}

const DEFAULT_VALUES = {
  user_id:    '',
  charge_id:  '',
  company_id: '',
}

function EmpleadoForm({ usuarios, cargos, empresas, existingEmployee, onSuccess, onCancel }) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: DEFAULT_VALUES })

  useEffect(() => {
    if (!existingEmployee) {
      reset(DEFAULT_VALUES)
      return
    }
    reset({
      user_id:    existingEmployee.user_id ?? '',
      charge_id:  existingEmployee.charge_id ?? '',
      company_id: existingEmployee.company_id ?? '',
    })
  }, [existingEmployee, reset])

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
    mutationFn: createEmpleado,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['empleados'] })
      onSuccess(data, false)
    },
    onError: handleApiError,
  })

  const updateMutation = useMutation({
    mutationFn: (body) => updateEmpleado(existingEmployee.id, body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['empleados'] })
      onSuccess(data, true)
    },
    onError: handleApiError,
  })

  const isPending = createMutation.isPending || updateMutation.isPending
  const mutError = createMutation.error ?? updateMutation.error

  const onSubmit = (values) => {
    const body = {
      user_id:    Number(values.user_id),
      charge_id:  Number(values.charge_id),
      company_id: Number(values.company_id),
    }
    if (existingEmployee) {
      updateMutation.mutate(body)
    } else {
      createMutation.mutate(body)
    }
  }

  return (
    <>
      <div className="em-modal__body">
        <div className="em-modal__header">
          <h3 className="em-modal__title">
            {existingEmployee ? 'Editar empleado' : 'Nuevo empleado'}
          </h3>
          <p className="em-modal__sub">
            Seleccione el usuario, el cargo y la empresa para el empleado.
          </p>
        </div>

        <form id="em-form" className="em-modal__form" onSubmit={handleSubmit(onSubmit)}>
          {mutError && (
            <div className="em-form__alert">{normalizeError(mutError)}</div>
          )}

          <div className="em-form__grid em-form__grid--2">
            <div className="em-form__field em-form__field--span2">
              <label className="em-form__label">Usuario *</label>
              <select
                className={`em-form__select${errors.user_id ? ' em-form__input--error' : ''}`}
                {...register('user_id', { required: 'Requerido' })}
              >
                <option value="">Seleccione un usuario</option>
                {usuarios.map(u => {
                  const nombre = u.persona
                    ? `${u.persona.first_name} ${u.persona.last_name}`.trim()
                    : (u.responsible_user || u.email)
                  return (
                    <option key={u.id} value={u.id}>
                      {nombre} — {u.email}
                    </option>
                  )
                })}
              </select>
              {errors.user_id && <span className="em-form__error">{errors.user_id.message}</span>}
            </div>

            <div className="em-form__field">
              <label className="em-form__label">Cargo *</label>
              <select
                className={`em-form__select${errors.charge_id ? ' em-form__input--error' : ''}`}
                {...register('charge_id', { required: 'Requerido' })}
              >
                <option value="">Seleccione un cargo</option>
                {cargos.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.charge_id && <span className="em-form__error">{errors.charge_id.message}</span>}
            </div>

            <div className="em-form__field">
              <label className="em-form__label">Empresa *</label>
              <select
                className={`em-form__select${errors.company_id ? ' em-form__input--error' : ''}`}
                {...register('company_id', { required: 'Requerido' })}
              >
                <option value="">Seleccione una empresa</option>
                {empresas.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              {errors.company_id && <span className="em-form__error">{errors.company_id.message}</span>}
            </div>
          </div>
        </form>
      </div>

      <div className="em-modal__footer">
        <button type="button" className="em-modal__btn em-modal__btn--cancel" onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="submit"
          form="em-form"
          className="em-modal__btn em-modal__btn--primary"
          disabled={isPending}
        >
          {isPending ? 'Guardando...' : existingEmployee ? 'Guardar cambios' : 'Crear empleado'}
        </button>
      </div>
    </>
  )
}

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

function ContratosList({ employeeId, onClose, onAddContrato, onEditContrato }) {
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['empleado-contratos', employeeId, page],
    queryFn: () => getContratosEmpleado(employeeId, { page, page_size: PAGE_SIZE_CONTRACTS }),
    enabled: !!employeeId,
    staleTime: 0,
    retry: 1,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.total_pages ?? 1
  const pageNumbers = buildPageNumbers(page, totalPages)

  return (
    <>
      <div className="em-modal__body">
        <div className="em-contracts">
          <div className="em-contracts__header">
            <div className="em-contracts__title">Contratos del empleado</div>
            <button
              type="button"
              className="em-modal__btn em-modal__btn--primary"
              onClick={onAddContrato}
            >
              + Añadir contrato
            </button>
          </div>

          {isLoading ? (
            <div className="em-state">
              <div className="em-spinner" />
              <span>Cargando contratos...</span>
            </div>
          ) : isError ? (
            <div className="em-state em-state--error">
              No fue posible cargar los contratos.
            </div>
          ) : items.length === 0 ? (
            <div className="em-state">Este empleado no tiene contratos registrados.</div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="em-contracts__table">
                  <thead>
                    <tr>
                      <th>CONTRATO</th>
                      <th>TIPO</th>
                      <th>VIGENCIA</th>
                      <th>SALARIO BASE</th>
                      <th>ESTADO</th>
                      <th>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="em-contracts__name">
                            <span className="em-contracts__name-text">{c.contract_name}</span>
                            {c.charge_name && (
                              <span className="em-contracts__name-sub">{c.charge_name}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="em-badge em-badge--accent">
                            {CONTRACT_TYPE_LABELS[c.contract_type] ?? c.contract_type}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.78rem' }}>
                              {formatDate(c.start_date)}
                            </span>
                            {c.end_date && (
                              <span style={{ fontSize: '0.65rem', color: 'rgba(237,244,255,0.35)' }}>
                                hasta {formatDate(c.end_date)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {formatCurrency(c.salary_base)}
                        </td>
                        <td>
                          <span className={`em-badge ${CONTRACT_STATUS_CLASS[c.contract_status] ?? 'em-badge--muted'}`}>
                            {c.contract_status ?? 'N/A'}
                          </span>
                        </td>
                        <td>
                          {c.modificalbe_contract ? (
                            <button
                              type="button"
                              className="em-action-btn em-action-btn--warning"
                              onClick={() => onEditContrato(c)}
                            >
                              Editar
                            </button>
                          ) : (
                            <span className="em-badge em-badge--muted" title="Contrato no modificable">
                              Bloqueado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {total > PAGE_SIZE_CONTRACTS && (
                <div className="em-contracts__pagination">
                  <button
                    type="button"
                    className="em-pagination__btn"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Ant.
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
                    Sig.
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="em-modal__footer">
        <button type="button" className="em-modal__btn em-modal__btn--cancel" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </>
  )
}

export function EmpleadoModal({ show, onClose, usuarios, cargos, empresas, initialEmployee }) {
  const [activeTab, setActiveTab] = useState('datos')
  const [currentEmployee, setCurrentEmployee] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [showContratoModal, setShowContratoModal] = useState(false)
  const [selectedPlantilla, setSelectedPlantilla] = useState(null)
  const [editingContract, setEditingContract] = useState(null)

  const isEditing = !!initialEmployee

  useLayoutEffect(() => {
    if (show) {
      setActiveTab('datos')
      setCurrentEmployee(null)
      setShowPicker(false)
      setShowContratoModal(false)
      setSelectedPlantilla(null)
      setEditingContract(null)
    }
  }, [show, initialEmployee])

  if (!show) return null

  const activeEmployee = currentEmployee ?? initialEmployee

  const handleEmployeeSuccess = (data, wasEditing) => {
    if (wasEditing) {
      onClose()
    } else {
      setCurrentEmployee(data)
      setActiveTab('contratos')
    }
  }

  const handleAddContrato = () => {
    setShowPicker(true)
  }

  const handleTemplateSelect = (template) => {
    setSelectedPlantilla(template)
    setShowPicker(false)
    setShowContratoModal(true)
  }

  const handleEditContrato = (contract) => {
    setEditingContract(contract)
    setShowContratoModal(true)
  }

  const handleContratoModalClose = () => {
    setShowContratoModal(false)
    setSelectedPlantilla(null)
    setEditingContract(null)
  }

  const canViewContratos = isEditing || !!currentEmployee

  return (
    <>
      <div className="em-overlay" onClick={onClose}>
        <div
          className={`em-modal${canViewContratos ? ' em-modal--wide' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="em-modal__tabs">
            <button
              type="button"
              className={`em-modal__tab${activeTab === 'datos' ? ' em-modal__tab--active' : ''}`}
              onClick={() => setActiveTab('datos')}
            >
              Datos del empleado
            </button>
            <button
              type="button"
              className={`em-modal__tab${activeTab === 'contratos' ? ' em-modal__tab--active' : ''}`}
              disabled={!canViewContratos}
              onClick={() => canViewContratos && setActiveTab('contratos')}
            >
              Contratos
            </button>
          </div>

          {activeTab === 'datos' && (
            <EmpleadoForm
              usuarios={usuarios}
              cargos={cargos}
              empresas={empresas}
              existingEmployee={initialEmployee}
              onSuccess={handleEmployeeSuccess}
              onCancel={onClose}
            />
          )}

          {activeTab === 'contratos' && canViewContratos && (
            <ContratosList
              employeeId={activeEmployee?.id}
              onClose={onClose}
              onAddContrato={handleAddContrato}
              onEditContrato={handleEditContrato}
            />
          )}
        </div>
      </div>

      <PlantillaPickerModal
        show={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleTemplateSelect}
      />

      {showContratoModal && activeEmployee && (
        <ContratoEmpleadoModal
          show={showContratoModal}
          onClose={handleContratoModalClose}
          employee={activeEmployee}
          initialTemplate={selectedPlantilla}
          existingContract={editingContract}
        />
      )}
    </>
  )
}
