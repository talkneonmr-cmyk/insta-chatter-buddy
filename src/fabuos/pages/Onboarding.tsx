import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFabuos, type Interest } from "../store";

const options: { id: Interest; label: string; emoji: string }[] = [
  { id: "content", label: "Content creation", emoji: "🎬" },
  { id: "school", label: "School", emoji: "📚" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "fitness", label: "Fitness", emoji: "🏃" },
  { id: "music", label: "Music", emoji: "🎧" },
  { id: "fashion", label: "Fashion", emoji: "👟" },
];

export default function Onboarding() {
  const { state, update } = useFabuos();
  const [picked, setPicked] = useState<Interest[]>(state.interests);
  const navigate = useNavigate();

  const toggle = (id: Interest) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]));

  return (
    <div className="min-h-screen px-6 py-12 bg-background text-foreground" style={{ backgroundImage: "var(--gradient-mesh)" }}>
      <div className="mx-auto max-w-md animate-fade-in">
        <p className="text-sm font-semibold text-primary">Step 1 of 1 — quick, promise</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">
          Hey {state.name || "there"} 👋 what are you into?
        </h1>
        <p className="mt-2 text-muted-foreground">Pick up to 3. We'll tune your daily challenges around them.</p>

        <div className="mt-7 grid grid-cols-2 gap-3">
          {options.map((o) => {
            const active = picked.includes(o.id);
            return (
              <button
                key={o.id}
                onClick={() => toggle(o.id)}
                className={cn(
                  "rounded-3xl border p-5 text-left transition-all duration-200 active:scale-95",
                  active ? "border-primary bg-primary/15 shadow-[var(--shadow-glow)]" : "border-border/60 bg-card/70",
                )}
              >
                <span className="text-2xl">{o.emoji}</span>
                <p className="mt-2 font-semibold">{o.label}</p>
              </button>
            );
          })}
        </div>

        <Button
          disabled={picked.length === 0}
          onClick={() => {
            update({ interests: picked, onboarded: true });
            navigate("/", { replace: true });
          }}
          className="mt-8 h-12 w-full rounded-2xl text-base font-bold"
          style={picked.length ? { background: "var(--gradient-3d)" } : undefined}
        >
          {picked.length ? "Open Fabuos" : "Pick at least one"}
        </Button>
      </div>
    </div>
  );
}
