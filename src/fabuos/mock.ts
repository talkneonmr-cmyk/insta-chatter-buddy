import type { Task, UserType } from "./store";

/** Simulated processing delay so the UI feels alive without a backend. */
export const wait = (ms = 1200) => new Promise((r) => setTimeout(r, ms));

export const userTypeLabel: Record<UserType, string> = {
  student: "Student",
  professional: "Professional",
  parent: "Parent",
  creator: "Creator",
  personal: "Just for me",
};

export const dailyChallenges: Record<UserType, string[]> = {
  student: [
    "Review one topic for 15 focused minutes",
    "Turn today's notes into 3 flashcards",
    "Message a classmate you've been meaning to reply to",
  ],
  professional: [
    "Write that message you've been putting off",
    "Block 25 minutes of deep work before noon",
    "Clear your inbox down to five threads",
  ],
  parent: [
    "Plan tomorrow's dinner in under 2 minutes",
    "Spend 10 uninterrupted minutes with family",
    "Log one expense you'd usually forget",
  ],
  creator: [
    "Draft one hook for your next post",
    "Cut one 30-second clip from old footage",
    "Reply to three comments with something real",
  ],
  personal: [
    "Learn one new thing today",
    "Take a 10-minute walk without your phone",
    "Write one line about how today went",
  ],
};

export function challengeForToday(type: UserType | null) {
  const list = dailyChallenges[type ?? "personal"];
  const day = Math.floor(Date.now() / 86400000);
  return list[day % list.length];
}

export const skillsOfWeek = [
  {
    title: "The two-minute rule",
    body: "If a task takes under two minutes, do it now. It stops your mental to-do list from quietly filling up all day.",
    tag: "Productivity",
  },
  {
    title: "Word of the week: Ephemeral",
    body: "Lasting for a very short time. \"The applause was ephemeral, but the lesson stuck.\" Use it once today and it's yours.",
    tag: "Language",
  },
  {
    title: "Box breathing",
    body: "In for 4, hold 4, out for 4, hold 4. Three rounds resets your nervous system before a test, a meeting, or a hard call.",
    tag: "Life skill",
  },
  {
    title: "The 50/30/20 split",
    body: "50% of income to needs, 30% to wants, 20% to savings. A rough split beats no plan at all.",
    tag: "Money",
  },
];

export function skillForWeek() {
  const week = Math.floor(Date.now() / (86400000 * 7));
  return skillsOfWeek[week % skillsOfWeek.length];
}

