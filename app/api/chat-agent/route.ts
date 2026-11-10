import { ChatOpenAI } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import {
  getProjects,
  getSkills,
  getWorkExperiences,
} from "@/lib/firebase-services";
import type { Project, Skill, WorkExperience } from "@/types";
import path from "path";
import fs from "fs";

// The whole knowledge base (CV PDFs + Firestore) is a few thousand characters,
// so it's sent in full with every question instead of embedding + retrieval.
// Cached to avoid re-reading PDFs and Firestore on every request.
let knowledgeCache: Document[] | null = null;
let lastLoadTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Chat model. Uses OpenRouter when OPENROUTER_API_KEY is set (any model via
 * OPENROUTER_MODEL, e.g. "anthropic/claude-sonnet-4.5"), otherwise OpenAI.
 */
function chatModel(streaming: boolean) {
  if (process.env.OPENROUTER_API_KEY) {
    return new ChatOpenAI({
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      apiKey: process.env.OPENROUTER_API_KEY,
      temperature: 0.7,
      streaming,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: { "HTTP-Referer": "https://www.eldadyikne.com", "X-Title": "Eldad Yikne Portfolio" },
      },
    });
  }
  return new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.7, streaming });
}

// Format Firestore data as documents
function formatProjectsAsText(projects: Project[]): string {
  return projects
    .map(
      (p) =>
        `פרויקט: ${p.title}
תיאור: ${p.description}
${p.longDescription ? `תיאור מורחב: ${p.longDescription}` : ""}
טכנולוגיות: ${p.techStack.join(", ")}
קטגוריה: ${p.category}
${p.liveUrl ? `קישור לאתר: ${p.liveUrl}` : ""}
${p.githubUrl ? `קישור לגיטהאב: ${p.githubUrl}` : ""}`
    )
    .join("\n\n---\n\n");
}

function formatSkillsAsText(skills: Skill[]): string {
  const grouped = skills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<string, Skill[]>
  );

  return Object.entries(grouped)
    .map(
      ([category, categorySkills]) =>
        `קטגוריה: ${category}\nכישורים: ${categorySkills.map((s) => `${s.name} (רמה: ${s.proficiency}%)`).join(", ")}`
    )
    .join("\n\n");
}

function formatWorkExperienceAsText(experiences: WorkExperience[]): string {
  return experiences
    .map(
      (exp) =>
        `חברה: ${exp.company}
תפקיד: ${exp.role}
תקופה: ${exp.startDate} - ${exp.endDate || "היום"}
תיאור: ${exp.description}
${exp.achievements?.length ? `הישגים: ${exp.achievements.join(", ")}` : ""}
טכנולוגיות: ${exp.technologies.join(", ")}`
    )
    .join("\n\n---\n\n");
}

async function loadPDFs(): Promise<Document[]> {
  const dataDir = path.join(process.cwd(), "data");
  const pdfFiles = fs
    .readdirSync(dataDir)
    .filter((file) => file.endsWith(".pdf"));

  const allDocs: Document[] = [];

  for (const pdfFile of pdfFiles) {
    const pdfPath = path.join(dataDir, pdfFile);
    const loader = new PDFLoader(pdfPath);
    const docs = await loader.load();

    // Add source metadata
    docs.forEach((doc) => {
      doc.metadata.source = pdfFile;
    });

    allDocs.push(...docs);
  }

  return allDocs;
}

async function loadFirestoreData(): Promise<Document[]> {
  const docs: Document[] = [];

  try {
    // Load projects
    const projects = await getProjects();
    if (projects.length > 0) {
      docs.push(
        new Document({
          pageContent: formatProjectsAsText(projects),
          metadata: { source: "firestore:projects" },
        })
      );
    }

    // Load skills
    const skills = await getSkills();
    if (skills.length > 0) {
      docs.push(
        new Document({
          pageContent: formatSkillsAsText(skills),
          metadata: { source: "firestore:skills" },
        })
      );
    }

    // Load work experience
    const workExperiences = await getWorkExperiences();
    if (workExperiences.length > 0) {
      docs.push(
        new Document({
          pageContent: formatWorkExperienceAsText(workExperiences),
          metadata: { source: "firestore:workExperience" },
        })
      );
    }
  } catch (error) {
    console.error("Error loading Firestore data:", error);
  }

  return docs;
}

