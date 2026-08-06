import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Scissors, Image as ImageIcon, Mic, TrendingUp, Type, Copy, Check, Lock, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FabCard, SectionTitle, Pill, Processing } from "../components/ui-kit";
import { Confetti } from "../components/Confetti";
import { useFabuos } from "../store";
import {
  generateCaptions, generateClips, generateThumbnailConcepts, generateVoiceover, voiceStyles, trends, sleep, type Tone,
} from "../mock";

type ToolId = "captions" | "clips" | "thumbnails" | "voice" | "trends";

const tools: { id: ToolId; name: string; desc: string; icon: typeof Type; tint: string }[] = [
  { id: "captions", name: "Caption Generator", desc: "Hooks + captions + hashtags", icon: Type, tint: "text-primary" },
  { id: "clips", name: "Clip Cutter", desc: "Find the moments worth posting", icon: Scissors, tint: "text-pink-400" },
  { id: "thumbnails", name: "Thumbnail Studio", desc: "Concepts that get the click", icon: ImageIcon, tint: "text-orange-400" },
  { id: "voice", name: "Voiceover", desc: "Narrate it without recording", icon: Mic, tint: "text-emerald-400" },
  { id: "trends", name: "Trend Radar", desc: "What's blowing up right now", icon: TrendingUp, tint: "text-sky-400" },
];

const tones: Tone[] = ["funny", "dramatic", "aesthetic", "motivational"];

export default function Create() {
  const [tool, setTool] = useState<ToolId | null>(null);
  const { setLastActivity } = useFabuos();

  if (tool) {
    const meta = tools.find((t) => t.id === tool)!;
    return (
      <div className="animate-fade-in">
        <button onClick={() => setTool(null)} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground active:scale-95">
          <ArrowLeft className="h-4 w-4" /> Create Studio
        </button>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">{meta.name}</h1>
        <p className="mb-5 text-sm text-muted-foreground">{meta.desc}</p>
        {tool === "captions" && <CaptionTool />}
        {tool === "clips" && <ClipTool />}
        {tool === "thumbnails" && <ThumbTool />}
        {tool === "voice" && <VoiceTool />}
        {tool === "trends" && <TrendTool />}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-heading text-3xl font-extrabold tracking-tight">Create Studio</h1>
      <p className="mb-6 mt-1 text-muted-foreground">Five tools. Pick one and make something in the next ten minutes.</p>
      <div className="space-y-3">
        {tools.map((t) => (
          <FabCard
            key={t.id}
            as="button"
            onClick={() => {
              setTool(t.id);
              setLastActivity(t.name, "/create");
            }}
            className="flex items-center gap-4"
          >
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

function useRun() {
  const { spendCredit, addWin, state } = useFabuos();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const run = async (label: string, fn: () => void) => {
    if (!spendCredit()) {
      toast.error("You're out of free generations today", {
        description: "Fabuos+ unlocks unlimited runs.",
        action: { label: "See Fabuos+", onClick: () => navigate("/pricing") },
      });
      return;
    }
    setBusy(true);
    await sleep(1100);
    fn();
    setBusy(false);
    addWin(label, "create");
    setCelebrate(true);
  };

  return { run, busy, celebrate, setCelebrate, plus: state.plus };
}

function OutBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        toast.success("Copied");
        setTimeout(() => setCopied(false), 1500);
      }}
      className="mt-2 flex w-full items-start gap-2 rounded-2xl bg-muted/50 p-3 text-left text-sm active:scale-[0.98] transition-transform"
    >
      <span className="flex-1">{text}</span>
      {copied ? <Check className="h-4 w-4 shrink-0 text-primary" /> : <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </button>
  );
}

function CaptionTool() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<Tone>("funny");
  const [out, setOut] = useState<ReturnType<typeof generateCaptions>>([]);
  const { run, busy, celebrate, setCelebrate } = useRun();

  return (
    <div className="space-y-4">
      <Confetti fire={celebrate} onDone={() => setCelebrate(false)} />
      <FabCard>
        <label className="text-sm font-semibold">What's the video about?</label>
        <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. my 5am study routine" className="mt-2 h-12 rounded-2xl" />
        <p className="mt-4 text-sm font-semibold">Tone</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {tones.map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold capitalize transition-all active:scale-95",
                tone === t ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <Button
          onClick={() => run("Generated captions", () => setOut(generateCaptions(topic, tone)))}
          className="mt-5 h-12 w-full rounded-2xl font-bold"
          style={{ background: "var(--gradient-3d)" }}
        >
          Generate
        </Button>
      </FabCard>

      {busy && <Processing label="Writing hooks that don't sound like a robot…" />}
      {!busy &&
        out.map((o) => (
          <FabCard key={o.id}>
            <Pill className="bg-primary/15 text-primary">Hook</Pill>
            <p className="mt-2 font-heading font-bold leading-snug">{o.hook}</p>
            <OutBlock text={o.caption} />
            <p className="mt-2 text-xs text-primary">{o.hashtags.join(" ")}</p>
          </FabCard>
        ))}
    </div>
  );
}

function ClipTool() {
  const [file, setFile] = useState<string>("");
  const [out, setOut] = useState<ReturnType<typeof generateClips>>([]);
  const { run, busy, celebrate, setCelebrate } = useRun();

  return (
    <div className="space-y-4">
      <Confetti fire={celebrate} onDone={() => setCelebrate(false)} />
      <FabCard>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 py-10 text-center">
          <Upload className="h-7 w-7 text-primary" />
          <span className="mt-2 text-sm font-semibold">{file || "Choose a video"}</span>
          <span className="text-xs text-muted-foreground">MP4 or MOV, any length</span>
          <input type="file" accept="video/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0]?.name ?? "")} />
        </label>
        <Button
          disabled={!file}
          onClick={() => run("Cut clips from a video", () => setOut(generateClips(file)))}
          className="mt-4 h-12 w-full rounded-2xl font-bold"
          style={file ? { background: "var(--gradient-3d)" } : undefined}
        >
          Find the best moments
        </Button>
      </FabCard>

      {busy && <Processing label="Scrubbing through your footage…" />}
      {!busy &&
        out.map((c) => (
          <FabCard key={c.id}>
            <div className="flex items-center justify-between">
              <Pill className="bg-pink-500/15 text-pink-400">{c.start} → {c.end}</Pill>
              <span className="font-heading text-sm font-bold text-primary">{c.score}% hit chance</span>
            </div>
            <p className="mt-3 font-semibold">{c.title}</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: "var(--gradient-3d)" }} />
            </div>
          </FabCard>
        ))}
    </div>
  );
}

function ThumbTool() {
  const [prompt, setPrompt] = useState("");
  const [out, setOut] = useState<ReturnType<typeof generateThumbnailConcepts>>([]);
  const { run, busy, celebrate, setCelebrate } = useRun();

  return (
    <div className="space-y-4">
      <Confetti fire={celebrate} onDone={() => setCelebrate(false)} />
      <FabCard>
        <label className="text-sm font-semibold">Describe the video</label>
        <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. 24 hours eating only blue food" className="mt-2 h-12 rounded-2xl" />
        <Button onClick={() => run("Designed thumbnail concepts", () => setOut(generateThumbnailConcepts(prompt)))} className="mt-4 h-12 w-full rounded-2xl font-bold" style={{ background: "var(--gradient-3d)" }}>
          Generate concepts
        </Button>
      </FabCard>

      {busy && <Processing label="Sketching four directions…" />}
      {!busy && out.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {out.map((t) => (
            <FabCard key={t.id} className="p-3">
              <div
                className="flex aspect-video items-center justify-center rounded-2xl p-3 text-center"
                style={{ background: `linear-gradient(135deg, hsl(${t.palette[0]}), hsl(${t.palette[1]}))` }}
              >
                <span className="font-heading text-sm font-extrabold leading-tight text-white drop-shadow">{t.headline}</span>
              </div>
              <p className="mt-2 text-xs font-semibold text-muted-foreground">{t.style}</p>
            </FabCard>
          ))}
        </div>
      )}
    </div>
  );
}

