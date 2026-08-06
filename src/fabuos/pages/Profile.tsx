import { useNavigate } from "react-router-dom";
import { Flame, Timer, Trophy, Sparkles, LogOut, Zap, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { FabCard, SectionTitle, Pill } from "../components/ui-kit";
import { useFabuos, FREE_DAILY_CREDITS } from "../store";

const interestLabels: Record<string, string> = {
  content: "🎬 Content", school: "📚 School", gaming: "🎮 Gaming",
  fitness: "🏃 Fitness", music: "🎧 Music", fashion: "👟 Fashion",
};

export default function Profile() {
  const { state, update, creditsLeft, reset } = useFabuos();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(state.name);
  const navigate = useNavigate();

  const stats = [
    { icon: Flame, label: "Day streak", value: state.streak, tint: "text-orange-400" },
    { icon: Timer, label: "Minutes focused", value: state.focusMinutes, tint: "text-sky-400" },
    { icon: Trophy, label: "Wins logged", value: state.wins.length, tint: "text-amber-400" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <FabCard className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl font-heading text-2xl font-extrabold text-white" style={{ background: "var(--gradient-3d)" }}>
          {(state.name || "F").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-xl" />
              <Button
                onClick={() => { update({ name: name.trim() || state.name }); setEditing(false); toast.success("Saved"); }}
                className="h-10 rounded-xl"
              >
                Save
              </Button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2">
              <span className="font-heading text-xl font-extrabold">{state.name || "friend"}</span>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {state.plus ? "Fabuos+ member" : `Free plan · ${creditsLeft}/${FREE_DAILY_CREDITS} generations left today`}
          </p>
        </div>
      </FabCard>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <FabCard key={s.label} className="p-4 text-center">
            <s.icon className={`mx-auto h-5 w-5 ${s.tint}`} />
            <p className="mt-2 font-heading text-2xl font-extrabold">{s.value}</p>
            <p className="text-[11px] leading-tight text-muted-foreground">{s.label}</p>
          </FabCard>
        ))}
      </div>

      <div>
        <SectionTitle>Your interests</SectionTitle>
        <FabCard className="flex flex-wrap gap-2">
          {state.interests.length ? (
            state.interests.map((i) => <Pill key={i}>{interestLabels[i] ?? i}</Pill>)
          ) : (
            <span className="text-sm text-muted-foreground">None picked yet.</span>
          )}
        </FabCard>
      </div>

      {!state.plus && (
        <FabCard as="button" onClick={() => navigate("/pricing")} className="relative overflow-hidden">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-40 blur-3xl" style={{ background: "var(--gradient-3d)" }} />
          <div className="relative flex items-center gap-3">
            <Zap className="h-6 w-6 text-primary" />
            <div>
              <p className="font-heading font-bold">Go unlimited with Fabuos+</p>
              <p className="text-sm text-muted-foreground">All tools, no daily cap, every trend.</p>
            </div>
          </div>
        </FabCard>
      )}

      <div className="space-y-3 pt-2">
        <Button variant="outline" className="h-12 w-full rounded-2xl" onClick={() => navigate("/pricing")}>
          <Sparkles className="mr-2 h-4 w-4" /> Manage plan
        </Button>
        <Button
          variant="ghost"
          className="h-12 w-full rounded-2xl text-muted-foreground"
          onClick={() => { reset(); navigate("/signin", { replace: true }); }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out & clear demo data
        </Button>
      </div>
    </div>
  );
}
