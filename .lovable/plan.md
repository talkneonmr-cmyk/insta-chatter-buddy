## Dr. Fabuos AI — Premium Medical AI Assistant

A new standalone, ChatGPT-style medical AI experience inside the platform, accessible at `/dr-fabuos` (and a public landing at `/dr-fabuos-ai`).

### 1. Routes & Pages

- `**/dr-fabuos-ai**` — Public SEO landing page (intro, features, FAQ, schema markup). Crawlable, no auth needed.
- `**/dr-fabuos**` — The chat app itself. Works in **guest mode** (no auth) AND logged-in mode.
- Add link in sidebar (logged-in users) and on landing page hero.

### 2. Guest Mode (ChatGPT-style)

- No login required to start chatting.
- Guest chats stored in `localStorage` only (temporary, no server save).
- Daily message limit for guests: **10 messages / 24h** (tracked via localStorage + IP-based soft limit in edge function).
- Image upload limited to **2/day** for guests.
- Soft upsell: after limit hit → modal "Sign in to continue + save chats + unlimited".
- Logged-in users: unlimited (subject to plan), full history saved to DB.

### 3. Database (logged-in users only)

New tables:

- `dr_fabuos_conversations` — id, user_id, title, created_at, updated_at
- `dr_fabuos_messages` — id, conversation_id, user_id, role (user/assistant), content, attachments (jsonb), created_at

RLS: users only see their own. No table for guests.

### 4. Edge Function: `dr-fabuos-chat`

- Streams responses (SSE) for ChatGPT-like typing feel.
- System prompt enforces: medical-only scope, natural human-doctor tone, concise replies, multilingual auto-detect, safety disclaimers, emergency detection.
- Off-topic guard: politely redirects non-medical questions back to health topics.
- Vision support for prescription/skin/report image analysis.
- Provider chain (resilience): Lovable AI Gateway (`google/gemini-2.5-flash` for speed, `gemini-2.5-pro` for vision/complex) → OpenAI → NVIDIA Llama 70B fallback.
- Guest rate limiting via IP + a simple in-memory/edge counter.

### 5. UI / UX (premium)

- Dedicated layout — NOT wrapped in the existing `Layout` sidebar.
- Custom premium shell: collapsible chat-history sidebar (logged-in), centered chat area, sticky composer.
- Welcome screen: greeting, suggested prompts ("Explain my prescription", "Skin concern check", "Symptom guidance", "Medicine info"), quick action chips.
- Medical category pills (Skin, Symptoms, Medicines, Reports, General).
- Composer: text input, image upload (paperclip), voice input button (Web Speech API), send.
- Streaming markdown responses (`react-markdown`) with smooth token-by-token rendering.
- Typing indicator, message animations (fade-in/slide-up), glassmorphism cards.
- Image preview thumbnails inline in messages.
- Disclaimer banner at bottom: "Dr. Fabuos AI provides general guidance, not a substitute for a licensed physician. For emergencies call local services."
- Dark/light mode toggle.
- Mobile-first responsive.
- Premium branding: stethoscope/cross icon, gradient accent, clean serif/sans pairing distinct from rest of app.

### 6. Safety Layer

- Emergency keyword detector (chest pain, suicide, severe bleeding, etc.) → highlighted red banner with emergency numbers.
- Persistent footer disclaimer.
- System prompt: never prescribe controlled substances, always recommend consulting a real doctor for serious symptoms, but stay helpful (not over-restrictive).

### 7. Multilingual

- System prompt: "Detect the user's language from their message and reply in the SAME language naturally. Support Hindi, English, Urdu, Arabic, Spanish, etc. Match cultural tone."
- No UI language switcher needed — auto.

### 8. SEO & AI Discoverability

- `/dr-fabuos-ai` landing page: semantic HTML, single H1, meta title/description, OG tags, canonical, JSON-LD (`MedicalWebPage` + `FAQPage` + `SoftwareApplication`).
- Update `public/sitemap.xml` with new URLs.
- Update `public/llms.txt` with full Dr. Fabuos AI section (what it is, capabilities, languages, scanning features).
- FAQ section on landing page (also schema'd).
- Keywords targeted: "ai doctor", "doctor ai", "medical ai chatbot", "ai skin doctor", "prescription ai", "dr fabuos ai", etc.

### 9. Performance

- Lazy-load chat route in `AppRoutes.tsx`.
- Stream responses (no waiting for full reply).
- Lazy image previews, code-split markdown lib.
- Skeleton loaders.
- Optimistic UI on message send.

### 10. Files to Create / Edit

**Create:**

- `src/pages/DrFabuosAI.tsx` — public landing page (SEO).
- `src/pages/DrFabuos.tsx` — chat app shell.
- `src/components/dr-fabuos/ChatInterface.tsx`
- `src/components/dr-fabuos/MessageList.tsx`
- `src/components/dr-fabuos/Composer.tsx`
- `src/components/dr-fabuos/HistorySidebar.tsx`
- `src/components/dr-fabuos/WelcomeScreen.tsx`
- `src/components/dr-fabuos/EmergencyBanner.tsx`
- `src/hooks/useDrFabuosChat.ts` — streaming + guest/auth logic
- `supabase/functions/dr-fabuos-chat/index.ts`

**Edit:**

- `src/AppRoutes.tsx` — add routes (landing public, chat allowed both guest+auth so NOT inside ProtectedRoute).
- `src/App.tsx` — register the public landing route directly so it loads instantly.
- `src/components/AppSidebar.tsx` — add nav link.
- `public/sitemap.xml` — add URLs.
- `public/llms.txt` — add Dr. Fabuos AI section.
- `index.html` — no change needed (per-page meta via React Helmet-style direct DOM update or simple `<title>` updates in component).

**Migration:** create the two tables + RLS.

### 11. Future Scaling Recommendations (delivered post-build)

- Add real voice (TTS) playback via existing `text-to-speech` function.
- Add saved "medical profile" (allergies, conditions) per user for personalized replies.
- Add doctor-verified content library + RAG.
- Add file types: PDF reports parsing.
- Add per-conversation memory summaries to keep token costs low.
- Add admin moderation for flagged messages.

---

Ready to build this. I'll start with the migration, then edge function, then UI.  
  
dont mention chatgpt ok pls i mean jus users cant see

&nbsp;