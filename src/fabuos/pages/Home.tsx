import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Trophy, ArrowRight, CheckCircle2, Sparkles, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FabCard, SectionTitle, Pill, EmptyState } from "../components/ui-kit";
import { Confetti } from "../components/Confetti";
import { useFabuos, todayKey } from "../store";
import { dailyChallenge } from "../mock";

export default function Home() {
  const { state, update, addWin, checkIn } = useFabuos();
  const navigate = useNavigate();
  const [celebrate, setCelebrate] = useState(false);

  const challenge = useMemo(() => dailyChallenge(state.interests), [state.interests]);
  const challengeDone = state.challengeDoneDate === todayKey();
  const checkedIn = state.lastCheckIn === todayKey();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const doCheckIn = () => {
    if (checkIn()) setCelebrate(true);
  };

  const completeChallenge = () => {
    if (challengeDone) return;
    update({ challengeDoneDate: todayKey() });
    addWin(challenge.title, "streak");
    setCelebrate(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Confetti fire={celebrate} onDone={() => setCelebrate(false)} />

      <div>
        <p className="text-sm text-muted-foreground">{greeting},</p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">{state.name || "friend"} 👋</h1>
      </div>

      <FabCard className="relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-3xl" style={{ background: "var(--gradient-3d)" }} />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-400" />
              <span className="font-heading text-3xl font-extrabold">{state.streak}</span>
              <span className="text-sm text-muted-foreground">day streak</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {checkedIn ? "Checked in for today. Nice." : "Tap to keep the streak alive."}
            </p>
          </div>
          <Button
            onClick={doCheckIn}
            disabled={checkedIn}
            className="rounded-2xl font-bold"
            style={!checkedIn ? { background: "var(--gradient-3d)" } : undefined}
          >
            {checkedIn ? "Done ✓" : "Check in"}
          </Button>
        </div>
      </FabCard>

      <FabCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Pill className="bg-primary/15 text-primary">Today's challenge</Pill>
            <p className="mt-3 font-heading text-lg font-bold">{challenge.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{challenge.sub}</p>
          </div>
          <button
            onClick={completeChallenge}
            aria-label="Complete challenge"
            className="shrink-0 transition-transform active:scale-90"
          >
            <CheckCircle2 className={challengeDone ? "h-9 w-9 text-primary" : "h-9 w-9 text-muted-foreground/40"} />
          </button>
        </div>
      </FabCard>

      <div>
        <SectionTitle>Jump back in</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <FabCard as="button" onClick={() => navigate(state.lastActivity?.to ?? "/create")}>
            <Sparkles className="h-6 w-6 text-primary" />
            <p className="mt-3 font-bold">{state.lastActivity?.label ?? "Create Studio"}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              Continue <ArrowRight className="h-3 w-3" />
            </p>
          </FabCard>
          <FabCard as="button" onClick={() => navigate("/life")}>
            <HeartPulse className="h-6 w-6 text-pink-400" />
            <p className="mt-3 font-bold">Life Hub</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Study, plan, breathe</p>
          </FabCard>
        </div>
      </div>

      <div>
        <SectionTitle action={<span className="text-xs text-muted-foreground">{state.wins.length} total</span>}>
          Recent wins
        </SectionTitle>
        {state.wins.length === 0 ? (
          <EmptyState
            icon={<Trophy className="h-8 w-8" />}
            title="No wins logged yet"
            hint="Finish a challenge or make something in Create Studio — it'll show up here."
          />
        ) : (
          <div className="space-y-2">
            {state.wins.slice(0, 5).map((w) => (
              <FabCard key={w.id} className="flex items-center gap-3 py-3.5">
                <Trophy className="h-5 w-5 shrink-0 text-amber-400" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{w.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</p>
                </div>
              </FabCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
