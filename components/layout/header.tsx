'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Navigation } from './navigation'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
          Eldad Yikne
        </Link>

        <div className="flex items-center gap-6">
          <Navigation />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
