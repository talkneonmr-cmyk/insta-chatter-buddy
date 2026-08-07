import { useMemo, useState } from "react";
import { Plus, Wand2, Trash2, Inbox, Wallet, Repeat, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FabCard, SectionTitle, EmptyState, Pill } from "../components/ui-kit";
import { autoSchedule } from "../mock";
import { useFabuos, type Task, type Expense } from "../store";

const categories = ["Food", "Transport", "Bills", "Fun", "Health", "Other"];

export default function Compass() {
  const { state, update, addWin } = useFabuos();
  const [text, setText] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [priority, setPriority] = useState<Task["priority"]>("normal");

  const [capture, setCapture] = useState("");
  const [routineName, setRoutineName] = useState("");
  const [routineTime, setRoutineTime] = useState("08:00");

  const [expLabel, setExpLabel] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCat, setExpCat] = useState("Food");
  const [expRecurring, setExpRecurring] = useState(false);

  const open = state.tasks.filter((t) => !t.done);
  const done = state.tasks.filter((t) => t.done);

  const monthTotal = useMemo(
    () => state.expenses.reduce((s, e) => s + e.amount, 0),
    [state.expenses],
  );
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    state.expenses.forEach((e) => (map[e.category] = (map[e.category] || 0) + e.amount));
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [state.expenses]);

  const addTask = () => {
    if (!text.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      text: text.trim(),
      done: false,
      minutes,
      priority,
      createdAt: new Date().toISOString(),
    };
    update({ tasks: [task, ...state.tasks] });
    setText("");
  };

  const toggleTask = (id: string) => {
    const target = state.tasks.find((t) => t.id === id);
    update({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });
    if (target && !target.done) addWin(`Finished: ${target.text}`, "compass", 10);
  };

  const plan = () => {
    if (!open.length) return toast("Add a couple of tasks first");
    const scheduled = autoSchedule(open);
    update({ tasks: [...scheduled, ...done] });
    toast.success("Your day is planned");
  };

  const addExpense = () => {
    const amount = Number(expAmount);
    if (!expLabel.trim() || !amount) return;
    const e: Expense = {
      id: crypto.randomUUID(),
      label: expLabel.trim(),
      amount,
      category: expCat,
      recurring: expRecurring,
      createdAt: new Date().toISOString(),
    };
    update({ expenses: [e, ...state.expenses] });
    setExpLabel("");
    setExpAmount("");
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <header>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">Daily Compass</h1>
        <p className="text-sm text-muted-foreground">Plan the day, capture the noise, watch the money.</p>
      </header>

      <Tabs defaultValue="plan">
        <TabsList className="grid w-full grid-cols-4 rounded-2xl">
          <TabsTrigger value="plan" className="rounded-xl text-xs">Plan</TabsTrigger>
          <TabsTrigger value="capture" className="rounded-xl text-xs">Capture</TabsTrigger>
          <TabsTrigger value="routines" className="rounded-xl text-xs">Routines</TabsTrigger>
          <TabsTrigger value="money" className="rounded-xl text-xs">Money</TabsTrigger>
        </TabsList>

        {/* PLAN */}
        <TabsContent value="plan" className="mt-4 space-y-4">
          <FabCard>
            <SectionTitle>Add a task</SectionTitle>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="What needs doing?"
              className="h-12 rounded-2xl"
            />
            <div className="mt-3 flex items-center gap-2">
              <Input
                type="number"
                min={5}
                step={5}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value) || 15)}
                className="h-11 w-24 rounded-2xl"
                aria-label="Minutes"
              />
              <div className="flex gap-1.5">
                {(["low", "normal", "high"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-all active:scale-95",
                      priority === p ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <Button onClick={addTask} size="icon" className="ml-auto h-11 w-11 rounded-2xl" style={{ background: "var(--gradient-3d)" }}>
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </FabCard>

          <Button onClick={plan} className="h-12 w-full rounded-2xl font-bold" style={{ background: "var(--gradient-3d)" }}>
            <Wand2 className="mr-2 h-4 w-4" /> Auto-plan my day
          </Button>

          {open.length === 0 && done.length === 0 ? (
            <EmptyState icon={<Clock className="h-8 w-8" />} title="Nothing planned yet" hint="Add two or three things and let Fabuos slot them into your day." />
          ) : (
            <div className="space-y-2">
              {[...open, ...done].map((t) => (
                <FabCard key={t.id} className="py-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleTask(t.id)} aria-label="Toggle task" className="shrink-0">
                      <CheckCircle2 className={cn("h-5 w-5", t.done ? "text-primary" : "text-muted-foreground")} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-medium", t.done && "line-through text-muted-foreground")}>{t.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.start ? `${t.start} · ` : ""}
                        {t.minutes} min · {t.priority}
                      </p>
                    </div>
                    <button
                      onClick={() => update({ tasks: state.tasks.filter((x) => x.id !== t.id) })}
                      aria-label="Delete task"
                      className="text-muted-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </FabCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* CAPTURE */}
        <TabsContent value="capture" className="mt-4 space-y-4">
          <FabCard>
            <SectionTitle>Brain dump</SectionTitle>
            <p className="mb-3 text-sm text-muted-foreground">Get it out of your head now, sort it later.</p>
            <div className="flex gap-2">
              <Input
                value={capture}
                onChange={(e) => setCapture(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && capture.trim()) {
                    update({
                      captures: [
                        { id: crypto.randomUUID(), text: capture.trim(), createdAt: new Date().toISOString(), sorted: false },
                        ...state.captures,
                      ],
                    });
                    setCapture("");
                  }
                }}
                placeholder="Anything on your mind…"
                className="h-12 rounded-2xl"
              />
            </div>
          </FabCard>

          {state.captures.length === 0 ? (
            <EmptyState icon={<Inbox className="h-8 w-8" />} title="Inbox is empty" hint="Dump thoughts here all day, then turn the useful ones into tasks." />
          ) : (
            <div className="space-y-2">
              {state.captures.map((c) => (
                <FabCard key={c.id} className="py-3">
                  <p className="text-sm">{c.text}</p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-xl text-xs"
                      onClick={() => {
                        update({
                          tasks: [
                            { id: crypto.randomUUID(), text: c.text, done: false, minutes: 20, priority: "normal", createdAt: new Date().toISOString() },
                            ...state.tasks,
                          ],
                          captures: state.captures.filter((x) => x.id !== c.id),
                        });
                        toast.success("Moved to today's plan");
                      }}
                    >
                      Make it a task
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl text-xs"
                      onClick={() => update({ captures: state.captures.filter((x) => x.id !== c.id) })}
                    >
                      Discard
                    </Button>
                  </div>
                </FabCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ROUTINES */}
        <TabsContent value="routines" className="mt-4 space-y-4">
          <FabCard>
            <SectionTitle>New routine</SectionTitle>
            <Input value={routineName} onChange={(e) => setRoutineName(e.target.value)} placeholder="Morning reset" className="h-12 rounded-2xl" />
            <div className="mt-3 flex gap-2">
              <Input type="time" value={routineTime} onChange={(e) => setRoutineTime(e.target.value)} className="h-11 rounded-2xl" />
              <Button
                className="h-11 rounded-2xl font-bold"
                style={{ background: "var(--gradient-3d)" }}
                onClick={() => {
                  if (!routineName.trim()) return;
                  update({
                    routines: [
                      { id: crypto.randomUUID(), name: routineName.trim(), time: routineTime, days: ["Mon", "Tue", "Wed", "Thu", "Fri"], active: true },
                      ...state.routines,
                    ],
                  });
                  setRoutineName("");
                }}
              >
                Add
              </Button>
            </div>
          </FabCard>

          {state.routines.length === 0 ? (
            <EmptyState icon={<Repeat className="h-8 w-8" />} title="No routines yet" hint="Routines are the boring habits that quietly hold the week together." />
          ) : (
            <div className="space-y-2">
              {state.routines.map((r) => (
                <FabCard key={r.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.time} · {r.days.join(" ")}</p>
                    </div>
                    <Switch
                      checked={r.active}
                      onCheckedChange={(v) => update({ routines: state.routines.map((x) => (x.id === r.id ? { ...x, active: v } : x)) })}
                    />
                  </div>
                </FabCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* MONEY */}
        <TabsContent value="money" className="mt-4 space-y-4">
          <FabCard>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tracked so far</p>
                <p className="font-heading text-3xl font-extrabold">₹{monthTotal.toLocaleString("en-IN")}</p>
              </div>
              <Pill><Wallet className="h-3 w-3" /> {state.expenses.length} entries</Pill>
            </div>
            {byCategory.length > 0 && (
              <div className="mt-4 space-y-2">
                {byCategory.map(([cat, amt]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{cat}</span>
                      <span className="text-muted-foreground">₹{amt.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${(amt / monthTotal) * 100}%`, background: "var(--gradient-3d)" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FabCard>

          <FabCard>
            <SectionTitle>Add an expense</SectionTitle>
            <Input value={expLabel} onChange={(e) => setExpLabel(e.target.value)} placeholder="What did you spend on?" className="h-12 rounded-2xl" />
            <div className="mt-3 flex gap-2">
              <Input
                type="number"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                placeholder="₹"
                className="h-11 w-28 rounded-2xl"
              />
              <select
                value={expCat}
                onChange={(e) => setExpCat(e.target.value)}
                className="h-11 flex-1 rounded-2xl border border-input bg-background px-3 text-sm"
                aria-label="Category"
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <Switch checked={expRecurring} onCheckedChange={setExpRecurring} />
              Recurring every month
            </label>
            <Button onClick={addExpense} className="mt-3 h-11 w-full rounded-2xl font-bold" style={{ background: "var(--gradient-3d)" }}>
              Add expense
            </Button>
          </FabCard>

          <div className="space-y-2">
            {state.expenses.map((e) => (
              <FabCard key={e.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{e.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.category}
                      {e.recurring ? " · recurring" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">₹{e.amount.toLocaleString("en-IN")}</span>
                    <button onClick={() => update({ expenses: state.expenses.filter((x) => x.id !== e.id) })} aria-label="Delete expense">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </FabCard>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
