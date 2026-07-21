import { createFileRoute } from "@tanstack/react-router";
import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatRequestBody = { messages?: unknown; context?: unknown };

const BASE_PROMPT = `You are Aura, the Executive AI Chief of Staff for the U.S. Truck Driver Training School (USTDTS) in Sterling Heights, MI. You brief the owner (Tyler) like a razor-sharp COO.

WHO YOU ARE
- Confident, concise, proactive. You summarize KPIs, surface bottlenecks, and recommend the single highest-leverage next action.
- You speak in short spoken-friendly sentences because your replies are read aloud. Avoid markdown tables and emoji — write the way a person talks.
- The school only recruits Michigan residents. Weekly revenue goal is 80,000 dollars. Tuition is 6,500 dollars.

YOUR TOOLS
- get_executive_brief — pull the live snapshot (revenue vs goal, pipeline, temperature, students-needed, top actions).
- list_missing_paperwork — see which active students are missing required documents (CDL permit, medical card, DL, SSN, enrollment agreement).
- list_campaigns — see every active/paused marketing campaign, spend, and leads generated.
- pause_campaign / launch_campaign — mutate campaigns when Tyler asks.
- list_hot_leads — show hottest leads by AI score with contact info.

HOW YOU RESPOND
- Always call get_executive_brief first when Tyler asks "what's next", "how am I doing", "give me a briefing", or anything about status. Use the numbers precisely.
- When he mentions paperwork, missing docs, or a student by name → call list_missing_paperwork.
- When he mentions campaigns, ads, marketing, or wants to pause/launch → call the campaign tools and confirm what you did.
- Rhythm for a briefing: (1) where we stand vs goal in one line, (2) the biggest bottleneck, (3) 2-3 concrete next actions ranked by impact with real names and numbers.
- Never invent a number. If a tool did not give it to you, say you don't have it and offer to check.
- End with a crisp recommendation. Be encouraging but direct about what's slipping.`;

const REQUIRED_DOC_TYPES = [
  "cdl_permit",
  "medical_card",
  "drivers_license",
  "ssn_card",
  "enrollment_agreement",
] as const;

const CLOSE_PROBABILITY = { hot: 0.6, warm: 0.3, cold: 0.1 } as const;
const TUITION = 6500;
const WEEKLY_GOAL = 80000;

