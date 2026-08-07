import { useCallback, useEffect, useState } from "react";

export type UserType = "student" | "professional" | "parent" | "creator" | "personal";
export type Tier = "basic" | "advanced" | "pro";

export interface Task {
  id: string;
  text: string;
  done: boolean;
  minutes: number;
  start?: string;
  priority: "low" | "normal" | "high";
  createdAt: string;
}

export interface Routine {
  id: string;
  name: string;
  time: string;
  days: string[];
  active: boolean;
}

export interface Capture {
  id: string;
  text: string;
  createdAt: string;
  sorted: boolean;
}

export interface Expense {
  id: string;
  label: string;
  amount: number;
  category: string;
  recurring: boolean;
  createdAt: string;
}

export interface Win {
  id: string;
  title: string;
  kind: "create" | "grow" | "compass" | "streak" | "badge";
  createdAt: string;
}

export interface MoodEntry {
  date: string;
  mood: string;
  note: string;
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  streak: number;
  challenges: number;
}

export interface FabuosState {
  signedIn: boolean;
  name: string;
  email: string;
  onboarded: boolean;
  userType: UserType | null;
  theme: "dark" | "light";
  tier: Tier;
  aiUsedToday: number;
  aiDate: string;
  xp: number;
  streak: number;
  lastCheckIn: string | null;
  challengeDoneDate: string | null;
  badges: string[];
  tasks: Task[];
  routines: Routine[];
  captures: Capture[];
  expenses: Expense[];
  moods: MoodEntry[];
  wins: Win[];
  communityOptIn: boolean;
  friends: Friend[];
  lastActivity: { label: string; to: string } | null;
}

export const FREE_DAILY_AI = 5;
export const XP_PER_LEVEL = 120;

const KEY = "fabuos.state.v2";

export const todayKey = () => new Date().toISOString().slice(0, 10);

export const levelFromXp = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;
export const levelProgress = (xp: number) => (xp % XP_PER_LEVEL) / XP_PER_LEVEL;

const initialState: FabuosState = {
  signedIn: false,
  name: "",
  email: "",
  onboarded: false,
  userType: null,
  theme: "dark",
  tier: "basic",
  aiUsedToday: 0,
  aiDate: todayKey(),
  xp: 0,
  streak: 0,
  lastCheckIn: null,
  challengeDoneDate: null,
  badges: [],
  tasks: [],
  routines: [],
  captures: [],
  expenses: [],
  moods: [],
  wins: [],
  communityOptIn: false,
  friends: [],
  lastActivity: null,
};

function read(): FabuosState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    const parsed = { ...initialState, ...JSON.parse(raw) } as FabuosState;
    if (parsed.aiDate !== todayKey()) {
      parsed.aiDate = todayKey();
      parsed.aiUsedToday = 0;
    }
    return parsed;
  } catch {
    return initialState;
  }
}

const listeners = new Set<(s: FabuosState) => void>();
let current: FabuosState = typeof window === "undefined" ? initialState : read();

function write(next: FabuosState) {
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — state stays in memory */
  }
  listeners.forEach((l) => l(next));
}

export const getState = () => current;

export function useFabuos() {
  const [state, setState] = useState<FabuosState>(current);

  useEffect(() => {
    listeners.add(setState);
    setState(current);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const update = useCallback((patch: Partial<FabuosState> | ((s: FabuosState) => Partial<FabuosState>)) => {
    const p = typeof patch === "function" ? patch(current) : patch;
    write({ ...current, ...p });
  }, []);

  const unlimitedAI = state.tier !== "basic";
  const aiLeft = unlimitedAI ? Infinity : Math.max(0, FREE_DAILY_AI - state.aiUsedToday);

  const spendAI = useCallback(() => {
    if (current.tier !== "basic") return true;
    if (current.aiUsedToday >= FREE_DAILY_AI) return false;
    write({ ...current, aiUsedToday: current.aiUsedToday + 1, aiDate: todayKey() });
    return true;
  }, []);

  const addXp = useCallback((amount: number) => {
    write({ ...current, xp: current.xp + amount });
  }, []);

  const addWin = useCallback((title: string, kind: Win["kind"], xp = 10) => {
    write({
      ...current,
      xp: current.xp + xp,
      wins: [{ id: crypto.randomUUID(), title, kind, createdAt: new Date().toISOString() }, ...current.wins].slice(0, 100),
    });
  }, []);

  const awardBadge = useCallback((badge: string) => {
    if (current.badges.includes(badge)) return false;
    write({
      ...current,
      badges: [...current.badges, badge],
      wins: [
        { id: crypto.randomUUID(), title: `Badge unlocked — ${badge}`, kind: "badge" as const, createdAt: new Date().toISOString() },
        ...current.wins,
      ].slice(0, 100),
    });
    return true;
  }, []);

  const setLastActivity = useCallback((label: string, to: string) => {
    write({ ...current, lastActivity: { label, to } });
  }, []);

  /** Returns true when this check-in extended the streak (worth celebrating). */
  const checkIn = useCallback(() => {
    const today = todayKey();
    if (current.lastCheckIn === today) return false;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const streak = current.lastCheckIn === yesterday ? current.streak + 1 : 1;
    write({ ...current, lastCheckIn: today, streak, xp: current.xp + 15 });
    return true;
  }, []);

  const toggleTheme = useCallback(() => {
    write({ ...current, theme: current.theme === "dark" ? "light" : "dark" });
  }, []);

  const reset = useCallback(() => write({ ...initialState }), []);

  return {
    state,
    update,
    aiLeft,
    unlimitedAI,
    spendAI,
    addXp,
    addWin,
    awardBadge,
    checkIn,
    setLastActivity,
    toggleTheme,
    reset,
    level: levelFromXp(state.xp),
    progress: levelProgress(state.xp),
  };
}
