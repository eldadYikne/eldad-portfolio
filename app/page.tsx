import { GameHome } from "@/components/game/GameHome";
import { education, experience, profile, projects, skills } from "@/content/portfolio";

export default function HomePage() {
  return (
    <GameHome>
      <PortfolioContent />
    </GameHome>
  );
}

/** Semantic, server-rendered portfolio: SEO, screen readers and the no-WebGL fallback. */
function PortfolioContent() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-200">
      <header className="mb-12">
        <h1 className="text-5xl font-bold text-white">{profile.name}</h1>
        <p className="mt-2 text-2xl text-cyan-400">{profile.title}</p>
        <p className="mt-4">{profile.tagline}</p>
        {profile.bio.map((p) => (
          <p key={p} className="mt-3 text-slate-400">{p}</p>
        ))}
      </header>

      <section className="mb-12" aria-labelledby="exp-h">
        <h2 id="exp-h" className="mb-4 text-3xl font-bold text-white">Experience</h2>
        {experience.map((e) => (
          <article key={e.id} className="mb-6">
            <h3 className="text-xl font-semibold text-white">{e.company}: {e.role}</h3>
            <p className="text-sm text-slate-400">{e.period}</p>
            <p className="mt-1">{e.summary}</p>
            <ul className="ml-5 mt-1 list-disc text-slate-400">
              {e.highlights.map((h) => <li key={h}>{h}</li>)}
            </ul>
            <p className="mt-1 text-sm text-cyan-300">{e.stack.join(" · ")}</p>
          </article>
        ))}
      </section>

      <section className="mb-12" aria-labelledby="proj-h">
        <h2 id="proj-h" className="mb-4 text-3xl font-bold text-white">Projects</h2>
        {projects.map((p) => (
          <article key={p.id} className="mb-6">
            <h3 className="text-xl font-semibold text-white">{p.name}</h3>
            <p className="text-sm text-slate-400">{p.kicker}</p>
            <p className="mt-1">{p.summary}</p>
            <p className="mt-1 text-sm text-purple-300">{p.stack.join(" · ")}</p>
          </article>
        ))}
      </section>

      <section className="mb-12" aria-labelledby="skills-h">
        <h2 id="skills-h" className="mb-4 text-3xl font-bold text-white">Skills</h2>
        <p>{skills.map((s) => s.name).join(" · ")}</p>
      </section>

      <section aria-labelledby="edu-h">
        <h2 id="edu-h" className="mb-4 text-3xl font-bold text-white">Education</h2>
        <ul>
          {education.map((e) => (
            <li key={e.id}>{e.title}{e.school && `, ${e.school}`} ({e.year})</li>
          ))}
        </ul>
      </section>

      <footer className="mt-12 flex gap-4 text-cyan-400">
        <a href={profile.links.github}>GitHub</a>
        <a href={profile.links.linkedin}>LinkedIn</a>
        <a href={`mailto:${profile.email}`}>Email</a>
        <a href="/projects">All projects</a>
      </footer>
    </main>
  );
}
