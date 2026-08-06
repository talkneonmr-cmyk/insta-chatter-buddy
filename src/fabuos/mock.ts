import type { Interest } from "./store";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type Tone = "funny" | "dramatic" | "aesthetic" | "motivational";

const hookBank: Record<Tone, string[]> = {
  funny: [
    "POV: you tried {topic} and it went exactly as badly as you'd hope 💀",
    "nobody: … me at 2am explaining {topic} to my ceiling 🗣️",
    "I did {topic} so you legally never have to",
  ],
  dramatic: [
    "I gave {topic} 30 days. Day 1 broke me.",
    "Everything changed the second I understood {topic}.",
    "This is the {topic} story nobody tells you.",
  ],
  aesthetic: [
    "slow mornings, soft light, and a little {topic} ✨",
    "a quiet day of {topic} — no rush, no noise",
    "{topic}, but make it cinematic 🎞️",
  ],
  motivational: [
    "You don't need motivation for {topic}. You need 10 minutes.",
    "Six months of {topic} changes your entire life. Start today.",
    "Nobody is coming to do {topic} for you — and that's the good news.",
  ],
};

const captionBank = [
  "saving this one for the archive 🤍",
  "made this in 12 minutes, no thoughts, only vibes",
  "tell me you'd try this without telling me",
  "day {n} of getting 1% better",
  "unserious content, serious effort",
];

export function generateCaptions(topic: string, tone: Tone) {
  const t = topic.trim() || "this";
  const hooks = hookBank[tone].map((h) => h.replaceAll("{topic}", t));
  const caps = captionBank.map((c, i) => c.replaceAll("{n}", String(i + 3)));
  return hooks.map((hook, i) => ({
    id: `${tone}-${i}`,
    hook,
    caption: caps[i % caps.length],
    hashtags: ["#fyp", `#${t.split(/\s+/)[0].toLowerCase().replace(/\W/g, "") || "vibes"}`, "#fabuos", "#creator"],
  }));
}

export function generateClips(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, "") || "your video";
  return [
    { id: "c1", title: `${base} — the hook everyone replays`, start: "00:12", end: "00:41", score: 94 },
    { id: "c2", title: `${base} — the part that gets stitched`, start: "02:03", end: "02:33", score: 88 },
    { id: "c3", title: `${base} — clean payoff moment`, start: "05:47", end: "06:12", score: 81 },
  ];
}

export const thumbnailStyles = ["Bold Text", "Neon Glow", "Minimal Clean", "Reaction Face", "Cinematic"] as const;

export function generateThumbnailConcepts(prompt: string) {
  const p = prompt.trim() || "your idea";
  return thumbnailStyles.slice(0, 4).map((style, i) => ({
    id: `t${i}`,
    style,
    headline: [`I TRIED ${p.toUpperCase()}`, `${p.toUpperCase()}?!`, `THE TRUTH ABOUT ${p.toUpperCase()}`, `${p.toUpperCase()} IN 24H`][i],
    palette: [
      ["262 83% 58%", "340 82% 58%"],
      ["150 90% 45%", "190 90% 50%"],
      ["24 95% 58%", "340 82% 58%"],
      ["220 90% 60%", "262 83% 58%"],
    ][i],
  }));
}

export const voiceStyles = ["Warm Narrator", "Hype Energy", "Calm ASMR", "British Casual", "Deep Trailer"];

