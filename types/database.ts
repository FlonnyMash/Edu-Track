export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          timezone: string;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          timezone?: string;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          timezone?: string;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      learning_tracks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          difficulty_preference: "gentle" | "balanced" | "ambitious";
          is_active: boolean;
          started_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          difficulty_preference?: "gentle" | "balanced" | "ambitious";
          is_active?: boolean;
          started_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          difficulty_preference?: "gentle" | "balanced" | "ambitious";
          is_active?: boolean;
          started_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_tasks: {
        Row: {
          id: string;
          user_id: string;
          track_id: string;
          task_date: string;
          day_number: number;
          title: string;
          instructions: string;
          estimated_minutes: number | null;
          difficulty_level: number;
          ai_metadata: Json;
          status: "pending" | "completed" | "skipped";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          track_id: string;
          task_date: string;
          day_number: number;
          title: string;
          instructions: string;
          estimated_minutes?: number | null;
          difficulty_level?: number;
          ai_metadata?: Json;
          status?: "pending" | "completed" | "skipped";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          track_id?: string;
          task_date?: string;
          day_number?: number;
          title?: string;
          instructions?: string;
          estimated_minutes?: number | null;
          difficulty_level?: number;
          ai_metadata?: Json;
          status?: "pending" | "completed" | "skipped";
          created_at?: string;
        };
        Relationships: [];
      };
      task_completions: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          completed_at: string;
          reflection_notes: string | null;
          xp_awarded: number;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          completed_at?: string;
          reflection_notes?: string | null;
          xp_awarded?: number;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          completed_at?: string;
          reflection_notes?: string | null;
          xp_awarded?: number;
        };
        Relationships: [];
      };
      gamification_stats: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_active_date: string | null;
          total_xp: number;
          companion_stage: number;
          map_node_index: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_active_date?: string | null;
          total_xp?: number;
          companion_stage?: number;
          map_node_index?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          last_active_date?: string | null;
          total_xp?: number;
          companion_stage?: number;
          map_node_index?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          duration_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          duration_seconds: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          duration_seconds?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type LearningTrack = Database["public"]["Tables"]["learning_tracks"]["Row"];
export type DailyTask = Database["public"]["Tables"]["daily_tasks"]["Row"];
export type GamificationStats = Database["public"]["Tables"]["gamification_stats"]["Row"];
export type StudySession = Database["public"]["Tables"]["study_sessions"]["Row"];