export const moods = [
  { emoji: "😄", label: "Great" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😕", label: "Low" },
  { emoji: "😴", label: "Tired" },
];

export const reflectionPrompts = [
  "What went better today than you expected?",
  "What's one small thing you're glad you did?",
  "Who made your day a little easier?",
  "What would make tomorrow feel lighter?",
];

export function promptForToday() {
  const day = Math.floor(Date.now() / 86400000);
  return reflectionPrompts[day % reflectionPrompts.length];
}

export const moodInsight = (mood: string) => {
  switch (mood) {
    case "Great":
      return "Love this. Ride the momentum — knock out the one thing you keep pushing back.";
    case "Good":
      return "Steady days build everything. Keep the bar exactly where it is.";
    case "Okay":
      return "Okay is a perfectly fine day. One small win is more than enough today.";
    case "Low":
      return "Rough days happen and they pass. Shrink today's plan and be generous with yourself.";
    default:
      return "Rest counts as progress. Protect your sleep tonight and start fresh.";
  }
};

/* ---------------- Daily Compass: mock scheduling ---------------- */

const pad = (n: number) => String(n).padStart(2, "0");

export function autoSchedule(tasks: Task[], startHour = 9): Task[] {
  let minutes = startHour * 60;
  const order = [...tasks].sort((a, b) => {
    const w = { high: 0, normal: 1, low: 2 } as const;
    return w[a.priority] - w[b.priority];
  });
  return order.map((t) => {
    const start = `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;
    minutes += t.minutes + 10;
    return { ...t, start };
  });
}

/* ---------------- Create Studio: mock AI ---------------- */

const tones = {
  friendly: "warm and easy to read",
  professional: "crisp and professional",
  bold: "punchy and confident",
  casual: "relaxed and conversational",
};

export type Tone = keyof typeof tones;

export function rewriteText(input: string, tone: Tone) {
  const clean = input.trim().replace(/\s+/g, " ");
  const first = clean.split(/(?<=\.)\s/)[0] || clean;
  const lead = {
    friendly: "Here's a warmer take:",
    professional: "Here's a tightened, professional version:",
    bold: "Here's a bolder version:",
    casual: "Here's a more relaxed version:",
  }[tone];
  return `${lead}\n\n${first.replace(/^(i|we)\b/i, (m) => m.toUpperCase())}${
    clean.length > first.length ? " " + clean.slice(first.length).trim() : ""
  }\n\nRewritten to be ${tones[tone]}, with tighter sentences and no filler.`;
}

export function grammarIssues(input: string) {
  const issues: { type: string; text: string; fix: string }[] = [];
  if (/\bi\b/.test(input)) issues.push({ type: "Capitalisation", text: "i", fix: "I" });
  if (/\s{2,}/.test(input)) issues.push({ type: "Spacing", text: "double space", fix: "single space" });
  if (/\b(very|really|just|actually)\b/i.test(input))
    issues.push({ type: "Clarity", text: "filler word", fix: "remove for a stronger sentence" });
  if (input.trim().length && !/[.!?]$/.test(input.trim()))
    issues.push({ type: "Punctuation", text: "missing end punctuation", fix: "add a full stop" });
  if (input.split(" ").length > 40) issues.push({ type: "Readability", text: "long sentence", fix: "split into two" });
  return issues;
}

export function readabilityScore(input: string) {
  const words = input.trim().split(/\s+/).filter(Boolean).length;
  const sentences = Math.max(1, (input.match(/[.!?]/g) || []).length);
  const avg = words / sentences;
  return Math.max(52, Math.min(98, Math.round(100 - Math.abs(avg - 14) * 2.4)));
}

export function generateCaptions(topic: string) {
  const t = topic.trim() || "today";
  return [
    { hook: `Nobody talks about this part of ${t}.`, caption: `Nobody talks about this part of ${t} — so I will. Save this for later 👇` },
    { hook: `I tried ${t} for 7 days. Here's what changed.`, caption: `I tried ${t} for 7 days. Day 1 was rough, day 7 felt automatic. Full breakdown in comments.` },
    { hook: `The ${t} mistake I made for a year.`, caption: `The ${t} mistake I made for a year, in 20 seconds. Don't repeat it 🙃` },
    { hook: `${t}, but make it 30 seconds.`, caption: `Everything you need to know about ${t} in 30 seconds. Bookmark it.` },
  ];
}

export function generateClips(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, "") || "your video";
  return [
    { id: "1", title: `${base} — the hook`, start: "00:14", end: "00:42", score: 94, caption: "Wait for the ending 👀" },
    { id: "2", title: `${base} — the tip`, start: "03:08", end: "03:39", score: 88, caption: "The part nobody tells you." },
    { id: "3", title: `${base} — the reaction`, start: "07:51", end: "08:20", score: 81, caption: "Did not expect that." },
  ];
}

export function transcribeVoice(seconds: number) {
  return `Cleaned-up note (${seconds}s recording)\n\n• Main idea: pick one priority for tomorrow and protect the first hour for it.\n• Follow up with the group about timings before Friday.\n• Idea worth keeping: turn this week's notes into a short explainer.\n\nSuggested next step: add the first bullet to your Daily Compass plan.`;
}

export function thumbnailConcepts(topic: string) {
  const t = topic.trim() || "your topic";
  return [
    { title: "Split-face reaction", desc: `Close-up reaction on the left, bold 3-word text on the right about ${t}.`, palette: ["#FF5A3C", "#FF2D78", "#1B1526"] },
    { title: "Big number", desc: `Huge numeral (e.g. "7 DAYS") with ${t} as a subtitle and a heavy drop shadow.`, palette: ["#12B39A", "#7CE577", "#0F1A18"] },
    { title: "Before / after", desc: `Two panels with a bright divider, arrow pointing right, ${t} label at the bottom.`, palette: ["#FFB020", "#FF5A3C", "#221204"] },
  ];
}

export function resumeDraft(job: string, name: string) {
  const role = (job.split("\n")[0] || "the role").slice(0, 60);
  return {
    score: 78 + (job.length % 15),
    keywords: ["ownership", "collaboration", "data-informed", "communication", "delivery"],
    resume: `${name || "Your Name"}\nTailored for: ${role}\n\nSUMMARY\nOutcome-focused candidate with a track record of shipping work end to end and communicating clearly across teams.\n\nEXPERIENCE\n• Led a project from scoping to delivery, cutting turnaround time by roughly 30%.\n• Partnered across teams to unblock decisions and keep timelines realistic.\n• Built lightweight processes that were actually adopted.\n\nSKILLS\nCommunication · Planning · Analysis · Tools relevant to ${role}`,
    cover: `Hi,\n\nI'm applying for ${role}. What caught my attention is how much of the work depends on clear communication and follow-through — that's the part I'm genuinely good at.\n\nIn my last role I owned projects end to end, kept the people around me informed, and shipped on the dates I promised. I'd bring the same steadiness here.\n\nHappy to walk through specifics whenever suits you.\n\nThanks for your time,\n${name || "Your Name"}`,
  };
}

/* ---------------- Grow Hub: mock AI ---------------- */

export function summarize(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 20);
  const picks = sentences.slice(0, 3);
  return {
    summary:
      picks.length > 0
        ? picks.map((s, i) => `${i + 1}. ${s.trim()}`).join("\n")
        : "1. The material covers one core idea and a few supporting details.\n2. Focus on the main claim first — the examples exist to prove it.\n3. Re-read the last section; that's usually where the conclusion hides.",
    flashcards: [
      { q: "What is the main idea here?", a: picks[0]?.slice(0, 120) || "The central claim of the material." },
      { q: "Which detail supports it best?", a: picks[1]?.slice(0, 120) || "The strongest supporting example." },
      { q: "How would you explain it in one line?", a: "In plain words, to someone who has never seen this before." },
    ],
    quiz: [
      { q: "The material is mainly about…", options: ["A single core idea", "Five unrelated topics", "A list of dates"], answer: 0 },
      { q: "The best way to retain this is…", options: ["Re-reading passively", "Explaining it out loud", "Highlighting everything"], answer: 1 },
      { q: "Supporting examples exist to…", options: ["Fill space", "Prove the main claim", "Confuse you"], answer: 1 },
    ],
  };
}

export function meetingNotes(text: string) {
  return {
    summary:
      "The group aligned on scope and agreed the timeline is tight but workable. Two open questions were parked for the next session, and owners were named for everything else.",
    decisions: ["Scope stays as-is for this cycle", "Weekly check-in moved to Thursday", "Budget question deferred to next review"],
    actions: [
      { who: "You", what: "Share the summary with the group", when: "Today" },
      { who: "You", what: "Draft the one-pager for review", when: "In 2 days" },
      { who: "Team", what: "Confirm availability for Thursday", when: "This week" },
    ],
    length: `${Math.max(1, Math.round(text.length / 900))} min read`,
  };
}

/* ---------------- Community Lite ---------------- */

export const suggestedFriends = [
  { id: "f1", name: "Aarav", avatar: "🦊", streak: 12, challenges: 9 },
  { id: "f2", name: "Meera", avatar: "🌸", streak: 21, challenges: 14 },
  { id: "f3", name: "Dev", avatar: "🎧", streak: 5, challenges: 4 },
  { id: "f4", name: "Sana", avatar: "⚡", streak: 33, challenges: 22 },
  { id: "f5", name: "Kabir", avatar: "🍜", streak: 8, challenges: 6 },
];
