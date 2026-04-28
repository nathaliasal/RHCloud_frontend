import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './AppShowcase.css'

gsap.registerPlugin(ScrollTrigger)

const SCENES = [
  {
    num: '01',
    title: 'Gestiona múltiples empresas',
    desc: 'Centraliza todas tus empresas en un único panel. Accede a su información, equipos y contratos con un solo clic.',
  },
  {
    num: '02',
    title: 'Contratos digitales en segundos',
    desc: 'Crea plantillas reutilizables y genera contratos personalizados para cada empleado. Sin papel, sin demoras.',
  },
  {
    num: '03',
    title: 'Aprueba solicitudes al instante',
    desc: 'Recibe notificaciones en tiempo real y gestiona permisos y vacaciones con un clic desde cualquier dispositivo.',
  },
]

export function AppShowcase() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=200%',
          pin: true,
          scrub: 0.9,
          anticipatePin: 1,
        },
      })

      // scene 1 → 2
      tl.to('.showcase__text--1',       { opacity: 0, y: -30, duration: 0.28 })
        .fromTo('.showcase__text--2',   { opacity: 0, y:  30 }, { opacity: 1, y: 0, duration: 0.28 }, '<0.08')
        .to('.showcase__vis--1',        { opacity: 0, scale: 0.93, duration: 0.28 }, '<')
        .fromTo('.showcase__vis--2',    { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 0.28 }, '<0.08')

      // scene 2 → 3
      tl.to('.showcase__text--2',       { opacity: 0, y: -30, duration: 0.28 }, '+=0.3')
        .fromTo('.showcase__text--3',   { opacity: 0, y:  30 }, { opacity: 1, y: 0, duration: 0.28 }, '<0.08')
        .to('.showcase__vis--2',        { opacity: 0, scale: 0.93, duration: 0.28 }, '<')
        .fromTo('.showcase__vis--3',    { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 0.28 }, '<0.08')

      // Step indicator dots
      tl.to('.showcase__dot--1', { background: 'rgba(0,229,204,0.25)', duration: 0.2 }, 0.28)
        .to('.showcase__dot--2', { background: 'var(--color-accent)',   duration: 0.2 }, 0.28)
        .to('.showcase__dot--2', { background: 'rgba(0,229,204,0.25)', duration: 0.2 }, '+=0.3')
        .to('.showcase__dot--3', { background: 'var(--color-accent)',   duration: 0.2 }, '<')
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="showcase" id="showcase">
      <div className="showcase__inner">
        {/* Left: text panels (stacked, only one visible) */}
        <div className="showcase__texts">
          <p className="section-eyebrow" style={{ marginBottom: '2rem' }}>Flujo de trabajo</p>

          <div className="showcase__text-stack">
            {SCENES.map((scene, i) => (
              <div
                key={scene.num}
                className={`showcase__text showcase__text--${i + 1}`}
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                <span className="showcase__num">{scene.num}</span>
                <h2 className="showcase__title">{scene.title}</h2>
                <p className="showcase__desc">{scene.desc}</p>
              </div>
            ))}
          </div>

          {/* Step dots */}
          <div className="showcase__dots">
            {SCENES.map((_, i) => (
              <div
                key={i}
                className={`showcase__dot showcase__dot--${i + 1}`}
                style={{ background: i === 0 ? 'var(--color-accent)' : 'rgba(0,229,204,0.2)' }}
              />
            ))}
          </div>
        </div>

        {/* Right: visuals */}
        <div className="showcase__visuals">
          {/* Scene 1: company cards */}
          <div className="showcase__vis showcase__vis--1">
            <div className="showcase__panel">
              <p className="showcase__panel-label">Empresas registradas</p>
              <div className="showcase__company-grid">
                {['TechCorp S.A.', 'Retail Plus', 'Logística Norte', 'FinGroup'].map((name) => (
                  <div key={name} className="showcase__company-card">
                    <div className="showcase__company-icon">{name[0]}</div>
                    <span>{name}</span>
                    <span className="showcase__company-tag">Activa</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scene 2: contract */}
          <div className="showcase__vis showcase__vis--2" style={{ opacity: 0 }}>
            <div className="showcase__panel">
              <p className="showcase__panel-label">Generando contrato…</p>
              <div className="showcase__contract">
                <div className="showcase__contract-header">
                  <span>Contrato Laboral Indefinido</span>
                  <span className="showcase__contract-chip">Plantilla</span>
                </div>
                {['Empleado', 'Cargo', 'Salario base', 'Fecha inicio'].map((field) => (
                  <div key={field} className="showcase__contract-row">
                    <span className="showcase__contract-key">{field}</span>
                    <div className="showcase__contract-val" />
                  </div>
                ))}
                <div className="showcase__contract-action">
                  <div className="showcase__contract-btn">Generar contrato</div>
                </div>
              </div>
            </div>
          </div>

          {/* Scene 3: approval queue */}
          <div className="showcase__vis showcase__vis--3" style={{ opacity: 0 }}>
            <div className="showcase__panel">
              <p className="showcase__panel-label">Solicitudes pendientes</p>
              <div className="showcase__approvals">
                {[
                  { init: 'AG', name: 'Ana García',   type: 'Permiso médico',  days: '2 días' },
                  { init: 'LT', name: 'Luis Torres',  type: 'Vacaciones',      days: '5 días' },
                  { init: 'MP', name: 'María Pérez',  type: 'Permiso personal',days: '1 día'  },
                ].map(({ init, name, type, days }) => (
                  <div key={name} className="showcase__approval">
                    <div className="showcase__approval-avatar">{init}</div>
                    <div className="showcase__approval-info">
                      <span>{name}</span>
                      <span>{type} · {days}</span>
                    </div>
                    <div className="showcase__approval-actions">
                      <button className="showcase__btn-approve">✓</button>
                      <button className="showcase__btn-reject">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
