import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFabuos, type UserType } from "../store";

const options: { id: UserType; label: string; emoji: string; blurb: string }[] = [
  { id: "student", label: "Student", emoji: "📚", blurb: "Study packs, notes, focus" },
  { id: "professional", label: "Professional", emoji: "💼", blurb: "Meetings, tasks, writing" },
  { id: "parent", label: "Parent", emoji: "🏡", blurb: "Planning, expenses, routines" },
  { id: "creator", label: "Creator", emoji: "🎬", blurb: "Clips, captions, thumbnails" },
  { id: "personal", label: "Just for me", emoji: "✨", blurb: "A calmer, sorted day" },
];

export default function Onboarding() {
  const { state, update } = useFabuos();
  const [picked, setPicked] = useState<UserType | null>(state.userType);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-6 py-12 bg-background text-foreground" style={{ backgroundImage: "var(--gradient-mesh)" }}>
      <div className="mx-auto max-w-md animate-fade-in">
        <p className="text-sm font-semibold text-primary">Step 1 of 1 — quick, promise</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">
          Hey {state.name || "there"} 👋 what does a normal day look like?
        </h1>
        <p className="mt-2 text-muted-foreground">
          We'll tune your home feed, challenges and tools around it. You can change this any time.
        </p>

        <div className="mt-7 space-y-3">
          {options.map((o) => {
            const active = picked === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setPicked(o.id)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-3xl border p-4 text-left transition-all duration-200 active:scale-[0.98]",
                  active ? "border-primary bg-primary/10 shadow-[var(--shadow-glow)]" : "border-border/60 bg-card/70",
                )}
              >
                <span className="text-2xl">{o.emoji}</span>
                <span>
                  <span className="block font-semibold">{o.label}</span>
                  <span className="block text-sm text-muted-foreground">{o.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>

        <Button
          disabled={!picked}
          onClick={() => {
            update({ userType: picked, onboarded: true });
            navigate("/", { replace: true });
          }}
          className="mt-8 h-12 w-full rounded-2xl text-base font-bold"
          style={picked ? { background: "var(--gradient-3d)" } : undefined}
        >
          {picked ? "Open Fabuos" : "Pick one to continue"}
        </Button>
      </div>
    </div>
  );
}
