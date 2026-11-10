import { NextResponse } from "next/server";

export async function GET() {
  // Realtime voice is OpenAI-only (OpenRouter has no realtime API).
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Voice chat needs OPENAI_API_KEY" }, { status: 503 });
  }
  const resp = await fetch(
    "https://api.openai.com/v1/realtime/client_secrets",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: "gpt-4o-realtime-preview",
        },
      }),
    }
  );

  const data = await resp.json();
  return NextResponse.json({ clientSecret: data.value });
}
