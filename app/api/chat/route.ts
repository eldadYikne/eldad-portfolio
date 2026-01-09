import {
  convertToModelMessages,
  generateText,
  UIMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = await generateText({
    model: openai("gpt-4o-mini"),
    system: "You are a helpful assistant.",
    messages: await convertToModelMessages(messages),
  });

  return new Response(JSON.stringify({ text: result.text }), {
    headers: { "Content-Type": "application/json" },
  });
}
