export function Splash() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground"
      style={{ backgroundImage: "var(--gradient-mesh)" }}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-3xl blur-2xl opacity-70" style={{ background: "var(--gradient-3d)" }} />
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-3xl font-heading text-3xl font-extrabold text-primary-foreground"
          style={{ background: "var(--gradient-3d)" }}
        >
          F
        </div>
      </div>
      <p className="mt-6 font-heading text-xl font-extrabold tracking-tight">Fabuos</p>
      <p className="mt-1 text-sm text-muted-foreground">One app. Everything you actually use.</p>
      <div className="mt-6 h-1.5 w-32 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 animate-pulse rounded-full" style={{ background: "var(--gradient-3d)" }} />
      </div>
    </div>
  );
}

export default Splash;
