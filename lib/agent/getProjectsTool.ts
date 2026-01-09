import { tool } from "@openai/agents/realtime";
import z from "zod";

export const getProjectsTool = tool({
  name: "get_projects",
  description:
    "Fetches projects from Firestore (optionally featured only), ordered by 'order' ascending.",
  parameters: z.object({
    featuredOnly: z
      .boolean()
      .optional()
      .describe("If true, return only featured projects"),
  }),
  async execute({ featuredOnly }) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featuredOnly: Boolean(featuredOnly) }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error ?? `Request failed: ${res.status}`);
    }

    const { projects } = await res.json();

    // אפשר להחזיר JSON (הכי טוב לסוכן), או להפוך לטקסט.
    return projects;
  },
});
