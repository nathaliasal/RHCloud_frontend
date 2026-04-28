import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { gsap } from 'gsap'
import { login, getMe } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'
import './Login.css'

export default function Login() {
  const navigate   = useNavigate()
  const { setSession, accessToken } = useAuthStore()
  const cardRef    = useRef(null)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]         = useState(false)
  const [showPass, setShowPass]       = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    if (accessToken) { navigate('/dashboard', { replace: true }); return }
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 32, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out' },
    )
  }, [])

  const onSubmit = async ({ email, password }) => {
    setLoading(true)
    setServerError('')
    try {
      const tokens = await login(email, password)
      localStorage.setItem('rhcloud.tokens', JSON.stringify({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      }))
      const me = await getMe()
      setSession(me, tokens.access_token, tokens.refresh_token)

      if (!me.is_verified) {
        navigate('/complete-profile', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setServerError(detail.map((d) => d.msg).join('. '))
      } else if (typeof detail === 'string') {
        setServerError(detail)
      } else {
        setServerError('Credenciales incorrectas. Verifica tu correo y contraseña.')
      }
      gsap.fromTo(cardRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1,0.4)' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-bg">
      <div className="login-bg__orb login-bg__orb--1" />
      <div className="login-bg__orb login-bg__orb--2" />

      <div className="login-card" ref={cardRef}>
        <header className="login-card__header">
          <div className="login-logo">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="var(--color-accent)" fillOpacity="0.15" />
              <path
                d="M18 8C12.477 8 8 12.477 8 18s4.477 10 10 10 10-4.477 10-10S23.523 8 18 8zm0 3a7 7 0 110 14A7 7 0 0118 11zm0 2a5 5 0 100 10A5 5 0 0018 13z"
                fill="var(--color-accent)"
              />
              <circle cx="18" cy="14" r="2" fill="var(--color-accent)" />
            </svg>
          </div>
          <h1 className="login-card__brand">RHCloud</h1>
          <p className="login-card__eyebrow">Centro de mando de RR.HH.</p>
        </header>

        <div className="login-card__body">
          <h2 className="login-card__title">Bienvenido de nuevo</h2>
          <p className="login-card__subtitle">Accede a tu panel de administración.</p>

          {serverError && (
            <div className="login-alert" role="alert">
              <span className="login-alert__icon">⚠</span>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="login-field">
              <label className="login-label" htmlFor="email">
                Correo electrónico laboral
              </label>
              <div className={`login-input-wrap ${errors.email ? 'login-input-wrap--error' : ''}`}>
                <span className="login-input-wrap__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  className="login-input"
                  placeholder="nombre@empresa.com"
                  autoComplete="email"
                  {...register('email', {
                    required: 'El correo es requerido',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Correo no válido' },
                  })}
                />
              </div>
              {errors.email && <span className="login-error">{errors.email.message}</span>}
            </div>

            <div className="login-field">
              <div className="login-label-row">
                <label className="login-label" htmlFor="password">Contraseña</label>
                <Link to="/reset-password" className="login-forgot">
                  ¿Olvidó su contraseña?
                </Link>
              </div>
              <div className={`login-input-wrap ${errors.password ? 'login-input-wrap--error' : ''}`}>
                <span className="login-input-wrap__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password', { required: 'La contraseña es requerida' })}
                />
                <button
                  type="button"
                  className="login-input-wrap__toggle"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <span className="login-error">{errors.password.message}</span>}
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <span className="login-btn__spinner" />
              ) : (
                <>
                  Autenticar
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <footer className="login-card__footer">
          <p className="login-footer__support">
            ¿Necesita asistencia técnica?{' '}
            <a href="mailto:soporte@rhcloud.com" className="login-footer__link">
              Contactar Soporte
            </a>
          </p>
          <p className="login-footer__legal">
            Portal de acceso seguro © 2024 ReCLOuD SYSTEMS INC.
          </p>
        </footer>
      </div>
    </div>
  )
}
