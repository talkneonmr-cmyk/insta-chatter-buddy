import { useState } from "react";
import { Copy, Scissors, Type, Image as ImageIcon, Mic, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FabCard, SectionTitle, Pill, Processing } from "../components/ui-kit";
import {
  wait,
  rewriteText,
  grammarIssues,
  readabilityScore,
  generateCaptions,
  generateClips,
  transcribeVoice,
  thumbnailConcepts,
  resumeDraft,
  type Tone,
} from "../mock";
import { useFabuos } from "../store";

const tones: Tone[] = ["friendly", "professional", "bold", "casual"];

function Gate({ children, onNeed }: { children: React.ReactNode; onNeed: () => boolean }) {
  return <>{children}</>;
}

export default function Create() {
  const { state, spendAI, aiLeft, unlimitedAI, addWin } = useFabuos();
  const [busy, setBusy] = useState<string | null>(null);

  // writer
  const [text, setText] = useState("");
  const [tone, setTone] = useState<Tone>("friendly");
  const [rewritten, setRewritten] = useState("");

  // captions
  const [topic, setTopic] = useState("");
  const [captions, setCaptions] = useState<{ hook: string; caption: string }[]>([]);

  // clips
  const [fileName, setFileName] = useState("");
  const [clips, setClips] = useState<ReturnType<typeof generateClips>>([]);

  // voice
  const [voiceNote, setVoiceNote] = useState("");

  // thumbnails
  const [thumbTopic, setThumbTopic] = useState("");
  const [concepts, setConcepts] = useState<ReturnType<typeof thumbnailConcepts>>([]);

  // resume
  const [job, setJob] = useState("");
  const [resume, setResume] = useState<ReturnType<typeof resumeDraft> | null>(null);

  const run = async (key: string, fn: () => void) => {
    if (!spendAI()) {
      toast.error("You're out of AI runs today — upgrade for unlimited.");
      return;
    }
    setBusy(key);
    await wait(1100);
    fn();
    setBusy(null);
  };

  const copy = (t: string) => {
    navigator.clipboard.writeText(t);
    toast.success("Copied");
  };

  const issues = grammarIssues(text);

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Create Studio</h1>
          <p className="text-sm text-muted-foreground">Write, cut, design — without opening five apps.</p>
        </div>
        <Pill><Sparkles className="h-3 w-3" /> {unlimitedAI ? "Unlimited" : `${aiLeft} left`}</Pill>
      </header>

      <Tabs defaultValue="write">
        <TabsList className="grid w-full grid-cols-5 rounded-2xl">
          <TabsTrigger value="write" className="rounded-xl text-xs">Write</TabsTrigger>
          <TabsTrigger value="captions" className="rounded-xl text-xs">Social</TabsTrigger>
          <TabsTrigger value="clips" className="rounded-xl text-xs">Clips</TabsTrigger>
          <TabsTrigger value="voice" className="rounded-xl text-xs">Voice</TabsTrigger>
          <TabsTrigger value="resume" className="rounded-xl text-xs">Resume</TabsTrigger>
        </TabsList>

        {/* WRITE */}
        <TabsContent value="write" className="mt-4 space-y-4">
          <FabCard>
            <SectionTitle action={text.trim() ? <Pill>Readability {readabilityScore(text)}</Pill> : undefined}>
              Rewrite & fix
            </SectionTitle>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Paste an email, message, caption or paragraph…"
              className="rounded-2xl"
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tones.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-all active:scale-95",
                    tone === t ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <Button
              disabled={!text.trim() || busy === "write"}
              onClick={() => run("write", () => { setRewritten(rewriteText(text, tone)); addWin("Rewrote a piece of writing", "create", 8); })}
              className="mt-3 h-11 w-full rounded-2xl font-bold"
              style={{ background: "var(--gradient-3d)" }}
            >
              <Type className="mr-2 h-4 w-4" /> Rewrite
            </Button>
          </FabCard>

          {issues.length > 0 && (
            <FabCard>
              <SectionTitle>Suggested fixes</SectionTitle>
              <ul className="space-y-2">
                {issues.map((i, n) => (
                  <li key={n} className="text-sm">
                    <span className="font-semibold">{i.type}:</span>{" "}
                    <span className="text-muted-foreground">{i.text} → {i.fix}</span>
                  </li>
                ))}
              </ul>
            </FabCard>
          )}

          {busy === "write" && <Processing label="Rewriting in your tone…" />}
          {rewritten && busy !== "write" && (
            <FabCard>
              <SectionTitle action={<Button size="sm" variant="ghost" onClick={() => copy(rewritten)}><Copy className="h-4 w-4" /></Button>}>
                Result
              </SectionTitle>
              <p className="whitespace-pre-wrap text-sm">{rewritten}</p>
            </FabCard>
          )}
        </TabsContent>

        {/* CAPTIONS */}
        <TabsContent value="captions" className="mt-4 space-y-4">
          <FabCard>
            <SectionTitle>Hooks & captions</SectionTitle>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What's the post about?" className="h-12 rounded-2xl" />
            <Button
              disabled={busy === "cap"}
              onClick={() => run("cap", () => { setCaptions(generateCaptions(topic)); addWin("Generated post ideas", "create", 8); })}
              className="mt-3 h-11 w-full rounded-2xl font-bold"
              style={{ background: "var(--gradient-3d)" }}
            >
              Generate 4 options
            </Button>
          </FabCard>
          {busy === "cap" && <Processing label="Writing hooks…" />}
          {captions.map((c, i) => (
            <FabCard key={i}>
              <p className="font-semibold">{c.hook}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.caption}</p>
              <Button size="sm" variant="secondary" className="mt-3 rounded-xl text-xs" onClick={() => copy(`${c.hook}\n\n${c.caption}`)}>
                <Copy className="mr-1.5 h-3 w-3" /> Copy
              </Button>
            </FabCard>
          ))}
        </TabsContent>

        {/* CLIPS */}
        <TabsContent value="clips" className="mt-4 space-y-4">
          <FabCard>
            <SectionTitle>AI clip cutter</SectionTitle>
            <p className="mb-3 text-sm text-muted-foreground">Drop a long video and Fabuos marks the moments worth posting.</p>
            <label className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 text-sm text-muted-foreground">
              <Scissors className="mb-2 h-5 w-5 text-primary" />
              {fileName || "Tap to choose a video"}
              <input type="file" accept="video/*" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
            </label>
            <Button
              disabled={!fileName || busy === "clip"}
              onClick={() => run("clip", () => { setClips(generateClips(fileName)); addWin("Cut clips from a long video", "create", 12); })}
              className="mt-3 h-11 w-full rounded-2xl font-bold"
              style={{ background: "var(--gradient-3d)" }}
            >
              Find the best moments
            </Button>
          </FabCard>
          {busy === "clip" && <Processing label="Scanning for high-retention moments…" />}
          {clips.map((c) => (
            <FabCard key={c.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.start} → {c.end}</p>
                  <p className="mt-2 text-sm">{c.caption}</p>
                </div>
                <Pill>{c.score}</Pill>
              </div>
            </FabCard>
          ))}

          <FabCard>
            <SectionTitle>Thumbnail concepts</SectionTitle>
            <Input value={thumbTopic} onChange={(e) => setThumbTopic(e.target.value)} placeholder="Video topic" className="h-12 rounded-2xl" />
            <Button
              disabled={busy === "thumb"}
              onClick={() => run("thumb", () => setConcepts(thumbnailConcepts(thumbTopic)))}
              className="mt-3 h-11 w-full rounded-2xl font-bold"
              variant="secondary"
            >
              <ImageIcon className="mr-2 h-4 w-4" /> Suggest 3 concepts
            </Button>
          </FabCard>
          {busy === "thumb" && <Processing label="Sketching concepts…" />}
          {concepts.map((c, i) => (
            <FabCard key={i}>
              <div className="flex items-center gap-2">
                {c.palette.map((p) => (
                  <span key={p} className="h-5 w-5 rounded-full border border-border/60" style={{ background: p }} />
                ))}
              </div>
              <p className="mt-2 font-semibold">{c.title}</p>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </FabCard>
          ))}
        </TabsContent>

        {/* VOICE */}
        <TabsContent value="voice" className="mt-4 space-y-4">
          <FabCard>
            <SectionTitle>Voice to clean notes</SectionTitle>
            <p className="mb-3 text-sm text-muted-foreground">Ramble for a minute — get structured notes back.</p>
            <Button
              disabled={busy === "voice"}
              onClick={() => run("voice", () => { setVoiceNote(transcribeVoice(62)); addWin("Turned a voice note into notes", "create", 8); })}
              className="h-12 w-full rounded-2xl font-bold"
              style={{ background: "var(--gradient-3d)" }}
            >
              <Mic className="mr-2 h-4 w-4" /> Record & clean up
            </Button>
          </FabCard>
          {busy === "voice" && <Processing label="Listening and tidying…" />}
          {voiceNote && busy !== "voice" && (
            <FabCard>
              <SectionTitle action={<Button size="sm" variant="ghost" onClick={() => copy(voiceNote)}><Copy className="h-4 w-4" /></Button>}>
                Your notes
              </SectionTitle>
              <p className="whitespace-pre-wrap text-sm">{voiceNote}</p>
            </FabCard>
          )}
        </TabsContent>

        {/* RESUME */}
        <TabsContent value="resume" className="mt-4 space-y-4">
          <FabCard>
            <SectionTitle>ATS resume & cover letter</SectionTitle>
            <Textarea
              value={job}
              onChange={(e) => setJob(e.target.value)}
              rows={6}
              placeholder="Paste the job description…"
              className="rounded-2xl"
            />
            <Button
              disabled={!job.trim() || busy === "resume"}
              onClick={() => run("resume", () => { setResume(resumeDraft(job, state.name)); addWin("Tailored a resume to a job", "create", 15); })}
              className="mt-3 h-11 w-full rounded-2xl font-bold"
              style={{ background: "var(--gradient-3d)" }}
            >
              <FileText className="mr-2 h-4 w-4" /> Tailor my application
            </Button>
          </FabCard>
          {busy === "resume" && <Processing label="Matching keywords to the role…" />}
          {resume && busy !== "resume" && (
            <>
              <FabCard>
                <SectionTitle action={<Pill>ATS {resume.score}%</Pill>}>Keywords to include</SectionTitle>
                <div className="flex flex-wrap gap-1.5">
                  {resume.keywords.map((k) => (
                    <Pill key={k}>{k}</Pill>
                  ))}
                </div>
              </FabCard>
              <FabCard>
                <SectionTitle action={<Button size="sm" variant="ghost" onClick={() => copy(resume.resume)}><Copy className="h-4 w-4" /></Button>}>
                  Resume draft
                </SectionTitle>
                <p className="whitespace-pre-wrap text-sm">{resume.resume}</p>
              </FabCard>
              <FabCard>
                <SectionTitle action={<Button size="sm" variant="ghost" onClick={() => copy(resume.cover)}><Copy className="h-4 w-4" /></Button>}>
                  Cover letter
                </SectionTitle>
                <p className="whitespace-pre-wrap text-sm">{resume.cover}</p>
              </FabCard>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
