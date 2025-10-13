// Supabase Database Types for Interactive Polynesian Story System
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      stories: {
        Row: {
          id: string
          title: string
          description: string | null
          category: 'legend' | 'mythology' | 'history' | 'folklore' | 'creation' | 'adventure'
          difficulty_level: 'beginner' | 'intermediate' | 'advanced'
          estimated_duration: number
          cultural_region: string
          language: string
          cover_image_url: string | null
          author_id: string | null
          is_published: boolean
          cultural_authenticity_score: number
          total_passages: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: 'legend' | 'mythology' | 'history' | 'folklore' | 'creation' | 'adventure'
          difficulty_level: 'beginner' | 'intermediate' | 'advanced'
          estimated_duration: number
          cultural_region: string
          language?: string
          cover_image_url?: string | null
          author_id?: string | null
          is_published?: boolean
          cultural_authenticity_score?: number
          total_passages?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: 'legend' | 'mythology' | 'history' | 'folklore' | 'creation' | 'adventure'
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
          estimated_duration?: number
          cultural_region?: string
          language?: string
          cover_image_url?: string | null
          author_id?: string | null
          is_published?: boolean
          cultural_authenticity_score?: number
          total_passages?: number
          created_at?: string
          updated_at?: string
        }
      }
      story_passages: {
        Row: {
          id: string
          story_id: string
          passage_number: number
          title: string | null
          content: string
          audio_url: string | null
          image_url: string | null
          is_starting_passage: boolean
          is_ending_passage: boolean
          cultural_context: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          passage_number: number
          title?: string | null
          content: string
          audio_url?: string | null
          image_url?: string | null
          is_starting_passage?: boolean
          is_ending_passage?: boolean
          cultural_context?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          passage_number?: number
          title?: string | null
          content?: string
          audio_url?: string | null
          image_url?: string | null
          is_starting_passage?: boolean
          is_ending_passage?: boolean
          cultural_context?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      story_choices: {
        Row: {
          id: string
          from_passage_id: string
          to_passage_id: string
          choice_text: string
          choice_description: string | null
          cultural_significance: string | null
          choice_order: number
          created_at: string
        }
        Insert: {
          id?: string
          from_passage_id: string
          to_passage_id: string
          choice_text: string
          choice_description?: string | null
          cultural_significance?: string | null
          choice_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          from_passage_id?: string
          to_passage_id?: string
          choice_text?: string
          choice_description?: string | null
          cultural_significance?: string | null
          choice_order?: number
          created_at?: string
        }
      }
      cultural_annotations: {
        Row: {
          id: string
          story_id: string | null
          passage_id: string | null
          annotation_type: 'cultural_context' | 'historical_fact' | 'language_note' | 'tradition' | 'symbol' | 'location'
          title: string
          content: string
          highlighted_text: string | null
          position_start: number | null
          position_end: number | null
          media_url: string | null
          external_links: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id?: string | null
          passage_id?: string | null
          annotation_type: 'cultural_context' | 'historical_fact' | 'language_note' | 'tradition' | 'symbol' | 'location'
          title: string
          content: string
          highlighted_text?: string | null
          position_start?: number | null
          position_end?: number | null
          media_url?: string | null
          external_links?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string | null
          passage_id?: string | null
          annotation_type?: 'cultural_context' | 'historical_fact' | 'language_note' | 'tradition' | 'symbol' | 'location'
          title?: string
          content?: string
          highlighted_text?: string | null
          position_start?: number | null
          position_end?: number | null
          media_url?: string | null
          external_links?: Json
          created_at?: string
          updated_at?: string
        }
      }
      user_story_progress: {
        Row: {
          id: string
          user_id: string
          story_id: string
          current_passage_id: string | null
          completion_percentage: number
          is_completed: boolean
          cultural_knowledge_gained: number
          choices_made: Json
          annotations_viewed: Json
          time_spent: number
          started_at: string
          completed_at: string | null
          last_accessed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          story_id: string
          current_passage_id?: string | null
          completion_percentage?: number
          is_completed?: boolean
          cultural_knowledge_gained?: number
          choices_made?: Json
          annotations_viewed?: Json
          time_spent?: number
          started_at?: string
          completed_at?: string | null
          last_accessed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          story_id?: string
          current_passage_id?: string | null
          completion_percentage?: number
          is_completed?: boolean
          cultural_knowledge_gained?: number
          choices_made?: Json
          annotations_viewed?: Json
          time_spent?: number
          started_at?: string
          completed_at?: string | null
          last_accessed_at?: string
        }
      }
      story_discussions: {
        Row: {
          id: string
          story_id: string
          user_id: string
          parent_id: string | null
          title: string | null
          content: string
          discussion_type: 'question' | 'insight' | 'cultural_note' | 'interpretation' | 'general'
          is_pinned: boolean
          likes_count: number
          replies_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          user_id: string
          parent_id?: string | null
          title?: string | null
          content: string
          discussion_type: 'question' | 'insight' | 'cultural_note' | 'interpretation' | 'general'
          is_pinned?: boolean
          likes_count?: number
          replies_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          user_id?: string
          parent_id?: string | null
          title?: string | null
          content?: string
          discussion_type?: 'question' | 'insight' | 'cultural_note' | 'interpretation' | 'general'
          is_pinned?: boolean
          likes_count?: number
          replies_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      story_ratings: {
        Row: {
          id: string
          story_id: string
          user_id: string
          rating: number
          review: string | null
          cultural_accuracy_rating: number | null
          educational_value_rating: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          user_id: string
          rating: number
          review?: string | null
          cultural_accuracy_rating?: number | null
          educational_value_rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          user_id?: string
          rating?: number
          review?: string | null
          cultural_accuracy_rating?: number | null
          educational_value_rating?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      story_bookmarks: {
        Row: {
          id: string
          user_id: string
          story_id: string
          passage_id: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          story_id: string
          passage_id?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          story_id?: string
          passage_id?: string | null
          note?: string | null
          created_at?: string
        }
      }
      cultural_knowledge_points: {
        Row: {
          id: string
          user_id: string
          story_id: string
          annotation_id: string
          points_earned: number
          knowledge_category: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          story_id: string
          annotation_id: string
          points_earned?: number
          knowledge_category: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          story_id?: string
          annotation_id?: string
          points_earned?: number
          knowledge_category?: string
          earned_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}