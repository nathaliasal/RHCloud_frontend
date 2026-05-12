import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { AdminLayout } from '@/components/AdminLayout'
import { http } from '@/services/http'
import './Cargos.css'

const PAGE_SIZE = 10
const LIST_ENDPOINT = '/api/v1/employee_charges/'

const STATUS_META = {
  true: { label: 'ACTIVO', badge: 'charge-badge--success' },
  false: { label: 'INACTIVO', badge: 'charge-badge--muted' },
}

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

function getCharges(params) {
  return http.get(LIST_ENDPOINT, { params }).then((response) => response.data)
}

function getChargeById(chargeId) {
  return http.get(`/api/v1/employee_charges/${chargeId}`).then((response) => response.data)
}

function createCharge(body) {
  return http.post(LIST_ENDPOINT, body).then((response) => response.data)
}

function updateCharge(chargeId, body) {
  return http.put(`/api/v1/employee_charges/${chargeId}`, body).then((response) => response.data)
}

function deleteCharge(chargeId) {
  return http.delete(`/api/v1/employee_charges/${chargeId}`).then((response) => response.data)
}

function toggleChargeActivation(chargeId, isActive) {
  return http.patch(`/api/v1/employee_charges/${chargeId}/activation`, {}, {
    params: { is_active: isActive },
  }).then((response) => response.data)
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

function applyValidationErrors(error, setError) {
  const detail = error?.response?.data?.detail

  if (!Array.isArray(detail)) return

  detail.forEach(({ loc, msg }) => {
    const field = loc?.[loc.length - 1]

    if (typeof field === 'string') {
      setError(field, { message: msg })
    }
  })
}

function getInitials(name) {
  const letters = (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join('')
    .toUpperCase()

  return letters || 'CG'
}

function sortCharges(items, sort) {
  const sorted = [...items]

  sorted.sort((left, right) => {
    if (sort === 'nombre-za') {
      return right.name.localeCompare(left.name)
    }

    if (sort === 'estado') {
      if (left.is_active === right.is_active) {
        return left.name.localeCompare(right.name)
      }

      return Number(right.is_active) - Number(left.is_active)
    }

    return left.name.localeCompare(right.name)
  })

  return sorted
}

function getFormValues(charge) {
  return {
    name: charge?.name ?? '',
    description: charge?.description ?? '',
    is_active: charge?.is_active ? 'true' : 'false',
  }
}

export default function Cargos() {
  const queryClient = useQueryClient()
  const rootRef = useRef(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('todos')
  const [sort, setSort] = useState('nombre-az')
  const [search, setSearch] = useState('')
  const [modalMode, setModalMode] = useState(null)
  const [selectedChargeId, setSelectedChargeId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [pageNotice, setPageNotice] = useState(null)
  const deferredSearch = useDeferredValue(search.trim().toLowerCase())

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: getFormValues(),
  })

  const queryParams = useMemo(() => ({
    page,
    page_size: PAGE_SIZE,
    'page size': PAGE_SIZE,
    ...(statusFilter !== 'todos' && { is_active: statusFilter === 'activos' }),
  }), [page, statusFilter])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['employee-charges-admin', queryParams],
    queryFn: () => getCharges(queryParams),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const {
    data: chargeDetail,
    isLoading: isChargeLoading,
    isError: isChargeError,
  } = useQuery({
    queryKey: ['employee-charge-admin-detail', selectedChargeId],
    queryFn: () => getChargeById(selectedChargeId),
    enabled: modalMode === 'edit' && Boolean(selectedChargeId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const createMutation = useMutation({
    mutationFn: (body) => createCharge(body),
    onSuccess: () => {
      setPageNotice({ type: 'success', text: 'El cargo se creo correctamente.' })
      setPage(1)
      closeModal()
      queryClient.invalidateQueries({ queryKey: ['employee-charges-admin'] })
    },
    onError: (error) => {
      applyValidationErrors(error, setError)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ chargeId, body }) => updateCharge(chargeId, body),
    onSuccess: () => {
      setPageNotice({ type: 'success', text: 'El cargo se actualizo correctamente.' })
      closeModal()
      queryClient.invalidateQueries({ queryKey: ['employee-charges-admin'] })
      queryClient.invalidateQueries({ queryKey: ['employee-charge-admin-detail', selectedChargeId] })
    },
    onError: (error) => {
      applyValidationErrors(error, setError)
    },
  })

  const activationMutation = useMutation({
    mutationFn: ({ chargeId, isActive }) => toggleChargeActivation(chargeId, isActive),
    onSuccess: (_, variables) => {
      setPageNotice({
        type: 'success',
        text: variables.isActive
          ? 'El cargo quedo activo.'
          : 'El cargo quedo inactivo.',
      })
      queryClient.invalidateQueries({ queryKey: ['employee-charges-admin'] })
    },
    onError: (error) => {
      setPageNotice({ type: 'error', text: normalizeError(error) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (chargeId) => deleteCharge(chargeId),
    onSuccess: () => {
      setPageNotice({ type: 'success', text: 'El cargo se elimino correctamente.' })
      setConfirmDelete(null)
      queryClient.invalidateQueries({ queryKey: ['employee-charges-admin'] })
    },
    onError: (error) => {
      setPageNotice({ type: 'error', text: normalizeError(error) })
    },
  })

  useEffect(() => {
    if (modalMode === 'create') {
      clearErrors()
      reset(getFormValues())
    }
  }, [clearErrors, modalMode, reset])

  useEffect(() => {
    if (modalMode !== 'edit' || !chargeDetail || chargeDetail.id !== selectedChargeId) return

    clearErrors()
    reset(getFormValues(chargeDetail))
  }, [chargeDetail, clearErrors, modalMode, reset, selectedChargeId])

  useEffect(() => {
    if (isLoading) return

    const ctx = gsap.context(() => {
      gsap.from('.charge-header, .charge-summary, .charge-filters, .charge-table-card', {
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
    const filtered = items.filter((charge) => {
      if (!deferredSearch) return true

      const haystack = [
        charge.name,
        charge.description,
        charge.responsible_user,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(deferredSearch)
    })

    return sortCharges(filtered, sort)
  }, [deferredSearch, items, sort])

  const summary = useMemo(() => {
    const counts = {
      active: 0,
      inactive: 0,
    }

    items.forEach((charge) => {
      if (charge.is_active) counts.active += 1
      else counts.inactive += 1
    })

    return counts
  }, [items])

  function openCreateModal() {
    setPageNotice(null)
    setSelectedChargeId(null)
    setModalMode('create')
  }

  function openEditModal(chargeId) {
    setPageNotice(null)
    setSelectedChargeId(chargeId)
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode(null)
    setSelectedChargeId(null)
    clearErrors()
    reset(getFormValues())
  }

  function onSubmit(values) {
    const body = {
      name: values.name.trim(),
      description: values.description.trim() ? values.description.trim() : null,
    }

    if (modalMode === 'create') {
      createMutation.mutate(body)
      return
    }

    if (!selectedChargeId) return

    updateMutation.mutate({
      chargeId: selectedChargeId,
      body: {
        ...body,
        is_active: values.is_active === 'true',
      },
    })
  }

  return (
    <AdminLayout>
      <div className="charge-page" ref={rootRef}>
        <div className="charge-header">
          <nav className="charge-header__breadcrumb">
            <span>PANEL</span>
            <span className="charge-header__sep">/</span>
            <span className="charge-header__crumb-active">CARGOS</span>
          </nav>

          <div className="charge-header__row">
            <div>
              <h1 className="charge-header__title">Cargos de empleados</h1>
              <p className="charge-header__sub">
                Administre el catalogo de cargos disponibles para contratos, perfiles y asignaciones del sistema.
              </p>
            </div>

            <div className="charge-header__actions">
              <div className="charge-header__note">
                <span className="charge-header__note-label">Total</span>
                <strong className="charge-header__note-value">{total}</strong>
              </div>
              <button type="button" className="charge-header__button" onClick={openCreateModal}>
                Nuevo cargo
              </button>
            </div>
          </div>
        </div>

        <div className="charge-summary">
          <div className="charge-summary__card">
            <span className="charge-summary__label">Activos en pagina</span>
            <strong className="charge-summary__value">{summary.active}</strong>
          </div>
          <div className="charge-summary__card">
            <span className="charge-summary__label">Inactivos en pagina</span>
            <strong className="charge-summary__value">{summary.inactive}</strong>
          </div>
          <div className="charge-summary__card">
            <span className="charge-summary__label">Resultados visibles</span>
            <strong className="charge-summary__value">{visibleItems.length}</strong>
          </div>
          <div className="charge-summary__card">
            <span className="charge-summary__label">Pagina actual</span>
            <strong className="charge-summary__value">{page}</strong>
          </div>
        </div>

        <div className="charge-filters">
          <div className="charge-filters__search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="charge-filters__search-input"
              placeholder="BUSCAR CARGO, DESCRIPCION O RESPONSABLE"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </div>

          <div className="charge-filters__control">
            <span className="charge-filters__label">ESTADO:</span>
            <select
              className="charge-filters__select"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setPage(1)
              }}
            >
              <option value="todos">TODOS</option>
              <option value="activos">ACTIVOS</option>
              <option value="inactivos">INACTIVOS</option>
            </select>
          </div>

          <div className="charge-filters__control">
            <span className="charge-filters__label">ORDEN:</span>
            <select
              className="charge-filters__select"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="nombre-az">NOMBRE A-Z</option>
              <option value="nombre-za">NOMBRE Z-A</option>
              <option value="estado">ACTIVOS PRIMERO</option>
            </select>
          </div>
        </div>

        <div className="charge-table-card">
          <div className="charge-table-card__header">
            <div>
              <h2 className="charge-table-card__title">Catalogo administrativo</h2>
              <p className="charge-table-card__sub">
                Cree, ajuste, active o elimine cargos segun la operacion interna del negocio.
              </p>
            </div>
          </div>

          {pageNotice ? (
            <div className={`charge-alert charge-alert--${pageNotice.type}`}>
              {pageNotice.text}
            </div>
          ) : null}

          {isLoading ? (
            <div className="charge-state">
              <div className="charge-spinner" />
              <span>Cargando cargos...</span>
            </div>
          ) : isError ? (
            <div className="charge-state charge-state--error">
              No fue posible cargar los cargos.
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="charge-state">
              No se encontraron cargos con los filtros actuales.
            </div>
          ) : (
            <div className="charge-table-wrap">
              <table className="charge-table">
                <thead>
                  <tr>
                    <th>CARGO</th>
                    <th>DESCRIPCION</th>
                    <th>RESPONSABLE</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((charge) => {
                    const statusMeta = STATUS_META[String(charge.is_active)] ?? STATUS_META.true
                    const activationPending = activationMutation.isPending
                      && activationMutation.variables?.chargeId === charge.id
                    const deletePending = deleteMutation.isPending && confirmDelete?.id === charge.id

                    return (
                      <tr key={charge.id} className="charge-table__row">
                        <td>
                          <div className="charge-entry">
                            <span className="charge-entry__avatar">{getInitials(charge.name)}</span>
                            <div className="charge-entry__content">
                              <span className="charge-entry__name">{charge.name}</span>
                              <span className="charge-entry__meta">ID {charge.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className={`charge-description${charge.description ? '' : ' charge-description--muted'}`}>
                            {charge.description || 'Sin descripcion registrada.'}
                          </p>
                        </td>
                        <td>
                          <span className="charge-responsible">
                            {charge.responsible_user || 'Sin responsable registrado.'}
                          </span>
                        </td>
                        <td>
                          <span className={`charge-badge ${statusMeta.badge}`}>{statusMeta.label}</span>
                        </td>
                        <td>
                          <div className="charge-actions">
                            <button
                              type="button"
                              className="charge-action-btn charge-action-btn--accent"
                              onClick={() => openEditModal(charge.id)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className={`charge-action-btn ${charge.is_active ? 'charge-action-btn--warning' : 'charge-action-btn--success'}`}
                              disabled={activationPending}
                              onClick={() => activationMutation.mutate({
                                chargeId: charge.id,
                                isActive: !charge.is_active,
                              })}
                            >
                              {activationPending
                                ? 'Procesando'
                                : charge.is_active
                                  ? 'Inactivar'
                                  : 'Activar'}
                            </button>
                            <button
                              type="button"
                              className="charge-action-btn charge-action-btn--danger"
                              disabled={deletePending}
                              onClick={() => setConfirmDelete(charge)}
                            >
                              {deletePending ? 'Procesando' : 'Eliminar'}
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

          {!isLoading && !isError && total > 0 ? (
            <div className="charge-pagination">
              <span className="charge-pagination__info">
                MOSTRANDO {visibleItems.length} DE {total} REGISTROS
              </span>

              <div className="charge-pagination__controls">
                <button
                  type="button"
                  className="charge-pagination__btn"
                  disabled={page === 1}
                  onClick={() => setPage((currentPage) => currentPage - 1)}
                >
                  Anterior
                </button>

                {pageNumbers.map((value, index) =>
                  value === '...'
                    ? (
                      <span key={`ellipsis-${index}`} className="charge-pagination__ellipsis">
                        ...
                      </span>
                    )
                    : (
                      <button
                        key={value}
                        type="button"
                        className={`charge-pagination__btn${value === page ? ' charge-pagination__btn--active' : ''}`}
                        onClick={() => setPage(value)}
                      >
                        {value}
                      </button>
                    )
                )}

                <button
                  type="button"
                  className="charge-pagination__btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {modalMode ? (
          <ChargeFormModal
            mode={modalMode}
            errors={errors}
            isLoading={modalMode === 'edit' && isChargeLoading}
            isError={modalMode === 'edit' && isChargeError}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            onClose={closeModal}
            onSubmit={handleSubmit(onSubmit)}
            register={register}
            requestError={normalizeRequestError(createMutation.error, updateMutation.error)}
          />
        ) : null}

        {confirmDelete ? (
          <ConfirmDeleteDialog
            item={confirmDelete}
            isDeleting={deleteMutation.isPending}
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => deleteMutation.mutate(confirmDelete.id)}
          />
        ) : null}
      </div>
    </AdminLayout>
  )
}

function normalizeRequestError(createError, updateError) {
  const activeError = updateError ?? createError
  return activeError ? normalizeError(activeError) : ''
}

function ChargeFormModal({
  mode,
  errors,
  isLoading,
  isError,
  isSubmitting,
  onClose,
  onSubmit,
  register,
  requestError,
}) {
  const isEdit = mode === 'edit'

  return (
    <div className="charge-modal-overlay" onClick={onClose}>
      <div className="charge-modal" onClick={(event) => event.stopPropagation()}>
        <div className="charge-modal__header">
          <div>
            <h3 className="charge-modal__title">
              {isEdit ? 'Editar cargo' : 'Crear cargo'}
            </h3>
            <p className="charge-modal__sub">
              {isEdit
                ? 'Actualice los datos base del cargo y su estado administrativo.'
                : 'Registre un nuevo cargo para el catalogo interno del sistema.'}
            </p>
          </div>

          <button type="button" className="charge-modal__close" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {isLoading ? (
          <div className="charge-state charge-state--modal">
            <div className="charge-spinner" />
            <span>Cargando datos del cargo...</span>
          </div>
        ) : isError ? (
          <div className="charge-state charge-state--modal charge-state--error">
            No fue posible cargar el detalle del cargo.
          </div>
        ) : (
          <form className="charge-form" onSubmit={onSubmit}>
            {requestError ? (
              <div className="charge-alert charge-alert--error charge-alert--modal">
                {requestError}
              </div>
            ) : null}

            <div className="charge-form__grid">
              <label className="charge-field charge-field--full">
                <span className="charge-field__label">Nombre del cargo</span>
                <input
                  type="text"
                  className={`charge-field__input${errors.name ? ' charge-field__input--error' : ''}`}
                  placeholder="Ejemplo: Analista de talento humano"
                  {...register('name', {
                    required: 'El nombre del cargo es obligatorio.',
                  })}
                />
                {errors.name ? <span className="charge-field__error">{errors.name.message}</span> : null}
              </label>

              <label className="charge-field charge-field--full">
                <span className="charge-field__label">Descripcion</span>
                <textarea
                  className={`charge-field__textarea${errors.description ? ' charge-field__textarea--error' : ''}`}
                  rows={5}
                  placeholder="Agregue una descripcion breve del cargo."
                  {...register('description')}
                />
                {errors.description ? (
                  <span className="charge-field__error">{errors.description.message}</span>
                ) : null}
              </label>

              {isEdit ? (
                <label className="charge-field">
                  <span className="charge-field__label">Estado</span>
                  <select
                    className={`charge-field__input${errors.is_active ? ' charge-field__input--error' : ''}`}
                    {...register('is_active')}
                  >
                    <option value="true">ACTIVO</option>
                    <option value="false">INACTIVO</option>
                  </select>
                  {errors.is_active ? (
                    <span className="charge-field__error">{errors.is_active.message}</span>
                  ) : null}
                </label>
              ) : null}
            </div>

            <div className="charge-form__actions">
              <button
                type="button"
                className="charge-form__btn charge-form__btn--ghost"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="charge-form__btn charge-form__btn--primary"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Guardando'
                  : isEdit
                    ? 'Guardar cambios'
                    : 'Crear cargo'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function ConfirmDeleteDialog({ item, isDeleting, onCancel, onConfirm }) {
  return (
    <div className="charge-modal-overlay" onClick={onCancel}>
      <div className="charge-confirm" onClick={(event) => event.stopPropagation()}>
        <h3 className="charge-confirm__title">Eliminar cargo</h3>
        <p className="charge-confirm__body">
          Se eliminara el cargo <strong>{item.name}</strong>. Esta accion no se puede deshacer.
        </p>
        <div className="charge-confirm__actions">
          <button type="button" className="charge-form__btn charge-form__btn--ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className="charge-form__btn charge-form__btn--danger"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? 'Eliminando' : 'Confirmar eliminacion'}
          </button>
        </div>
      </div>
    </div>
  )
}
