import { NextResponse } from "next/server";

const USER = "eldadYikne";

export type Repo = {
  name: string;
  description: string | null;
  language: string | null;
  size: number;
  stars: number;
  forks: number;
  pushedAt: string;
  url: string;
  /** frameworks / libraries detected from package.json & composer.json */
  stack: string[];
};

/** Dependency → display name. Order = priority on the card (frameworks first). */
const TECH: [string, string][] = [
  ["next", "Next.js"], ["nuxt", "Nuxt"], ["react-native", "React Native"], ["expo", "Expo"], ["react", "React"],
  ["@angular/core", "Angular"], ["vue", "Vue"], ["svelte", "Svelte"], ["electron", "Electron"],
  ["laravel/framework", "Laravel"], ["@nestjs/core", "NestJS"], ["express", "Express"], ["fastify", "Fastify"], ["koa", "Koa"],
  ["typescript", "TypeScript"], ["mongoose", "MongoDB"], ["mongodb", "MongoDB"], ["mysql2", "MySQL"], ["mysql", "MySQL"],
  ["pg", "PostgreSQL"], ["@prisma/client", "Prisma"], ["sequelize", "Sequelize"], ["firebase", "Firebase"], ["firebase-admin", "Firebase"],
  ["socket.io", "Socket.io"], ["socket.io-client", "Socket.io"], ["@reduxjs/toolkit", "Redux"], ["redux", "Redux"], ["vuex", "Vuex"], ["pinia", "Pinia"],
  ["react-router-dom", "React Router"], ["tailwindcss", "Tailwind"], ["sass", "SASS"], ["node-sass", "SASS"], ["@mui/material", "MUI"], ["bootstrap", "Bootstrap"],
  ["three", "Three.js"], ["@react-three/fiber", "R3F"], ["gsap", "GSAP"], ["framer-motion", "Framer Motion"], ["chart.js", "Chart.js"], ["d3", "D3"],
  ["openai", "OpenAI"], ["langchain", "LangChain"], ["stripe", "Stripe"], ["jsonwebtoken", "JWT"], ["axios", "Axios"],
  ["vite", "Vite"], ["webpack", "Webpack"], ["jest", "Jest"], ["vitest", "Vitest"], ["cypress", "Cypress"],
];

const FALLBACK_MANIFESTS = ["package.json", "client/package.json", "frontend/package.json", "server/package.json", "backend/package.json", "composer.json"];
const TIMEOUT = 6000;

const authHeaders = (): Record<string, string> => ({
  Accept: "application/vnd.github+json",
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
});

/** Find every package.json / composer.json in the repo (up to 3 folders deep). */
async function findManifests(name: string, branch: string): Promise<string[]> {
  try {
    const r = await fetch(`https://api.github.com/repos/${USER}/${name}/git/trees/${branch}?recursive=1`, {
      headers: authHeaders(),
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!r.ok) throw new Error(String(r.status));
    const { tree } = (await r.json()) as { tree: { path: string; type: string }[] };
    const found = tree
      .filter((t) => t.type === "blob" && /(^|\/)(package|composer)\.json$/.test(t.path) && !t.path.includes("node_modules") && t.path.split("/").length <= 4)
      .map((t) => t.path)
      .slice(0, 6);
    return found.length ? found : FALLBACK_MANIFESTS;
  } catch {
    // Rate-limited or empty repo: probe the usual locations instead.
    return FALLBACK_MANIFESTS;
  }
}

/** Read the repo's manifests from raw.githubusercontent.com (not API-rate-limited). */
async function detectStack(name: string, branch: string, language: string | null): Promise<string[]> {
  const deps = new Set<string>();
  const files = await findManifests(name, branch);
  await Promise.all(
    files.map(async (file) => {
      try {
        const r = await fetch(`https://raw.githubusercontent.com/${USER}/${name}/${branch}/${file}`, {
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(TIMEOUT),
        });
        if (!r.ok) return;
        const j = await r.json();
        for (const key of ["dependencies", "devDependencies", "require", "require-dev"])
          Object.keys(j?.[key] ?? {}).forEach((d) => deps.add(d));
        if (file.endsWith("composer.json")) deps.add("php");
      } catch {
        /* missing, slow or invalid manifest */
      }
    })
  );
  const stack: string[] = [];
  for (const [dep, label] of TECH) if (deps.has(dep) && !stack.includes(label)) stack.push(label);
  if (deps.has("php") && !stack.includes("PHP")) stack.push("PHP");
  // Fall back to the primary language when there's no manifest (plain HTML/CSS/C++ repos).
  if (language && !stack.includes(language) && !(language === "JavaScript" && stack.length > 0)) stack.push(language);
  return stack.slice(0, 9);
}

/**
 * Public, non-fork repos for GitHub City. Cached for an hour so the city
 * stays within GitHub's anonymous rate limit (set GITHUB_TOKEN to raise it).
 */
export async function GET() {
  try {
    const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner&sort=pushed`, {
      headers: authHeaders(),
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!res.ok) throw new Error(String(res.status));
    const raw = (await res.json()) as {
      name: string;
      description: string | null;
      language: string | null;
      size: number;
      stargazers_count: number;
      forks_count: number;
      pushed_at: string;
      html_url: string;
      default_branch: string;
      fork: boolean;
      private: boolean;
    }[];
    const repos: Repo[] = await Promise.all(
      raw
        .filter((r) => !r.fork && !r.private)
        .map(async (r) => ({
          name: r.name,
          description: r.description,
          language: r.language,
          size: r.size,
          stars: r.stargazers_count,
          forks: r.forks_count,
          pushedAt: r.pushed_at,
          url: r.html_url,
          stack: await detectStack(r.name, r.default_branch, r.language),
        }))
    );
    return NextResponse.json({ repos }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ repos: [] }, { status: 502 });
  }
}
