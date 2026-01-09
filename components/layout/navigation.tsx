'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex items-center gap-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary-light dark:hover:text-primary-dark',
            pathname === item.href
              ? 'text-primary-light dark:text-primary-dark'
              : 'text-gray-600 dark:text-gray-400'
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
