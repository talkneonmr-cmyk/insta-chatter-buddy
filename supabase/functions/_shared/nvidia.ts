// Shared NVIDIA NIM fallback helper
// 3 separate keys, one per model, OpenAI-compatible API at NVIDIA's endpoint.

const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1/chat/completions";

export type NvidiaTier = "nano" | "8b" | "70b";

const MODEL_MAP: Record<NvidiaTier, { model: string; envKey: string }> = {
  nano: { model: "nvidia/llama-3.1-nemotron-nano-8b-v1", envKey: "NVIDIA_NEMOTRON_NANO_API_KEY" },
  "8b": { model: "meta/llama-3.1-8b-instruct", envKey: "NVIDIA_LLAMA_8B_API_KEY" },
  "70b": { model: "meta/llama-3.1-70b-instruct", envKey: "NVIDIA_LLAMA_70B_API_KEY" },
};

export interface NvidiaCallOptions {
  tier?: NvidiaTier;
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export async function callNvidia(opts: NvidiaCallOptions): Promise<string> {
  const tier = opts.tier ?? "8b";
  const cfg = MODEL_MAP[tier];
  const apiKey = Deno.env.get(cfg.envKey);
  if (!apiKey) throw new Error(`${cfg.envKey} not configured`);

  const messages: Array<{ role: string; content: string }> = [];
  if (opts.systemPrompt) messages.push({ role: "system", content: opts.systemPrompt });
  messages.push({ role: "user", content: opts.userPrompt });

  const res = await fetch(NVIDIA_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: opts.temperature ?? 0.7,
      top_p: opts.topP ?? 0.95,
      max_tokens: opts.maxTokens ?? 1024,
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NVIDIA ${tier} error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("NVIDIA: empty response");
  return content;
}

export function hasNvidia(tier: NvidiaTier): boolean {
  return !!Deno.env.get(MODEL_MAP[tier].envKey);
}

// Returns an object shaped like a Lovable AI / OpenAI chat completion response,
// so call sites that read `data.choices[0].message.content` keep working.
export async function callNvidiaAsOpenAI(opts: NvidiaCallOptions): Promise<{ choices: Array<{ message: { content: string } }> }> {
  const content = await callNvidia(opts);
  return { choices: [{ message: { content } }] };
}

// Try a list of NVIDIA tiers in order; return first success.
export async function nvidiaFallback(opts: Omit<NvidiaCallOptions, "tier"> & { tiers: NvidiaTier[] }) {
  let lastErr: unknown;
  for (const tier of opts.tiers) {
    if (!hasNvidia(tier)) continue;
    try {
      return await callNvidiaAsOpenAI({ ...opts, tier });
    } catch (e) {
      console.error(`NVIDIA ${tier} fallback failed:`, e);
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("No NVIDIA tier available");
}
