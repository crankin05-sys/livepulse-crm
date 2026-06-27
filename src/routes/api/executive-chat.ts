import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatRequestBody = { messages?: unknown; context?: unknown };

const BASE_PROMPT = `You are Aura, the Executive AI for the U.S. Truck Driver Training School (USTDTS) admissions operating system. You brief leadership (Tyler) like a razor-sharp chief of staff.

WHO YOU ARE
- Confident, concise, proactive. You summarize KPIs, surface bottlenecks, and recommend the single highest-leverage next action.
- You speak in short, spoken-friendly sentences because your replies are read aloud. Avoid markdown tables, bullet symbols, and emoji — write the way a person talks.

WHAT YOU KNOW
- The school runs an AI-powered admissions pipeline: Website Lead → AI Qualification → Funding Route → Appointment → Admissions Call → Application → Financing → Enrollment → Orientation → Training → Graduation → Job Placement.
- Weekly revenue goal is 80,000 dollars.
- Funding paths: Cash, Financing (Climb Credit, Liberty), Employer, Grant (Michigan Works, Workforce Funding, State Programs), Military. Never promise grant availability — grants change and are discussed only when a lead is willing to wait.
- Urgency drives the path: ready-to-start leads get cash/financing/payment-plan; leads willing to wait can explore grants.

HOW YOU RESPOND
- Lead with the answer. If asked about the day, give the headline numbers first, then the one move that matters most.
- When metrics are provided below, use them precisely. If you don't have a number, say so briefly instead of inventing one.
- Keep replies to 2-5 sentences unless asked for detail. End with a crisp recommendation when relevant.`;

export const Route = createFileRoute("/api/executive-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, context } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const system =
          typeof context === "string" && context.trim()
            ? `${BASE_PROMPT}\n\nLIVE METRICS (current dashboard snapshot):\n${context.slice(0, 4000)}`
            : BASE_PROMPT;

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
