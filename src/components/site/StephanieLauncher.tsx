import { useState } from "react";
import { MessageSquare, X, Sparkle } from "lucide-react";
import stephanieAvatar from "../../assets/stephanie.jpg";
import { AssistantPanel } from "./AssistantPanel";

export function StephanieLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Launcher button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Chat with Stephanie"}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full bg-primary py-2 pl-2 pr-4 text-primary-foreground shadow-elevated transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
      >
        <span className="relative">
          <img
            src={stephanieAvatar}
            alt="Stephanie"
            className="h-10 w-10 rounded-full object-cover ring-2 ring-accent"
            width={40}
            height={40}
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-success animate-live-ping" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-primary bg-success" />
          </span>
        </span>
        {!open && (
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-semibold leading-tight">Ask Stephanie</span>
            <span className="block text-xs text-primary-foreground/70">AI admissions advisor</span>
          </span>
        )}
        {open && <X className="h-5 w-5" />}
        {!open && <MessageSquare className="h-5 w-5 sm:hidden" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-x-3 bottom-24 z-50 flex h-[70vh] max-h-[640px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-elevated sm:inset-x-auto sm:right-6 sm:bottom-28 sm:w-[400px]">
          <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <img
              src={stephanieAvatar}
              alt="Stephanie"
              className="h-9 w-9 rounded-full object-cover ring-2 ring-accent"
              width={36}
              height={36}
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                Stephanie <Sparkle className="h-3.5 w-3.5 text-accent" />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Online · replies instantly
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-md p-1 hover:bg-primary-foreground/10">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <AssistantPanel compact />
          </div>
        </div>
      )}
    </>
  );
}
