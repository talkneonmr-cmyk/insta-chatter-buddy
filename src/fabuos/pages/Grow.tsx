import { useEffect, useRef, useState } from "react";
import { BookOpen, Brain, ListChecks, Timer, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FabCard, SectionTitle, Pill, Processing } from "../components/ui-kit";
import { wait, summarize, meetingNotes, skillForWeek } from "../mock";
import { useFabuos } from "../store";

function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          window.clearInterval(ref.current!);
          setRunning(false);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => {
      if (ref.current) window.clearInterval(ref.current);
    };
  }, [running]);

  return { left, running, setRunning, reset: (s: number) => { setRunning(false); setLeft(s); } };
}

export default function Grow() {
  const { spendAI, addWin } = useFabuos();
  const [busy, setBusy] = useState<string | null>(null);

  const [notes, setNotes] = useState("");
  const [pack, setPack] = useState<ReturnType<typeof summarize> | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  const [meeting, setMeeting] = useState("");
  const [mnotes, setMnotes] = useState<ReturnType<typeof meetingNotes> | null>(null);

  const [duration, setDuration] = useState(25);
  const timer = useCountdown(25 * 60);
  const skill = skillForWeek();

  const run = async (key: string, fn: () => void) => {
    if (!spendAI()) return toast.error("You're out of AI runs today — upgrade for unlimited.");
    setBusy(key);
    await wait(1200);
    fn();
    setBusy(null);
  };

  const mm = String(Math.floor(timer.left / 60)).padStart(2, "0");
  const ss = String(timer.left % 60).padStart(2, "0");

  return (
    <div className="space-y-5 animate-fade-in">
      <header>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">Grow Hub</h1>
        <p className="text-sm text-muted-foreground">Understand it faster, remember it longer.</p>
      </header>

      <Tabs defaultValue="study">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl">
          <TabsTrigger value="study" className="rounded-xl text-xs">Study</TabsTrigger>
          <TabsTrigger value="meetings" className="rounded-xl text-xs">Meetings</TabsTrigger>
          <TabsTrigger value="focus" className="rounded-xl text-xs">Focus</TabsTrigger>
        </TabsList>

        {/* STUDY */}
        <TabsContent value="study" className="mt-4 space-y-4">
          <FabCard>
            <SectionTitle>Summarise anything</SectionTitle>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={7}
              placeholder="Paste notes, an article, or a chapter…"
              className="rounded-2xl"
            />
            <Button
              disabled={!notes.trim() || busy === "sum"}
              onClick={() => run("sum", () => { setPack(summarize(notes)); addWin("Built a study pack", "grow", 12); })}
              className="mt-3 h-11 w-full rounded-2xl font-bold"
              style={{ background: "var(--gradient-3d)" }}
            >
              <BookOpen className="mr-2 h-4 w-4" /> Summary + flashcards + quiz
            </Button>
          </FabCard>

          {busy === "sum" && <Processing label="Reading it properly…" />}

          {pack && busy !== "sum" && (
            <>
              <FabCard>
                <SectionTitle>Key points</SectionTitle>
                <p className="whitespace-pre-wrap text-sm">{pack.summary}</p>
              </FabCard>

              <div>
                <SectionTitle action={<Pill><Brain className="h-3 w-3" /> tap to flip</Pill>}>Flashcards</SectionTitle>
                <div className="space-y-2">
                  {pack.flashcards.map((f, i) => (
                    <FabCard key={i} as="button" onClick={() => setFlipped((s) => ({ ...s, [i]: !s[i] }))}>
                      <p className="text-sm font-semibold">{flipped[i] ? f.a : f.q}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{flipped[i] ? "Answer" : "Question"}</p>
                    </FabCard>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle action={<Pill><ListChecks className="h-3 w-3" /> quiz</Pill>}>Test yourself</SectionTitle>
                <div className="space-y-3">
                  {pack.quiz.map((q, i) => (
                    <FabCard key={i}>
                      <p className="text-sm font-semibold">{q.q}</p>
                      <div className="mt-2 space-y-1.5">
                        {q.options.map((o, oi) => {
                          const picked = answers[i] === oi;
                          const correct = q.answer === oi;
                          const answered = answers[i] !== undefined;
                          return (
                            <button
                              key={oi}
                              onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                              className={cn(
                                "w-full rounded-2xl border px-3 py-2 text-left text-sm transition-all active:scale-[0.98]",
                                answered && correct && "border-primary bg-primary/10",
                                answered && picked && !correct && "border-destructive bg-destructive/10",
                                !answered && "border-border/60",
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

          <FabCard>
            <SectionTitle action={<Pill>{skill.tag}</Pill>}>Learn something small</SectionTitle>
            <p className="font-semibold">{skill.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{skill.body}</p>
          </FabCard>
        </TabsContent>

        {/* MEETINGS */}
        <TabsContent value="meetings" className="mt-4 space-y-4">
          <FabCard>
            <SectionTitle>Meeting notes</SectionTitle>
            <Textarea
              value={meeting}
              onChange={(e) => setMeeting(e.target.value)}
              rows={7}
              placeholder="Paste the transcript or your rough notes…"
              className="rounded-2xl"
            />
            <Button
              disabled={!meeting.trim() || busy === "meet"}
              onClick={() => run("meet", () => { setMnotes(meetingNotes(meeting)); addWin("Cleaned up meeting notes", "grow", 12); })}
              className="mt-3 h-11 w-full rounded-2xl font-bold"
              style={{ background: "var(--gradient-3d)" }}
            >
              Summarise & pull actions
            </Button>
          </FabCard>

          {busy === "meet" && <Processing label="Pulling out the decisions…" />}

          {mnotes && busy !== "meet" && (
            <>
              <FabCard>
                <SectionTitle action={<Pill>{mnotes.length}</Pill>}>Summary</SectionTitle>
                <p className="text-sm">{mnotes.summary}</p>
              </FabCard>
              <FabCard>
                <SectionTitle>Decisions</SectionTitle>
                <ul className="space-y-1.5 text-sm">
                  {mnotes.decisions.map((d) => (
                    <li key={d}>• {d}</li>
                  ))}
                </ul>
              </FabCard>
              <FabCard>
                <SectionTitle>Action items</SectionTitle>
                <div className="space-y-2">
                  {mnotes.actions.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>
                        <span className="font-semibold">{a.who}</span> — {a.what}
                      </span>
                      <Pill>{a.when}</Pill>
                    </div>
                  ))}
                </div>
              </FabCard>
            </>
          )}
        </TabsContent>

        {/* FOCUS */}
        <TabsContent value="focus" className="mt-4 space-y-4">
          <FabCard className="text-center">
            <p className="font-heading text-6xl font-extrabold tabular-nums">
              {mm}:{ss}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{duration} minute focus block</p>
            <div className="mt-4 flex justify-center gap-2">
              {[15, 25, 45].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDuration(d);
                    timer.reset(d * 60);
                  }}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all active:scale-95",
                    duration === d ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground",
                  )}
                >
                  {d}m
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => {
                  if (timer.running) timer.setRunning(false);
                  else {
                    timer.setRunning(true);
                    addWin(`Started a ${duration} min focus block`, "grow", 5);
                  }
                }}
                className="h-12 flex-1 rounded-2xl font-bold"
                style={{ background: "var(--gradient-3d)" }}
              >
                {timer.running ? <><Pause className="mr-2 h-4 w-4" /> Pause</> : <><Play className="mr-2 h-4 w-4" /> Start</>}
              </Button>
              <Button variant="secondary" onClick={() => timer.reset(duration * 60)} className="h-12 w-12 rounded-2xl" aria-label="Reset timer">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </FabCard>

          <FabCard>
            <SectionTitle action={<Pill><Timer className="h-3 w-3" /> tip</Pill>}>Make it stick</SectionTitle>
            <p className="text-sm text-muted-foreground">
              Put the phone in another room, not face-down. The distance does more work than the willpower.
            </p>
          </FabCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