export function generateVoiceover(text: string, style: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const seconds = Math.max(3, Math.round((words / 155) * 60));
  return {
    style,
    words,
    duration: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`,
    waveform: Array.from({ length: 48 }, (_, i) => 20 + Math.round(60 * Math.abs(Math.sin(i * 0.7 + words))) ),
  };
}

export const trends = [
  { id: "t1", type: "Sound", title: "sped-up bedroom pop loop", growth: "+412%", note: "Works best over get-ready-with-me and study clips." },
  { id: "t2", type: "Format", title: "\"explain it like I'm 5\" whiteboard cut", growth: "+236%", note: "Big on study and finance sides of the app." },
  { id: "t3", type: "Topic", title: "romanticising your school routine", growth: "+188%", note: "Peak posting window: 7–9am." },
  { id: "t4", type: "Format", title: "3-second hook, then hard cut to result", growth: "+143%", note: "Retention jumps when payoff lands before 0:05." },
  { id: "t5", type: "Sound", title: "lo-fi drum & bass edit", growth: "+97%", note: "Pairs with gym and gaming montages." },
  { id: "t6", type: "Topic", title: "\"things I wish I knew at 16\"", growth: "+74%", note: "Evergreen — reposts keep performing." },
];

export function generateStudyPack(notes: string) {
  const cleaned = notes.trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter((s) => s.length > 12).slice(0, 6);
  const keyPoints = sentences.length ? sentences : [cleaned || "Your notes"];
  return {
    summary: `Here's the short version: ${keyPoints.slice(0, 2).join(" ")} In plain English — it's about how the main idea connects to the examples, and why that connection is the thing you'll get tested on.`,
    flashcards: keyPoints.slice(0, 4).map((s, i) => ({
      id: `f${i}`,
      front: `What's the main idea in point ${i + 1}?`,
      back: s.slice(0, 160),
    })),
    quiz: keyPoints.slice(0, 3).map((s, i) => ({
      id: `q${i}`,
      question: `Which statement best matches point ${i + 1}?`,
      options: [s.slice(0, 70), "A related but incorrect detail", "An unrelated fact", "None of the above"],
      answer: 0,
    })),
  };
}

export function buildDayPlan(tasks: string[], startHour = 9) {
  let minutes = startHour * 60;
  const blocks: { id: string; time: string; task: string; length: number; kind: "task" | "break" }[] = [];
  tasks.forEach((task, i) => {
    const length = 25 + (i % 3) * 15;
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    blocks.push({
      id: `b${i}`,
      time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      task,
      length,
      kind: "task",
    });
    minutes += length;
    if (i < tasks.length - 1) {
      const bh = Math.floor(minutes / 60) % 24;
      const bm = minutes % 60;
      blocks.push({ id: `br${i}`, time: `${String(bh).padStart(2, "0")}:${String(bm).padStart(2, "0")}`, task: "Breathe, stretch, snack", length: 10, kind: "break" });
      minutes += 10;
    }
  });
  return blocks;
}

export const moods = [
  { emoji: "🔥", label: "Unstoppable" },
  { emoji: "😊", label: "Good" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😮‍💨", label: "Drained" },
  { emoji: "🌧️", label: "Rough" },
];

export const journalPrompts = [
  "One small thing that went right today?",
  "What's taking up the most space in your head?",
  "Who made your day a bit easier?",
  "What would make tomorrow 10% better?",
  "What are you low-key proud of?",
];

export function moodInsight(mood: string) {
  switch (mood) {
    case "Unstoppable":
      return "Love this energy. Bank it — knock out the thing you've been putting off while you're riding the wave.";
    case "Good":
      return "Steady days build everything. Nothing to fix here, just keep showing up like this.";
    case "Okay":
      return "Neutral is completely fine. Maybe pick one tiny win today and call it a success.";
    case "Drained":
      return "You're running low, not failing. Shrink today's list to one thing and let the rest wait.";
    default:
      return "Rough days happen and they pass. Be as kind to yourself as you'd be to a friend right now.";
  }
}

export function dailyChallenge(interests: Interest[]) {
  const pool: Record<string, { title: string; sub: string }[]> = {
    content: [
      { title: "Make one clip today", sub: "Even a 15-second one counts. Post it or don't — the rep is the point." },
      { title: "Write 3 hooks", sub: "Use the Caption Generator, keep the one that makes you laugh." },
    ],
    school: [
      { title: "Study for 15 minutes", sub: "One focus timer. That's it. Future you says thanks." },
      { title: "Turn your notes into flashcards", sub: "Paste them into Study Buddy and quiz yourself once." },
    ],
    gaming: [{ title: "Clip your best play", sub: "Drop it in the Clip Cutter and grab a vertical cut." }],
    fitness: [{ title: "Move for 20 minutes", sub: "Walk counts. Log it as a win when you're done." }],
    music: [{ title: "Try a trending sound", sub: "Check Trend Radar and build something around the top one." }],
    fashion: [{ title: "Shoot one outfit flat-lay", sub: "Aesthetic tone captions were made for this." }],
  };
  const keys = interests.length ? interests : (["content", "school"] as Interest[]);
  const options = keys.flatMap((k) => pool[k] ?? []);
  const idx = new Date().getDate() % Math.max(1, options.length);
  return options[idx] ?? { title: "Make something small today", sub: "Ten minutes in any module counts." };
}
