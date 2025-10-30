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
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          is_public: boolean
          role: 'member' | 'editor' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_public?: boolean
          role?: 'member' | 'editor' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_public?: boolean
          role?: 'member' | 'editor' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      competencies: {
        Row: {
          id: string
          name: string
          description: string | null
          parent_id: string | null
          level: 'domain' | 'competency' | 'micro_skill'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          parent_id?: string | null
          level: 'domain' | 'competency' | 'micro_skill'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          level?: 'domain' | 'competency' | 'micro_skill'
          created_at?: string
          updated_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          competency_id: string
          title: string
          content: string
          status: 'draft' | 'in_review' | 'approved' | 'published'
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          competency_id: string
          title: string
          content: string
          status?: 'draft' | 'in_review' | 'approved' | 'published'
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          competency_id?: string
          title?: string
          content?: string
          status?: 'draft' | 'in_review' | 'approved' | 'published'
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      cases: {
        Row: {
          id: string
          title: string
          briefing_doc: string
          datasets: Json | null
          rubric: Json
          status: 'draft' | 'in_review' | 'approved' | 'published'
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          title: string
          briefing_doc: string
          datasets?: Json | null
          rubric: Json
          status?: 'draft' | 'in_review' | 'approved' | 'published'
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          briefing_doc?: string
          datasets?: Json | null
          rubric?: Json
          status?: 'draft' | 'in_review' | 'approved' | 'published'
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      simulations: {
        Row: {
          id: string
          user_id: string
          case_id: string
          status: 'in_progress' | 'completed'
          user_inputs: Json
          started_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          case_id: string
          status?: 'in_progress' | 'completed'
          user_inputs?: Json
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          case_id?: string
          status?: 'in_progress' | 'completed'
          user_inputs?: Json
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      debriefs: {
        Row: {
          id: string
          simulation_id: string
          scores: Json
          summary_text: string
          radar_chart_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          simulation_id: string
          scores: Json
          summary_text: string
          radar_chart_data: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          simulation_id?: string
          scores?: Json
          summary_text?: string
          radar_chart_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      forum_channels: {
        Row: {
          id: string
          name: string
          description: string | null
          slug: string
          created_at: string
          updated_at: string
        }
      }
      forum_threads: {
        Row: {
          id: string
          channel_id: string
          author_id: string
          title: string
          content: string
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
      }
      forum_posts: {
        Row: {
          id: string
          thread_id: string
          author_id: string
          content: string
          parent_post_id: string | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
}


