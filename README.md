# Eldad Yikne - Full-Stack Developer Portfolio

A modern, high-performance developer portfolio built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Firebase.

## 🚀 Features Implemented (Phase 1)

### ✅ Core Setup Complete
- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** v4+ with custom design system
- **Firebase** (Firestore + Storage) integration configured
- **Dark/Light Theme** with next-themes (system preference support)
- **Responsive Layout** with Header, Footer, and Navigation
- **UI Component Library** (Button, Card, Input, Textarea)

### 📁 Project Structure

```
portfolio/
├── app/
│   ├── layout.tsx              # Root layout with theme provider
│   └── page.tsx                # Homepage
├── components/
│   ├── ui/                     # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   └── theme-toggle.tsx
│   ├── layout/                 # Layout components
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── navigation.tsx
│   └── theme-provider.tsx      # Theme context provider
├── lib/
│   ├── firebase.ts             # Firebase client configuration
│   ├── firebase-services.ts    # Firestore CRUD operations
│   └── utils.ts                # Utility functions
├── styles/
│   └── globals.css             # Global styles + Tailwind
├── types/
│   └── index.ts                # TypeScript type definitions
└── public/
    └── images/                 # Static images
```

## 🛠️ Tech Stack

- **Framework:** Next.js 16.1
- **Language:** TypeScript 5.9
- **Styling:** Tailwind CSS 4.1
- **Database:** Firebase Firestore
- **Storage:** Firebase Storage
- **Theme:** next-themes 0.4
- **Forms:** react-hook-form 7.70 + zod 4.3
- **Icons:** lucide-react
- **Utilities:** clsx, tailwind-merge

## 📋 Next Steps

### Phase 2: Content & Features

1. **Firebase Setup** (See [FIREBASE_SETUP.md](FIREBASE_SETUP.md))
   - Create Firebase project
   - Enable Firestore Database
   - Enable Firebase Storage for images
   - Populate initial content from your CV
   - Set environment variables

2. **Homepage Development**
   - Create Hero section component
   - Add About/Skills section
   - Implement Projects grid
   - Add Contact form

3. **Project Pages**
   - Create `/projects` listing page
   - Create `/projects/[slug]` detail pages
   - Implement ISR (Incremental Static Regeneration)

4. **Additional Pages**
   - `/about` - About & Experience page
   - `/contact` - Contact form page

### Phase 3: Enhancements
- Analytics integration (Vercel Analytics)
- Contact form with email delivery (Resend)
- SEO optimization (meta tags, sitemap)
- Performance optimization
- Vercel deployment

## 🚦 Getting Started

### Prerequisites
- Node.js 20.11+
- npm or yarn
- Firebase account (free tier available)

### Installation

```bash
# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your portfolio.

### Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

## 🎨 Design System

### Colors

**Light Mode:**
- Background: `#FFFFFF`, `#F9FAFB`
- Text: `#111827`, `#6B7280`
- Primary: `#3B82F6` (blue-500)
- Borders: `#E5E7EB`

**Dark Mode:**
- Background: `#0F172A`, `#1E293B`
- Text: `#F1F5F9`, `#94A3B8`
- Primary: `#60A5FA` (blue-400)
- Borders: `#334155`

### Typography
- **Font Family:** Inter (Google Fonts)
- **Headings:** font-bold
- **Body:** font-normal

## 🔑 Environment Variables

Create a `.env.local` file (copy from `.env.local.example`):

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Email (for contact form)
RESEND_API_KEY=your_resend_key
CONTACT_EMAIL_TO=eldadykn@gmail.com

# Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id
```

## 📄 Documentation

- **[PRD](C:\Users\אלדד\.claude\plans\ancient-baking-pillow.md)** - Complete Product Requirements Document
- **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)** - Firebase setup guide with Firestore collections
- **[CLAUDE.md](CLAUDE.md)** - Guide for Claude Code AI assistant

## 🧑‍💻 Your Information

Based on your CV, the portfolio will showcase:

**Name:** Eldad Yikne
**Title:** Full-Stack Developer
**Email:** eldadykn@gmail.com
**Phone:** 052-6587480

**Core Skills:**
- Frontend: React.js, Vue.js, Angular, Next.js, TailwindCSS
- Backend: Node.js, Nest.js, Express.js, PHP
- AI/LLM: OpenAI API, GPT-4, Model Context Protocol (MCP)
- Databases: MongoDB, MySQL, Firebase
- Cloud: AWS, MongoDB Atlas

**Experience:**
1. Codere Online (Dec 2024 - Present)
2. Go-Code (July 2022 - Nov 2024)

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Configure environment variables
4. Deploy!

Vercel will automatically:
- Build your Next.js app
- Set up CI/CD
- Provide analytics
- Handle caching and CDN

## 📝 License

MIT © 2026 Eldad Yikne

---

**Current Status:** Phase 1 Complete - Foundation Ready with Firebase
**Next Action:** Set up Firebase using FIREBASE_SETUP.md guide
**Server Running:** http://localhost:3000