function temp(score: number | null | undefined): "hot" | "warm" | "cold" {
  const s = score ?? 0;
  if (s >= 75) return "hot";
  if (s >= 50) return "warm";
  return "cold";
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const tools = {
  get_executive_brief: tool({
    description:
      "Compute the live executive brief from the database: revenue vs weekly goal, hot/warm/cold pipeline, students needed to hit goal, top hottest leads, missing-paperwork count, and campaign spend. Call this whenever Tyler asks about status, next steps, or the day.",
    inputSchema: z.object({}),
    execute: async () => {
      const s = await admin();
      const [leadsRes, studentsRes, paymentsRes, docsRes, campaignsRes] = await Promise.all([
        s.from("leads").select("id,full_name,email,phone,program,status,score,source,created_at"),
        s.from("students").select("id,full_name,status,progress_pct,enrollment_date"),
        s.from("payments").select("amount,status"),
        s.from("documents").select("student_id,doc_type,status"),
        s.from("campaigns").select("name,channel,status,budget,spend,leads_generated"),
      ]);
      const leads = leadsRes.data ?? [];
      const students = studentsRes.data ?? [];
      const payments = paymentsRes.data ?? [];
      const docs = docsRes.data ?? [];
      const campaigns = campaignsRes.data ?? [];

      const collected = payments
        .filter((p) => p.status === "paid")
        .reduce((n, p) => n + Number(p.amount ?? 0), 0);
      const remaining = Math.max(WEEKLY_GOAL - collected, 0);
      const pctToGoal = Math.round((collected / WEEKLY_GOAL) * 100);
      const studentsNeeded = Math.ceil(remaining / TUITION);

      const closed = new Set(["enrolled", "won", "rejected", "lost"]);
      const pipeline = leads.filter((l) => !closed.has(l.status));
      const hot = pipeline.filter((l) => temp(l.score) === "hot").length;
      const warm = pipeline.filter((l) => temp(l.score) === "warm").length;
      const cold = pipeline.filter((l) => temp(l.score) === "cold").length;
      const projectedPipeline = pipeline.reduce(
        (n, l) => n + TUITION * CLOSE_PROBABILITY[temp(l.score)],
        0,
      );

      const hottest = [...leads]
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 5)
        .map((l) => ({ name: l.full_name, score: l.score ?? 0, phone: l.phone, program: l.program }));

      const active = students.filter((s) => ["active", "enrolled"].includes(s.status));
      let missingCount = 0;
      for (const st of active) {
        const have = new Set(
          docs
            .filter((d) => d.student_id === st.id && ["received", "approved", "complete"].includes(d.status))
            .map((d) => d.doc_type),
        );
        for (const req of REQUIRED_DOC_TYPES) if (!have.has(req)) missingCount++;
      }

      const activeCampaigns = campaigns.filter((c) => c.status === "active");
      const totalSpend = campaigns.reduce((n, c) => n + Number(c.spend ?? 0), 0);
      const totalLeadsFromCampaigns = campaigns.reduce((n, c) => n + (c.leads_generated ?? 0), 0);

      return {
        revenue: { collected, remaining, weekly_goal: WEEKLY_GOAL, pct_to_goal: pctToGoal, students_needed_to_hit_goal: studentsNeeded },
        pipeline: {
          total: pipeline.length,
          hot,
          warm,
          cold,
          projected_income_usd: Math.round(projectedPipeline),
        },
        hottest_leads: hottest,
        paperwork: {
          active_students: active.length,
          missing_document_count: missingCount,
        },
        campaigns: {
          active: activeCampaigns.length,
          paused: campaigns.length - activeCampaigns.length,
          total_spend_usd: totalSpend,
          leads_generated_all_time: totalLeadsFromCampaigns,
          list: campaigns.map((c) => ({
            name: c.name,
            channel: c.channel,
            status: c.status,
            spend: Number(c.spend),
            leads: c.leads_generated,
          })),
        },
      };
    },
  }),

  list_missing_paperwork: tool({
    description:
      "List every active student and which required documents are missing (CDL permit, medical card, driver's license, SSN card, enrollment agreement). Call when Tyler asks about paperwork, missing docs, or compliance.",
    inputSchema: z.object({}),
    execute: async () => {
      const s = await admin();
      const [studentsRes, docsRes] = await Promise.all([
        s.from("students").select("id,full_name,status,phone,email").in("status", ["active", "enrolled"]),
        s.from("documents").select("student_id,doc_type,status"),
      ]);
      const students = studentsRes.data ?? [];
      const docs = docsRes.data ?? [];
      const rows = students.map((st) => {
        const have = new Set(
          docs
            .filter((d) => d.student_id === st.id && ["received", "approved", "complete"].includes(d.status))
            .map((d) => d.doc_type),
        );
        const missing = REQUIRED_DOC_TYPES.filter((d) => !have.has(d));
        return { name: st.full_name, phone: st.phone, email: st.email, missing };
      });
      return {
        students_missing_paperwork: rows.filter((r) => r.missing.length > 0),
        fully_compliant: rows.filter((r) => r.missing.length === 0).length,
      };
    },
  }),

  list_campaigns: tool({
    description: "List every marketing campaign with channel, status, budget, spend, and leads generated.",
    inputSchema: z.object({}),
    execute: async () => {
      const s = await admin();
      const { data } = await s.from("campaigns").select("*").order("created_at", { ascending: false });
      return { campaigns: data ?? [] };
    },
  }),

  pause_campaign: tool({
    description: "Pause an active campaign by name (case-insensitive contains match). Use when Tyler says to stop, pause, or kill a campaign.",
    inputSchema: z.object({ name: z.string() }),
    execute: async ({ name }) => {
      const s = await admin();
      const { data: found } = await s.from("campaigns").select("id,name").ilike("name", `%${name}%`).limit(1);
      if (!found || found.length === 0) return { ok: false, error: `No campaign matched "${name}".` };
      const { error } = await s.from("campaigns").update({ status: "paused" }).eq("id", found[0].id);
      if (error) return { ok: false, error: error.message };
      return { ok: true, paused: found[0].name };
    },
  }),

  launch_campaign: tool({
    description: "Create a new marketing campaign. Use when Tyler asks to launch, spin up, or start a new campaign.",
    inputSchema: z.object({
      name: z.string(),
      channel: z.enum(["facebook", "google", "email", "sms", "tiktok", "instagram"]),
      budget: z.number(),
      audience_size: z.number().nullable(),
      notes: z.string().nullable(),
    }),
    execute: async ({ name, channel, budget, audience_size, notes }) => {
      const s = await admin();
      const { data, error } = await s
        .from("campaigns")
        .insert({
          name,
          channel,
          budget,
          audience_size: audience_size ?? 0,
          notes: notes ?? null,
          status: "active",
        })
        .select()
        .single();
      if (error) return { ok: false, error: error.message };
      return { ok: true, launched: data };
    },
  }),

  list_hot_leads: tool({
    description: "Return the top hottest leads with score, phone, program, and status so Tyler can call them right now.",
    inputSchema: z.object({ limit: z.number().nullable() }),
    execute: async ({ limit }) => {
      const s = await admin();
      const { data } = await s
        .from("leads")
        .select("full_name,phone,email,program,status,score,city")
        .order("score", { ascending: false })
        .limit(limit ?? 8);
      return { leads: data ?? [] };
    },
  }),
};

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
        const model = gateway("google/gemini-3.5-flash");

        const system =
          typeof context === "string" && context.trim()
            ? `${BASE_PROMPT}\n\nLIVE DASHBOARD SNAPSHOT (may be stale — prefer calling tools):\n${context.slice(0, 3000)}`
            : BASE_PROMPT;

        const result = streamText({
          model,
          system,
          tools,
          stopWhen: stepCountIs(50),
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
