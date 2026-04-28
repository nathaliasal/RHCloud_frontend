import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './CustomCursor.css'

export function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current

    const xDot = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'none' })
    const yDot = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'none' })
    const xRing = gsap.quickTo(ring, 'x', { duration: 0.38, ease: 'power3' })
    const yRing = gsap.quickTo(ring, 'y', { duration: 0.38, ease: 'power3' })

    const onMove = (e) => {
      xDot(e.clientX)
      yDot(e.clientY)
      xRing(e.clientX)
      yRing(e.clientY)
    }

    const onEnter = () => {
      gsap.to(ring, { scale: 2.4, opacity: 0.45, duration: 0.3, ease: 'power2.out' })
      gsap.to(dot, { opacity: 0, duration: 0.15 })
    }

    const onLeave = () => {
      gsap.to(ring, { scale: 1, opacity: 1, duration: 0.45, ease: 'power2.out' })
      gsap.to(dot, { opacity: 1, duration: 0.2 })
    }

    const onDown = () => gsap.to([dot, ring], { scale: 0.65, duration: 0.12 })
    const onUp = () => {
      gsap.to(ring, { scale: 1, duration: 0.55, ease: 'elastic.out(1, 0.4)' })
      gsap.to(dot, { scale: 1, duration: 0.2 })
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)

    const addListeners = () => {
      document.querySelectorAll('a, button, .btn, .feature-card, .hiw__card').forEach(el => {
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })
    }
    addListeners()

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.querySelectorAll('a, button, .btn, .feature-card, .hiw__card').forEach(el => {
        el.removeEventListener('mouseenter', onEnter)
        el.removeEventListener('mouseleave', onLeave)
      })
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  )
}
