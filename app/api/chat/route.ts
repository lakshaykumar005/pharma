import { NextResponse } from "next/server";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { prisma } from "@/app/lib/db";
import { buildAssistantContext } from "@/app/lib/assistant";
import { checkOrigin, requireAuth } from "@/app/lib/api-guard";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const HISTORY_LIMIT = 40;

const textOf = (m: UIMessage): string =>
  (m.parts ?? []).filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join("").trim();

// GET /api/chat — this user's saved conversation (the bot's cross-session memory).
export async function GET() {
  const guard = await requireAuth();
  if ("res" in guard) return guard.res;
  const rows = await prisma.chatMessage.findMany({
    where: { userId: guard.user.uid },
    orderBy: { createdAt: "asc" },
    take: HISTORY_LIMIT,
  });
  const messages: UIMessage[] = rows.map((r) => ({
    id: String(r.id),
    role: r.role === "assistant" ? "assistant" : "user",
    parts: [{ type: "text", text: r.content }],
  }));
  return NextResponse.json({ messages });
}

// POST /api/chat — stream a grounded reply and persist the turn.
export async function POST(req: Request) {
  const origin = checkOrigin(req);
  if (origin) return origin;
  const guard = await requireAuth();
  if ("res" in guard) return guard.res;

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { error: "Assistant not configured — set GOOGLE_GENERATIVE_AI_API_KEY." },
      { status: 503 },
    );
  }

  let body: { messages?: UIMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const last = messages[messages.length - 1];
  const userText = last && last.role === "user" ? textOf(last) : "";

  // persist the user's message (memory)
  if (userText) {
    await prisma.chatMessage.create({ data: { userId: guard.user.uid, role: "user", content: userText } });
  }

  const system = await buildAssistantContext(guard.user);
  // bound the window we send to the model
  const modelMessages = await convertToModelMessages(messages.slice(-20));

  const result = streamText({
    model: google(MODEL),
    system,
    messages: modelMessages,
    onFinish: async ({ text }) => {
      const clean = (text ?? "").trim();
      if (clean) {
        await prisma.chatMessage
          .create({ data: { userId: guard.user.uid, role: "assistant", content: clean } })
          .catch(() => {});
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
