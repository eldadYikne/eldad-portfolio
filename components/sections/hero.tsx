"use client";

import { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Linkedin, Mail } from "lucide-react";
import gsap from "gsap";

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  // 3D tilt effect on mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (
      !imageContainerRef.current ||
      !glowRef.current ||
      !imageWrapperRef.current
    )
      return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate distance from center
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    // Calculate rotation (max ±15 degrees)
    const rotateY = (deltaX / (rect.width / 2)) * 15;
    const rotateX = -(deltaY / (rect.height / 2)) * 15;

    // Apply 3D transform with GSAP for smoothness
    gsap.to(imageWrapperRef.current, {
      rotateX,
      rotateY,
      duration: 0.3,
      ease: "power2.out",
    });

    // Move glow to follow cursor (calculate angle around the circle)
    const angle = Math.atan2(deltaY, deltaX);
    const glowX = Math.cos(angle) * (rect.width / 2 - 10);
    const glowY = Math.sin(angle) * (rect.height / 2 - 10);

    gsap.to(glowRef.current, {
      x: glowX,
      y: glowY,
      duration: 0.2,
      ease: "power2.out",
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!imageWrapperRef.current || !glowRef.current) return;

    // Reset transforms smoothly
    gsap.to(imageWrapperRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: "power2.out",
    });

    gsap.to(glowRef.current, {
      x: 0,
      y: -80,
      duration: 0.5,
      ease: "power2.out",
    });
  }, []);

  // Set up mouse tracking for 3D effect
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

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
        image: heroRef.current?.querySelector(".hero-image"),
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
        // Profile image
        .fromTo(
          heroElements.image!,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.7 }
        )
        // Greeting badge
        .fromTo(
          heroElements.greeting!,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.4"
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
          {/* Profile Image with 3D Effect */}
          <div className="hero-image mb-8">
            <div
              ref={imageContainerRef}
              className="relative w-40 h-40 md:w-64 md:h-64 mx-auto cursor-pointer"
              style={{ perspective: "1000px" }}
            >
              {/* Floating animation wrapper */}
              <div className="absolute inset-0 animate-float">
                {/* 3D tilt wrapper */}
                <div
                  ref={imageWrapperRef}
                  className="relative w-full h-full"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Animated gradient ring */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-75 blur-sm animate-spin-slow" />

                  {/* Main image container */}
                  <div className="relative w-full h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[3px]">
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-900">
                      <Image
                        src="https://res.cloudinary.com/dkfnkf3gl/image/upload/v1768326078/portfolio/projects/dtcmayvvyrmwldrt6kub.png"
                        alt="Eldad Yikne"
                        fill
                        className="rounded-full object-cover select-none"
                        priority
                      />
                    </div>
                  </div>

                  {/* Inner glow overlay */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 via-transparent to-purple-500/20 pointer-events-none" />
                </div>
              </div>

              {/* Moving glow spot that follows cursor */}
              <div
                ref={glowRef}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full blur-md opacity-80 pointer-events-none"
                style={{
                  transform: "translate(-50%, -50%) translate(0, -80px)",
                }}
              />

              {/* Outer glow rings */}
              <div className="absolute -inset-4 rounded-full bg-blue-500/10 dark:bg-blue-400/10 blur-xl animate-pulse-slow pointer-events-none" />
              <div className="absolute -inset-8 rounded-full bg-purple-500/5 dark:bg-purple-400/5 blur-2xl animate-pulse-slower pointer-events-none" />
            </div>
          </div>

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
