import { ShieldOff } from "lucide-react";

export default function WebsiteClosed() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-to-r from-destructive via-red-500 to-orange-500 rounded-full blur-2xl opacity-30 animate-pulse" />
          <div className="relative bg-gradient-to-br from-muted to-muted/50 p-8 rounded-full border border-border/50">
            <ShieldOff className="h-16 w-16 text-destructive" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-destructive via-red-500 to-orange-500 bg-clip-text text-transparent">
            Website Closed
          </h1>
        </div>

        <p className="text-lg text-muted-foreground leading-relaxed px-4">
          This website has been closed. We apologize for the inconvenience.
        </p>

        <div className="flex justify-center gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-destructive animate-pulse"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        <p className="text-xs text-muted-foreground/60">
          If you believe this is an error, please contact the administrator.
        </p>
      </div>
    </div>
  );
}
