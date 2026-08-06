import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { FabCard, Pill } from "../components/ui-kit";
import { Confetti } from "../components/Confetti";
import { useFabuos, FREE_DAILY_CREDITS } from "../store";

const free = [
  `${FREE_DAILY_CREDITS} AI generations per day`,
  "All 5 Create Studio tools",
  "Full Life Hub: study, planner, focus, mood",
  "Streaks, daily challenges and wins",
];

const plus = [
  "Unlimited AI generations",
  "Every trend on Trend Radar, unlocked",
  "Priority generation queue",
  "Early access to new tools",
  "Support a tiny team building this",
];

export default function Pricing() {
  const { state, update } = useFabuos();
  const navigate = useNavigate();
  const [celebrate, setCelebrate] = useState(false);

  const upgrade = () => {
    update({ plus: true });
    setCelebrate(true);
    toast.success("Welcome to Fabuos+ 🎉", { description: "Unlimited generations unlocked." });
  };

  return (
    <div className="animate-fade-in">
      <Confetti fire={celebrate} onDone={() => setCelebrate(false)} />
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground active:scale-95">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-heading text-3xl font-extrabold tracking-tight">
        Simple pricing. <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-3d)" }}>No nonsense.</span>
      </h1>
      <p className="mb-6 mt-1 text-muted-foreground">Start free forever. Upgrade only if you're hitting the cap.</p>

      <div className="space-y-4">
        <FabCard>
          <div className="flex items-baseline justify-between">
            <p className="font-heading text-xl font-bold">Free</p>
            <p className="font-heading text-2xl font-extrabold">₹0</p>
          </div>
          <ul className="mt-4 space-y-2">
            {free.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> {f}
              </li>
            ))}
          </ul>
          <Button variant="outline" disabled className="mt-5 h-12 w-full rounded-2xl">
            {state.plus ? "Downgrade anytime" : "Your current plan"}
          </Button>
        </FabCard>

        <FabCard className="relative overflow-hidden border-primary/50">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-40 blur-3xl" style={{ background: "var(--gradient-3d)" }} />
          <div className="relative">
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <p className="font-heading text-xl font-bold">Fabuos+</p>
                <Pill className="bg-primary/20 text-primary">Most popular</Pill>
              </div>
              <p className="font-heading text-2xl font-extrabold">
                ₹199<span className="text-sm font-medium text-muted-foreground">/mo</span>
              </p>
            </div>
            <ul className="mt-4 space-y-2">
              {plus.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={state.plus ? () => update({ plus: false }) : upgrade}
              className="mt-5 h-12 w-full rounded-2xl font-bold"
              style={!state.plus ? { background: "var(--gradient-3d)" } : undefined}
              variant={state.plus ? "outline" : "default"}
            >
              {state.plus ? "Cancel Fabuos+" : (<><Sparkles className="mr-2 h-4 w-4" /> Upgrade to Fabuos+</>)}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Demo checkout — no card, no charge.</p>
          </div>
        </FabCard>
      </div>
    </div>
  );
}
