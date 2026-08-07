import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FabCard, GradientText, Pill } from "../components/ui-kit";
import { useFabuos, FREE_DAILY_AI, type Tier } from "../store";

const plans: { id: Tier; name: string; price: string; blurb: string; perks: string[] }[] = [
  {
    id: "basic",
    name: "Basic",
    price: "₹99",
    blurb: "The daily essentials",
    perks: [`${FREE_DAILY_AI} AI runs a day`, "Daily Compass planning", "Streaks, XP and challenges", "Expense tracking"],
  },
  {
    id: "advanced",
    name: "Advanced",
    price: "₹299",
    blurb: "For people who use it every day",
    perks: ["Unlimited AI runs", "Create Studio in full", "Grow Hub study packs", "Meeting notes & actions"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹499",
    blurb: "Everything, no limits",
    perks: ["Everything in Advanced", "AI clip cutter priority", "ATS resume & cover letters", "Early access to new tools"],
  },
];

export default function Pricing() {
  const { state, update } = useFabuos();
  const navigate = useNavigate();

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="text-center">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">
          Go <GradientText>all in</GradientText>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">One app. Everything you actually use, every day.</p>
      </header>

      {plans.map((p) => {
        const active = state.tier === p.id;
        return (
          <FabCard key={p.id} className={cn(active && "border-primary shadow-[var(--shadow-glow)]")}>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="font-heading text-xl font-extrabold">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.blurb}</p>
              </div>
              <p className="font-heading text-2xl font-extrabold">
                {p.price}
                <span className="text-sm font-medium text-muted-foreground">/mo</span>
              </p>
            </div>
            <ul className="mt-4 space-y-2">
              {p.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" /> {perk}
                </li>
              ))}
            </ul>
            <Button
              disabled={active}
              onClick={() => {
                update({ tier: p.id });
                toast.success(`You're on ${p.name}`);
                navigate("/");
              }}
              className="mt-4 h-11 w-full rounded-2xl font-bold"
              style={!active ? { background: "var(--gradient-3d)" } : undefined}
              variant={active ? "secondary" : "default"}
            >
              {active ? "Current plan" : `Choose ${p.name}`}
            </Button>
          </FabCard>
        );
      })}

      <p className="pb-2 text-center text-xs text-muted-foreground">
        <Pill>Demo</Pill> Plans switch instantly here — no payment is taken.
      </p>
    </div>
  );
}
