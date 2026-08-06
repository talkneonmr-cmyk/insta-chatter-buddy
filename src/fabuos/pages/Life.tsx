import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BookOpen, CalendarClock, Timer, Smile, Play, Pause, RotateCcw, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FabCard, Pill, Processing, EmptyState } from "../components/ui-kit";
import { Confetti } from "../components/Confetti";
import { useFabuos, todayKey } from "../store";
import { generateStudyPack, buildDayPlan, moods, journalPrompts, moodInsight, sleep } from "../mock";

type ToolId = "study" | "planner" | "focus" | "mood";

const tools: { id: ToolId; name: string; desc: string; icon: typeof BookOpen; tint: string }[] = [
  { id: "study", name: "Study Buddy", desc: "Notes → summary, flashcards, quiz", icon: BookOpen, tint: "text-sky-400" },
  { id: "planner", name: "Day Planner", desc: "Turn your list into a real schedule", icon: CalendarClock, tint: "text-primary" },
  { id: "focus", name: "Focus Timer", desc: "25 minutes, no doomscrolling", icon: Timer, tint: "text-orange-400" },
  { id: "mood", name: "Mood & Journal", desc: "Check in with yourself", icon: Smile, tint: "text-pink-400" },
];

export default function Life() {
  const [tool, setTool] = useState<ToolId | null>(null);

  if (tool) {
    const meta = tools.find((t) => t.id === tool)!;
    return (
      <div className="animate-fade-in">
        <button onClick={() => setTool(null)} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground active:scale-95">
          <ArrowLeft className="h-4 w-4" /> Life Hub
        </button>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">{meta.name}</h1>
        <p className="mb-5 text-sm text-muted-foreground">{meta.desc}</p>
        {tool === "study" && <StudyTool />}
        {tool === "planner" && <PlannerTool />}
        {tool === "focus" && <FocusTool />}
        {tool === "mood" && <MoodTool />}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-heading text-3xl font-extrabold tracking-tight">Life Hub</h1>
      <p className="mb-6 mt-1 text-muted-foreground">School, plans, focus and feelings — the unglamorous stuff that actually matters.</p>
      <div className="space-y-3">
        {tools.map((t) => (
          <FabCard key={t.id} as="button" onClick={() => setTool(t.id)} className="flex items-center gap-4">
            <span className="rounded-2xl bg-muted/60 p-3">
              <t.icon className={cn("h-6 w-6", t.tint)} />
            </span>
            <span className="min-w-0">
              <span className="block font-heading font-bold">{t.name}</span>
              <span className="block text-sm text-muted-foreground">{t.desc}</span>
            </span>
          </FabCard>
        ))}
      </div>
    </div>
  );
}

function StudyTool() {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [pack, setPack] = useState<ReturnType<typeof generateStudyPack> | null>(null);
  const [flipped, setFlipped] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [celebrate, setCelebrate] = useState(false);
  const { addWin } = useFabuos();

  const go = async () => {
    setBusy(true);
    await sleep(1100);
    setPack(generateStudyPack(notes));
    setBusy(false);
    addWin("Made a study pack", "life");
    setCelebrate(true);
  };

  return (
    <div className="space-y-4">
      <Confetti fire={celebrate} onDone={() => setCelebrate(false)} />
      <FabCard>
        <label className="text-sm font-semibold">Paste your notes</label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} placeholder="Lecture notes, textbook paragraphs, anything…" className="mt-2 rounded-2xl" />
        <Button disabled={notes.trim().length < 20} onClick={go} className="mt-4 h-12 w-full rounded-2xl font-bold" style={notes.trim().length >= 20 ? { background: "var(--gradient-3d)" } : undefined}>
          {notes.trim().length < 20 ? "Add a bit more text" : "Break it down for me"}
        </Button>
      </FabCard>

      {busy && <Processing label="Reading your notes properly…" />}

      {!busy && pack && (
        <>
          <FabCard>
            <Pill className="bg-sky-500/15 text-sky-400">Summary</Pill>
            <p className="mt-3 text-sm leading-relaxed">{pack.summary}</p>
          </FabCard>

          <div>
            <p className="mb-2 font-heading font-bold">Flashcards — tap to flip</p>
            <div className="grid grid-cols-2 gap-3">
              {pack.flashcards.map((f) => (
                <FabCard key={f.id} as="button" onClick={() => setFlipped(flipped === f.id ? null : f.id)} className="min-h-[120px]">
                  <p className="text-sm">{flipped === f.id ? f.back : f.front}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">{flipped === f.id ? "answer" : "tap to reveal"}</p>
                </FabCard>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 font-heading font-bold">Quick quiz</p>
            <div className="space-y-3">
              {pack.quiz.map((q) => (
                <FabCard key={q.id}>
                  <p className="font-semibold">{q.question}</p>
                  <div className="mt-3 space-y-2">
                    {q.options.map((o, i) => {
                      const picked = answers[q.id];
                      const isPicked = picked === i;
                      const correct = i === q.answer;
                      return (
                        <button
                          key={i}
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                          className={cn(
                            "w-full rounded-2xl px-4 py-3 text-left text-sm transition-all active:scale-[0.98]",
                            picked === undefined && "bg-muted/50",
                            picked !== undefined && correct && "bg-emerald-500/20 text-emerald-300",
                            picked !== undefined && isPicked && !correct && "bg-destructive/20 text-destructive",
                            picked !== undefined && !isPicked && !correct && "bg-muted/30 text-muted-foreground",
                          )}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </FabCard>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PlannerTool() {
  const { state, update, addWin } = useFabuos();
  const [text, setText] = useState("");
  const [plan, setPlan] = useState<ReturnType<typeof buildDayPlan>>([]);
  const [busy, setBusy] = useState(false);

  const add = () => {
    if (!text.trim()) return;
    update({ todos: [...state.todos, { id: crypto.randomUUID(), text: text.trim(), done: false }] });
    setText("");
  };

  const toggle = (id: string) =>
    update({ todos: state.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });

  const remove = (id: string) => update({ todos: state.todos.filter((t) => t.id !== id) });

  const build = async () => {
    setBusy(true);
    await sleep(900);
    setPlan(buildDayPlan(state.todos.filter((t) => !t.done).map((t) => t.text)));
    setBusy(false);
    addWin("Planned the day", "life");
  };

  return (
    <div className="space-y-4">
      <FabCard>
        <div className="flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add something you need to do" className="h-12 rounded-2xl" />
          <Button onClick={add} className="h-12 w-12 shrink-0 rounded-2xl p-0" style={{ background: "var(--gradient-3d)" }}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        {state.todos.length > 0 && (
          <div className="mt-4 space-y-2">
            {state.todos.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-muted/40 px-4 py-3">
                <button onClick={() => toggle(t.id)} className={cn("h-5 w-5 shrink-0 rounded-full border-2 transition-colors", t.done ? "border-primary bg-primary" : "border-muted-foreground/40")} aria-label="Toggle task" />
                <span className={cn("flex-1 text-sm", t.done && "text-muted-foreground line-through")}>{t.text}</span>
                <button onClick={() => remove(t.id)} aria-label="Delete task">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
        <Button disabled={!state.todos.some((t) => !t.done)} onClick={build} className="mt-4 h-12 w-full rounded-2xl font-bold" style={state.todos.some((t) => !t.done) ? { background: "var(--gradient-3d)" } : undefined}>
          Build my day
        </Button>
      </FabCard>

      {busy && <Processing label="Fitting it all into a realistic day…" />}
      {!busy && plan.length > 0 && (
        <FabCard>
          <Pill className="bg-primary/15 text-primary">Your schedule</Pill>
          <div className="mt-4 space-y-3">
            {plan.map((b) => (
              <div key={b.id} className="flex gap-4">
                <span className="w-12 shrink-0 font-mono text-sm text-muted-foreground">{b.time}</span>
                <div className={cn("flex-1 rounded-2xl px-4 py-3 text-sm", b.kind === "break" ? "bg-muted/30 text-muted-foreground" : "bg-muted/60 font-medium")}>
                  {b.task}
                  <span className="ml-2 text-xs text-muted-foreground">{b.length}m</span>
                </div>
              </div>
            ))}
          </div>
        </FabCard>
      )}
    </div>
  );
}

function FocusTool() {
  const { state, update, addWin } = useFabuos();
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  useTick(running, () => {
    setSeconds((s) => {
      if (s <= 1) {
        setRunning(false);
        update({ focusMinutes: state.focusMinutes + 25 });
        addWin("Finished a 25-minute focus session", "life");
        setCelebrate(true);
        toast.success("Session complete. Go stretch.");
        return 25 * 60;
      }
      return s - 1;
    });
  });

  const pct = 1 - seconds / (25 * 60);

  return (
    <div className="space-y-4">
      <Confetti fire={celebrate} onDone={() => setCelebrate(false)} />
      <FabCard className="flex flex-col items-center py-10">
        <div className="relative flex h-56 w-56 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - pct)}`}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <span className="font-heading text-5xl font-extrabold tabular-nums">
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
          </span>
        </div>
        <div className="mt-8 flex gap-3">
          <Button onClick={() => setRunning((r) => !r)} className="h-12 rounded-2xl px-8 font-bold" style={{ background: "var(--gradient-3d)" }}>
            {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {running ? "Pause" : "Start"}
          </Button>
          <Button variant="outline" onClick={() => { setRunning(false); setSeconds(25 * 60); }} className="h-12 rounded-2xl">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </FabCard>
      <FabCard className="text-center">
        <p className="font-heading text-2xl font-extrabold">{state.focusMinutes}</p>
        <p className="text-sm text-muted-foreground">minutes focused all time</p>
      </FabCard>
    </div>
  );
}

function useTick(active: boolean, fn: () => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => ref.current(), 1000);
    return () => clearInterval(id);
  }, [active]);
}

function MoodTool() {
  const { state, update, addWin } = useFabuos();
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const prompt = journalPrompts[new Date().getDate() % journalPrompts.length];

  const save = () => {
    if (!mood) return;
    update({ moods: [{ date: todayKey(), mood, note: note.trim() }, ...state.moods.filter((m) => m.date !== todayKey())].slice(0, 60) });
    addWin("Checked in with a mood entry", "life");
    setNote("");
    toast.success("Logged. Thanks for being honest.");
  };

  return (
    <div className="space-y-4">
      <FabCard>
        <p className="text-sm font-semibold">How are you actually doing?</p>
        <div className="mt-4 flex justify-between gap-2">
          {moods.map((m) => (
            <button
              key={m.label}
              onClick={() => setMood(m.label)}
              className={cn("flex flex-1 flex-col items-center gap-1 rounded-2xl py-3 transition-all active:scale-90", mood === m.label ? "bg-primary/15 ring-1 ring-primary" : "bg-muted/40")}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[10px] font-semibold text-muted-foreground">{m.label}</span>
            </button>
          ))}
        </div>
        {mood && <p className="mt-4 rounded-2xl bg-muted/40 p-4 text-sm leading-relaxed">{moodInsight(mood)}</p>}
      </FabCard>

      <FabCard>
        <Pill className="bg-pink-500/15 text-pink-400">Journal prompt</Pill>
        <p className="mt-3 font-semibold">{prompt}</p>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Type as much or as little as you want…" className="mt-3 rounded-2xl" />
        <Button disabled={!mood} onClick={save} className="mt-4 h-12 w-full rounded-2xl font-bold" style={mood ? { background: "var(--gradient-3d)" } : undefined}>
          {mood ? "Save today's entry" : "Pick a mood first"}
        </Button>
      </FabCard>

      {state.moods.length === 0 ? (
        <EmptyState icon={<Smile className="h-8 w-8" />} title="No entries yet" hint="Your past check-ins will collect here so you can spot patterns." />
      ) : (
        <div className="space-y-2">
          {state.moods.slice(0, 7).map((m) => (
            <FabCard key={m.date} className="py-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{m.mood}</span>
                <span className="text-xs text-muted-foreground">{m.date}</span>
              </div>
              {m.note && <p className="mt-1 text-sm text-muted-foreground">{m.note}</p>}
            </FabCard>
          ))}
        </div>
      )}
    </div>
  );
}
