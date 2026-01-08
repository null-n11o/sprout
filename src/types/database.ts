export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "posts_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "growth_records_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      growth_milestones: {
        Row: {
          id: string;
          child_id: string;
          content: string;
          recorded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          content: string;
          recorded_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          content?: string;
          recorded_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "growth_milestones_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
        ];
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
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Child = Database["public"]["Tables"]["children"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type GrowthRecord = Database["public"]["Tables"]["growth_records"]["Row"];
export type GrowthMilestone = Database["public"]["Tables"]["growth_milestones"]["Row"];
export type Reaction = Database["public"]["Tables"]["reactions"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];

export type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
export type GrowthRecordInsert = Database["public"]["Tables"]["growth_records"]["Insert"];
export type GrowthMilestoneInsert = Database["public"]["Tables"]["growth_milestones"]["Insert"];
export type ReactionInsert = Database["public"]["Tables"]["reactions"]["Insert"];
export type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];
