import { getSkills } from "@/lib/firebase-services";
import { Code2, Server, Cloud, Wrench, Brain } from "lucide-react";

export async function SkillsFull() {
  const skills = await getSkills();
  console.log("skills", skills);
  // Hardcoded fallback data from CV if Firebase is empty
  const fallbackSkills = [
    // AI & LLM
    {
      id: "1",
      name: "OpenAI API",
      category: "ai" as const,
      proficiency: 90,
      order: 1,
    },
    {
      id: "2",
      name: "GPT-4",
      category: "ai" as const,
      proficiency: 90,
      order: 2,
    },
    {
      id: "3",
      name: "Model Context Protocol (MCP)",
      category: "ai" as const,
      proficiency: 85,
      order: 3,
    },
    {
      id: "4",
      name: "Prompt Engineering",
      category: "ai" as const,
      proficiency: 85,
      order: 4,
    },
    {
      id: "5",
      name: "AI Integration",
      category: "ai" as const,
      proficiency: 88,
      order: 5,
    },

    // Frontend
    {
      id: "6",
      name: "React.js",
      category: "frontend" as const,
      proficiency: 95,
      order: 1,
    },
    {
      id: "7",
      name: "Next.js",
      category: "frontend" as const,
      proficiency: 90,
      order: 2,
    },
    {
      id: "8",
      name: "Vue.js",
      category: "frontend" as const,
      proficiency: 85,
      order: 3,
    },
    {
      id: "9",
      name: "Angular",
      category: "frontend" as const,
      proficiency: 80,
      order: 4,
    },
    {
      id: "10",
      name: "TypeScript",
      category: "frontend" as const,
      proficiency: 92,
      order: 5,
    },
    {
      id: "11",
      name: "JavaScript",
      category: "frontend" as const,
      proficiency: 95,
      order: 6,
    },
    {
      id: "12",
      name: "TailwindCSS",
      category: "frontend" as const,
      proficiency: 90,
      order: 7,
    },
    {
      id: "13",
      name: "HTML/CSS",
      category: "frontend" as const,
      proficiency: 95,
      order: 8,
    },

    // Backend
    {
      id: "14",
      name: "Node.js",
      category: "backend" as const,
      proficiency: 92,
      order: 1,
    },
    {
      id: "15",
      name: "Nest.js",
      category: "backend" as const,
      proficiency: 85,
      order: 2,
    },
    {
      id: "16",
      name: "Express.js",
      category: "backend" as const,
      proficiency: 90,
      order: 3,
    },
    {
      id: "17",
      name: "PHP",
      category: "backend" as const,
      proficiency: 75,
      order: 4,
    },
    {
      id: "18",
      name: "MongoDB",
      category: "backend" as const,
      proficiency: 88,
      order: 5,
    },
    {
      id: "19",
      name: "MySQL",
      category: "backend" as const,
      proficiency: 85,
      order: 6,
    },
    {
      id: "20",
      name: "Firebase",
      category: "backend" as const,
      proficiency: 87,
      order: 7,
    },
    {
      id: "21",
      name: "RESTful APIs",
      category: "backend" as const,
      proficiency: 93,
      order: 8,
    },

    // DevOps & Tools
    {
      id: "22",
      name: "AWS",
      category: "devops" as const,
      proficiency: 82,
      order: 1,
    },
    {
      id: "23",
      name: "Git",
      category: "devops" as const,
      proficiency: 90,
      order: 2,
    },
    {
      id: "24",
      name: "CI/CD",
      category: "devops" as const,
      proficiency: 80,
      order: 3,
    },
    {
      id: "25",
      name: "Docker",
      category: "devops" as const,
      proficiency: 75,
      order: 4,
    },
    {
      id: "26",
      name: "MongoDB Atlas",
      category: "devops" as const,
      proficiency: 85,
      order: 5,
    },
  ];

  const displaySkills = skills.length > 0 ? skills : fallbackSkills;

  // Group skills by category
  const skillsByCategory = displaySkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill as any);
    return acc;
  }, {} as Record<string, typeof displaySkills>);

  const categories = [
    {
      key: "ai",
      label: "AI & LLM",
      icon: Brain,
      color: "purple",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      key: "frontend",
      label: "Frontend Development",
      icon: Code2,
      color: "blue",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      key: "backend",
      label: "Backend Development",
      icon: Server,
      color: "green",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      key: "devops",
      label: "DevOps & Cloud",
      icon: Cloud,
      color: "orange",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <section className="mb-16">
      <h2 className="text-3xl font-bold mb-8">Technical Skills</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map((category) => {
          const categorySkills = (skillsByCategory[category.key] || []).sort(
            (a, b) => (b.proficiency || 0) - (a.proficiency || 0)
          );

          if (categorySkills.length === 0) return null;

          const Icon = category.icon;

          return (
            <div
              key={category.key}
              className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`p-2 rounded-lg bg-gradient-to-br ${category.gradient}`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">{category.label}</h3>
              </div>

              {/* Skills List */}
              <div className="space-y-4">
                {categorySkills.map((skill) => (
                  <div key={skill.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {skill.name}
                      </span>
                      {skill.proficiency && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {skill.proficiency}%
                        </span>
                      )}
                    </div>
                    {skill.proficiency && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${category.gradient} rounded-full transition-all duration-500`}
                          style={{ width: `${skill.proficiency}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
