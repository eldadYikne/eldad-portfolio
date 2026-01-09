import { tool } from "@openai/agents/realtime";
import z from "zod";

export const getPdf = tool({
  name: "get_pdf",
  description:
    "Searches the internal knowledge base (PDFs) for specific answers .",
  parameters: z.object({
    query: z
      .string()
      .describe(
        "The specific search term or question to look up in the document"
      ),
  }),
  async execute({ query }) {
    const res = await fetch("/api/search-pdf", {
      method: "POST",
      body: JSON.stringify({ query }),
      headers: { "Content-Type": "application/json" },
    });

    const { content } = await res.json();
    console.log('text.join("\n---\n")', content[0].text);
    return content[0].text;
  },
});
