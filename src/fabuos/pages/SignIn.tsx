import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFabuos } from "../store";

export default function SignIn() {
  const { update } = useFabuos();
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const go = () => {
    update({ signedIn: true, name: name.trim() || "friend" });
    navigate("/onboarding", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background text-foreground" style={{ backgroundImage: "var(--gradient-mesh)" }}>
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-3xl" style={{ background: "var(--gradient-3d)" }}>
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-3d)" }}>Fabuos</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Create, study, and keep your life together — all in one place.</p>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl shadow-[var(--shadow-card)]">
          <label className="text-sm font-semibold" htmlFor="fab-name">What should we call you?</label>
          <Input
            id="fab-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder="your name or handle"
            className="mt-2 rounded-2xl h-12"
          />
          <Button onClick={go} className="mt-4 h-12 w-full rounded-2xl text-base font-bold" style={{ background: "var(--gradient-3d)" }}>
            Let's go
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">No password, no spam. This is a demo account stored on your device.</p>
        </div>
      </div>
    </div>
  );
}
