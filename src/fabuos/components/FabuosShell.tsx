import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, CalendarCheck, Sparkles, GraduationCap, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFabuos, FREE_DAILY_AI } from "../store";

const tabs = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/compass", label: "Compass", icon: CalendarCheck, end: false },
  { to: "/create", label: "Create", icon: Sparkles, end: false },
  { to: "/grow", label: "Grow", icon: GraduationCap, end: false },
  { to: "/profile", label: "Profile", icon: User, end: false },
];

export function FabuosShell() {
  const { state, aiLeft, unlimitedAI } = useFabuos();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.theme === "dark");
  }, [state.theme]);

  useEffect(() => {
    if (!state.signedIn && location.pathname !== "/signin") navigate("/signin", { replace: true });
    else if (state.signedIn && !state.onboarded && location.pathname !== "/onboarding")
      navigate("/onboarding", { replace: true });
  }, [state.signedIn, state.onboarded, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ backgroundImage: "var(--gradient-mesh)" }}>
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl safe-top">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <button onClick={() => navigate("/")} className="font-heading text-xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-3d)" }}>
              Fabuos
            </span>
          </button>
          <button
            onClick={() => navigate("/pricing")}
            className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs font-semibold transition-transform active:scale-95"
          >
            <Zap className="h-3.5 w-3.5 text-primary" />
            {unlimitedAI ? `${state.tier === "pro" ? "Pro" : "Advanced"} · unlimited` : `${aiLeft}/${FREE_DAILY_AI} AI today`}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-5">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/80 backdrop-blur-xl safe-bottom">
        <div className="mx-auto flex max-w-2xl items-stretch">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-all duration-200 active:scale-90",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn("rounded-xl px-3.5 py-1 transition-all", isActive && "bg-primary/15")}>
                    <Icon className="h-5 w-5" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
