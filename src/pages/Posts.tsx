import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, ExternalLink, Edit, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PostCard } from "@/components/PostCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const postFormSchema = z.object({
  post_url: z.string().url("Must be a valid URL").includes("instagram.com", { message: "Must be an Instagram URL" }),
  post_title: z.string().min(1, "Title is required").max(200),
});

export default function Posts() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: instagramAccount } = useQuery({
    queryKey: ["instagram_account"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("instagram_accounts")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["monitored_posts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("monitored_posts")
        .select(`
          *,
          automation_rules (count)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<z.infer<typeof postFormSchema>>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      post_url: editingPost?.post_url || "",
      post_title: editingPost?.post_title || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof postFormSchema>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (!instagramAccount) {
        throw new Error("No Instagram account connected");
      }

      // Extract post ID from URL
      const urlMatch = values.post_url.match(/\/p\/([^\/]+)/);
      const postId = urlMatch ? urlMatch[1] : values.post_url;

      const { error } = await supabase
        .from("monitored_posts")
        .insert({
          user_id: user.id,
          instagram_account_id: instagramAccount.id,
          post_id: postId,
          post_url: values.post_url,
          post_title: values.post_title,
          thumbnail_url: null, // Will be populated by Instagram API later
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitored_posts"] });
      toast.success("Post added successfully");
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add post");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof postFormSchema>) => {
      const { error } = await supabase
        .from("monitored_posts")
        .update({
          post_url: values.post_url,
          post_title: values.post_title,
        })
        .eq("id", editingPost.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitored_posts"] });
      toast.success("Post updated successfully");
      setEditingPost(null);
      form.reset();
    },
    onError: () => {
      toast.error("Failed to update post");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("monitored_posts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitored_posts"] });
      toast.success("Post deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete post");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("monitored_posts")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitored_posts"] });
      toast.success("Post status updated");
    },
    onError: () => {
      toast.error("Failed to update post status");
    },
  });

  const onSubmit = (values: z.infer<typeof postFormSchema>) => {
    if (editingPost) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitored Posts</h1>
          <p className="text-muted-foreground">Manage Instagram posts for comment monitoring</p>
        </div>
        <Dialog open={isCreateOpen || !!editingPost} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setEditingPost(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPost ? "Edit Post" : "Add New Post"}</DialogTitle>
              <DialogDescription>
                {editingPost ? "Update the post details" : "Add an Instagram post to monitor for comments"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="post_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram Post URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.instagram.com/p/..." {...field} />
                      </FormControl>
                      <FormDescription>Paste the full Instagram post URL</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="post_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Summer Sale Announcement" {...field} />
                      </FormControl>
                      <FormDescription>A descriptive title for this post</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsCreateOpen(false);
                    setEditingPost(null);
                    form.reset();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingPost ? "Update Post" : "Add Post"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {!instagramAccount && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Instagram Account Connected</AlertTitle>
          <AlertDescription>
            Please connect your Instagram account in Settings before adding posts to monitor.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
      ) : posts?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No posts added yet</p>
            <p className="text-sm text-muted-foreground">Add your first Instagram post to start monitoring comments</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts?.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onToggleActive={(is_active) => toggleActiveMutation.mutate({ id: post.id, is_active })}
              onEdit={() => {
                setEditingPost(post);
                form.reset({
                  post_url: post.post_url,
                  post_title: post.post_title || "",
                });
              }}
              onDelete={() => deleteMutation.mutate(post.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
