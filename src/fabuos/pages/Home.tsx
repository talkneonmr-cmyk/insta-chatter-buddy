import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Trophy, Sparkles, ArrowRight, CheckCircle2, BookOpen, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FabCard, SectionTitle, GradientText, Pill } from "../components/ui-kit";
import { Confetti } from "../components/Confetti";
import { challengeForToday, skillForWeek, moods, moodInsight, promptForToday } from "../mock";
import { useFabuos, todayKey, XP_PER_LEVEL } from "../store";

export default function Home() {
  const { state, update, addWin, checkIn, level, progress } = useFabuos();
  const navigate = useNavigate();
  const [fire, setFire] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const challenge = useMemo(() => challengeForToday(state.userType), [state.userType]);
  const skill = useMemo(() => skillForWeek(), []);
  const challengeDone = state.challengeDoneDate === todayKey();
  const checkedIn = state.lastCheckIn === todayKey();
  const todaysMood = state.moods.find((m) => m.date === todayKey());

  const openTasks = state.tasks.filter((t) => !t.done);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const completeChallenge = () => {
    if (challengeDone) return;
    update({ challengeDoneDate: todayKey() });
    addWin(challenge, "streak", 20);
    setFire(true);
  };

  const saveMood = () => {
    if (!mood) return;
    const rest = state.moods.filter((m) => m.date !== todayKey());
    update({ moods: [{ date: todayKey(), mood, note: note.trim() }, ...rest].slice(0, 90) });
    addWin("Checked in on how you're doing", "grow", 10);
    setNote("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Confetti fire={fire} onDone={() => setFire(false)} />

      <header>
        <p className="text-sm text-muted-foreground">{greeting},</p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">
          <GradientText>{state.name || "friend"}</GradientText>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">One app. Everything you actually use, every day.</p>
      </header>

      {/* Streak + level */}
      <FabCard className="relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl opacity-30" style={{ background: "var(--gradient-3d)" }} />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              <span className="font-heading text-2xl font-extrabold">{state.streak} day streak</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Level {level} · {state.xp % XP_PER_LEVEL}/{XP_PER_LEVEL} XP</p>
          </div>
          <Button
            onClick={() => {
              if (checkIn()) setFire(true);
            }}
            disabled={checkedIn}
            className="rounded-2xl font-bold"
            style={!checkedIn ? { background: "var(--gradient-3d)" } : undefined}
          >
            {checkedIn ? "Checked in" : "Check in"}
          </Button>
        </div>
        <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress * 100}%`, background: "var(--gradient-3d)" }} />
        </div>
      </FabCard>

      {/* Daily challenge */}
      <FabCard>
        <SectionTitle action={<Pill>+20 XP</Pill>}>Today's challenge</SectionTitle>
        <p className="text-base font-medium">{challenge}</p>
        <Button
          onClick={completeChallenge}
          disabled={challengeDone}
          variant={challengeDone ? "secondary" : "default"}
          className="mt-4 h-11 w-full rounded-2xl font-bold"
          style={!challengeDone ? { background: "var(--gradient-3d)" } : undefined}
        >
          {challengeDone ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Done today
            </>
          ) : (
            "Mark as done"
          )}
        </Button>
      </FabCard>

      {/* Compass summary */}
      <FabCard as="button" onClick={() => navigate("/compass")}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-heading font-bold">Daily Compass</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {openTasks.length ? `${openTasks.length} task${openTasks.length > 1 ? "s" : ""} left today` : "Nothing planned yet — take 2 minutes"}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-primary" />
        </div>
      </FabCard>

      {/* Quick actions */}
      <div>
        <SectionTitle>Jump back in</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Create Studio", hint: "Captions, clips, resume", to: "/create", icon: Sparkles },
            { label: "Grow Hub", hint: "Summarise & learn", to: "/grow", icon: BookOpen },
          ].map((a) => (
            <FabCard key={a.to} as="button" onClick={() => navigate(a.to)}>
              <a.icon className="h-5 w-5 text-primary" />
              <p className="mt-2 font-semibold">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.hint}</p>
            </FabCard>
          ))}
        </div>
      </div>

      {/* Mood check */}
      <FabCard>
        <SectionTitle>How are you doing?</SectionTitle>
        {todaysMood ? (
          <div>
            <p className="text-sm">
              You logged <span className="font-semibold">{todaysMood.mood}</span> today.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{moodInsight(todaysMood.mood)}</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              {moods.map((m) => (
                <button
                  key={m.label}
                  onClick={() => setMood(m.label)}
                  className={cn(
                    "flex-1 rounded-2xl border py-3 text-2xl transition-all active:scale-90",
                    mood === m.label ? "border-primary bg-primary/10" : "border-border/60",
                  )}
                  aria-label={m.label}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{promptForToday()}</p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="One line is enough (optional)"
              className="mt-2 rounded-2xl"
              rows={2}
            />
            <Button onClick={saveMood} disabled={!mood} className="mt-3 h-11 w-full rounded-2xl font-bold">
              <Heart className="mr-2 h-4 w-4" /> Save today
            </Button>
          </>
        )}
      </FabCard>

      {/* Skill of the week */}
      <FabCard>
        <SectionTitle action={<Pill>{skill.tag}</Pill>}>Skill of the week</SectionTitle>
        <p className="font-semibold">{skill.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{skill.body}</p>
      </FabCard>

      {/* Wins */}
      <div>
        <SectionTitle action={<Pill><Trophy className="h-3 w-3" /> {state.wins.length}</Pill>}>Recent wins</SectionTitle>
        {state.wins.length === 0 ? (
          <FabCard>
            <p className="text-sm text-muted-foreground">No wins logged yet. Finish today's challenge and this fills up fast.</p>
          </FabCard>
        ) : (
          <div className="space-y-2">
            {state.wins.slice(0, 5).map((w) => (
              <FabCard key={w.id} className="py-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{w.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </FabCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
