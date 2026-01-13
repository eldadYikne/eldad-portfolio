import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
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

// Cache for vector store to avoid reloading PDFs on every request
let vectorStoreCache: MemoryVectorStore | null = null;
let lastLoadTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

async function getVectorStore(): Promise<MemoryVectorStore> {
  const now = Date.now();

  // Return cached vector store if still valid
  if (vectorStoreCache && now - lastLoadTime < CACHE_DURATION) {
    return vectorStoreCache;
  }

  // Load PDFs and Firestore data in parallel
  const [pdfDocs, firestoreDocs] = await Promise.all([
    loadPDFs(),
    loadFirestoreData(),
  ]);

  const allDocs = [...pdfDocs, ...firestoreDocs];

  // Split documents into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const splitDocs = await textSplitter.splitDocuments(allDocs);

  // Create embeddings and vector store
  const embeddings = new OpenAIEmbeddings();
  vectorStoreCache = await MemoryVectorStore.fromDocuments(
    splitDocs,
    embeddings
  );
  lastLoadTime = now;

  return vectorStoreCache;
}

function formatDocs(docs: Document[]): string {
  return docs.map((doc) => doc.pageContent).join("\n\n");
}

export async function POST(req: Request) {
  try {
    const { prompt: input, stream: useStream = true } = await req.json();

    if (!input || typeof input !== "string") {
      return Response.json({ error: "Invalid prompt" }, { status: 400 });
    }

    // Initialize the model with streaming enabled
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      streaming: useStream,
    });

    // Get or create vector store
    const vectorStore = await getVectorStore();
    const retriever = vectorStore.asRetriever({
      k: 6,
    });

    // Get relevant documents
    const relevantDocs = await retriever.invoke(input);
    const context = formatDocs(relevantDocs);
    const sources = [...new Set(relevantDocs.map((doc) => doc.metadata.source))];

    // Create the prompt template
    const systemPrompt = `אתה עוזר אישי חכם של אלדד יקנה (Eldad Yikne).
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

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
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
