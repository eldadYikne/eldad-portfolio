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
};

/**
 * Public, non-fork repos for GitHub City. Cached for an hour so the city
 * stays within GitHub's anonymous rate limit (set GITHUB_TOKEN to raise it).
 */
export async function GET() {
  try {
    const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner&sort=pushed`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      next: { revalidate: 3600 },
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
      fork: boolean;
      private: boolean;
    }[];
    const repos: Repo[] = raw
      .filter((r) => !r.fork && !r.private)
      .map((r) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        size: r.size,
        stars: r.stargazers_count,
        forks: r.forks_count,
        pushedAt: r.pushed_at,
        url: r.html_url,
      }));
    return NextResponse.json({ repos }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ repos: [] }, { status: 502 });
  }
}
