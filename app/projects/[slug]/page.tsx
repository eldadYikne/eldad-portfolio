import { getProjects, getProjectBySlug } from "@/lib/firebase-services";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Github, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface ProjectPageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const resolvedParams: any =
    typeof (params as any)?.then === "function"
      ? await (params as any)
      : params;

  // אם מסיבה כלשהי זה מגיע כ-string JSON
  const finalParams =
    typeof resolvedParams === "string"
      ? JSON.parse(resolvedParams)
      : resolvedParams;

  const slug = finalParams.slug;

  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: `${project.title} | Eldad Yikne`,
    description: project.description,
  };
}

export const revalidate = 3600; // Revalidate every hour

export default async function ProjectPage({ params }: ProjectPageProps) {
  const resolvedParams: any =
    typeof (params as any)?.then === "function"
      ? await (params as any)
      : params;

  // אם מסיבה כלשהי זה מגיע כ-string JSON
  const finalParams =
    typeof resolvedParams === "string"
      ? JSON.parse(resolvedParams)
      : resolvedParams;

  const slug = finalParams.slug;

  const project = await getProjectBySlug(slug);
  console.log("params.slug", slug);
  if (!project) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link href="/projects" className="inline-block mb-8">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>

        {/* Hero Image */}
        {project.featuredImage && (
          <div className="relative h-64 md:h-96 w-full overflow-hidden rounded-lg mb-8 bg-gray-100 dark:bg-gray-800">
            <Image
              src={project.featuredImage}
              alt={project.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 896px"
            />
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
              {project.category}
            </span>
            {project.featured && (
              <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                Featured
              </span>
            )}
          </div>

          <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {project.description}
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-4 mb-8">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                <Github className="h-4 w-4 mr-2" />
                View Source
              </Button>
            </a>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="primary">
                <ExternalLink className="h-4 w-4 mr-2" />
                Live Demo
              </Button>
            </a>
          )}
        </div>

        {/* Description */}
        <div className="prose dark:prose-invert max-w-none mb-8">
          <h2 className="text-2xl font-bold mb-4">About This Project</h2>
          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {project.longDescription}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            {project.techStack &&
              project.techStack?.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
                >
                  {tech}
                </span>
              ))}
          </div>
        </div>

        {/* Gallery */}
        {project.gallery && project.gallery.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Gallery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.gallery.map((image, index) => (
                <div
                  key={index}
                  className="relative h-64 w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
                >
                  <Image
                    src={image}
                    alt={`${project.title} screenshot ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
