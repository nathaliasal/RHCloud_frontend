import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { createEmpresa, uploadEmpresaLogo } from '@/services/empresas'
import './EmpresaModal.css'

const DOCUMENT_TYPES = [
  { value: 'CC',  label: 'CC — Cédula de Ciudadanía' },
  { value: 'NIT', label: 'NIT — Número de Identificación' },
  { value: 'CE',  label: 'CE — Cédula de Extranjería' },
  { value: 'PA',  label: 'PA — Pasaporte' },
  { value: 'RUT', label: 'RUT' },
]

export function EmpresaModal({ onClose }) {
  const queryClient = useQueryClient()
  const backdropRef = useRef(null)
  const panelRef = useRef(null)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm({ defaultValues: { terms: [] } })

  const { fields, append, remove } = useFieldArray({ control, name: 'terms' })

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') animateClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function animateClose() {
    gsap.to(panelRef.current, { opacity: 0, y: 16, duration: 0.18, ease: 'power2.in', onComplete: onClose })
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.18 })
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const prev = URL.createObjectURL(file)
    setLogoPreview(prev)
  }

  const mutation = useMutation({
    mutationFn: async (raw) => {
      const { terms, ...rest } = raw
      const body = Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      )
      const validTerms = (terms ?? []).filter(t => t.title?.trim() && t.description?.trim())
      if (validTerms.length) body.terms = validTerms

      const created = await createEmpresa(body)
      if (logoFile) await uploadEmpresaLogo(created.id, logoFile)
      return created
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] })
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

        {/* ── Header ── */}
        <div className="em-header">
          <div>
            <h2 className="em-header__title">Nueva Empresa</h2>
            <p className="em-header__sub">Complete los datos para registrar la compañía en el sistema.</p>
          </div>
          <button className="em-close-btn" type="button" onClick={animateClose} aria-label="Cerrar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} noValidate>
          <div className="em-body">

            {/* Logo */}
            <section className="em-section">
              <h3 className="em-section__title">Logo de la empresa</h3>
              <label className="em-logo-uploader">
                {logoPreview ? (
                  <img src={logoPreview} alt="preview" className="em-logo-uploader__preview" />
                ) : (
                  <div className="em-logo-uploader__placeholder">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Clic para cargar imagen</span>
                    <small>PNG, JPG, WEBP — máx. 5 MB</small>
                  </div>
                )}
                <input type="file" accept="image/*" className="em-logo-uploader__input" onChange={handleLogoChange} />
              </label>
              {logoPreview && (
                <button
                  type="button"
                  className="em-logo-uploader__remove"
                  onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                >
                  Quitar imagen
                </button>
              )}
            </section>

            {/* Company info */}
            <section className="em-section">
              <h3 className="em-section__title">Información de la empresa</h3>
              <div className="em-grid">

                <div className="em-field em-field--full">
                  <label className="em-field__label">
                    Nombre <span className="em-field__req">*</span>
                  </label>
                  <input
                    className={`em-field__input${errors.name ? ' em-field__input--err' : ''}`}
                    placeholder="TechNova Solutions S.A."
                    {...register('name', { required: 'El nombre es obligatorio' })}
                  />
                  {errors.name && <span className="em-field__error">{errors.name.message}</span>}
                </div>

                <div className="em-field">
                  <label className="em-field__label">Tipo de documento</label>
                  <select className="em-field__input em-field__select" {...register('document_type')}>
                    <option value="">— Seleccionar —</option>
                    {DOCUMENT_TYPES.map(dt => (
                      <option key={dt.value} value={dt.value}>{dt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="em-field">
                  <label className="em-field__label">Número de documento</label>
                  <input
                    className={`em-field__input${errors.document_number ? ' em-field__input--err' : ''}`}
                    placeholder="900-123-456-1"
                    {...register('document_number')}
                  />
                  {errors.document_number && <span className="em-field__error">{errors.document_number.message}</span>}
                </div>

                <div className="em-field">
                  <label className="em-field__label">Email</label>
                  <input
                    type="email"
                    className={`em-field__input${errors.email ? ' em-field__input--err' : ''}`}
                    placeholder="contacto@empresa.com"
                    {...register('email', {
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
                    })}
                  />
                  {errors.email && <span className="em-field__error">{errors.email.message}</span>}
                </div>

                <div className="em-field">
                  <label className="em-field__label">Teléfono</label>
                  <input
                    className={`em-field__input${errors.phone ? ' em-field__input--err' : ''}`}
                    placeholder="+57 300 000 0000"
                    {...register('phone')}
                  />
                  {errors.phone && <span className="em-field__error">{errors.phone.message}</span>}
                </div>

                <div className="em-field em-field--full">
                  <label className="em-field__label">Dirección</label>
                  <input
                    className={`em-field__input${errors.address ? ' em-field__input--err' : ''}`}
                    placeholder="Calle 123 # 45-67, Bogotá"
                    {...register('address')}
                  />
                  {errors.address && <span className="em-field__error">{errors.address.message}</span>}
                </div>

                <div className="em-field em-field--full">
                  <label className="em-field__label">Descripción</label>
                  <textarea
                    className={`em-field__input em-field__textarea${errors.description ? ' em-field__input--err' : ''}`}
                    placeholder="Descripción breve de la empresa..."
                    rows={3}
                    {...register('description')}
                  />
                  {errors.description && <span className="em-field__error">{errors.description.message}</span>}
                </div>

              </div>
            </section>

            {/* Terms */}
            <section className="em-section">
              <div className="em-section__row">
                <h3 className="em-section__title">Términos y condiciones</h3>
                <button
                  type="button"
                  className="em-btn-add-term"
                  onClick={() => append({ title: '', description: '' })}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Agregar término
                </button>
              </div>

              {fields.length === 0 && (
                <p className="em-terms__empty">
                  Sin términos. Usa el botón para agregar si la empresa lo requiere.
                </p>
              )}

              <div className="em-terms__list">
                {fields.map((field, idx) => (
                  <div key={field.id} className="em-term">
                    <div className="em-term__header">
                      <span className="em-term__num">Término {idx + 1}</span>
                      <button type="button" className="em-term__remove" onClick={() => remove(idx)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                    <div className="em-grid">
                      <div className="em-field em-field--full">
                        <label className="em-field__label">Título <span className="em-field__req">*</span></label>
                        <input
                          className={`em-field__input${errors.terms?.[idx]?.title ? ' em-field__input--err' : ''}`}
                          placeholder="Confidencialidad, Uso de datos..."
                          {...register(`terms.${idx}.title`, { required: 'Requerido' })}
                        />
                        {errors.terms?.[idx]?.title && (
                          <span className="em-field__error">{errors.terms[idx].title.message}</span>
                        )}
                      </div>
                      <div className="em-field em-field--full">
                        <label className="em-field__label">Descripción <span className="em-field__req">*</span></label>
                        <textarea
                          className={`em-field__input em-field__textarea${errors.terms?.[idx]?.description ? ' em-field__input--err' : ''}`}
                          placeholder="Contenido del término..."
                          rows={3}
                          {...register(`terms.${idx}.description`, { required: 'Requerido' })}
                        />
                        {errors.terms?.[idx]?.description && (
                          <span className="em-field__error">{errors.terms[idx].description.message}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* ── Footer ── */}
          <div className="em-footer">
            {mutation.isError && !Array.isArray(mutation.error?.response?.data?.detail) && (
              <span className="em-footer__error">
                Error al crear la empresa. Verifique los datos e intente de nuevo.
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
                    Creando...
                  </>
                ) : 'Crear Empresa'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>,
    document.body
  )
}
