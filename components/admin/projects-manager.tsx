"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/firebase-services";
import type { Project } from "@/types";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import UploadWidget from "@/components/UploadWidget";

export function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<Project>>({
    title: "",
    slug: "",
    description: "",
    longDescription: "",
    techStack: [],
    githubUrl: "",
    liveUrl: "",
    featuredImage: "",
    category: "fullstack",
    featured: false,
    isPrivate: false,
    order: 0,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const data = await getProjects();
    setProjects(data);
    setLoading(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      title: "",
      slug: "",
      description: "",
      longDescription: "",
      techStack: [],
      githubUrl: "",
      liveUrl: "",
      featuredImage: "",
      category: "fullstack",
      featured: false,
      isPrivate: false,
      order: projects.length,
    });
  };

  const handleEdit = (project: Project) => {
    setIsCreating(false);
    setEditingId(project.id);
    setFormData(project);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      title: "",
      slug: "",
      description: "",
      longDescription: "",
      techStack: [],
      githubUrl: "",
      liveUrl: "",
      featuredImage: "",
      category: "fullstack",
      featured: false,
      isPrivate: false,
      order: 0,
    });
  };

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createProject(formData as Omit<Project, "id">);
      } else if (editingId) {
        await updateProject(editingId, formData);
      }
      handleCancel();
      loadProjects();
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Failed to save project");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await deleteProject(id);
      loadProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project");
    }
  };

  const handleArrayInput = (value: string) => {
    setFormData({
      ...formData,
      techStack: value.split(",").map((item) => item.trim()),
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects Management</h2>
        <Button onClick={handleCreate} disabled={isCreating || editingId !== null}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-xl font-semibold mb-4">
            {isCreating ? "Create New Project" : "Edit Project"}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Project Title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug *</label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="project-slug"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Short Description *
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description for project card"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Long Description
              </label>
              <Textarea
                value={formData.longDescription}
                onChange={(e) =>
                  setFormData({ ...formData, longDescription: e.target.value })
                }
                placeholder="Detailed description for project page"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tech Stack (comma-separated) *
                </label>
                <Input
                  value={formData.techStack?.join(", ")}
                  onChange={(e) => handleArrayInput(e.target.value)}
                  placeholder="React, Node.js, MongoDB, TypeScript"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as Project["category"],
                    })
                  }
                  className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="fullstack">Full Stack</option>
                  <option value="ai">AI/Machine Learning</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  GitHub URL {formData.isPrivate && <span className="text-gray-400">(disabled - private project)</span>}
                </label>
                <Input
                  value={formData.isPrivate ? "" : formData.githubUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, githubUrl: e.target.value })
                  }
                  placeholder="https://github.com/..."
                  disabled={formData.isPrivate}
                  className={formData.isPrivate ? "opacity-50 cursor-not-allowed" : ""}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Live URL {formData.isPrivate && <span className="text-gray-400">(disabled - private project)</span>}
                </label>
                <Input
                  value={formData.isPrivate ? "" : formData.liveUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, liveUrl: e.target.value })
                  }
                  placeholder="https://..."
                  disabled={formData.isPrivate}
                  className={formData.isPrivate ? "opacity-50 cursor-not-allowed" : ""}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Featured Image *
              </label>
              <UploadWidget
                folder="portfolio/projects"
                maxFiles={1}
                initialImages={
                  formData.featuredImage
                    ? [
                        {
                          secure_url: formData.featuredImage,
                          public_id: formData.featuredImage.split("/").pop() || "",
                        },
                      ]
                    : []
                }
                onImagesChange={(images) => {
                  setFormData({
                    ...formData,
                    featuredImage: images[0]?.secure_url || "",
                  });
                }}
              />
              {/* Fallback manual input */}
              <details className="mt-2">
                <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                  Or enter URL manually
                </summary>
                <Input
                  value={formData.featuredImage}
                  onChange={(e) =>
                    setFormData({ ...formData, featuredImage: e.target.value })
                  }
                  placeholder="https://..."
                  className="mt-2"
                />
              </details>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData({ ...formData, featured: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="featured" className="text-sm font-medium">
                  Featured Project
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={formData.isPrivate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isPrivate: e.target.checked,
                      githubUrl: e.target.checked ? "" : formData.githubUrl,
                      liveUrl: e.target.checked ? "" : formData.liveUrl,
                    })
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="isPrivate" className="text-sm font-medium">
                  Private Project
                </label>
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

            {formData.isPrivate && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  This is a private project. GitHub and Live URLs are disabled. This project was created for paying clients and the source code is not publicly available.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} variant="primary">
                <Save className="h-4 w-4 mr-2" />
                Save Project
              </Button>
              <Button onClick={handleCancel} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Projects List */}
      <div className="grid gap-4">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">{project.title}</h3>
                  {project.featured && (
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded-full">
                      Featured
                    </span>
                  )}
                  {project.isPrivate && (
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs rounded-full">
                      Private
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.techStack?.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-sm rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="mb-3">
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                    {project.category}
                  </span>
                </div>
                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      GitHub
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      Live Demo
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(project)}
                  variant="outline"
                  size="sm"
                  disabled={isCreating || editingId !== null}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(project.id)}
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

        {projects.length === 0 && !isCreating && (
          <Card className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No projects found. Create your first project!
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
