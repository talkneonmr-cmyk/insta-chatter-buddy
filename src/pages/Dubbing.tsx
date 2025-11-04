import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Languages, Upload } from "lucide-react";

export default function Dubbing() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Languages className="h-8 w-8" />
          AI Dubbing
        </h1>
        <p className="text-muted-foreground">
          Translate and dub your audio to different languages
        </p>
      </div>

      {/* Development Notice */}
      <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
            <Upload className="h-5 w-5" />
            Feature Under Development
          </CardTitle>
          <CardDescription className="text-yellow-600 dark:text-yellow-400">
            Coming soon with advanced AI capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-yellow-700 dark:text-yellow-400">
            We're currently working on improving the AI dubbing feature to provide you with the best possible experience. 
            This feature will allow you to translate and dub audio files into multiple languages using advanced AI models.
          </p>
          <p className="text-yellow-700 dark:text-yellow-400">
            Stay tuned for updates! In the meantime, you can explore other powerful AI tools available in the sidebar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
