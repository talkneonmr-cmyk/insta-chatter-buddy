export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      auto_pilot_settings: {
        Row: {
          auto_apply: boolean
          check_frequency_hours: number
          created_at: string | null
          enabled: boolean
          id: string
          last_run_at: string | null
          performance_threshold: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_apply?: boolean
          check_frequency_hours?: number
          created_at?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          performance_threshold?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_apply?: boolean
          check_frequency_hours?: number
          created_at?: string | null
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          performance_threshold?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          created_at: string | null
          goal: string | null
          id: string
          is_active: boolean | null
          monitored_post_id: string
          name: string
          tone: string | null
          trigger_keywords: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          goal?: string | null
          id?: string
          is_active?: boolean | null
          monitored_post_id: string
          name: string
          tone?: string | null
          trigger_keywords: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          goal?: string | null
          id?: string
          is_active?: boolean | null
          monitored_post_id?: string
          name?: string
          tone?: string | null
          trigger_keywords?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_monitored_post_id_fkey"
            columns: ["monitored_post_id"]
            isOneToOne: false
            referencedRelation: "monitored_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_operation_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          failure_count: number
          id: string
          operation_type: string
          success_count: number
          user_id: string
          videos_affected: number
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          failure_count?: number
          id?: string
          operation_type: string
          success_count?: number
          user_id: string
          videos_affected: number
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          failure_count?: number
          id?: string
          operation_type?: string
          success_count?: number
          user_id?: string
          videos_affected?: number
        }
        Relationships: []
      }
      caption_templates: {
        Row: {
          category: string
          created_at: string | null
          example_caption: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          suggested_hashtags: string[] | null
          template_structure: string
          usage_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          example_caption?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          suggested_hashtags?: string[] | null
          template_structure: string
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          example_caption?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          suggested_hashtags?: string[] | null
          template_structure?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      comments_log: {
        Row: {
          action_taken: string | null
          comment_id: string
          comment_text: string
          commenter_name: string | null
          commenter_username: string
          created_at: string | null
          id: string
          monitored_post_id: string
          trigger_matched: boolean | null
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          comment_id: string
          comment_text: string
          commenter_name?: string | null
          commenter_username: string
          created_at?: string | null
          id?: string
          monitored_post_id: string
          trigger_matched?: boolean | null
          user_id: string
        }
        Update: {
          action_taken?: string | null
          comment_id?: string
          comment_text?: string
          commenter_name?: string | null
          commenter_username?: string
          created_at?: string | null
          id?: string
          monitored_post_id?: string
          trigger_matched?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_log_monitored_post_id_fkey"
            columns: ["monitored_post_id"]
            isOneToOne: false
            referencedRelation: "monitored_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      dms_sent: {
        Row: {
          comment_log_id: string
          id: string
          message_text: string
          recipient_username: string
          sent_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          comment_log_id: string
          id?: string
          message_text: string
          recipient_username: string
          sent_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          comment_log_id?: string
          id?: string
          message_text?: string
          recipient_username?: string
          sent_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dms_sent_comment_log_id_fkey"
            columns: ["comment_log_id"]
            isOneToOne: false
            referencedRelation: "comments_log"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_captions: {
        Row: {
          ai_model_used: string | null
          brand_voice: string | null
          call_to_action: string | null
          caption: string
          content_type: string | null
          created_at: string | null
          description: string | null
          emoji_suggestions: string[] | null
          generation_time_ms: number | null
          hashtags: string[] | null
          hook_line: string | null
          id: string
          is_saved: boolean | null
          reel_idea: string
          saved_to_post_id: string | null
          target_audience: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_model_used?: string | null
          brand_voice?: string | null
          call_to_action?: string | null
          caption: string
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          emoji_suggestions?: string[] | null
          generation_time_ms?: number | null
          hashtags?: string[] | null
          hook_line?: string | null
          id?: string
          is_saved?: boolean | null
          reel_idea: string
          saved_to_post_id?: string | null
          target_audience?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_model_used?: string | null
          brand_voice?: string | null
          call_to_action?: string | null
          caption?: string
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          emoji_suggestions?: string[] | null
          generation_time_ms?: number | null
          hashtags?: string[] | null
          hook_line?: string | null
          id?: string
          is_saved?: boolean | null
          reel_idea?: string
          saved_to_post_id?: string | null
          target_audience?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_captions_saved_to_post_id_fkey"
            columns: ["saved_to_post_id"]
            isOneToOne: false
            referencedRelation: "monitored_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_scripts: {
        Row: {
          ai_model_used: string | null
          call_to_action: string | null
          created_at: string | null
          generation_time_ms: number | null
          hook: string | null
          id: string
          is_favorite: boolean | null
          key_points: Json | null
          script_content: string
          target_audience: string | null
          timestamps: Json | null
          title: string
          tone: string
          updated_at: string | null
          user_id: string
          video_id: string | null
          video_length: string
          video_topic: string
        }
        Insert: {
          ai_model_used?: string | null
          call_to_action?: string | null
          created_at?: string | null
          generation_time_ms?: number | null
          hook?: string | null
          id?: string
          is_favorite?: boolean | null
          key_points?: Json | null
          script_content: string
          target_audience?: string | null
          timestamps?: Json | null
          title: string
          tone: string
          updated_at?: string | null
          user_id: string
          video_id?: string | null
          video_length: string
          video_topic: string
        }
        Update: {
          ai_model_used?: string | null
          call_to_action?: string | null
          created_at?: string | null
          generation_time_ms?: number | null
          hook?: string | null
          id?: string
          is_favorite?: boolean | null
          key_points?: Json | null
          script_content?: string
          target_audience?: string | null
          timestamps?: Json | null
          title?: string
          tone?: string
          updated_at?: string | null
          user_id?: string
          video_id?: string | null
          video_length?: string
          video_topic?: string
        }
        Relationships: []
      }
      generated_thumbnails: {
        Row: {
          ai_model_used: string | null
          created_at: string | null
          generation_time_ms: number | null
          id: string
          is_favorite: boolean | null
          prompt: string
          style: string
          thumbnail_url: string
          title: string
          updated_at: string | null
          user_id: string
          video_id: string | null
        }
        Insert: {
          ai_model_used?: string | null
          created_at?: string | null
          generation_time_ms?: number | null
          id?: string
          is_favorite?: boolean | null
          prompt: string
          style: string
          thumbnail_url: string
          title: string
          updated_at?: string | null
          user_id: string
          video_id?: string | null
        }
        Update: {
          ai_model_used?: string | null
          created_at?: string | null
          generation_time_ms?: number | null
          id?: string
          is_favorite?: boolean | null
          prompt?: string
          style?: string
          thumbnail_url?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          video_id?: string | null
        }
        Relationships: []
      }
      hashtag_generations: {
        Row: {
          category: string | null
          created_at: string
          hashtags: Json
          id: string
          topic: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          hashtags: Json
          id?: string
          topic: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          hashtags?: Json
          id?: string
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      instagram_accounts: {
        Row: {
          access_token: string
          created_at: string | null
          id: string
          instagram_user_id: string
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          id?: string
          instagram_user_id: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: string
          instagram_user_id?: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      monitored_posts: {
        Row: {
          created_at: string | null
          id: string
          instagram_account_id: string
          is_active: boolean | null
          post_id: string
          post_title: string | null
          post_url: string
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          instagram_account_id: string
          is_active?: boolean | null
          post_id: string
          post_title?: string | null
          post_url: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          instagram_account_id?: string
          is_active?: boolean | null
          post_id?: string
          post_title?: string | null
          post_url?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitored_posts_instagram_account_id_fkey"
            columns: ["instagram_account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      music_generations: {
        Row: {
          audio_urls: string[] | null
          bpm: number | null
          created_at: string | null
          generation_time_ms: number | null
          id: string
          instrumental: boolean | null
          is_favorite: boolean | null
          lyrics: string | null
          output_format: string | null
          prompt: string | null
          tags: string[] | null
          task_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_urls?: string[] | null
          bpm?: number | null
          created_at?: string | null
          generation_time_ms?: number | null
          id?: string
          instrumental?: boolean | null
          is_favorite?: boolean | null
          lyrics?: string | null
          output_format?: string | null
          prompt?: string | null
          tags?: string[] | null
          task_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_urls?: string[] | null
          bpm?: number | null
          created_at?: string | null
          generation_time_ms?: number | null
          id?: string
          instrumental?: boolean | null
          is_favorite?: boolean | null
          lyrics?: string | null
          output_format?: string | null
          prompt?: string | null
          tags?: string[] | null
          task_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      music_presets: {
        Row: {
          bpm: number | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          instrumental: boolean | null
          is_system_preset: boolean | null
          name: string
          prompt_template: string | null
          tags: string[] | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          bpm?: number | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          instrumental?: boolean | null
          is_system_preset?: boolean | null
          name: string
          prompt_template?: string | null
          tags?: string[] | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          bpm?: number | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          instrumental?: boolean | null
          is_system_preset?: boolean | null
          name?: string
          prompt_template?: string | null
          tags?: string[] | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      optimization_suggestions: {
        Row: {
          ai_reasoning: string | null
          created_at: string | null
          id: string
          original_content: string | null
          status: string
          suggested_content: string
          suggestion_type: string
          user_id: string
          video_id: string
        }
        Insert: {
          ai_reasoning?: string | null
          created_at?: string | null
          id?: string
          original_content?: string | null
          status?: string
          suggested_content: string
          suggestion_type: string
          user_id: string
          video_id: string
        }
        Update: {
          ai_reasoning?: string | null
          created_at?: string | null
          id?: string
          original_content?: string | null
          status?: string
          suggested_content?: string
          suggestion_type?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_videos: {
        Row: {
          ai_generated_metadata: boolean | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          privacy_status: string | null
          scheduled_for: string
          status: string | null
          tags: string[] | null
          thumbnail_path: string | null
          title: string
          updated_at: string | null
          upload_error: string | null
          user_id: string
          video_file_path: string
          youtube_account_id: string
          youtube_video_id: string | null
        }
        Insert: {
          ai_generated_metadata?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          privacy_status?: string | null
          scheduled_for: string
          status?: string | null
          tags?: string[] | null
          thumbnail_path?: string | null
          title: string
          updated_at?: string | null
          upload_error?: string | null
          user_id: string
          video_file_path: string
          youtube_account_id: string
          youtube_video_id?: string | null
        }
        Update: {
          ai_generated_metadata?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          privacy_status?: string | null
          scheduled_for?: string
          status?: string | null
          tags?: string[] | null
          thumbnail_path?: string | null
          title?: string
          updated_at?: string | null
          upload_error?: string | null
          user_id?: string
          video_file_path?: string
          youtube_account_id?: string
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      seo_optimizations: {
        Row: {
          created_at: string
          id: string
          keywords: Json | null
          optimized_description: string | null
          optimized_title: string
          original_title: string
          seo_score: number | null
          tags: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          keywords?: Json | null
          optimized_description?: string | null
          optimized_title: string
          original_title: string
          seo_score?: number | null
          tags?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          keywords?: Json | null
          optimized_description?: string | null
          optimized_title?: string
          original_title?: string
          seo_score?: number | null
          tags?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      tester_keys: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_code: string
          last_used_at: string | null
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_code: string
          last_used_at?: string | null
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_code?: string
          last_used_at?: string | null
          usage_count?: number
        }
        Relationships: []
      }
      tester_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          session_token: string
          tester_key_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          session_token: string
          tester_key_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string
          tester_key_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tester_sessions_tester_key_id_fkey"
            columns: ["tester_key_id"]
            isOneToOne: false
            referencedRelation: "tester_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      trend_analyses: {
        Row: {
          analysis_content: string
          created_at: string
          id: string
          niche: string
          suggestions: Json | null
          trends: Json | null
          user_id: string
        }
        Insert: {
          analysis_content: string
          created_at?: string
          id?: string
          niche: string
          suggestions?: Json | null
          trends?: Json | null
          user_id: string
        }
        Update: {
          analysis_content?: string
          created_at?: string
          id?: string
          niche?: string
          suggestions?: Json | null
          trends?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          ai_background_removal_count: number
          ai_captions_count: number
          ai_dubbing_count: number
          ai_hashtags_count: number | null
          ai_image_enhancement_count: number
          ai_music_count: number
          ai_scripts_count: number
          ai_seo_count: number | null
          ai_shorts_packages_count: number
          ai_speech_to_text_count: number
          ai_text_summarizer_count: number
          ai_text_to_speech_count: number
          ai_thumbnails_count: number
          ai_trends_count: number | null
          ai_voice_cloning_count: number
          ai_voice_isolation_count: number
          created_at: string
          id: string
          reset_at: string
          updated_at: string
          user_id: string
          video_uploads_count: number
          youtube_channels_count: number
        }
        Insert: {
          ai_background_removal_count?: number
          ai_captions_count?: number
          ai_dubbing_count?: number
          ai_hashtags_count?: number | null
          ai_image_enhancement_count?: number
          ai_music_count?: number
          ai_scripts_count?: number
          ai_seo_count?: number | null
          ai_shorts_packages_count?: number
          ai_speech_to_text_count?: number
          ai_text_summarizer_count?: number
          ai_text_to_speech_count?: number
          ai_thumbnails_count?: number
          ai_trends_count?: number | null
          ai_voice_cloning_count?: number
          ai_voice_isolation_count?: number
          created_at?: string
          id?: string
          reset_at?: string
          updated_at?: string
          user_id: string
          video_uploads_count?: number
          youtube_channels_count?: number
        }
        Update: {
          ai_background_removal_count?: number
          ai_captions_count?: number
          ai_dubbing_count?: number
          ai_hashtags_count?: number | null
          ai_image_enhancement_count?: number
          ai_music_count?: number
          ai_scripts_count?: number
          ai_seo_count?: number | null
          ai_shorts_packages_count?: number
          ai_speech_to_text_count?: number
          ai_text_summarizer_count?: number
          ai_text_to_speech_count?: number
          ai_thumbnails_count?: number
          ai_trends_count?: number | null
          ai_voice_cloning_count?: number
          ai_voice_isolation_count?: number
          created_at?: string
          id?: string
          reset_at?: string
          updated_at?: string
          user_id?: string
          video_uploads_count?: number
          youtube_channels_count?: number
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_analyses: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
          video_title: string | null
          video_url: string
          viral_moments: Json
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
          video_title?: string | null
          video_url: string
          viral_moments: Json
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
          video_title?: string | null
          video_url?: string
          viral_moments?: Json
        }
        Relationships: []
      }
      video_performance_tracking: {
        Row: {
          comments: number
          created_at: string | null
          id: string
          last_checked: string
          likes: number
          optimization_applied: boolean
          optimization_suggested: boolean
          performance_score: number
          user_id: string
          video_id: string
          video_title: string
          views: number
        }
        Insert: {
          comments?: number
          created_at?: string | null
          id?: string
          last_checked?: string
          likes?: number
          optimization_applied?: boolean
          optimization_suggested?: boolean
          performance_score?: number
          user_id: string
          video_id: string
          video_title: string
          views?: number
        }
        Update: {
          comments?: number
          created_at?: string | null
          id?: string
          last_checked?: string
          likes?: number
          optimization_applied?: boolean
          optimization_suggested?: boolean
          performance_score?: number
          user_id?: string
          video_id?: string
          video_title?: string
          views?: number
        }
        Relationships: []
      }
      video_uploads_history: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          scheduled_video_id: string | null
          status: string
          title: string
          upload_date: string | null
          user_id: string
          youtube_account_id: string
          youtube_video_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          scheduled_video_id?: string | null
          status: string
          title: string
          upload_date?: string | null
          user_id: string
          youtube_account_id: string
          youtube_video_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          scheduled_video_id?: string | null
          status?: string
          title?: string
          upload_date?: string | null
          user_id?: string
          youtube_account_id?: string
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      youtube_accounts: {
        Row: {
          access_token: string
          channel_id: string
          channel_title: string
          created_at: string | null
          id: string
          refresh_token: string
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          channel_id: string
          channel_title: string
          created_at?: string | null
          id?: string
          refresh_token: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          channel_id?: string
          channel_title?: string
          created_at?: string | null
          id?: string
          refresh_token?: string
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      youtube_comment_logs: {
        Row: {
          comment_id: string
          comment_text: string
          created_at: string | null
          id: string
          replied_at: string | null
          reply_text: string | null
          skip_reason: string | null
          status: string
          user_id: string
          video_id: string
        }
        Insert: {
          comment_id: string
          comment_text: string
          created_at?: string | null
          id?: string
          replied_at?: string | null
          reply_text?: string | null
          skip_reason?: string | null
          status: string
          user_id: string
          video_id: string
        }
        Update: {
          comment_id?: string
          comment_text?: string
          created_at?: string | null
          id?: string
          replied_at?: string | null
          reply_text?: string | null
          skip_reason?: string | null
          status?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      youtube_comment_settings: {
        Row: {
          blacklist_keywords: string[] | null
          created_at: string | null
          custom_instructions: string | null
          enabled: boolean | null
          id: string
          min_comment_length: number | null
          reply_delay_minutes: number | null
          response_style: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          blacklist_keywords?: string[] | null
          created_at?: string | null
          custom_instructions?: string | null
          enabled?: boolean | null
          id?: string
          min_comment_length?: number | null
          reply_delay_minutes?: number | null
          response_style?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          blacklist_keywords?: string[] | null
          created_at?: string | null
          custom_instructions?: string | null
          enabled?: boolean | null
          id?: string
          min_comment_length?: number | null
          reply_delay_minutes?: number | null
          response_style?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      youtube_monitored_videos: {
        Row: {
          created_at: string | null
          id: string
          thumbnail_url: string | null
          user_id: string
          video_id: string
          video_title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          thumbnail_url?: string | null
          user_id: string
          video_id: string
          video_title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          thumbnail_url?: string | null
          user_id?: string
          video_id?: string
          video_title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_all_users_admin: {
        Args: never
        Returns: {
          banned_until: string
          confirmed_at: string
          created_at: string
          email: string
          email_confirmed_at: string
          id: string
          last_sign_in_at: string
          raw_user_meta_data: Json
        }[]
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      log_user_activity: {
        Args: { p_action: string; p_details?: Json }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "tester"
      subscription_plan: "free" | "pro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "tester"],
      subscription_plan: ["free", "pro"],
    },
  },
} as const
