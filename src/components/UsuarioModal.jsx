import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gsap } from 'gsap'
import { createUsuario, getRolesPublic, assignUserRole } from '@/services/usuarios'
import './UsuarioModal.css'

export function UsuarioModal({ onClose }) {
  const queryClient = useQueryClient()
  const backdropRef = useRef(null)
  const panelRef = useRef(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm()

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles', 'public'],
    queryFn: getRolesPublic,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const roles = rolesData?.items ?? rolesData ?? []

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
    mutationFn: async ({ role_id, ...rest }) => {
      const user = await createUsuario(rest)
      await assignUserRole(user.id, Number(role_id))
      return user
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
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
      className="um-backdrop"
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) animateClose() }}
    >
      <div className="um-panel" ref={panelRef} role="dialog" aria-modal="true">

        <div className="um-header">
          <div>
            <h2 className="um-header__title">Nuevo Usuario</h2>
            <p className="um-header__sub">Complete los datos para registrar el usuario en el sistema.</p>
          </div>
          <button className="um-close-btn" type="button" onClick={animateClose} aria-label="Cerrar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} noValidate>
          <div className="um-body">
            <section className="um-section">
              <h3 className="um-section__title">Credenciales de acceso</h3>
              <div className="um-grid">

                <div className="um-field um-field--full">
                  <label className="um-field__label">
                    Email <span className="um-field__req">*</span>
                  </label>
                  <input
                    type="email"
                    className={`um-field__input${errors.email ? ' um-field__input--err' : ''}`}
                    placeholder="usuario@empresa.com"
                    {...register('email', {
                      required: 'El email es obligatorio',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
                    })}
                  />
                  {errors.email && <span className="um-field__error">{errors.email.message}</span>}
                </div>

                <div className="um-field um-field--full">
                  <label className="um-field__label">
                    Contraseña <span className="um-field__req">*</span>
                  </label>
                  <input
                    type="password"
                    className={`um-field__input${errors.password ? ' um-field__input--err' : ''}`}
                    placeholder="Mínimo 8 caracteres"
                    {...register('password', {
                      required: 'La contraseña es obligatoria',
                      minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                    })}
                  />
                  {errors.password && <span className="um-field__error">{errors.password.message}</span>}
                </div>

              </div>
            </section>

            <section className="um-section">
              <h3 className="um-section__title">Rol</h3>
              <div className="um-grid">

                <div className="um-field um-field--full">
                  <label className="um-field__label">
                    Rol <span className="um-field__req">*</span>
                  </label>
                  <select
                    className={`um-field__input${errors.role_id ? ' um-field__input--err' : ''}`}
                    disabled={rolesLoading}
                    {...register('role_id', { required: 'El rol es obligatorio' })}
                  >
                    <option value="">
                      {rolesLoading ? 'Cargando roles...' : 'Seleccione un rol'}
                    </option>
                    {roles.map(rol => (
                      <option key={rol.id} value={rol.id}>{rol.nombre ?? rol.name}</option>
                    ))}
                  </select>
                  {errors.role_id && <span className="um-field__error">{errors.role_id.message}</span>}
                </div>

              </div>
            </section>
          </div>

          <div className="um-footer">
            {mutation.isError && !Array.isArray(mutation.error?.response?.data?.detail) && (
              <span className="um-footer__error">
                Error al crear el usuario. Verifique los datos e intente de nuevo.
              </span>
            )}
            <div className="um-footer__actions">
              <button type="button" className="um-btn-cancel" onClick={animateClose}>
                Cancelar
              </button>
              <button type="submit" className="um-btn-submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <span className="um-btn-spinner" />
                    Creando...
                  </>
                ) : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>,
    document.body
  )
}
