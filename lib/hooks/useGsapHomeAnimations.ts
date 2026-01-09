import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * Custom hook for GSAP animations on the Home page
 * Handles hero animations and scroll-triggered section reveals
 */
export function useGsapHomeAnimations() {
  const heroRef = useRef<HTMLDivElement>(null)
  const sectionsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      // Simple fade-in only for reduced motion
      if (heroRef.current) {
        gsap.fromTo(
          heroRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.6, ease: 'power2.out' }
        )
      }
      return
    }

    // Create GSAP context for cleanup
    const ctx = gsap.context(() => {
      // Hero section animations
      if (heroRef.current) {
        const heroElements = {
          greeting: heroRef.current.querySelector('.hero-greeting'),
          title: heroRef.current.querySelector('.hero-title'),
          subtitle: heroRef.current.querySelector('.hero-subtitle'),
          description: heroRef.current.querySelector('.hero-description'),
          cta: heroRef.current.querySelector('.hero-cta'),
          social: heroRef.current.querySelector('.hero-social'),
          blob1: heroRef.current.querySelector('.hero-blob-1'),
          blob2: heroRef.current.querySelector('.hero-blob-2'),
        }

        // Stagger fade + slide animations
        const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })

        timeline
          // Greeting badge
          .fromTo(
            heroElements.greeting,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6 }
          )
          // Title
          .fromTo(
            heroElements.title,
            { opacity: 0, y: 30, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.8 },
            '-=0.3'
          )
          // Subtitle
          .fromTo(
            heroElements.subtitle,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.7 },
            '-=0.4'
          )
          // Description
          .fromTo(
            heroElements.description,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.7 },
            '-=0.3'
          )
          // CTA buttons
          .fromTo(
            heroElements.cta,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6 },
            '-=0.2'
          )
          // Social links
          .fromTo(
            heroElements.social,
            { opacity: 0, scale: 0.8 },
            { opacity: 1, scale: 1, duration: 0.5 },
            '-=0.2'
          )

        // Background blobs gentle animation
        if (heroElements.blob1 && heroElements.blob2) {
          gsap.to(heroElements.blob1, {
            x: 30,
            y: -30,
            rotation: 10,
            duration: 8,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          })

          gsap.to(heroElements.blob2, {
            x: -30,
            y: 30,
            rotation: -10,
            duration: 10,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          })
        }
      }

      // Scroll-triggered section animations
      sectionsRef.current.forEach((section, index) => {
        if (section) {
          gsap.fromTo(
            section,
            {
              opacity: 0,
              y: 60,
              filter: 'blur(10px)',
            },
            {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              duration: 1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                end: 'top 50%',
                toggleActions: 'play none none reverse',
                // markers: true, // Uncomment for debugging
              },
            }
          )
        }
      })
    })

    // Cleanup on unmount
    return () => {
      ctx.revert()
    }
  }, [])

  // Helper to add sections to animation array
  const addSectionRef = (el: HTMLDivElement | null) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el)
    }
  }

  return {
    heroRef,
    addSectionRef,
  }
}
