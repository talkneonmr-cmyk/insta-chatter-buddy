import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  monitored_post_id: z.string().min(1, "Please select a post"),
  trigger_keywords: z.string().min(1, "At least one keyword is required"),
  tone: z.string().min(1, "Please select a tone"),
  goal: z.string().min(1, "Please select a goal"),
});

interface RuleFormProps {
  initialData?: any;
  onSuccess: () => void;
}

export function RuleForm({ initialData, onSuccess }: RuleFormProps) {
  const queryClient = useQueryClient();

  const { data: posts } = useQuery({
    queryKey: ["monitored_posts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("monitored_posts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      monitored_post_id: initialData?.monitored_post_id || "",
      trigger_keywords: initialData?.trigger_keywords || "",
      tone: initialData?.tone || "friendly",
      goal: initialData?.goal || "share coupon",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("automation_rules")
        .insert({
          user_id: user.id,
          name: values.name,
          monitored_post_id: values.monitored_post_id,
          trigger_keywords: values.trigger_keywords,
          tone: values.tone,
          goal: values.goal,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_rules"] });
      toast.success("Rule created successfully");
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to create rule");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { error } = await supabase
        .from("automation_rules")
        .update(values)
        .eq("id", initialData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_rules"] });
      toast.success("Rule updated successfully");
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to update rule");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (initialData) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rule Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Coupon Distribution Rule" {...field} />
              </FormControl>
              <FormDescription>A descriptive name for this automation rule</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="monitored_post_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monitored Post</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a post" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {posts?.map((post) => (
                    <SelectItem key={post.id} value={post.id}>
                      {post.post_title || post.post_url}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {posts?.length === 0 ? "No active posts. Add a post first." : "Select which post to monitor"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trigger_keywords"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trigger Keywords</FormLabel>
              <FormControl>
                <Input placeholder="interested, yes, want, DM me, send me" {...field} />
              </FormControl>
              <FormDescription>Comma-separated keywords that will trigger the automation</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tone</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="helpful">Helpful</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>The tone of the automated DM response</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="goal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="share coupon">Share Coupon</SelectItem>
                  <SelectItem value="book appointment">Book Appointment</SelectItem>
                  <SelectItem value="provide info">Provide Info</SelectItem>
                  <SelectItem value="generate lead">Generate Lead</SelectItem>
                  <SelectItem value="event registration">Event Registration</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>The goal of this automation</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {initialData ? "Update Rule" : "Create Rule"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
