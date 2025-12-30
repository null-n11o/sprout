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
          name: string;
          birth_date: string | null;
          gender: "male" | "female" | "other" | null;
          avatar_url: string | null;
          role: "admin" | "editor";
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          birth_date?: string | null;
          gender?: "male" | "female" | "other" | null;
          avatar_url?: string | null;
          role?: "admin" | "editor";
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          birth_date?: string | null;
          gender?: "male" | "female" | "other" | null;
          avatar_url?: string | null;
          role?: "admin" | "editor";
          created_at?: string;
        };
      };
      children: {
        Row: {
          id: string;
          name: string;
          birth_date: string;
          gender: "male" | "female" | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          birth_date: string;
          gender?: "male" | "female" | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          birth_date?: string;
          gender?: "male" | "female" | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          child_id: string;
          user_id: string;
          media_url: string;
          media_type: "image" | "video";
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          user_id: string;
          media_url: string;
          media_type: "image" | "video";
          caption?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          user_id?: string;
          media_url?: string;
          media_type?: "image" | "video";
          caption?: string | null;
          created_at?: string;
        };
      };
      growth_records: {
        Row: {
          id: string;
          child_id: string;
          height: number;
          weight: number;
          memo: string | null;
          recorded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          height: number;
          weight: number;
          memo?: string | null;
          recorded_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          height?: number;
          weight?: number;
          memo?: string | null;
          recorded_at?: string;
          created_at?: string;
        };
      };
      reactions: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// Helper types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Child = Database["public"]["Tables"]["children"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type GrowthRecord = Database["public"]["Tables"]["growth_records"]["Row"];
export type Reaction = Database["public"]["Tables"]["reactions"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
