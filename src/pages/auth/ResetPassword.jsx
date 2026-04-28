import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { gsap } from 'gsap'
import { recoverPassword, resetPassword } from '@/services/auth'
import './ResetPassword.css'

export default function ResetPassword() {
  const cardRef      = useRef(null)
  const [params]     = useSearchParams()
  const token        = params.get('token')
  const [status, setStatus]     = useState('idle')
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
    )
  }, [])

  const onRecoverSubmit = async ({ email }) => {
    setStatus('loading')
    setServerError('')
    try {
      await recoverPassword(email)
      setStatus('sent')
    } catch (err) {
      const detail = err.response?.data?.detail
      setServerError(
        Array.isArray(detail)
          ? detail.map((d) => d.msg).join('. ')
          : (detail ?? 'Ocurrió un error. Inténtalo de nuevo.'),
      )
      setStatus('idle')
    }
  }

  const onResetSubmit = async ({ new_password, confirm_password }) => {
    setStatus('loading')
    setServerError('')
    try {
      await resetPassword(token, new_password, confirm_password)
      setStatus('reset-done')
    } catch (err) {
      const detail = err.response?.data?.detail
      setServerError(
        typeof detail === 'string'
          ? detail
          : 'El enlace no es válido o ha expirado.',
      )
      setStatus('idle')
    }
  }

  return (
    <div className="rp-bg">
      <div className="rp-bg__orb rp-bg__orb--1" />
      <div className="rp-bg__orb rp-bg__orb--2" />

      <div className="rp-card" ref={cardRef}>
        <header className="rp-card__header">
          <Link to="/login" className="rp-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Volver al login
          </Link>
          <div className="rp-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>
        </header>

        <div className="rp-card__body">
          {/* Recovery form — no token in URL */}
          {!token && status !== 'sent' && (
            <>
              <h2 className="rp-title">Recuperar contraseña</h2>
              <p className="rp-subtitle">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              {serverError && (
                <div className="rp-alert" role="alert">
                  <span>⚠</span> {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit(onRecoverSubmit)} noValidate>
                <div className="rp-field">
                  <label className="rp-label" htmlFor="email">Correo electrónico</label>
                  <div className={`rp-input-wrap ${errors.email ? 'rp-input-wrap--error' : ''}`}>
                    <span className="rp-input-wrap__icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      id="email"
                      type="email"
                      className="rp-input"
                      placeholder="nombre@empresa.com"
                      {...register('email', {
                        required: 'El correo es requerido',
                        pattern: { value: /^\S+@\S+\.\S+$/, message: 'Correo no válido' },
                      })}
                    />
                  </div>
                  {errors.email && <span className="rp-error">{errors.email.message}</span>}
                </div>

                <button type="submit" className="rp-btn" disabled={status === 'loading'}>
                  {status === 'loading' ? <span className="rp-spinner" /> : 'Enviar enlace de recuperación'}
                </button>
              </form>
            </>
          )}

          {/* Confirmation state */}
          {status === 'sent' && (
            <div className="rp-success">
              <div className="rp-success__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className="rp-title">Correo enviado</h2>
              <p className="rp-subtitle">
                Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <Link to="/login" className="rp-btn rp-btn--outline">Volver al login</Link>
            </div>
          )}

          {/* Reset form — token present in URL */}
          {token && status !== 'reset-done' && (
            <>
              <h2 className="rp-title">Nueva contraseña</h2>
              <p className="rp-subtitle">Elige una contraseña segura para tu cuenta.</p>

              {serverError && (
                <div className="rp-alert" role="alert">
                  <span>⚠</span> {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit(onResetSubmit)} noValidate>
                <div className="rp-field">
                  <label className="rp-label" htmlFor="new_password">Nueva contraseña</label>
                  <div className={`rp-input-wrap ${errors.new_password ? 'rp-input-wrap--error' : ''}`}>
                    <span className="rp-input-wrap__icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </span>
                    <input
                      id="new_password"
                      type="password"
                      className="rp-input"
                      placeholder="••••••••"
                      {...register('new_password', {
                        required: 'La contraseña es requerida',
                        minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                      })}
                    />
                  </div>
                  {errors.new_password && <span className="rp-error">{errors.new_password.message}</span>}
                </div>

                <div className="rp-field">
                  <label className="rp-label" htmlFor="confirm_password">Confirmar contraseña</label>
                  <div className={`rp-input-wrap ${errors.confirm_password ? 'rp-input-wrap--error' : ''}`}>
                    <span className="rp-input-wrap__icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </span>
                    <input
                      id="confirm_password"
                      type="password"
                      className="rp-input"
                      placeholder="••••••••"
                      {...register('confirm_password', {
                        required: 'Confirma tu contraseña',
                        validate: (v) => v === watch('new_password') || 'Las contraseñas no coinciden',
                      })}
                    />
                  </div>
                  {errors.confirm_password && <span className="rp-error">{errors.confirm_password.message}</span>}
                </div>

                <button type="submit" className="rp-btn" disabled={status === 'loading'}>
                  {status === 'loading' ? <span className="rp-spinner" /> : 'Restablecer contraseña'}
                </button>
              </form>
            </>
          )}

          {status === 'reset-done' && (
            <div className="rp-success">
              <div className="rp-success__icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className="rp-title">¡Contraseña actualizada!</h2>
              <p className="rp-subtitle">Tu contraseña ha sido restablecida correctamente.</p>
              <Link to="/login" className="rp-btn">Ir al login</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
