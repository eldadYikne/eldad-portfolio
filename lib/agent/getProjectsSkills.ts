import { tool } from "@openai/agents/realtime";
import z from "zod";

export const getSkillsTool = tool({
  name: "get_skills",
  description:
    "Fetches skills from Firestore (optionally featured only), ordered by 'order' ascending.",
  parameters: z.object({
    featuredOnly: z.boolean().optional().describe(""),
  }),
  async execute({ featuredOnly }) {
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featuredOnly: Boolean(featuredOnly) }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error ?? `Request failed: ${res.status}`);
    }

    const { skills } = await res.json();

    // אפשר להחזיר JSON (הכי טוב לסוכן), או להפוך לטקסט.
    return skills;
  },
});
