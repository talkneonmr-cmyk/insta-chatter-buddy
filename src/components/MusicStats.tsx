import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Music, Clock, Heart, TrendingUp } from "lucide-react";

interface Stats {
  totalGenerations: number;
  totalFavorites: number;
  averageGenerationTime: number;
  topTags: { tag: string; count: number }[];
  formatsUsed: { format: string; count: number }[];
  generationsOverTime: { date: string; count: number }[];
}

export default function MusicStats() {
  const [stats, setStats] = useState<Stats>({
    totalGenerations: 0,
    totalFavorites: 0,
    averageGenerationTime: 0,
    topTags: [],
    formatsUsed: [],
    generationsOverTime: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: generations, error } = await supabase
        .from("music_generations")
        .select("*");

      if (error) throw error;

      if (!generations) {
        setLoading(false);
        return;
      }

      // Calculate statistics
      const totalGenerations = generations.length;
      const totalFavorites = generations.filter((g) => g.is_favorite).length;
      
      const avgTime = generations
        .filter((g) => g.generation_time_ms)
        .reduce((sum, g) => sum + (g.generation_time_ms || 0), 0) / totalGenerations;

      // Top tags
      const tagCounts: Record<string, number> = {};
      generations.forEach((g) => {
        g.tags?.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      const topTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Formats used
      const formatCounts: Record<string, number> = {};
      generations.forEach((g) => {
        formatCounts[g.output_format] = (formatCounts[g.output_format] || 0) + 1;
      });
      const formatsUsed = Object.entries(formatCounts).map(([format, count]) => ({
        format: format.toUpperCase(),
        count,
      }));

      // Generations over time (last 7 days)
      const today = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split("T")[0];
      });

      const generationsOverTime = last7Days.map((date) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: generations.filter((g) => g.created_at.startsWith(date)).length,
      }));

      setStats({
        totalGenerations,
        totalFavorites,
        averageGenerationTime: avgTime / 1000, // Convert to seconds
        topTags,
        formatsUsed,
        generationsOverTime,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({
        title: "Error",
        description: "Failed to load statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#8b5cf6", "#ec4899"];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Statistics & Insights
        </h3>
        <p className="text-muted-foreground">
          Track your music generation journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-purple-500/5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Generations</p>
              <p className="text-3xl font-bold">{stats.totalGenerations}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-pink-500/10 to-purple-500/5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-pink-500/20">
              <Heart className="h-6 w-6 text-pink-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Favorites</p>
              <p className="text-3xl font-bold">{stats.totalFavorites}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-500/20">
              <Clock className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Generation Time</p>
              <p className="text-3xl font-bold">{stats.averageGenerationTime.toFixed(1)}s</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/20">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-3xl font-bold">
                {stats.generationsOverTime.reduce((sum, day) => sum + day.count, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="text-lg font-bold mb-4">Top Tags</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.topTags}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="tag" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h4 className="text-lg font-bold mb-4">Format Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.formatsUsed}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ format, count }) => `${format} (${count})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {stats.formatsUsed.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <h4 className="text-lg font-bold mb-4">Generation Activity (Last 7 Days)</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stats.generationsOverTime}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
