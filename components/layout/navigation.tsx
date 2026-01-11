"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Handle closing with animation
  const handleClose = () => {
    setIsClosing(true);
  };

  // Complete close after animation ends
  const handleAnimationEnd = () => {
    if (isClosing) {
      setIsOpen(false);
      setIsClosing(false);
    }
  };

  // Close menu when route changes
  useEffect(() => {
    if (isOpen) {
      handleClose();
    }
  }, [pathname]);

  // Prevent body scroll and horizontal overflow when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary-light dark:hover:text-primary-dark",
              pathname === item.href
                ? "text-primary-light dark:text-primary-dark"
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu - Only render when open to prevent overflow-x */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className={cn(
              "fixed inset-0 z-[9998] bg-black/70 md:hidden",
              isClosing ? "animate-fade-out" : "animate-fade-in"
            )}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            className={cn(
              "fixed top-0 right-0 z-[9999] h-screen w-[280px] max-w-[80vw] md:hidden bg-white dark:bg-gray-900 shadow-[-10px_0_30px_rgba(0,0,0,0.3)]",
              isClosing ? "animate-slide-out-right" : "animate-slide-in-right"
            )}
            onAnimationEnd={handleAnimationEnd}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Menu
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Links */}
            <nav className="flex flex-col p-4 gap-2 bg-white dark:bg-gray-900">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleClose}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all",
                    pathname === item.href
                      ? "bg-blue-600 text-white"
                      : "text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <p className="text-xs text-center text-gray-600 dark:text-gray-300 font-medium">
                Eldad Yikne - Full-Stack Developer
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
