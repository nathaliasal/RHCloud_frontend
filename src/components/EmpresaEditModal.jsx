import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { updateEmpresa, uploadEmpresaLogo } from '@/services/empresas'
import './EmpresaModal.css'

const DOCUMENT_TYPES = [
  { value: 'CC',  label: 'CC — Cédula de Ciudadanía' },
  { value: 'NIT', label: 'NIT — Número de Identificación' },
  { value: 'CE',  label: 'CE — Cédula de Extranjería' },
  { value: 'PA',  label: 'PA — Pasaporte' },
  { value: 'RUT', label: 'RUT' },
]

export function EmpresaEditModal({ empresa, onClose }) {
  const queryClient = useQueryClient()
  const backdropRef = useRef(null)
  const panelRef = useRef(null)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name:            empresa.name            ?? '',
      document_type:   empresa.document_type   ?? '',
      document_number: empresa.document_number ?? '',
      email:           empresa.email           ?? '',
      phone:           empresa.phone           ?? '',
      address:         empresa.address         ?? '',
      description:     empresa.description     ?? '',
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

  function handleLogoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const mutation = useMutation({
    mutationFn: async (raw) => {
      const body = Object.fromEntries(
        Object.entries(raw).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      )
      const updated = await updateEmpresa(empresa.id, body)
      if (logoFile) await uploadEmpresaLogo(empresa.id, logoFile)
      return updated
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

        <div className="em-header">
          <div>
            <h2 className="em-header__title">Editar Empresa</h2>
            <p className="em-header__sub">Modifica los datos de {empresa.name}.</p>
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
              <h3 className="em-section__title">Logo de la empresa</h3>
              <label className="em-logo-uploader">
                {logoPreview ? (
                  <img src={logoPreview} alt="preview" className="em-logo-uploader__preview" />
                ) : empresa.logo_url ? (
                  <img src={empresa.logo_url} alt={empresa.name} className="em-logo-uploader__preview" />
                ) : (
                  <div className="em-logo-uploader__placeholder">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Clic para cambiar imagen</span>
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
                  Quitar nueva imagen
                </button>
              )}
            </section>

            <section className="em-section">
              <h3 className="em-section__title">Información de la empresa</h3>
              <div className="em-grid">

                <div className="em-field em-field--full">
                  <label className="em-field__label">
                    Nombre <span className="em-field__req">*</span>
                  </label>
                  <input
                    className={`em-field__input${errors.name ? ' em-field__input--err' : ''}`}
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
                    {...register('document_number')}
                  />
                  {errors.document_number && <span className="em-field__error">{errors.document_number.message}</span>}
                </div>

                <div className="em-field">
                  <label className="em-field__label">Email</label>
                  <input
                    type="email"
                    className={`em-field__input${errors.email ? ' em-field__input--err' : ''}`}
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
                    {...register('phone')}
                  />
                  {errors.phone && <span className="em-field__error">{errors.phone.message}</span>}
                </div>

                <div className="em-field em-field--full">
                  <label className="em-field__label">Dirección</label>
                  <input
                    className={`em-field__input${errors.address ? ' em-field__input--err' : ''}`}
                    {...register('address')}
                  />
                  {errors.address && <span className="em-field__error">{errors.address.message}</span>}
                </div>

                <div className="em-field em-field--full">
                  <label className="em-field__label">Descripción</label>
                  <textarea
                    className={`em-field__input em-field__textarea${errors.description ? ' em-field__input--err' : ''}`}
                    rows={3}
                    {...register('description')}
                  />
                  {errors.description && <span className="em-field__error">{errors.description.message}</span>}
                </div>

              </div>
            </section>

          </div>

          <div className="em-footer">
            {mutation.isError && !Array.isArray(mutation.error?.response?.data?.detail) && (
              <span className="em-footer__error">
                Error al actualizar. Verifique los datos e intente de nuevo.
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
                    Guardando...
                  </>
                ) : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>,
    document.body
  )
}
