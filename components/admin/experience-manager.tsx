"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  getWorkExperiences,
  createWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
} from "@/lib/firebase-services";
import type { WorkExperience } from "@/types";
import { Plus, Pencil, Trash2, X, Save, Briefcase } from "lucide-react";
import { TechIcon } from "@/lib/techIcons";

export function ExperienceManager() {
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<WorkExperience>>({
    company: "",
    role: "",
    startDate: "",
    endDate: "",
    description: "",
    achievements: [],
    technologies: [],
  });

  useEffect(() => {
    loadExperiences();
  }, []);

  const loadExperiences = async () => {
    setLoading(true);
    const data = await getWorkExperiences();
    setExperiences(data);
    setLoading(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      company: "",
      role: "",
      startDate: "",
      endDate: "",
      description: "",
      achievements: [],
      technologies: [],
    });
  };

  const handleEdit = (experience: WorkExperience) => {
    setIsCreating(false);
    setEditingId(experience.id);
    setFormData(experience);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      company: "",
      role: "",
      startDate: "",
      endDate: "",
      description: "",
      achievements: [],
      technologies: [],
    });
  };

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createWorkExperience(formData as Omit<WorkExperience, "id">);
      } else if (editingId) {
        await updateWorkExperience(editingId, formData);
      }
      handleCancel();
      loadExperiences();
    } catch (error) {
      console.error("Error saving experience:", error);
      alert("Failed to save work experience");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this work experience?"))
      return;

    try {
      await deleteWorkExperience(id);
      loadExperiences();
    } catch (error) {
      console.error("Error deleting experience:", error);
      alert("Failed to delete work experience");
    }
  };

  const handleArrayInput = (
    value: string,
    field: "achievements" | "technologies"
  ) => {
    setFormData({
      ...formData,
      [field]: value.split("\n").filter((item) => item.trim()),
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  };

  if (loading) {
    return <div className="text-center py-8">Loading work experiences...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Work Experience Management</h2>
        <Button
          onClick={handleCreate}
          disabled={isCreating || editingId !== null}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Experience
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-xl font-semibold mb-4">
            {isCreating ? "Create New Work Experience" : "Edit Work Experience"}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Company *
                </label>
                <Input
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  placeholder="Company Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Role *
                </label>
                <Input
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  placeholder="Job Title"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Start Date *
                </label>
                <Input
                  type="month"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  End Date
                </label>
                <Input
                  type="month"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  placeholder="Leave empty for current"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of your role"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Achievements (one per line)
              </label>
              <Textarea
                value={formData.achievements?.join("\n")}
                onChange={(e) => handleArrayInput(e.target.value, "achievements")}
                placeholder="Achievement 1&#10;Achievement 2&#10;Achievement 3"
                rows={5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Technologies (one per line)
              </label>
              <Textarea
                value={formData.technologies?.join("\n")}
                onChange={(e) =>
                  handleArrayInput(e.target.value, "technologies")
                }
                placeholder="React&#10;Node.js&#10;MongoDB"
                rows={5}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} variant="primary">
                <Save className="h-4 w-4 mr-2" />
                Save Experience
              </Button>
              <Button onClick={handleCancel} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Experiences List */}
      <div className="space-y-4">
        {experiences.map((exp) => (
          <Card key={exp.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg h-fit">
                  <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{exp.role}</h3>
                  <p className="text-lg text-gray-700 dark:text-gray-300">
                    {exp.company}
                  </p>
                  <div className="flex gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span>
                      {formatDate(exp.startDate)} -{" "}
                      {exp.endDate ? formatDate(exp.endDate) : "Present"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(exp)}
                  variant="outline"
                  size="sm"
                  disabled={isCreating || editingId !== null}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(exp.id)}
                  variant="outline"
                  size="sm"
                  disabled={isCreating || editingId !== null}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {exp.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {exp.description}
              </p>
            )}

            {exp.achievements && exp.achievements.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Key Achievements:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {exp.achievements.map((achievement, i) => (
                    <li key={i}>{achievement}</li>
                  ))}
                </ul>
              </div>
            )}

            {exp.technologies && exp.technologies.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Technologies:</h4>
                <div className="flex flex-wrap gap-3">
                  {exp.technologies.map((tech) => (
                    <TechIcon key={tech} tech={tech} size={20} />
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}

        {experiences.length === 0 && !isCreating && (
          <Card className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No work experiences found. Add your first experience!
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Experience
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
