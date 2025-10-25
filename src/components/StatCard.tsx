import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  loading?: boolean;
}

export const StatCard = ({ icon: Icon, label, value, loading }: StatCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (loading) return;
    
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, loading]);

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 hover:shadow-lg transition-all duration-300">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {displayValue.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
