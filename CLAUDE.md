# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern, high-performance developer portfolio for Eldad Yikne, built with Next.js 14 App Router, TypeScript, Tailwind CSS, and Firebase.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint

# Type check without emitting files
npm run type-check
```

## Architecture

### Technology Stack
- **Framework:** Next.js 16.1 with App Router
- **Language:** TypeScript 5.9 (strict mode enabled)
- **Styling:** Tailwind CSS 4.1 with custom design system
- **Database:** Firebase Firestore for content management
- **Storage:** Firebase Storage for images
- **Theme:** next-themes for dark/light mode
- **Forms:** react-hook-form + zod for validation
- **Icons:** lucide-react

### Project Structure

```
portfolio/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # Root layout with theme provider, header, footer
│   └── page.tsx               # Homepage
│
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── button.tsx         # Button with variants (primary, secondary, outline, ghost)
│   │   ├── card.tsx           # Card components (Card, CardHeader, CardContent, etc.)
│   │   ├── input.tsx          # Form input component
│   │   ├── textarea.tsx       # Textarea component
│   │   └── theme-toggle.tsx   # Dark/light mode toggle button
│   │
│   ├── layout/                # Layout components
│   │   ├── header.tsx         # Site header with navigation and theme toggle
│   │   ├── footer.tsx         # Site footer with links and social icons
│   │   └── navigation.tsx     # Main navigation menu
│   │
│   └── theme-provider.tsx     # Theme provider wrapper for next-themes
│
├── lib/
│   ├── firebase.ts            # Firebase client configuration
│   ├── firebase-services.ts   # Firestore CRUD operations
│   └── utils.ts               # Utility functions (cn helper)
│
├── styles/
│   └── globals.css            # Global styles and Tailwind imports
│
├── types/
│   └── index.ts               # TypeScript type definitions for CMS data
│
└── public/
    └── images/                # Static images
```

### Design System

**Theme:**
- Light/Dark mode support via next-themes
- System preference detection on first visit
- Preference persisted in localStorage

**Colors:**
- Primary Light: `#3B82F6` (blue-500)
- Primary Dark: `#60A5FA` (blue-400)
- Defined in [tailwind.config.ts](tailwind.config.ts:10-13)

**Typography:**
- Font: Inter (Google Fonts)
- Loaded in [app/layout.tsx](app/layout.tsx:6)

**UI Components:**
All components use the `cn()` utility from [lib/utils.ts](lib/utils.ts) for conditional class merging.

### Content Management (Firebase)

**Client Configuration:**
- See [lib/firebase.ts](lib/firebase.ts)
- Firebase config from environment variables

**Services:**
- All CRUD operations defined in [lib/firebase-services.ts](lib/firebase-services.ts)
- Functions: getProjects, getWorkExperiences, getSkills, etc.

**Firestore Collections:**
1. **projects** - Portfolio projects with case studies
2. **workExperience** - Job history and achievements
3. **skills** - Technical skills organized by category

**Setup:**
- Follow [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for Firebase configuration
- Requires environment variables in `.env.local`

### Key Files

**Configuration:**
- [next.config.js](next.config.js) - Next.js configuration with Sanity image domain
- [tailwind.config.ts](tailwind.config.ts) - Tailwind with dark mode and custom colors
- [tsconfig.json](tsconfig.json) - TypeScript strict mode configuration

**Layout:**
- [app/layout.tsx](app/layout.tsx) - Root layout with ThemeProvider, Header, and Footer

## Important Patterns

### Theme Support
All components must support both light and dark modes using Tailwind's `dark:` prefix.

Example:
```tsx
className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
```

### Component Styling
Use the `cn()` utility for conditional classes:
```tsx
import { cn } from '@/lib/utils'

className={cn('base-classes', conditionalClasses, className)}
```

### Path Aliases
Import using `@/` prefix:
```tsx
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```

### Firebase Data Fetching
Use service functions from [lib/firebase-services.ts](lib/firebase-services.ts):
```tsx
import { getProjects, getWorkExperiences, getSkills } from '@/lib/firebase-services'

// Fetch data in Server Components
const projects = await getProjects(true) // featured only
const experiences = await getWorkExperiences()
const skills = await getSkills()
```

## Environment Variables

Required in `.env.local`:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Email (for contact form - future)
RESEND_API_KEY=
CONTACT_EMAIL_TO=eldadykn@gmail.com
```

## Next Development Steps

1. **Firebase Setup** - Configure Firebase following [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
2. **Homepage Sections** - Create Hero, About, Projects, Contact sections
3. **Project Pages** - Create `/projects` and `/projects/[slug]` routes
4. **Contact Form** - Build form with validation and email integration
5. **SEO** - Add meta tags and structured data
6. **Deployment** - Deploy to Vercel

## Personal Information

**Name:** Eldad Yikne
**Title:** Full-Stack Developer
**Email:** eldadykn@gmail.com
**Phone:** 052-6587480

**Key Skills:**
- AI/LLM: OpenAI API, GPT-4, Model Context Protocol (MCP)
- Frontend: React, Vue, Angular, Next.js, TailwindCSS
- Backend: Node.js, Nest.js, Express.js, PHP
- Databases: MongoDB, MySQL, Firebase

## Coding Conventions

- Use TypeScript strict mode
- Functional components with hooks
- Server Components by default (use 'use client' when needed)
- Prefer composition over configuration
- Keep components small and focused
- Co-locate related files (component + styles + types)