function VoiceTool() {
  const [text, setText] = useState("");
  const [style, setStyle] = useState(voiceStyles[0]);
  const [out, setOut] = useState<ReturnType<typeof generateVoiceover> | null>(null);
  const { run, busy, celebrate, setCelebrate } = useRun();

  return (
    <div className="space-y-4">
      <Confetti fire={celebrate} onDone={() => setCelebrate(false)} />
      <FabCard>
        <label className="text-sm font-semibold">Script</label>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Paste what you want narrated…" className="mt-2 rounded-2xl" />
        <p className="mt-4 text-sm font-semibold">Voice</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {voiceStyles.map((v) => (
            <button
              key={v}
              onClick={() => setStyle(v)}
              className={cn("rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95", style === v ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground")}
            >
              {v}
            </button>
          ))}
        </div>
        <Button disabled={!text.trim()} onClick={() => run("Made a voiceover", () => setOut(generateVoiceover(text, style)))} className="mt-5 h-12 w-full rounded-2xl font-bold" style={text.trim() ? { background: "var(--gradient-3d)" } : undefined}>
          Generate voiceover
        </Button>
      </FabCard>

      {busy && <Processing label="Warming up the vocal cords…" />}
      {!busy && out && (
        <FabCard>
          <div className="flex items-center justify-between">
            <Pill className="bg-emerald-500/15 text-emerald-400">{out.style}</Pill>
            <span className="text-sm font-bold">{out.duration}</span>
          </div>
          <div className="mt-4 flex h-16 items-end gap-[3px]">
            {out.waveform.map((h, i) => (
              <span key={i} className="flex-1 rounded-full" style={{ height: `${h}%`, background: "var(--gradient-3d)", opacity: 0.5 + (h / 200) }} />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{out.words} words · preview render</p>
        </FabCard>
      )}
    </div>
  );
}

function TrendTool() {
  const { state } = useFabuos();
  const visible = state.plus ? trends : trends.slice(0, 3);
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {visible.map((t) => (
        <FabCard key={t.id}>
          <div className="flex items-center justify-between">
            <Pill className="bg-sky-500/15 text-sky-400">{t.type}</Pill>
            <span className="font-heading text-sm font-bold text-emerald-400">{t.growth}</span>
          </div>
          <p className="mt-3 font-heading font-bold">{t.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.note}</p>
        </FabCard>
      ))}
      {!state.plus && (
        <FabCard as="button" onClick={() => navigate("/pricing")} className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">{trends.length - 3} more trends with Fabuos+</span>
        </FabCard>
      )}
    </div>
  );
}
