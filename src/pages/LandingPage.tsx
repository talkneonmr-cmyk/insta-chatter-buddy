import { useState, useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import fabulousLogo from "@/assets/fabulous-logo.png";

type IconName = "sparkles" | "wand" | "music" | "image" | "mic" | "video" | "trend" | "globe" | "arrow" | "down" | "star" | "zap" | "shield" | "menu" | "x" | "play";

const iconPaths: Record<IconName, ReactNode> = {
  sparkles: <path d="M12 2l1.7 5.1L19 9l-5.3 1.9L12 16l-1.7-5.1L5 9l5.3-1.9L12 2Zm7 11 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3ZM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z" />,
  wand: <path d="m14 4 6 6M4 20l10.5-10.5M13 5l6 6M5 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Zm14 10 .8 1.7 1.7.8-1.7.8L19 19l-.8-1.7-1.7-.8 1.7-.8L19 14Z" />,
  music: <path d="M9 18V5l11-2v13M9 18a3 3 0 1 1-2-2.8M20 16a3 3 0 1 1-2-2.8M9 9l11-2" />,
  image: <path d="M4 5h16v14H4V5Zm3 10 3.5-4 2.5 3 2-2.3L19 16M8 9h.01" />,
  mic: <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm7 8a7 7 0 0 1-14 0m7 7v3m-4 0h8" />,
  video: <path d="M4 6h12v12H4V6Zm12 4 5-3v10l-5-3" />,
  trend: <path d="m3 17 6-6 4 4 8-8m0 0v6m0-6h-6" />,
  globe: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5-2.4 4-5.4 4-9s-1.5-6.6-4-9c-2.5 2.4-4 5.4-4 9s1.5 6.6 4 9Zm-8-9h16" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6-4.4-4.3 6.1-.9L12 3Z" />,
  zap: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  shield: <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  play: <path d="M8 5v14l11-7L8 5Z" />,
};

const Icon = ({ name, className = "" }: { name: IconName; className?: string }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill={name === "star" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {iconPaths[name]}
  </svg>
);

const useInView = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

const Section = ({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) => {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const features = [
  { icon: "wand" as const, title: "AI Script Writer", desc: "Generate engaging scripts for any platform in seconds" },
  { icon: "music" as const, title: "Music Generator", desc: "Create royalty-free background music with AI" },
  { icon: "image" as const, title: "Thumbnail Designer", desc: "Design scroll-stopping thumbnails that convert" },
  { icon: "mic" as const, title: "Voice Cloning", desc: "Clone any voice and generate natural speech" },
  { icon: "video" as const, title: "Shorts Factory", desc: "Turn long videos into viral short-form content" },
  { icon: "trend" as const, title: "Trend Analyzer", desc: "Discover trending topics before they peak" },
  { icon: "globe" as const, title: "SEO Optimizer", desc: "Rank higher with AI-optimized metadata" },
  { icon: "sparkles" as const, title: "Caption Generator", desc: "Write captions that boost engagement 3×" },
];

const steps = [
  { num: "01", title: "Sign Up Free", desc: "Create your account in under 30 seconds. No credit card required." },
  { num: "02", title: "Choose Your Tool", desc: "Pick from 15+ AI-powered tools designed for content creators." },
  { num: "03", title: "Create & Publish", desc: "Generate professional content and publish directly to your channels." },
];

const testimonials = [
  { name: "Alex R.", role: "YouTuber · 500K subs", text: "Fabuos cut my content creation time by 70%. The AI script writer alone is worth it.", avatar: "AR" },
  { name: "Priya M.", role: "Social Media Manager", text: "The thumbnail generator is insane. My CTR went up 40% in the first week.", avatar: "PM" },
  { name: "Jordan L.", role: "Podcast Host", text: "Voice cloning and TTS are game changers. I can produce content 5× faster now.", avatar: "JL" },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── Navbar ─── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <button onClick={() => scrollTo("hero")} className="flex items-center gap-2.5 group">
            <img src={fabulousLogo} alt="Fabuos" className="h-9 w-9 rounded-xl group-hover:scale-105 transition-transform" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Fabuos
            </span>
          </button>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            {["features", "how-it-works", "testimonials"].map((s) => (
              <button key={s} onClick={() => scrollTo(s)} className="hover:text-foreground transition-colors capitalize">
                {s.replace("-", " ")}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate("/auth")} className="inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all">
              Log in
            </button>
            <button
              onClick={() => { navigate("/auth"); }}
              className="inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25 transition-all"
            >
              Get Started Free
            </button>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Icon name={mobileMenuOpen ? "x" : "menu"} className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border animate-fade-in">
            <div className="px-4 py-4 space-y-3">
              {["features", "how-it-works", "testimonials"].map((s) => (
                <button key={s} onClick={() => scrollTo(s)} className="block w-full text-left py-2 text-muted-foreground hover:text-foreground capitalize">
                  {s.replace("-", " ")}
                </button>
              ))}
              <div className="flex gap-3 pt-2">
                <button className="flex-1 inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all" onClick={() => navigate("/auth")}>Log in</button>
                <button className="flex-1 inline-flex h-10 items-center justify-center rounded-md bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-medium text-primary-foreground transition-all" onClick={() => navigate("/auth")}>Sign Up</button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[120px] animate-float" style={{ animationDelay: "2s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-sm font-medium text-primary animate-fade-in">
            <Icon name="zap" className="w-3.5 h-3.5" />
            AI-Powered Content Creation Platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight animate-fade-in">
            Create Content That
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Breaks the Internet
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            15+ AI tools in one platform. Write scripts, generate music, design thumbnails, clone voices, and grow your audience — all without leaving Fabuos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center justify-center rounded-md text-base font-medium px-8 py-4 bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground hover:opacity-90 shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-300 group"
            >
              Start Creating Free
              <Icon name="arrow" className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => scrollTo("features")}
              className="inline-flex items-center justify-center rounded-md border border-border/60 bg-background text-base font-medium px-8 py-4 hover:bg-accent/5 transition-all group"
            >
              <Icon name="play" className="w-4 h-4 mr-1" />
              See What's Possible
            </button>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-4 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.6s" }}>
            {[
              { icon: "star" as const, label: "4.9/5 Rating" },
              { icon: "zap" as const, label: "10K+ Creators" },
              { icon: "shield" as const, label: "No Credit Card" },
            ].map(({ icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon name={icon} className="w-4 h-4 text-primary" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={() => scrollTo("features")}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors animate-bounce"
        >
          <Icon name="down" className="w-6 h-6" />
        </button>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 sm:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Section className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Powerful Tools</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Everything You Need to Create</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From ideation to publication, our AI handles the heavy lifting so you can focus on what matters — your creativity.
            </p>
          </Section>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <Section key={f.title} delay={i * 80}>
                <div className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 h-full">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${f.color} mb-4`}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-24 sm:py-32 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <Section className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Up & Running in Minutes</h2>
          </Section>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <Section key={s.num} delay={i * 120}>
                <div className="relative text-center md:text-left">
                  <span className="text-6xl sm:text-7xl font-black bg-gradient-to-b from-primary/20 to-transparent bg-clip-text text-transparent select-none">
                    {s.num}
                  </span>
                  <h3 className="text-xl font-bold mt-2 mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="py-24 sm:py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <Section className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Loved by Creators</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">What Creators Are Saying</h2>
          </Section>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Section key={t.name} delay={i * 100}>
                <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed flex-1 mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 sm:py-32 px-4 sm:px-6">
        <Section>
          <div className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border border-primary/20 p-10 sm:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Ready to Create Something
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Amazing</span>?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Join thousands of creators who are already using Fabuos to produce world-class content.
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-base px-10 py-6 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 shadow-2xl shadow-primary/30 hover:scale-105 transition-all duration-300 group"
              >
                Get Started — It's Free
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </Section>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/50 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src={fabulousLogo} alt="Fabuos" className="h-8 w-8 rounded-lg" />
              <span className="font-bold text-lg">Fabuos</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate("/about")} className="hover:text-foreground transition-colors">About</button>
              <button onClick={() => navigate("/press")} className="hover:text-foreground transition-colors">Press</button>
              <button onClick={() => navigate("/pricing")} className="hover:text-foreground transition-colors">Pricing</button>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Fabulous Creators. Founded by Jagrit Khundia.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
