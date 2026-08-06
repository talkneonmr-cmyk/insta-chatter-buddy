import { useCallback, useEffect, useState } from "react";

export type Interest = "gaming" | "school" | "content" | "fitness" | "music" | "fashion";

export interface Win {
  id: string;
  title: string;
  kind: "create" | "life" | "streak";
  createdAt: string;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
}

export interface MoodEntry {
  date: string;
  mood: string;
  note: string;
}

export interface FabuosState {
  signedIn: boolean;
  name: string;
  onboarded: boolean;
  interests: Interest[];
  plus: boolean;
  creditsUsedToday: number;
  creditsDate: string;
  streak: number;
  lastCheckIn: string | null;
  challengeDoneDate: string | null;
  focusMinutes: number;
  wins: Win[];
  todos: Todo[];
  moods: MoodEntry[];
  lastActivity: { label: string; to: string } | null;
}

export const FREE_DAILY_CREDITS = 5;

const KEY = "fabuos.state.v1";

export const todayKey = () => new Date().toISOString().slice(0, 10);

const initialState: FabuosState = {
  signedIn: false,
  name: "",
  onboarded: false,
  interests: [],
  plus: false,
  creditsUsedToday: 0,
  creditsDate: todayKey(),
  streak: 0,
  lastCheckIn: null,
  challengeDoneDate: null,
  focusMinutes: 0,
  wins: [],
  todos: [],
  moods: [],
  lastActivity: null,
};

function read(): FabuosState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    const parsed = { ...initialState, ...JSON.parse(raw) } as FabuosState;
    if (parsed.creditsDate !== todayKey()) {
      parsed.creditsDate = todayKey();
      parsed.creditsUsedToday = 0;
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

  const creditsLeft = state.plus ? Infinity : Math.max(0, FREE_DAILY_CREDITS - state.creditsUsedToday);

  const spendCredit = useCallback(() => {
    if (current.plus) return true;
    if (current.creditsUsedToday >= FREE_DAILY_CREDITS) return false;
    write({ ...current, creditsUsedToday: current.creditsUsedToday + 1, creditsDate: todayKey() });
    return true;
  }, []);

  const addWin = useCallback((title: string, kind: Win["kind"]) => {
    write({
      ...current,
      wins: [{ id: crypto.randomUUID(), title, kind, createdAt: new Date().toISOString() }, ...current.wins].slice(0, 60),
    });
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
    write({ ...current, lastCheckIn: today, streak });
    return true;
  }, []);

  const reset = useCallback(() => write({ ...initialState }), []);

  return { state, update, creditsLeft, spendCredit, addWin, checkIn, setLastActivity, reset };
}
