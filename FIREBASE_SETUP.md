# Firebase Setup Guide

This guide will help you set up Firebase for your portfolio CMS.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: **"Eldad Portfolio"**
4. Disable Google Analytics (optional, can enable later)
5. Click "Create project"

## Step 2: Register Your Web App

1. In your Firebase project, click the **Web icon** (</>)
2. Enter app nickname: **"Portfolio Website"**
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. Copy the Firebase configuration object (we'll use this in Step 4)

## Step 3: Enable Firestore Database

1. In the Firebase Console, go to **Build** > **Firestore Database**
2. Click "Create database"
3. Select **"Start in production mode"** (we'll add rules later)
4. Choose your Cloud Firestore location (closest to your users)
5. Click "Enable"

## Step 4: Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Email Configuration (for contact form)
RESEND_API_KEY=your_resend_api_key_here
CONTACT_EMAIL_TO=eldadykn@gmail.com
```

Replace the values with those from your Firebase configuration object from Step 2.

## Step 5: Set Up Firestore Security Rules

In Firebase Console, go to **Firestore Database** > **Rules** and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Projects collection - public read, no write
    match /projects/{projectId} {
      allow read: if true;
      allow write: if false; // Manage via Firebase Console
    }

    // Work Experience collection - public read, no write
    match /workExperience/{experienceId} {
      allow read: if true;
      allow write: if false; // Manage via Firebase Console
    }

    // Skills collection - public read, no write
    match /skills/{skillId} {
      allow read: if true;
      allow write: if false; // Manage via Firebase Console
    }
  }
}
```

**Note:** We're setting `write: false` because you'll manage content through the Firebase Console. Later, you can add Firebase Authentication and allow authenticated writes.

## Step 6: Enable Firebase Storage (for Images)

1. In Firebase Console, go to **Build** > **Storage**
2. Click "Get started"
3. Use production mode rules (we'll configure later)
4. Choose same location as Firestore
5. Click "Done"

### Storage Security Rules

Go to **Storage** > **Rules** and update:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public read access for all images
    match /{allPaths=**} {
      allow read: if true;
      allow write: if false; // Upload via Firebase Console only
    }
  }
}
```

## Step 7: Add Initial Data to Firestore

Based on your CV, here's the data to add manually in Firebase Console:

### Collection: `workExperience`

**Document 1: Codere Online**

```json
{
  "company": "Codere Online",
  "role": "Full-Stack Developer",
  "startDate": "2024-12-01",
  "endDate": null,
  "description": "Developing and maintaining full-stack applications using Angular, NextJS, React, TypeScript, Node.js, PHP, SQL, and MongoDB. Integrated AI features using OpenAI's APIs for personalized content and internal automations.",
  "achievements": [
    "Integrated AI features using OpenAI's APIs for personalized content, Cursor, and internal automations",
    "Building and optimizing RESTful APIs for efficient communication between services",
    "Working on high-performance and scalable web applications for the online gaming industry"
  ],
  "technologies": [
    "Angular",
    "NextJS",
    "React",
    "TypeScript",
    "Node.js",
    "PHP",
    "SQL",
    "MongoDB",
    "OpenAI API"
  ],
  "logo": ""
}
```

**Document 2: Go-Code**

```json
{
  "company": "Go-Code",
  "role": "Full-Stack Developer",
  "startDate": "2022-07-01",
  "endDate": "2024-11-30",
  "description": "Developed and maintained full-stack applications using Angular, React, TypeScript, TailwindCSS, MongoDB, and Node.js. Designed and implemented RESTful APIs.",
  "achievements": [
    "Designed and implemented RESTful APIs ensuring seamless communication between frontend and backend",
    "Integrated third-party APIs to enhance application functionality",
    "Optimized performance for diverse devices ensuring smooth user experience",
    "Managed Git version control handling merging, code reviews, and CI/CD workflows"
  ],
  "technologies": [
    "Angular",
    "React",
    "TypeScript",
    "TailwindCSS",
    "MongoDB",
    "Node.js"
  ],
  "logo": ""
}
```

### Collection: `skills`

Add these skills documents (set appropriate `proficiency` from 1-10 and `order` for display):

**AI Category:**

```json
{ "name": "OpenAI API", "category": "ai", "proficiency": 9, "order": 1 }
{ "name": "ChatGPT Integration", "category": "ai", "proficiency": 9, "order": 2 }
{ "name": "GPT-4", "category": "ai", "proficiency": 8, "order": 3 }
{ "name": "Model Context Protocol (MCP)", "category": "ai", "proficiency": 8, "order": 4 }
{ "name": "Prompt Engineering", "category": "ai", "proficiency": 8, "order": 5 }
```

**Frontend Category:**

```json
{ "name": "React.js", "category": "frontend", "proficiency": 9, "order": 1 }
{ "name": "Next.js", "category": "frontend", "proficiency": 9, "order": 2 }
{ "name": "Vue.js", "category": "frontend", "proficiency": 8, "order": 3 }
{ "name": "Angular", "category": "frontend", "proficiency": 8, "order": 4 }
{ "name": "TypeScript", "category": "frontend", "proficiency": 9, "order": 5 }
{ "name": "TailwindCSS", "category": "frontend", "proficiency": 9, "order": 6 }
{ "name": "HTML5", "category": "frontend", "proficiency": 10, "order": 7 }
{ "name": "CSS3", "category": "frontend", "proficiency": 9, "order": 8 }
{ "name": "SASS", "category": "frontend", "proficiency": 8, "order": 9 }
```

**Backend Category:**

```json
{ "name": "Node.js", "category": "backend", "proficiency": 9, "order": 1 }
{ "name": "Nest.js", "category": "backend", "proficiency": 8, "order": 2 }
{ "name": "Express.js", "category": "backend", "proficiency": 9, "order": 3 }
{ "name": "PHP", "category": "backend", "proficiency": 7, "order": 4 }
{ "name": "MongoDB", "category": "backend", "proficiency": 8, "order": 5 }
{ "name": "MySQL", "category": "backend", "proficiency": 8, "order": 6 }
{ "name": "Firebase", "category": "backend", "proficiency": 8, "order": 7 }
```

**DevOps/Tools Category:**

```json
{ "name": "AWS", "category": "devops", "proficiency": 7, "order": 1 }
{ "name": "Git", "category": "devops", "proficiency": 9, "order": 2 }
{ "name": "GitHub", "category": "devops", "proficiency": 9, "order": 3 }
{ "name": "CI/CD", "category": "devops", "proficiency": 8, "order": 4 }
{ "name": "Docker", "category": "devops", "proficiency": 7, "order": 5 }
```

### Collection: `projects`

Add your portfolio projects. Here's an example structure:

```json
{
  "title": "Logiki - Smart Logistics Management System",
  "slug": "logiki",
  "description": "A smart logistics management system for real-time inventory tracking and digital sign-offs, built for large organizations operating across multiple cities and sites.",
  "longDescription": "Logiki is a full-stack smart logistics management platform designed for large-scale organizations that manage inventory, deliveries, and digital sign-offs across multiple cities and operational sites. The system provides a centralized company dashboard alongside a client-facing portal, enabling real-time access to inventory status, asset assignments, delivery confirmations, and historical sign-off records. Built with React, TypeScript, and Vite on the frontend, Firebase for real-time data, authentication, and storage, and a Node.js backend for secure business logic and critical operations, Logiki delivers a scalable, reliable, and enterprise-ready logistics solution.",
  "featuredImage": "https://firebasestorage.googleapis.com/...",
  "gallery": [
    "https://firebasestorage.googleapis.com/...",
    "https://firebasestorage.googleapis.com/...",
    "https://firebasestorage.googleapis.com/..."
  ],
  "techStack": [
    "React",
    "TypeScript",
    "Vite",
    "Firebase",
    "Node.js"
  ],
  "githubUrl": "https://github.com/eldadYikne/logiki",
  "liveUrl": "https://logiki.example.com",
  "category": "fullstack",
  "featured": true,
  "order": 1
},
{
  "title": "AI-Powered Portfolio CMS",
  "slug": "ai-portfolio-cms",
  "description": "Modern portfolio website with AI integration and CMS built with Next.js and Firebase",
  "longDescription": "A comprehensive full-stack portfolio application showcasing modern web development practices. Features include dark/light mode theming, Firebase CMS integration, responsive design, and AI-powered content suggestions.",
  "featuredImage": "https://firebasestorage.googleapis.com/...",
  "gallery": [
    "https://firebasestorage.googleapis.com/...",
    "https://firebasestorage.googleapis.com/..."
  ],
  "techStack": [
    "Next.js",
    "TypeScript",
    "Firebase",
    "Tailwind CSS",
    "React"
  ],
  "githubUrl": "https://github.com/eldadykn/portfolio",
  "liveUrl": "https://eldadyikne.com",
  "category": "fullstack",
  "featured": true,
  "order": 1
}
```

## Step 8: Upload Images to Firebase Storage

1. Go to **Storage** in Firebase Console
2. Create folders: `projects/`, `logos/`, `icons/`
3. Upload your images
4. Copy the download URLs and use them in your Firestore documents

## Step 9: Test the Connection

Restart your development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to verify Firebase is connected.

## Using the Firebase Services

### Fetching Data in Components

```tsx
import { getProjects, getWorkExperiences, getSkills } from '@/lib/firebase-services'

// In a Server Component
export default async function HomePage() {
  const projects = await getProjects(true) // Featured only
  const experiences = await getWorkExperiences()
  const skills = await getSkills()

  return (
    // Your JSX
  )
}

// In a Client Component
'use client'

import { useEffect, useState } from 'react'
import { getProjects } from '@/lib/firebase-services'

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    getProjects().then(setProjects)
  }, [])

  return (
    // Your JSX
  )
}
```

## Optional: Firebase Admin SDK (for Server Actions)

If you want to perform admin operations (create, update, delete) from your Next.js app:

1. Go to **Project Settings** > **Service Accounts**
2. Click "Generate new private key"
3. Save the JSON file securely (DO NOT commit to Git)
4. Add to `.env.local`:
   ```env
   FIREBASE_ADMIN_PRIVATE_KEY="your-private-key"
   FIREBASE_ADMIN_CLIENT_EMAIL="your-service-account-email"
   ```

## Firestore Data Structure

```
portfolio (Firebase Project)
├── projects/
│   ├── {projectId}
│   │   ├── title: string
│   │   ├── slug: string
│   │   ├── description: string
│   │   ├── longDescription: string
│   │   ├── featuredImage: string
│   │   ├── gallery: string[]
│   │   ├── techStack: string[]
│   │   ├── githubUrl: string
│   │   ├── liveUrl: string
│   │   ├── category: string
│   │   ├── featured: boolean
│   │   ├── order: number
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── workExperience/
│   ├── {experienceId}
│   │   ├── company: string
│   │   ├── role: string
│   │   ├── startDate: string
│   │   ├── endDate: string | null
│   │   ├── description: string
│   │   ├── achievements: string[]
│   │   ├── technologies: string[]
│   │   ├── logo: string
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
└── skills/
    ├── {skillId}
    │   ├── name: string
    │   ├── category: string
    │   ├── proficiency: number
    │   ├── icon: string
    │   ├── order: number
    │   ├── createdAt: timestamp
    │   └── updatedAt: timestamp
```

## Troubleshooting

**Error: Firebase not initialized**

- Check that all environment variables are set correctly
- Restart your development server after adding `.env.local`

**Error: Permission denied**

- Verify Firestore security rules allow public read access
- Check that you're querying the correct collection names

**Images not loading**

- Ensure Storage security rules allow public read
- Verify image URLs are complete and accessible
- Check that images are in the correct Storage folders

## Next Steps

1. ✅ Firebase project created and configured
2. ✅ Firestore database enabled with security rules
3. ✅ Firebase Storage enabled for images
4. ✅ Initial data added (work experience, skills)
5. → Add your portfolio projects to Firestore
6. → Build homepage sections to display the data
7. → Create project detail pages
8. → Deploy to Vercel with environment variables

---

**Need Help?**

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guides](https://firebase.google.com/docs/firestore)
- [Firebase Storage](https://firebase.google.com/docs/storage)
