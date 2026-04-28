import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './Navbar.css'

export function Navbar() {
  const navRef      = useRef(null)
  const progressRef = useRef(null)

  useEffect(() => {
    // Entry animation
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -70, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 1.0,
      })
    }, navRef)

    // Scroll progress bar + morph on scroll
    const onScroll = () => {
      const scrolled = window.scrollY
      const total    = document.documentElement.scrollHeight - window.innerHeight
      const pct      = total > 0 ? (scrolled / total) * 100 : 0

      if (progressRef.current) {
        progressRef.current.style.width = `${pct}%`
      }

      if (navRef.current) {
        if (scrolled > 60) {
          navRef.current.classList.add('navbar--scrolled')
        } else {
          navRef.current.classList.remove('navbar--scrolled')
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      ctx.revert()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <nav ref={navRef} className="navbar">
      {/* Scroll progress bar */}
      <div className="navbar__progress" ref={progressRef} aria-hidden="true" />

      <div className="navbar__logo">
        <div className="navbar__logo-icon">
          RH<span className="navbar__logo-dot" />
        </div>
        <span className="navbar__logo-text">RHCloud</span>
      </div>

      <div className="navbar__links">
        <a href="#features"  className="navbar__link-item">Funcionalidades</a>
        <a href="#showcase"  className="navbar__link-item">Cómo funciona</a>
        <a href="/login"     className="navbar__cta">Iniciar sesión &rarr;</a>
      </div>
    </nav>
  )
}
