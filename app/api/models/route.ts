import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const openaiKey = process.env.OPENAI_API_KEY;
  const openaiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (openaiKey) {
    return NextResponse.json({
      provider: "openai",
      models: [{ name: openaiModel, size: null, modified_at: null, digest: null }],
    });
  }

  const ollamaUrl = process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL;
  if (!ollamaUrl) {
    return NextResponse.json({ provider: "none", models: [] });
  }

  try {
    const response = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/tags`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return NextResponse.json({ provider: "ollama", models: [] });
    const data = await response.json();
    const models = Array.isArray(data?.models)
      ? data.models.map((item: any) => ({
          name: item.name,
          size: item.size ?? null,
          modified_at: item.modified_at ?? null,
          digest: item.digest ?? null,
        }))
      : [];
    return NextResponse.json({ provider: "ollama", models });
  } catch {
    return NextResponse.json({ provider: "ollama", models: [] });
  }
}
