import { useNavigate } from "react-router-dom";
import { Moon, Sun, Trophy, Flame, Users, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { FabCard, SectionTitle, Pill, GradientText } from "../components/ui-kit";
import { suggestedFriends, userTypeLabel } from "../mock";
import { useFabuos, FREE_DAILY_AI, XP_PER_LEVEL } from "../store";

export default function Profile() {
  const { state, update, aiLeft, unlimitedAI, toggleTheme, reset, level, progress } = useFabuos();
  const navigate = useNavigate();

  const stats = [
    { label: "Streak", value: `${state.streak}d`, icon: Flame },
    { label: "Wins", value: state.wins.length, icon: Trophy },
    { label: "Level", value: level, icon: Sparkles },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <header>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          <GradientText>{state.name || "Your profile"}</GradientText>
        </h1>
        <p className="text-sm text-muted-foreground">
          {state.userType ? userTypeLabel[state.userType] : "Set up your day"} · {state.tier} plan
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <FabCard key={s.label} className="text-center">
            <s.icon className="mx-auto h-4 w-4 text-primary" />
            <p className="mt-2 font-heading text-xl font-extrabold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </FabCard>
        ))}
      </div>

      <FabCard>
        <SectionTitle action={<Pill>{state.xp % XP_PER_LEVEL}/{XP_PER_LEVEL} XP</Pill>}>Level {level}</SectionTitle>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, background: "var(--gradient-3d)" }} />
        </div>
        {state.badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {state.badges.map((b) => (
              <Pill key={b}>{b}</Pill>
            ))}
          </div>
        )}
      </FabCard>

      <FabCard>
        <SectionTitle>Your details</SectionTitle>
        <label className="text-xs font-semibold text-muted-foreground" htmlFor="p-name">Name</label>
        <Input id="p-name" value={state.name} onChange={(e) => update({ name: e.target.value })} className="mt-1 h-11 rounded-2xl" />
        <label className="mt-3 block text-xs font-semibold text-muted-foreground" htmlFor="p-email">Email</label>
        <Input id="p-email" value={state.email} onChange={(e) => update({ email: e.target.value })} placeholder="you@example.com" className="mt-1 h-11 rounded-2xl" />
        <Button variant="secondary" onClick={() => navigate("/onboarding")} className="mt-3 h-11 w-full rounded-2xl font-semibold">
          Change what my day looks like
        </Button>
      </FabCard>

      <FabCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {state.theme === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
            <span className="text-sm font-semibold">Dark mode</span>
          </div>
          <Switch checked={state.theme === "dark"} onCheckedChange={toggleTheme} />
        </div>
      </FabCard>

      <FabCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Share streaks with friends</span>
          </div>
          <Switch checked={state.communityOptIn} onCheckedChange={(v) => update({ communityOptIn: v })} />
        </div>
        {state.communityOptIn && (
          <div className="mt-4 space-y-2">
            {suggestedFriends.map((f) => {
              const added = state.friends.some((x) => x.id === f.id);
              return (
                <div key={f.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{f.avatar}</span>
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.streak}d streak · {f.challenges} challenges</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={added ? "secondary" : "default"}
                    className="rounded-xl text-xs"
                    onClick={() =>
                      update({ friends: added ? state.friends.filter((x) => x.id !== f.id) : [...state.friends, f] })
                    }
                  >
                    {added ? "Following" : "Follow"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </FabCard>

      <FabCard as="button" onClick={() => navigate("/pricing")}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-heading font-bold capitalize">{state.tier} plan</p>
            <p className="text-sm text-muted-foreground">
              {unlimitedAI ? "Unlimited AI runs" : `${aiLeft}/${FREE_DAILY_AI} AI runs left today`}
            </p>
          </div>
          <Pill>Change</Pill>
        </div>
      </FabCard>

      <Button
        variant="ghost"
        className="h-11 w-full rounded-2xl text-destructive"
        onClick={() => {
          reset();
          toast("Signed out — your data stayed on this device");
          navigate("/signin", { replace: true });
        }}
      >
        <LogOut className="mr-2 h-4 w-4" /> Sign out & clear data
      </Button>
    </div>
  );
}
