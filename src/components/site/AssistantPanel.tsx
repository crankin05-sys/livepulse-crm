import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, CheckCircle2, Loader2, UserPlus, CalendarClock } from "lucide-react";
import stephanieAvatar from "../../assets/stephanie.jpg";
import { Button } from "../ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "../ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "../ai-elements/message";

const SUGGESTIONS = [
  "Which CDL is right for me?",
  "How much does training cost?",
  "Can I get funding or GI Bill?",
  "Book a call with an advisor",
];

function ToolCard({ part }: { part: { type: string; state?: string; output?: unknown } }) {
  const isLead = part.type === "tool-save_lead";
  const Icon = isLead ? UserPlus : CalendarClock;
  const label = isLead ? "Saving your details" : "Booking with an advisor";
  const done = part.state === "output-available";
  const out = part.output as { success?: boolean; message?: string } | undefined;
  return (
    <div className="my-1 flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-xs">
      {done ? (
        <CheckCircle2 className="h-4 w-4 text-success" />
      ) : (
        <Loader2 className="h-4 w-4 animate-spin text-accent-foreground" />
      )}
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium text-foreground">
        {done ? out?.message ?? "Done" : `${label}…`}
      </span>
    </div>
  );
}

export function AssistantPanel({ compact = false }: { compact?: boolean }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const busy = status === "submitted" || status === "streaming";

  function submit(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    sendMessage({ text: value });
    setInput("");
  }

  return (
    <div className="flex h-full flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="space-y-1">
          {messages.length === 0 && (
            <div className="px-1 py-3">
              <div className="flex items-start gap-3">
                <img
                  src={stephanieAvatar}
                  alt="Stephanie, admissions advisor"
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-accent/40"
                  width={40}
                  height={40}
                />
                <div className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-3 text-sm text-foreground">
                  Hi, I'm Stephanie 👋 your admissions advisor. I can recommend the right CDL
                  program, answer questions about cost &amp; funding, or book you a call. What
                  brings you in today?
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent/50 hover:bg-accent/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <Message from={m.role} key={m.id}>
              <MessageContent>
                {m.parts.map((part, i) => {
                  if (part.type === "text") {
                    return <MessageResponse key={i}>{part.text}</MessageResponse>;
                  }
                  if (part.type.startsWith("tool-")) {
                    return <ToolCard key={i} part={part as never} />;
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}

          {status === "submitted" && (
            <div className="flex items-center gap-2 px-1 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Stephanie is typing…
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex items-end gap-2 border-t border-border bg-background p-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(input);
            }
          }}
          rows={compact ? 1 : 2}
          placeholder="Ask Stephanie anything…"
          className="max-h-32 min-h-[40px] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
        />
        <Button type="submit" size="icon" variant="accent" disabled={busy || !input.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
