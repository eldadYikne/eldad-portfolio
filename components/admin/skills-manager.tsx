"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
} from "@/lib/firebase-services";
import type { Skill } from "@/types";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { TechIcon } from "@/lib/techIcons";

const SKILL_CATEGORIES = [
  { value: "ai", label: "AI & LLM" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "devops", label: "DevOps" },
  { value: "tools", label: "Tools" },
];

export function SkillsManager() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<Skill>>({
    name: "",
    category: "frontend",
    proficiency: 80,
    order: 0,
  });

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    const data = await getSkills();
    setSkills(data);
    setLoading(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      name: "",
      category: "frontend",
      proficiency: 80,
      order: skills.length,
    });
  };

  const handleEdit = (skill: Skill) => {
    setIsCreating(false);
    setEditingId(skill.id);
    setFormData(skill);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      name: "",
      category: "frontend",
      proficiency: 80,
      order: 0,
    });
  };

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createSkill(formData as Omit<Skill, "id">);
      } else if (editingId) {
        await updateSkill(editingId, formData);
      }
      handleCancel();
      loadSkills();
    } catch (error) {
      console.error("Error saving skill:", error);
      alert("Failed to save skill");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this skill?")) return;

    try {
      await deleteSkill(id);
      loadSkills();
    } catch (error) {
      console.error("Error deleting skill:", error);
      alert("Failed to delete skill");
    }
  };

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  if (loading) {
    return <div className="text-center py-8">Loading skills...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Skills Management</h2>
        <Button onClick={handleCreate} disabled={isCreating || editingId !== null}>
          <Plus className="h-4 w-4 mr-2" />
          New Skill
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-xl font-semibold mb-4">
            {isCreating ? "Create New Skill" : "Edit Skill"}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="React, Node.js, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as Skill['category'] })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                >
                  {SKILL_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Proficiency (0-100)</label>
                <div className="flex items-center gap-3">
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.proficiency ?? 80}
                    onChange={(e) =>
                      setFormData({ ...formData, proficiency: parseInt(e.target.value) })
                    }
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-medium">{formData.proficiency ?? 80}%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Order</label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} variant="primary">
                <Save className="h-4 w-4 mr-2" />
                Save Skill
              </Button>
              <Button onClick={handleCancel} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Skills List by Category */}
      <div className="space-y-6">
        {SKILL_CATEGORIES.map((category) => {
          const categorySkills = skillsByCategory[category.value] || [];

          return (
            <div key={category.value}>
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-500 rounded" />
                {category.label}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({categorySkills.length})
                </span>
              </h3>

              {categorySkills.length > 0 ? (
                <div className="grid gap-3">
                  {categorySkills.map((skill) => (
                    <Card
                      key={skill.id}
                      className="p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 flex-1">
                          <TechIcon tech={skill.name} size={24} />
                          <div className="flex-1">
                            <h4 className="font-semibold">{skill.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Proficiency: {skill.proficiency}%
                            </p>
                          </div>
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                            Order: {skill.order}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEdit(skill)}
                            variant="outline"
                            size="sm"
                            disabled={isCreating || editingId !== null}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(skill.id)}
                            variant="outline"
                            size="sm"
                            disabled={isCreating || editingId !== null}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    No skills in this category yet
                  </p>
                </Card>
              )}
            </div>
          );
        })}

        {skills.length === 0 && !isCreating && (
          <Card className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No skills found. Create your first skill!
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Skill
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
