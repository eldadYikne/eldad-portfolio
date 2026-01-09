import { Timestamp } from 'firebase/firestore'

export interface Project {
  id: string
  title: string
  slug: string
  description: string
  longDescription: string
  featuredImage: string
  gallery?: string[]
  techStack: string[]
  githubUrl?: string
  liveUrl?: string
  category: 'frontend' | 'backend' | 'fullstack' | 'ai'
  featured: boolean
  isPrivate: boolean
  order: number
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface WorkExperience {
  id: string
  company: string
  role: string
  startDate: string
  endDate?: string
  description: string
  achievements: string[]
  technologies: string[]
  logo?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Skill {
  id: string
  name: string
  category: 'frontend' | 'backend' | 'devops' | 'tools' | 'ai'
  proficiency: number
  icon?: string
  order: number
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface ContactFormData {
  name: string
  email: string
  subject?: string
  message: string
}
