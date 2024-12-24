export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      survey_responses: {
        Row: {
          id: string
          created_at: string
          user_id: string
          answers: Json
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          answers: Json
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          answers?: Json
          updated_at?: string
        }
      }
      project_plans: {
        Row: {
          id: string
          created_at: string
          user_id: string
          content: Json
          type: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          content: Json
          type: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          content?: Json
          type?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: string
          price_id: string
          created_at: string
          current_period_end: string
          cancel_at_period_end: boolean
        }
        Insert: {
          id: string
          user_id: string
          status: string
          price_id: string
          created_at?: string
          current_period_end: string
          cancel_at_period_end?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          price_id?: string
          created_at?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
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
  }
} 