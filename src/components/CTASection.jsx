import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import './CTASection.css'

export function CTASection() {
  const sectionRef = useRef(null)
  const btnRef     = useRef(null)

  // ── Magnetic button ──
  const onBtnMove = useCallback((e) => {
    const btn  = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width  / 2) * 0.28
    const y = (e.clientY - rect.top  - rect.height / 2) * 0.28
    gsap.to(btn, { x, y, duration: 0.5, ease: 'power2.out' })
  }, [])

  const onBtnLeave = useCallback(() => {
    gsap.to(btnRef.current, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
  }, [])

  // ── Particle burst on click ──
  const onBtnClick = useCallback((e) => {
    e.preventDefault()
    const btn  = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const cx   = rect.left + rect.width  / 2
    const cy   = rect.top  + rect.height / 2

    for (let i = 0; i < 22; i++) {
      const p = document.createElement('div')
      p.className = 'cta__particle'
      document.body.appendChild(p)
      const angle = (i / 22) * Math.PI * 2
      const dist  = 60 + Math.random() * 80
      gsap.set(p, { x: cx, y: cy, scale: Math.random() * 0.8 + 0.4 })
      gsap.to(p, {
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        opacity: 0,
        duration: 0.65 + Math.random() * 0.35,
        ease: 'power2.out',
        onComplete: () => p.remove(),
      })
    }

    // Short delay then navigate
    setTimeout(() => { window.location.href = '/login' }, 300)
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.cta__content', {
        y: 55, opacity: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: '.cta__content', start: 'top 85%' },
      })

      // Breathing glow orb
      gsap.to('.cta__orb', {
        scale: 1.22, opacity: 0.2, duration: 3,
        ease: 'sine.inOut', yoyo: true, repeat: -1,
      })

      // Shimmer sweep
      gsap.to('.cta__shimmer', {
        x: '220%', duration: 1.8, ease: 'power1.inOut',
        repeat: -1, repeatDelay: 2.8, delay: 1.2,
      })
    }, sectionRef)

    const btn = btnRef.current
    btn?.addEventListener('mousemove', onBtnMove)
    btn?.addEventListener('mouseleave', onBtnLeave)
    btn?.addEventListener('click', onBtnClick)

    return () => {
      ctx.revert()
      btn?.removeEventListener('mousemove', onBtnMove)
      btn?.removeEventListener('mouseleave', onBtnLeave)
      btn?.removeEventListener('click', onBtnClick)
    }
  }, [onBtnMove, onBtnLeave, onBtnClick])

  return (
    <section ref={sectionRef} className="cta" id="cta">
      <div className="cta__orb" aria-hidden="true" />

      <div className="cta__content">
        <p className="section-eyebrow">Empieza hoy</p>
        <h2 className="cta__title">
          ¿Listo para transformar la<br />gestión de tu equipo?
        </h2>
        <p className="cta__subtitle">
          Accede al panel administrativo y comienza a gestionar empresas, contratos, permisos y vacaciones desde un solo lugar.
        </p>

        <div className="cta__actions">
          <a href="/login" ref={btnRef} className="cta__btn btn btn--primary">
            <span className="cta__shimmer" aria-hidden="true" />
            Acceder al panel
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div className="cta__badges">
          {[
            { label: 'Seguro y confiable', icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
            { label: 'Tiempo real',        icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Web + App móvil',    icon: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3' },
          ].map(({ label, icon }) => (
            <span key={label} className="cta__badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={icon} />
              </svg>
              {label}
            </span>
          ))}
        </div>
      </div>

      <footer className="cta__footer">
        <div className="cta__footer-logo">
          <div className="cta__footer-icon">RH<span /></div>
          <span>RHCloud</span>
        </div>
        <p className="cta__footer-copy">© 2026 RHCloud. Plataforma de gestión de recursos humanos.</p>
      </footer>
    </section>
  )
}
