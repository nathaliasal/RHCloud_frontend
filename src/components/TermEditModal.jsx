import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { createTermino, updateTermino } from '@/services/terminos'
import './EmpresaModal.css'

export function TermEditModal({ term, companyId, onClose }) {
  const queryClient = useQueryClient()
  const backdropRef = useRef(null)
  const panelRef = useRef(null)
  const isEditing = !!term

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title:       term?.title       ?? '',
      description: term?.description ?? '',
    },
  })

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') animateClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function animateClose() {
    gsap.to(panelRef.current, { opacity: 0, y: 16, duration: 0.18, ease: 'power2.in', onComplete: onClose })
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.18 })
  }

  const mutation = useMutation({
    mutationFn: (body) =>
      isEditing
        ? updateTermino(term.id, body)
        : createTermino({ ...body, company_id: Number(companyId) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminos'] })
      animateClose()
    },
    onError: (err) => {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        detail.forEach(({ loc, msg }) => {
          const field = loc[loc.length - 1]
          if (typeof field === 'string') setError(field, { message: msg })
        })
      }
    },
  })

  return createPortal(
    <div
      className="em-backdrop"
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) animateClose() }}
    >
      <div className="em-panel" ref={panelRef} role="dialog" aria-modal="true">

        <div className="em-header">
          <div>
            <h2 className="em-header__title">{isEditing ? 'Editar Término' : 'Nuevo Término'}</h2>
            <p className="em-header__sub">
              {isEditing ? 'Modifica el título y la descripción.' : 'Agrega un nuevo término a la empresa.'}
            </p>
          </div>
          <button className="em-close-btn" type="button" onClick={animateClose} aria-label="Cerrar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} noValidate>
          <div className="em-body">
            <section className="em-section">
              <div className="em-grid">

                <div className="em-field em-field--full">
                  <label className="em-field__label">
                    Título <span className="em-field__req">*</span>
                  </label>
                  <input
                    className={`em-field__input${errors.title ? ' em-field__input--err' : ''}`}
                    {...register('title', { required: 'Requerido' })}
                  />
                  {errors.title && <span className="em-field__error">{errors.title.message}</span>}
                </div>

                <div className="em-field em-field--full">
                  <label className="em-field__label">
                    Descripción <span className="em-field__req">*</span>
                  </label>
                  <textarea
                    className={`em-field__input em-field__textarea${errors.description ? ' em-field__input--err' : ''}`}
                    rows={5}
                    {...register('description', { required: 'Requerido' })}
                  />
                  {errors.description && <span className="em-field__error">{errors.description.message}</span>}
                </div>

              </div>
            </section>
          </div>

          <div className="em-footer">
            {mutation.isError && !Array.isArray(mutation.error?.response?.data?.detail) && (
              <span className="em-footer__error">
                {isEditing ? 'Error al actualizar el término.' : 'Error al crear el término.'}
              </span>
            )}
            <div className="em-footer__actions">
              <button type="button" className="em-btn-cancel" onClick={animateClose}>
                Cancelar
              </button>
              <button type="submit" className="em-btn-submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <span className="em-btn-spinner" />
                    {isEditing ? 'Guardando...' : 'Creando...'}
                  </>
                ) : isEditing ? 'Guardar cambios' : 'Crear Término'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>,
    document.body
  )
}
