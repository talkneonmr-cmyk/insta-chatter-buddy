import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, Sparkles, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const videoSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().optional(),
  tags: z.string().optional(),
  categoryId: z.string().default("22"),
  privacyStatus: z.enum(["public", "private", "unlisted"]).default("private"),
  scheduledFor: z.string().min(1, "Schedule date is required"),
  useAI: z.boolean().default(false),
});

type VideoFormData = z.infer<typeof videoSchema>;

const VideoUploadForm = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const { toast } = useToast();

  const form = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      categoryId: "22",
      privacyStatus: "private",
      useAI: false,
    },
  });

  const handleGenerateMetadata = async () => {
    const title = form.getValues("title");
    const description = form.getValues("description");

    if (!title && !description) {
      toast({
        title: "Input Required",
        description: "Please provide at least a title or description to generate AI metadata.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-video-metadata', {
        body: {
          videoTitle: title,
          videoDescription: description,
        }
      });

      if (error) throw error;

      form.setValue("title", data.title);
      form.setValue("description", data.description);
      form.setValue("tags", data.tags.join(", "));

      toast({
        title: "Success",
        description: "AI metadata generated successfully!",
      });
    } catch (error) {
      console.error('Error generating metadata:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI metadata. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  const onSubmit = async (data: VideoFormData) => {
    if (!videoFile) {
      toast({
        title: "Error",
        description: "Please select a video file to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if YouTube account is connected
      const { data: ytAccount } = await supabase
        .from('youtube_accounts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!ytAccount) {
        toast({
          title: "Error",
          description: "Please connect your YouTube account first.",
          variant: "destructive",
        });
        return;
      }

      // Upload video file to storage
      const videoFileName = `${user.id}/${Date.now()}_${videoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Failed to upload video: ${uploadError.message}`);
      }

      const videoFilePath = `videos/${videoFileName}`;

      // Upload thumbnail if provided
      let thumbnailPath = null;
      if (thumbnailFile) {
        const thumbnailFileName = `${user.id}/${Date.now()}_${thumbnailFile.name}`;
        const { error: thumbError } = await supabase.storage
          .from('videos')
          .upload(thumbnailFileName, thumbnailFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (!thumbError) {
          thumbnailPath = `videos/${thumbnailFileName}`;
        }
      }

      // Parse tags
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

      // Insert scheduled video
      const { error: insertError } = await supabase
        .from('scheduled_videos')
        .insert({
          user_id: user.id,
          youtube_account_id: ytAccount.id,
          title: data.title,
          description: data.description || null,
          tags: tagsArray,
          category_id: data.categoryId,
          privacy_status: data.privacyStatus,
          video_file_path: videoFilePath,
          thumbnail_path: thumbnailPath,
          scheduled_for: data.scheduledFor,
          ai_generated_metadata: data.useAI,
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Video scheduled successfully!",
      });

      // Reset form
      form.reset();
      setVideoFile(null);
      setThumbnailFile(null);
    } catch (error) {
      console.error('Error scheduling video:', error);
      toast({
        title: "Error",
        description: "Failed to schedule video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Upload New Video</h3>
        <p className="text-sm text-muted-foreground">Schedule videos for automatic upload to YouTube</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Video File Upload */}
          <div className="space-y-2">
            <Label htmlFor="video-file">Video File *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              />
              {videoFile && <span className="text-sm text-muted-foreground">{videoFile.name}</span>}
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail-file">Thumbnail (Optional)</Label>
            <Input
              id="thumbnail-file"
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
            />
          </div>

          {/* AI Toggle */}
          <FormField
            control={form.control}
            name="useAI"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Use AI for Metadata
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Let AI generate optimized title, description, and tags
                  </p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter video title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter video description"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* AI Generate Button */}
          {form.watch("useAI") && (
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateMetadata}
              disabled={generatingAI}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {generatingAI ? "Generating..." : "Generate AI Metadata"}
            </Button>
          )}

          {/* Tags */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (comma-separated)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., vlog, tutorial, gaming" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Privacy Status */}
          <FormField
            control={form.control}
            name="privacyStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Privacy Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Schedule Date */}
          <FormField
            control={form.control}
            name="scheduledFor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Schedule For *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button type="submit" disabled={uploading} className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            {uploading ? "Scheduling..." : "Schedule Video"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default VideoUploadForm;