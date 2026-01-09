"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Linkedin, Mail } from "lucide-react";
import gsap from "gsap";

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion || !heroRef.current) {
      // Simple fade-in only for reduced motion
      if (heroRef.current) {
        gsap.fromTo(
          heroRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.6, ease: "power2.out" }
        );
      }
      return;
    }

    // Create GSAP context for cleanup
    const ctx = gsap.context(() => {
      const heroElements = {
        greeting: heroRef.current?.querySelector(".hero-greeting"),
        title: heroRef.current?.querySelector(".hero-title"),
        subtitle: heroRef.current?.querySelector(".hero-subtitle"),
        description: heroRef.current?.querySelector(".hero-description"),
        cta: heroRef.current?.querySelector(".hero-cta"),
        social: heroRef.current?.querySelector(".hero-social"),
        blob1: heroRef.current?.querySelector(".hero-blob-1"),
        blob2: heroRef.current?.querySelector(".hero-blob-2"),
      };

      // Stagger fade + slide animations
      const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });

      timeline
        // Greeting badge
        .fromTo(
          heroElements.greeting!,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 }
        )
        // Title
        .fromTo(
          heroElements.title!,
          { opacity: 0, y: 30, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8 },
          "-=0.3"
        )
        // Subtitle
        .fromTo(
          heroElements.subtitle!,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.4"
        )
        // Description
        .fromTo(
          heroElements.description!,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.3"
        )
        // CTA buttons
        .fromTo(
          heroElements.cta!,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.2"
        )
        // Social links
        .fromTo(
          heroElements.social!,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.5 },
          "-=0.2"
        );

      // Background blobs gentle animation
      if (heroElements.blob1 && heroElements.blob2) {
        gsap.to(heroElements.blob1, {
          x: 30,
          y: -30,
          rotation: 10,
          duration: 8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        gsap.to(heroElements.blob2, {
          x: -30,
          y: 30,
          rotation: -10,
          duration: 10,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    }, heroRef);

    // Cleanup on unmount
    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section ref={heroRef} className="relative py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Greeting */}
          <div className="mb-6 hero-greeting">
            <span className="inline-block px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium">
              👋 Welcome to my portfolio
            </span>
          </div>

          {/* Name & Title */}
          <h1 className="hero-title text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Eldad Yikne
          </h1>

          <h2 className="hero-subtitle text-2xl md:text-3xl lg:text-4xl font-semibold mb-6 text-blue-600 dark:text-blue-400">
            Full-Stack Developer
          </h2>

          {/* Tagline */}
          <p className="hero-description text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Specializing in{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              AI/LLM Integration
            </span>
            , modern web applications, and scalable full-stack solutions.
            Building innovative products with React, Node.js, and cutting-edge
            technologies.
          </p>

          {/* CTA Buttons */}
          <div className="hero-cta flex flex-wrap items-center justify-center gap-4 mb-12">
            <Link href="/projects">
              <Button variant="primary" size="lg">
                View My Work
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg">
                Get In Touch
              </Button>
            </Link>
          </div>

          {/* Social Links */}
          <div className="hero-social flex items-center justify-center gap-4">
            <a
              href="https://github.com/eldadYikne"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://linkedin.com/in/eldad-yikne"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="mailto:eldadykn@gmail.com"
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="hero-blob-1 absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="hero-blob-2 absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
      </div>
    </section>
  );
}
