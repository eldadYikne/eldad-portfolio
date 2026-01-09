import { Hero } from "@/components/sections/hero";
import { FeaturedProjects } from "@/components/sections/featured-projects";
import { SkillsPreview } from "@/components/sections/skills-preview";
import HomeAnimations from "@/components/home/HomeAnimations";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <HomeAnimations>
        <FeaturedProjects />
        <SkillsPreview />
      </HomeAnimations>
    </main>
  );
}
