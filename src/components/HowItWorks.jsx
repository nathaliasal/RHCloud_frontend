import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './HowItWorks.css'

const STEPS = [
  {
    number: '01',
    accent: 'var(--color-accent)',
    title: 'Configura tu empresa',
    description:
      'Registra tu empresa, define la estructura de cargos y agrega a tu equipo en cuestión de minutos. Sin complicaciones.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    number: '02',
    accent: '#60a5fa',
    title: 'Gestiona con facilidad',
    description:
      'Crea plantillas de contratos digitales, asígnalas a tus empleados y mantén toda la documentación organizada en un solo lugar.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
      </svg>
    ),
  },
  {
    number: '03',
    accent: 'var(--color-success)',
    title: 'Aprueba en tiempo real',
    description:
      'Recibe notificaciones al instante cuando tus empleados soliciten permisos o vacaciones. Aprueba o rechaza con un solo clic.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
]

export function HowItWorks() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header
      gsap.from('.hiw__header', {
        y: 45,
        opacity: 0,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.hiw__header', start: 'top 88%' },
      })

      // Progress line draws left→right
      gsap.from('.hiw__progress-fill', {
        scaleX: 0,
        transformOrigin: 'left center',
        ease: 'none',
        scrollTrigger: {
          trigger: '.hiw__steps',
          start: 'top 72%',
          end: 'center 40%',
          scrub: 1.2,
        },
      })

      // Step dots pop in
      gsap.from('.hiw__dot', {
        scale: 0,
        opacity: 0,
        duration: 0.5,
        stagger: 0.2,
        ease: 'back.out(2)',
        scrollTrigger: { trigger: '.hiw__steps', start: 'top 75%' },
      })

      // Step cards slide up with stagger
      gsap.from('.hiw__card', {
        y: 65,
        opacity: 0,
        duration: 0.85,
        stagger: 0.18,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.hiw__steps', start: 'top 78%' },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="hiw" id="how">
      <div className="hiw__container">
        <header className="hiw__header">
          <p className="section-eyebrow">¿Cómo funciona?</p>
          <h2 className="section-title">
            En tres pasos, transforma<br />tu gestión de RR.HH.
          </h2>
        </header>

        <div className="hiw__steps">
          {/* Connecting progress line */}
          <div className="hiw__progress-track" aria-hidden="true">
            <div className="hiw__progress-fill" />
          </div>

          {STEPS.map((step) => (
            <div key={step.number} className="hiw__step">
              {/* Dot on the line */}
              <div
                className="hiw__dot"
                style={{ '--step-accent': step.accent }}
                aria-hidden="true"
              />

              {/* Card */}
              <div className="hiw__card" style={{ '--step-accent': step.accent }}>
                <div className="hiw__card-icon">{step.icon}</div>
                <div className="hiw__card-number">{step.number}</div>
                <h3 className="hiw__card-title">{step.title}</h3>
                <p className="hiw__card-desc">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
