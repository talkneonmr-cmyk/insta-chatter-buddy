import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Stethoscope,
  ScanLine,
  Languages,
  Sun,
  Pill,
  HeartPulse,
  Shield,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: ScanLine, title: "Prescription scanner", desc: "Upload a photo of any prescription and get a plain-language explanation of every medicine, dose, and warning." },
  { icon: Sun, title: "Skin analysis", desc: "Share a photo of a rash, spot, or skin concern and get instant guidance on what it might be and what to do next." },
  { icon: HeartPulse, title: "Symptom guidance", desc: "Describe what you're feeling and get calm, doctor-style triage in seconds — without the WebMD panic." },
  { icon: Pill, title: "Medicine explainer", desc: "Ask anything about a medicine — how it works, side effects, interactions, and safer alternatives." },
  { icon: Languages, title: "Multilingual", desc: "Talks naturally in English, Hindi, Urdu, Arabic, Spanish and more — replies in the language you write in." },
  { icon: Shield, title: "Private & safe", desc: "No login required to start. Built-in safety guardrails escalate emergencies and recommend a real doctor when it matters." },
];

const FAQ = [
  { q: "What is Dr. Fabuos AI?", a: "Dr. Fabuos AI is a premium AI doctor and medical assistant. It answers health questions, explains prescriptions, analyzes skin photos, and guides you through symptoms in a calm, human way." },
  { q: "Is it free to use?", a: "Yes. You can chat instantly without signing up. Free guests get 10 messages per day. Sign in for unlimited messages, saved chat history, and more uploads." },
  { q: "Can it read my prescription?", a: "Yes. Upload a photo of any prescription or medicine label and Dr. Fabuos AI will explain it in plain language — what it treats, how to take it, and what to watch out for." },
  { q: "Can it analyze skin photos?", a: "Yes. Send a photo of a skin concern and the AI will describe what it sees, suggest possible causes, and tell you when you should see a real dermatologist." },
  { q: "What languages does it support?", a: "Hindi, English, Urdu, Arabic, Spanish, French, and many more. It auto-detects your language and replies in the same one — naturally." },
  { q: "Does it replace a real doctor?", a: "No. Dr. Fabuos AI is a brilliant first stop, but it is not a licensed physician. For emergencies or serious conditions, always see a real doctor." },
];

export default function DrFabuosLanding() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalWebPage",
        name: "Dr. Fabuos AI — AI Doctor & Medical Assistant",
        url: "https://fabuos.com/dr-fabuos-ai",
        description: "Premium AI doctor for medical questions, prescription scanning, skin analysis, and multilingual health guidance.",
        about: { "@type": "MedicalCondition", name: "General health, skin, medicines, symptoms" },
      },
      {
        "@type": "SoftwareApplication",
        name: "Dr. Fabuos AI",
        applicationCategory: "HealthApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "1280" },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Dr. Fabuos AI — AI Doctor for Prescriptions, Skin & Health</title>
        <meta
          name="description"
          content="Talk to Dr. Fabuos AI — a premium AI doctor that explains prescriptions, analyzes skin photos, and answers health questions in your language. Free to start."
        />
        <meta name="keywords" content="ai doctor, doctor ai, medical ai, ai skin doctor, prescription ai, health chatbot, dr fabuos ai, online ai doctor, medical assistant ai, skin ai" />
        <link rel="canonical" href="https://fabuos.com/dr-fabuos-ai" />
        <meta property="og:title" content="Dr. Fabuos AI — Your Personal AI Doctor" />
        <meta property="og:description" content="Premium AI doctor for prescriptions, skin, and health — multilingual and free to start." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://fabuos.com/dr-fabuos-ai" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background text-foreground">
        {/* Nav */}
        <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Dr. Fabuos AI</span>
            </Link>
            <Button asChild size="sm" className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
              <Link to="/dr-fabuos">Start chat</Link>
            </Button>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 pt-16 md:pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-6">
            <Sparkles className="h-3 w-3" /> Premium medical AI · Free to start
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
            Your personal
            <span className="block bg-gradient-to-br from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              AI doctor
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Dr. Fabuos AI explains prescriptions, analyzes skin, and answers health questions in your language —
            calm, clear, and human. No login required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2 shadow-lg shadow-emerald-500/20">
              <Link to="/dr-fabuos">
                Start chatting free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#features">See what it can do</a>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Built for real health questions</h2>
            <p className="mt-3 text-muted-foreground">Not a generic chatbot. A focused medical assistant.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <article key={f.title} className="p-6 rounded-2xl border border-border/60 bg-card/40 hover:bg-card/80 hover:border-emerald-500/30 transition-all">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 py-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center mb-10">Common questions</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-5 rounded-xl border border-border/60 bg-card/40 hover:bg-card/60 transition">
                <summary className="cursor-pointer font-medium flex items-center justify-between">
                  {f.q}
                  <span className="text-emerald-600 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="p-10 md:p-14 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/20">
            <Stethoscope className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Talk to Dr. Fabuos now</h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Free to start. No credit card. Sign in only when you want unlimited messages and saved history.
            </p>
            <Button asChild size="lg" className="mt-6 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2">
              <Link to="/dr-fabuos">
                Open Dr. Fabuos AI <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
          <p>
            Dr. Fabuos AI is for general guidance only and does not replace a licensed physician. For emergencies call your local emergency number.
          </p>
          <p className="mt-2">
            <Link to="/" className="hover:text-foreground transition">Back to Fabulous</Link>
          </p>
        </footer>
      </div>
    </>
  );
}
