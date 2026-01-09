"use client";

import { useState, useEffect } from "react";
import { getSkills } from "@/lib/firebase-services";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function SkillsPreview() {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSkills()
      .then((data) => {
        setSkills(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching skills:", error);
        setLoading(false);
      });
  }, []);

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill: any) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  const categories = [
    { key: "ai", label: "AI & LLM", color: "purple" },
    { key: "frontend", label: "Frontend", color: "blue" },
    { key: "backend", label: "Backend", color: "green" },
    { key: "devops", label: "DevOps & Tools", color: "orange" },
  ];

  return (
    <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Technical Skills
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              A diverse technology stack for building modern, scalable
              applications
            </p>
          </div>

          {/* Skills Grid */}
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading skills...
            </div>
          ) : skills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {categories.map((category) => {
                const categorySkills = skillsByCategory[category.key] || [];
                if (categorySkills.length === 0) return null;

                return (
                  <div
                    key={category.key}
                    className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full bg-${category.color}-500`}
                      />
                      {category.label}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {categorySkills.slice(0, 8).map((skill: any) => (
                        <span
                          key={skill.id}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-800 dark:text-gray-200"
                        >
                          {skill.name}
                        </span>
                      ))}
                      {categorySkills.length > 8 && (
                        <span className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                          +{categorySkills.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Skills data will be displayed here once added to Firebase.
            </div>
          )}

          {/* CTA */}
          <div className="text-center">
            <Link href="/about">
              <Button variant="outline">
                View All Skills & Experience
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
