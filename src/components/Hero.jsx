import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import './Hero.css'

const STATS = [
  { end: 500, suffix: '+', label: 'Contratos activos' },
  { end: 50,  suffix: '+', label: 'Empresas confían' },
  { end: 99,  suffix: '%', label: 'Uptime garantizado' },
]

const BAR_HEIGHTS = [42, 68, 52, 88, 62, 78, 48]

export function Hero() {
  const heroRef   = useRef(null)
  const auroraRef = useRef(null)
  const mockupRef = useRef(null)
  const statsRef  = useRef([])

  const onMouseMove = useCallback((e) => {
    const rect = heroRef.current?.getBoundingClientRect()
    if (!rect) return
    gsap.to(auroraRef.current, {
      x: e.clientX - rect.left - 300,
      y: e.clientY - rect.top  - 300,
      duration: 1.8,
      ease: 'power2.out',
    })
  }, [])

  const onMockupMove = useCallback((e) => {
    const el = mockupRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left)  / r.width  - 0.5) * 2
    const y = ((e.clientY - r.top)   / r.height - 0.5) * 2
    gsap.to(el, {
      rotateY: x * 7,
      rotateX: -y * 4,
      duration: 0.55,
      ease: 'power2.out',
      transformPerspective: 1200,
    })
  }, [])

  const onMockupLeave = useCallback(() => {
    gsap.to(mockupRef.current, {
      rotateY: 0, rotateX: 0,
      duration: 0.9,
      ease: 'elastic.out(1, 0.3)',
    })
  }, [])

  useEffect(() => {
    const hero   = heroRef.current
    const mockup = mockupRef.current

    hero.addEventListener('mousemove', onMouseMove)
    mockup.addEventListener('mousemove', onMockupMove)
    mockup.addEventListener('mouseleave', onMockupLeave)

    const ctx = gsap.context(() => {
      // ── Background blobs ──
      gsap.from('.hero__blob', { opacity: 0, scale: 0.6, duration: 2, stagger: 0.22, ease: 'power2.out' })

      // ── Word-reveal (clip from below) ──
      gsap.from('.hero__word-inner', {
        yPercent: 110,
        duration: 0.95,
        stagger: 0.1,
        ease: 'power4.out',
        delay: 0.25,
      })
      gsap.from('.hero__logo-row', { opacity: 0, y: -16, duration: 0.6, delay: 0.15 })
      gsap.from('.hero__eyebrow',  { opacity: 0, y: 12,  duration: 0.6, delay: 0.2  })
      gsap.from('.hero__subtitle', { opacity: 0, y: 20,  duration: 0.8, ease: 'power3.out', delay: 0.82 })
      gsap.from('.hero__actions',  { opacity: 0, y: 20,  duration: 0.8, ease: 'power3.out', delay: 0.98 })
      gsap.from('.hero__stats',    { opacity: 0, y: 16,  duration: 0.7, ease: 'power3.out', delay: 1.12 })

      // ── Mockup slides in ──
      gsap.from(mockupRef.current, {
        x: 90, opacity: 0, duration: 1.1, ease: 'power3.out', delay: 0.4,
      })

      // ── Toast pop-ins ──
      gsap.from('.mockup__toast--1', { x: 60, opacity: 0, duration: 0.7, ease: 'back.out(1.5)', delay: 1.5 })
      gsap.from('.mockup__toast--2', { x: 60, opacity: 0, duration: 0.7, ease: 'back.out(1.5)', delay: 1.9 })

      // ── Toast float (infinite) ──
      gsap.to('.mockup__toast--1', { y: -7, duration: 2.3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.2 })
      gsap.to('.mockup__toast--2', { y:  7, duration: 2.9, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.5 })

      // ── Chart bars grow ──
      gsap.from('.mockup__bar', {
        scaleY: 0, transformOrigin: 'bottom',
        duration: 0.6, stagger: 0.06, ease: 'power3.out', delay: 1.3,
      })

      // ── Stat counters ──
      statsRef.current.forEach((el, i) => {
        if (!el) return
        const { end, suffix } = STATS[i]
        const obj = { val: 0 }
        gsap.to(obj, {
          val: end,
          duration: 1.8,
          ease: 'power2.out',
          delay: 1.3 + i * 0.14,
          onUpdate() { if (el) el.textContent = Math.round(obj.val) + suffix },
        })
      })

      // ── Scroll parallax on blobs ──
      gsap.to('.hero__blob--1', {
        y: -140, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1.5 },
      })
      gsap.to('.hero__blob--2', {
        y: -75, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 2.2 },
      })

      // ── Content fades out on scroll ──
      gsap.to('.hero__inner', {
        y: -65, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: '58% top', scrub: 1 },
      })
    }, heroRef)

    return () => {
      ctx.revert()
      hero.removeEventListener('mousemove', onMouseMove)
      mockup.removeEventListener('mousemove', onMockupMove)
      mockup.removeEventListener('mouseleave', onMockupLeave)
    }
  }, [onMouseMove, onMockupMove, onMockupLeave])

  return (
    <section ref={heroRef} className="hero" id="hero">
      {/* Background */}
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__blob hero__blob--1" />
        <div className="hero__blob hero__blob--2" />
        <div className="hero__blob hero__blob--3" />
        <div ref={auroraRef} className="hero__aurora" />
      </div>

      {/* Split layout */}
      <div className="hero__inner">
        {/* ── LEFT: text ── */}
        <div className="hero__content">
          <div className="hero__logo-row">
            <div className="hero__logo-badge">
              RH<span className="hero__logo-dot" />
            </div>
            <span className="hero__logo-name">RHCloud</span>
          </div>

          <p className="hero__eyebrow">Plataforma Administrativa de RR.HH.</p>

          <h1 className="hero__title">
            {['Gestiona tu talento', 'humano de forma'].map((line, i) => (
              <span key={i} className="hero__word-line">
                <span className="hero__word-inner">{line}</span>
              </span>
            ))}
            <span className="hero__word-line">
              <span className="hero__word-inner hero__title-accent">moderna y eficiente.</span>
            </span>
          </h1>

          <p className="hero__subtitle">
            RHCloud centraliza la administración de empresas, contratos, permisos y vacaciones. Una plataforma para quienes gestionan personas.
          </p>

          <div className="hero__actions">
            <a href="/login" className="btn btn--primary">
              Acceder al panel
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            <a href="#features" className="btn btn--ghost">Ver funcionalidades</a>
          </div>

          {/* Animated counters */}
          <div className="hero__stats">
            {STATS.map(({ label }, i) => (
              <div key={label} className="hero__stat">
                <span className="hero__stat-num" ref={el => { statsRef.current[i] = el }}>0+</span>
                <span className="hero__stat-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: dashboard mockup ── */}
        <div ref={mockupRef} className="hero__visual" aria-hidden="true">
          <div className="mockup">
            {/* Browser chrome */}
            <div className="mockup__chrome">
              <div className="mockup__dots">
                <span /><span /><span />
              </div>
              <div className="mockup__url">rhcloud.app/dashboard</div>
            </div>

            {/* App UI */}
            <div className="mockup__app">
              {/* Sidebar */}
              <div className="mockup__sidebar">
                <div className="mockup__sb-logo">RH<span /></div>
                <div className="mockup__nav">
                  {['Dashboard','Empresas','Contratos','Permisos','Vacaciones'].map((item, i) => (
                    <div key={item} className={`mockup__nav-item${i === 0 ? ' mockup__nav-item--active' : ''}`}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main */}
              <div className="mockup__main">
                <div className="mockup__topbar">
                  <span>Buenos días, Admin</span>
                  <div className="mockup__notif"><span className="mockup__badge">3</span></div>
                </div>

                <div className="mockup__stat-row">
                  {[
                    { v: '12', l: 'Empresas' },
                    { v: '145', l: 'Usuarios' },
                    { v: '8',  l: 'Pendientes', warn: true },
                  ].map(({ v, l, warn }) => (
                    <div key={l} className={`mockup__stat-card${warn ? ' mockup__stat-card--warn' : ''}`}>
                      <span className="mockup__stat-val">{v}</span>
                      <span className="mockup__stat-lbl">{l}</span>
                    </div>
                  ))}
                </div>

                <div className="mockup__chart">
                  {BAR_HEIGHTS.map((h, i) => (
                    <div
                      key={i}
                      className={`mockup__bar${i === 3 ? ' mockup__bar--accent' : ''}`}
                      style={{ '--bar-h': `${h}%` }}
                    />
                  ))}
                </div>

                <div className="mockup__requests">
                  {[
                    { init: 'AG', name: 'Ana García',   type: 'Permiso médico' },
                    { init: 'LT', name: 'Luis Torres',  type: 'Vacaciones'     },
                  ].map(({ init, name, type }) => (
                    <div key={name} className="mockup__req">
                      <div className="mockup__req-avatar">{init}</div>
                      <div className="mockup__req-info">
                        <span>{name}</span>
                        <span>{type}</span>
                      </div>
                      <div className="mockup__req-tag">Pendiente</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating toasts */}
          <div className="mockup__toast mockup__toast--1">
            <span className="mockup__toast-check">✓</span> Contrato generado
          </div>
          <div className="mockup__toast mockup__toast--2">
            <span>🔔</span> Nueva solicitud
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="hero__scroll-hint" aria-hidden="true">
        <div className="hero__scroll-dot" />
        <span className="hero__scroll-text">Explora</span>
      </div>
    </section>
  )
}
