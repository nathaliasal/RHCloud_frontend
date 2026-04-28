import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomCursor } from '@/components/CustomCursor'
import { Navbar }       from '@/components/Navbar'
import { Hero }         from '@/components/Hero'
import { Features }     from '@/components/Features'
import { AppShowcase }  from '@/components/AppShowcase'
import { HowItWorks }   from '@/components/HowItWorks'
import { CTASection }   from '@/components/CTASection'
import './Landing.css'

gsap.registerPlugin(ScrollTrigger)

export default function Landing() {
  return (
    <main className="landing">
      <CustomCursor />
      <Navbar />
      <Hero />
      <Features />
      <AppShowcase />
      <HowItWorks />
      <CTASection />
    </main>
  )
}
