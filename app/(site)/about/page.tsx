import { Bio } from '@/components/sections/bio'
import { ExperienceTimeline } from '@/components/sections/experience-timeline'
import { SkillsFull } from '@/components/sections/skills-full'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | Eldad Yikne',
  description: 'Full-Stack Developer specializing in AI/LLM integration, modern web applications, and scalable solutions.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Me</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Full-Stack Developer & AI Integration Specialist
            </p>
          </div>

          {/* Bio Section */}
          <Bio />

          {/* Experience Timeline */}
          <ExperienceTimeline />

          {/* Skills Section */}
          <SkillsFull />
        </div>
      </div>
    </main>
  )
}
