import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface UsageResetCountdownProps {
  resetAt?: string;
  className?: string;
}

export default function UsageResetCountdown({ resetAt, className = "" }: UsageResetCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const reset = resetAt ? new Date(resetAt) : new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      // If reset time has passed, calculate next reset (24 hours from reset time)
      while (reset < now) {
        reset.setTime(reset.getTime() + 24 * 60 * 60 * 1000);
      }
      
      const diff = reset.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours}h ${minutes}m`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [resetAt]);

  return (
    <div className={`inline-flex items-center gap-1.5 text-sm text-muted-foreground ${className}`}>
      <Clock className="h-3.5 w-3.5" />
      <span>Resets in {timeLeft}</span>
    </div>
  );
}
