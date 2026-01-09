import { getWorkExperiences } from '@/lib/firebase-services'
import { Briefcase, Calendar } from 'lucide-react'
import { TechIcon } from '@/lib/techIcons'

export async function ExperienceTimeline() {
  const experiences = await getWorkExperiences()

  // Hardcoded fallback data from CV if Firebase is empty
  const fallbackExperiences = [
    {
      id: '1',
      company: 'Codere Online',
      role: 'Full-Stack Developer',
      startDate: 'December 2024',
      endDate: undefined,
      description: 'Working on innovative online gaming platform solutions',
      achievements: [
        'Developing full-stack features for online gaming platform',
        'Implementing AI/LLM integrations',
        'Building scalable web applications with modern technologies',
      ],
      technologies: ['React', 'Node.js', 'TypeScript', 'AI/LLM'],
      logo: undefined,
    },
    {
      id: '2',
      company: 'Go-Code',
      role: 'Full-Stack Developer',
      startDate: 'July 2022',
      endDate: 'November 2024',
      description: 'Led development of multiple client projects and internal tools',
      achievements: [
        'Developed and maintained multiple full-stack web applications',
        'Implemented RESTful APIs and microservices architecture',
        'Collaborated with cross-functional teams on various projects',
        'Mentored junior developers and conducted code reviews',
      ],
      technologies: ['React', 'Vue.js', 'Angular', 'Node.js', 'Express', 'MongoDB', 'MySQL', 'AWS'],
      logo: undefined,
    },
  ]

  const displayExperiences = experiences.length > 0 ? experiences : fallbackExperiences

  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold mb-8">Work Experience</h2>
      <div className="space-y-8">
        {displayExperiences.map((exp, index) => (
          <div
            key={exp.id}
            className="relative pl-8 pb-8 border-l-2 border-gray-300 dark:border-gray-700 last:pb-0"
          >
            {/* Timeline dot */}
            <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-400 border-4 border-white dark:border-gray-900" />

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {exp.role}
                  </h3>
                  {!exp.endDate && (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      Current
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span className="font-medium">{exp.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {exp.startDate} - {exp.endDate || 'Present'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-700 dark:text-gray-300 mb-4">{exp.description}</p>

              {/* Achievements */}
              {exp.achievements && exp.achievements.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Key Achievements:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    {exp.achievements.map((achievement, i) => (
                      <li key={i}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technologies with Icons */}
              {exp.technologies && exp.technologies.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Technologies:
                  </h4>
                  <div className="flex flex-wrap gap-3 items-center">
                    {exp.technologies.map((tech) => (
                      <TechIcon
                        key={tech}
                        tech={tech}
                        size={22}
                        className="transition-transform hover:scale-125"
                        showTooltip={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