async function getKnowledge(): Promise<Document[]> {
  const now = Date.now();
  if (knowledgeCache && now - lastLoadTime < CACHE_DURATION) return knowledgeCache;

  // Load PDFs and Firestore data in parallel
  const [pdfDocs, firestoreDocs] = await Promise.all([loadPDFs(), loadFirestoreData()]);
  knowledgeCache = [...pdfDocs, ...firestoreDocs];
  lastLoadTime = now;
  return knowledgeCache;
}

function formatDocs(docs: Document[]): string {
  return docs.map((doc) => doc.pageContent).join("\n\n");
}

export async function POST(req: Request) {
  try {
    const {
      prompt: input,
      stream: useStream = true,
      persona,
      history = [],
    } = await req.json();
    const isNpc = persona === "npc";

    if (!input || typeof input !== "string") {
      return Response.json({ error: "Invalid prompt" }, { status: 400 });
    }

    const model = chatModel(useStream);

    const knowledge = await getKnowledge();
    const context = formatDocs(knowledge);
    const sources = [...new Set(knowledge.map((doc) => doc.metadata.source))];

    // The in-game "digital twin" speaks as Eldad, briefly, in the visitor's language.
    const npcPrompt = `You are the AI digital twin of Eldad Yikne, standing on his portfolio island game.
Speak in FIRST PERSON as Eldad ("I built...", "At Codere I...").
Always answer in the same language the visitor wrote in (Hebrew → Hebrew, English → English).
Keep answers short and lively: 2-4 sentences, no markdown, no bullet lists.
Use only the facts below. If something isn't covered, say you'd love to talk about it in person and suggest the pier (contact).

Facts about me:
{context}`;

    // Create the prompt template
    const systemPrompt = isNpc ? npcPrompt : `אתה עוזר אישי חכם של אלדד יקנה (Eldad Yikne).
אתה עונה על שאלות בעברית בלבד.
יש לך גישה למידע מקבצי PDF, פרויקטים, כישורים וניסיון תעסוקתי של אלדד.

השתמש במידע הבא כדי לענות על השאלות:

{context}

הנחיות:
- אם המידע לא נמצא בקורות הנתונים, אמור "אין לי מידע על כך בנתונים שלי"
- ענה בצורה מקצועית וידידותית
- הדגש את היכולות והניסיון של אלדד
- הדגש כי אתה הסוכן האישי של אלדד ואתה שמח לעזור לתת מידע על אלדד
- אם שואלים על פרויקטים - תן פרטים על הפרויקטים כולל טכנולוגיות וקישורים
- אם שואלים על כישורים - ציין את רמת המיומנות
- אם שואלים על ניסיון - תן פרטים על החברות, התפקידים וההישגים`;

    // A few previous turns keep follow-up questions ("and what stack?") coherent.
    const past = (Array.isArray(history) ? history : [])
      .slice(-6)
      .filter((m: { role?: string; content?: string }) => typeof m?.content === "string")
      .map((m: { role: string; content: string }) =>
        [m.role === "assistant" ? "ai" : "human", m.content.replace(/[{}]/g, "")] as ["ai" | "human", string]
      );
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ...past,
      ["human", "{input}"],
    ]);

    // Create the chain
    const chain = RunnableSequence.from([
      prompt,
      model,
      new StringOutputParser(),
    ]);

    if (useStream) {
      // Streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send sources first
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`)
            );

            // Stream the answer
            const streamResponse = await chain.stream({
              context,
              input,
            });

            for await (const chunk of streamResponse) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`)
              );
            }

            // Send done signal
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
            );
            controller.close();
          } catch (error) {
            console.error("Stream error:", error);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "error", error: "Stream failed" })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      // Non-streaming response (fallback)
      const answer = await chain.invoke({
        context,
        input,
      });

      return Response.json({
        answer,
        sources,
      });
    }
  } catch (error) {
    console.error("Chat agent error:", error);
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
