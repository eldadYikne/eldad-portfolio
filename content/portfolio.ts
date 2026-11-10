// Single source of truth for the immersive home page.
// Rendered both as semantic HTML (SEO / screen readers / no-WebGL fallback)
// and as 3D objects in the physics scene.

export const profile = {
  name: "Eldad Yikne",
  title: "Tech Lead & Full-Stack Developer",
  tagline:
    "Tech Lead with 4+ years building production web apps in Angular, React and Next.js, now leading the frontend architecture of AI-powered products.",
  bio: [
    "Tech Lead at BrightBuild: frontend architecture, coding standards and reusable component libraries across Angular and React.",
    "I build AI-driven interfaces (chat experiences, agents, automation workflows) with Claude AI, the OpenAI API and the Model Context Protocol (MCP), and use Claude Code every day.",
    "Graduate of a 640-hour Full-Stack bootcamp, with an academic background in education, which shapes how I mentor developers and design for real people.",
  ],
  email: "eldadykn@gmail.com",
  cv: "/Eldad-Yikne-CV.pdf",
  links: {
    github: "https://github.com/eldadYikne",
    linkedin: "https://linkedin.com/in/eldad-yikne",
  },
};

export type Experience = {
  id: string;
  company: string;
  role: string;
  period: string;
  summary: string;
  highlights: string[];
  stack: string[];
  color: string;
};

export const experience: Experience[] = [
  {
    id: "brightbuild",
    company: "BrightBuild",
    role: "Tech Lead",
    period: "Feb 2026 — Present",
    summary: "Leading frontend development of AI-powered solutions for clients.",
    highlights: [
      "Define frontend architecture, coding standards and reusable component libraries across Angular and React",
      "Build AI-driven interfaces (chat, agents, automation workflows) with Claude AI, the OpenAI API and MCP",
      "Mentor developers, lead code reviews and technical planning",
      "Work with product, design and clients to turn requirements into scalable solutions",
    ],
    stack: ["Angular", "React", "Next.js", "TypeScript", "Claude AI", "OpenAI", "MCP"],
    color: "#22d3ee",
  },
  {
    id: "codere",
    company: "Codere Online",
    role: "Full-Stack Developer",
    period: "Dec 2024 — Jan 2026",
    summary: "High-traffic web applications for a high-scale online gaming platform.",
    highlights: [
      "Built performant, responsive UIs with Angular, React, Next.js and TypeScript",
      "Integrated LLM APIs for personalised content, internal automations and natural-language features",
      "Integrated RESTful and third-party APIs; contributed to Node.js, PHP, SQL and MongoDB services",
    ],
    stack: ["Angular", "React", "Next.js", "TypeScript", "Node.js", "PHP", "SQL", "MongoDB"],
    color: "#a855f7",
  },
  {
    id: "gocode",
    company: "Go-Code",
    role: "Full-Stack Developer",
    period: "Jul 2022 — Nov 2024",
    summary: "Client applications across the full stack.",
    highlights: [
      "Built apps with Angular, React, TypeScript and TailwindCSS on Node.js and MongoDB backends",
      "Built reusable UI components and optimised performance across devices",
      "Designed RESTful and third-party API integrations; owned Git workflows, code reviews and CI/CD",
    ],
    stack: ["Angular", "React", "TypeScript", "TailwindCSS", "Node.js", "MongoDB"],
    color: "#f472b6",
  },
];

export type Project = {
  id: "giborim" | "logiki" | "motion";
  name: string;
  kicker: string;
  summary: string;
  highlights: string[];
  stack: string[];
  /** What the 3D machine does when activated */
  machine: string;
  url?: string;
};

