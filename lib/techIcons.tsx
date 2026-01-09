import {
  SiReact,
  SiNextdotjs,
  SiNodedotjs,
  SiAngular,
  SiVuedotjs,
  SiTypescript,
  SiJavascript,
  SiFirebase,
  SiMongodb,
  SiMysql,
  SiDocker,
  SiExpress,
  SiNestjs,
  SiPhp,
  SiAmazon,
  SiGit,
  SiTailwindcss,
  SiOpenai,
  SiPython,
  SiPostgresql,
  SiRedis,
  SiGraphql,
  SiHtml5,
  SiCss3,
  SiSass,
  SiWebpack,
  SiVite,
} from "react-icons/si";
import { IconType } from "react-icons";

export interface TechIconConfig {
  icon: IconType;
  color: string; // Tailwind color class
  label: string;
}

// Comprehensive tech icon mapping
export const TECH_ICONS: Record<string, TechIconConfig> = {
  // Frontend Frameworks
  React: { icon: SiReact, color: "text-[#61DAFB]", label: "React" },
  "React.js": { icon: SiReact, color: "text-[#61DAFB]", label: "React" },
  "Next.js": {
    icon: SiNextdotjs,
    color: "text-gray-900 dark:text-white",
    label: "Next.js",
  },
  Vue: { icon: SiVuedotjs, color: "text-[#4FC08D]", label: "Vue.js" },
  "Vue.js": { icon: SiVuedotjs, color: "text-[#4FC08D]", label: "Vue.js" },
  Angular: { icon: SiAngular, color: "text-[#DD0031]", label: "Angular" },

  // Languages
  TypeScript: {
    icon: SiTypescript,
    color: "text-[#3178C6]",
    label: "TypeScript",
  },
  JavaScript: {
    icon: SiJavascript,
    color: "text-[#F7DF1E]",
    label: "JavaScript",
  },
  PHP: { icon: SiPhp, color: "text-[#777BB4]", label: "PHP" },
  Python: { icon: SiPython, color: "text-[#3776AB]", label: "Python" },

  // Backend
  "Node.js": { icon: SiNodedotjs, color: "text-[#339933]", label: "Node.js" },
  Express: {
    icon: SiExpress,
    color: "text-gray-700 dark:text-gray-300",
    label: "Express.js",
  },
  "Express.js": {
    icon: SiExpress,
    color: "text-gray-700 dark:text-gray-300",
    label: "Express.js",
  },
  "Nest.js": { icon: SiNestjs, color: "text-[#E0234E]", label: "Nest.js" },

  // Databases
  MongoDB: { icon: SiMongodb, color: "text-[#47A248]", label: "MongoDB" },
  MySQL: { icon: SiMysql, color: "text-[#4479A1]", label: "MySQL" },
  PostgreSQL: {
    icon: SiPostgresql,
    color: "text-[#4169E1]",
    label: "PostgreSQL",
  },
  Firebase: { icon: SiFirebase, color: "text-[#FFCA28]", label: "Firebase" },
  Redis: { icon: SiRedis, color: "text-[#DC382D]", label: "Redis" },

  // Cloud & DevOps
  AWS: { icon: SiAmazon, color: "text-[#FF9900]", label: "AWS" },
  Docker: { icon: SiDocker, color: "text-[#2496ED]", label: "Docker" },
  Git: { icon: SiGit, color: "text-[#F05032]", label: "Git" },

  // Styling & Tools
  TailwindCSS: {
    icon: SiTailwindcss,
    color: "text-[#06B6D4]",
    label: "Tailwind CSS",
  },
  Tailwind: {
    icon: SiTailwindcss,
    color: "text-[#06B6D4]",
    label: "Tailwind CSS",
  },
  HTML: { icon: SiHtml5, color: "text-[#E34F26]", label: "HTML5" },
  CSS: { icon: SiCss3, color: "text-[#1572B6]", label: "CSS3" },
  SASS: { icon: SiSass, color: "text-[#CC6699]", label: "SASS" },
  Webpack: { icon: SiWebpack, color: "text-[#8DD6F9]", label: "Webpack" },
  Vite: { icon: SiVite, color: "text-[#646CFF]", label: "Vite" },
  GraphQL: { icon: SiGraphql, color: "text-[#E10098]", label: "GraphQL" },

  // AI/LLM
  OpenAI: { icon: SiOpenai, color: "text-[#412991]", label: "OpenAI" },
  "AI/LLM": { icon: SiOpenai, color: "text-[#412991]", label: "AI & LLM" },
  "GPT-4": { icon: SiOpenai, color: "text-[#412991]", label: "GPT-4" },
};

/**
 * Get tech icon configuration by technology name
 * Case-insensitive matching with normalization
 */
export function getTechIcon(techName: string): TechIconConfig | null {
  // Normalize the tech name
  const normalized = techName.trim();

  // Try exact match first
  if (TECH_ICONS[normalized]) {
    return TECH_ICONS[normalized];
  }

  // Try case-insensitive match
  const lowerTech = normalized.toLowerCase();
  const found = Object.keys(TECH_ICONS).find(
    (key) => key.toLowerCase() === lowerTech
  );

  return found ? TECH_ICONS[found] : null;
}

/**
 * Render a tech icon with consistent styling
 */
interface TechIconProps {
  tech: string;
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

export function TechIcon({
  tech,
  size = 20,
  className = "",
  showTooltip = true,
}: TechIconProps) {
  const config = getTechIcon(tech);

  if (!config) {
    // Fallback: render a badge if no icon found
    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 ${className}`}
        aria-label={tech}
      >
        {tech}
      </span>
    );
  }

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      title={showTooltip ? config.label : undefined}
      aria-label={config.label}
    >
      <Icon
        size={size}
        className={`${config.color} transition-transform hover:scale-110`}
      />
    </span>
  );
}
