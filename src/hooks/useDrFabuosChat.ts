import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Attachment = { type: "image"; dataUrl: string; name?: string };
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
};

const GUEST_LIMIT = 10;
const GUEST_KEY = "drfab_guest_msgs";
const GUEST_COUNT_KEY = "drfab_guest_count";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getGuestUsage() {
  try {
    const raw = localStorage.getItem(GUEST_COUNT_KEY);
    if (!raw) return { date: todayKey(), count: 0 };
    const parsed = JSON.parse(raw);
    if (parsed.date !== todayKey()) return { date: todayKey(), count: 0 };
    return parsed as { date: string; count: number };
  } catch {
    return { date: todayKey(), count: 0 };
  }
}

function bumpGuestUsage() {
  const u = getGuestUsage();
  const next = { date: todayKey(), count: u.count + 1 };
  localStorage.setItem(GUEST_COUNT_KEY, JSON.stringify(next));
  return next;
}

export function useDrFabuosChat(opts: { isAuthed: boolean; conversationId: string | null; onConversationCreated?: (id: string) => void }) {
  const { isAuthed, conversationId, onConversationCreated } = opts;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [guestUsage, setGuestUsage] = useState(getGuestUsage());
  const abortRef = useRef<AbortController | null>(null);

  // Load history
  useEffect(() => {
    if (isAuthed && conversationId) {
      (async () => {
        const { data } = await supabase
          .from("dr_fabuos_messages")
          .select("id, role, content, attachments")
          .eq("conversation_id", conversationId)
          .order("created_at");
        if (data) {
          setMessages(
            data.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              attachments: m.attachments || [],
            }))
          );
        }
      })();
    } else if (!isAuthed) {
      try {
        const raw = localStorage.getItem(GUEST_KEY);
        if (raw) setMessages(JSON.parse(raw));
        else setMessages([]);
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [isAuthed, conversationId]);

  // Persist guest messages
  useEffect(() => {
    if (!isAuthed) {
      try {
        localStorage.setItem(GUEST_KEY, JSON.stringify(messages.slice(-30)));
      } catch {}
    }
  }, [messages, isAuthed]);

  const reset = useCallback(() => {
    setMessages([]);
    if (!isAuthed) localStorage.removeItem(GUEST_KEY);
  }, [isAuthed]);

  const sendMessage = useCallback(
    async (text: string, attachments: Attachment[] = []) => {
      if (!text.trim() && attachments.length === 0) return;

      // Guest limit check
      if (!isAuthed) {
        const u = getGuestUsage();
        if (u.count >= GUEST_LIMIT) {
          toast.error("Daily free limit reached. Sign in to continue unlimited.");
          return;
        }
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        attachments,
      };
      const next = [...messages, userMsg];
      setMessages(next);
      setIsStreaming(true);

      // Build OpenAI-style messages with vision parts
      const apiMessages = next.map((m) => {
        if (m.attachments && m.attachments.length > 0) {
          return {
            role: m.role,
            content: [
              ...(m.content ? [{ type: "text", text: m.content }] : []),
              ...m.attachments.map((a) => ({
                type: "image_url",
                image_url: { url: a.dataUrl },
              })),
            ],
          };
        }
        return { role: m.role, content: m.content };
      });

      // Save / create conversation if authed
      let convId = conversationId;
      if (isAuthed) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (!convId) {
            const { data } = await supabase
              .from("dr_fabuos_conversations")
              .insert({ user_id: user.id, title: text.slice(0, 60) || "New consultation" })
              .select("id")
              .single();
            if (data) {
              convId = data.id;
              onConversationCreated?.(convId);
            }
          }
          if (convId) {
            await supabase.from("dr_fabuos_messages").insert({
              conversation_id: convId,
              user_id: user.id,
              role: "user",
              content: text,
              attachments: attachments as any,
            });
          }
        }
      } else {
        bumpGuestUsage();
        setGuestUsage(getGuestUsage());
      }

      // Stream
      const controller = new AbortController();
      abortRef.current = controller;
      const assistantId = crypto.randomUUID();
      let assistantContent = "";

      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dr-fabuos-chat`;
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: apiMessages, guest: !isAuthed }),
          signal: controller.signal,
        });

        if (!resp.ok || !resp.body) {
          const err = await resp.json().catch(() => ({}));
          toast.error(err.error || "Could not reach Dr. Fabuos right now.");
          setIsStreaming(false);
          return;
        }

        setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let done = false;

        while (!done) {
          const { done: d, value } = await reader.read();
          if (d) break;
          buf += decoder.decode(value, { stream: true });
          let nl;
          while ((nl = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line || line.startsWith(":")) continue;
            if (!line.startsWith("data: ")) continue;
            const j = line.slice(6).trim();
            if (j === "[DONE]") {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(j);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: assistantContent } : m))
                );
              }
            } catch {
              buf = line + "\n" + buf;
              break;
            }
          }
        }

        // Save assistant message
        if (isAuthed && convId && assistantContent) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("dr_fabuos_messages").insert({
              conversation_id: convId,
              user_id: user.id,
              role: "assistant",
              content: assistantContent,
            });
            await supabase
              .from("dr_fabuos_conversations")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", convId);
          }
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error(e);
          toast.error("Something went wrong. Please try again.");
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isAuthed, conversationId, onConversationCreated]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, sendMessage, isStreaming, stop, reset, guestUsage, guestLimit: GUEST_LIMIT };
}