export const projects: Project[] = [
  {
    id: "giborim",
    name: "Bishvil Giborim",
    kicker: "Training & motivation app",
    summary:
      "A hero's-journey training app for trainees and youth: weekly missions, running and strength challenges, points, ranks and team competitions.",
    highlights: [
      "Gamified progression engine: missions, ranks, team leaderboards",
      "Mobile app + landing site with full accessibility compliance",
      "Realtime sync backend",
    ],
    stack: ["React Native", "TypeScript", "Node.js", "Firebase"],
    machine: "Pull the lever to switch the world into Heroes Mode.",
  },
  {
    id: "logiki",
    name: "Logiki",
    kicker: "Smart equipment management",
    summary:
      "\"My Unit\": a smart inventory and equipment management platform that tracks every item, assignment and audit trail.",
    highlights: [
      "Role-based workflows for sign-out, returns and audits",
      "QR-driven item tracking",
      "Realtime dashboards",
    ],
    stack: ["React", "TypeScript", "Vite", "Firebase", "Firestore"],
    machine: "Hit the button to flip gravity. Every object enters Zero-G.",
  },
  {
    id: "motion",
    name: "Motion-Tracking Games",
    kicker: "OpenCV · MediaPipe",
    summary:
      "Interactive wall-projection games: a camera watches the wall, computer vision detects ball impacts and body motion, and the game reacts in real time.",
    highlights: [
      "OpenCV impact detection streamed over WebSockets",
      "Projector ↔ camera homography calibration",
      "MediaPipe body tracking for hands-free play",
    ],
    stack: ["Python", "OpenCV", "MediaPipe", "WebSockets", "Canvas"],
    machine: "Turn on your camera and push the objects with your hands.",
  },
];

export type SkillCategory = "ai" | "frontend" | "backend" | "data" | "cloud";

export const skills: { name: string; category: SkillCategory }[] = [
  { name: "Claude AI", category: "ai" },
  { name: "OpenAI", category: "ai" },
  { name: "LLM / MCP", category: "ai" },
  { name: "Prompt Eng.", category: "ai" },
  { name: "OpenCV", category: "ai" },
  { name: "MediaPipe", category: "ai" },
  { name: "LangChain", category: "ai" },
  { name: "React", category: "frontend" },
  { name: "Next.js", category: "frontend" },
  { name: "Angular", category: "frontend" },
  { name: "Vue", category: "frontend" },
  { name: "TypeScript", category: "frontend" },
  { name: "RxJS", category: "frontend" },
  { name: "Three.js", category: "frontend" },
  { name: "Tailwind", category: "frontend" },
  { name: "SASS", category: "frontend" },
  { name: "Node.js", category: "backend" },
  { name: "Nest.js", category: "backend" },
  { name: "Express", category: "backend" },
  { name: "Python", category: "backend" },
  { name: "PHP", category: "backend" },
  { name: "REST APIs", category: "backend" },
  { name: "WebSockets", category: "backend" },
  { name: "MySQL", category: "data" },
  { name: "MongoDB", category: "data" },
  { name: "Firebase", category: "data" },
  { name: "Firestore", category: "data" },
  { name: "AWS", category: "cloud" },
  { name: "Vercel", category: "cloud" },
  { name: "Docker", category: "cloud" },
  { name: "CI/CD", category: "cloud" },
  { name: "Git", category: "cloud" },
];

export const skillColors: Record<SkillCategory, string> = {
  ai: "#22d3ee",
  frontend: "#a855f7",
  backend: "#f472b6",
  data: "#34d399",
  cloud: "#fbbf24",
};

export const education = [
  {
    id: "bootcamp",
    title: "Full-Stack Development Bootcamp",
    school: "Coding Academy",
    year: "2022",
    detail: "640 hours of intensive full-stack engineering.",
  },
  {
    id: "ma",
    title: "M.A. Educational Guidance",
    school: "",
    year: "2020",
    detail: "Leadership, guidance and human-centred thinking.",
  },
  {
    id: "bed",
    title: "B.Ed Special Education",
    school: "",
    year: "2017",
    detail: "Designing for every kind of learner.",
  },
];
