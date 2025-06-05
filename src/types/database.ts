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
      matches: {
        Row: {
          id: string
          date: string
          home_team_id: string
          away_team_id: string
          venue: string
          season: string
          completed: boolean
        }
        Insert: {
          id?: string
          date: string
          home_team_id: string
          away_team_id: string
          venue: string
          season: string
          completed?: boolean
        }
        Update: {
          id?: string
          date?: string
          home_team_id?: string
          away_team_id?: string
          venue?: string
          season?: string
          completed?: boolean
        }
      }
      player_history: {
        Row: {
          id: string
          player_id: string
          team_id: string
          join_date: string
          leave_date: string | null
        }
        Insert: {
          id?: string
          player_id: string
          team_id: string
          join_date: string
          leave_date?: string | null
        }
        Update: {
          id?: string
          player_id?: string
          team_id?: string
          join_date?: string
          leave_date?: string | null
        }
      }
      player_performances: {
        Row: {
          id: string
          match_id: string
          player_id: string
          team_id: string
          opponent_id: string
          position: number
          full: number
          spare: number
          errors: number
          total_pins: number
          points: number
        }
        Insert: {
          id?: string
          match_id: string
          player_id: string
          team_id: string
          opponent_id: string
          position: number
          full: number
          spare: number
          errors: number
          total_pins: number
          points: number
        }
        Update: {
          id?: string
          match_id?: string
          player_id?: string
          team_id?: string
          opponent_id?: string
          position?: number
          full?: number
          spare?: number
          errors?: number
          total_pins?: number
          points?: number
        }
      }
      players: {
        Row: {
          id: string
          name: string
          team_id: string
          gender: string
          join_date: string
          leave_date: string | null
        }
        Insert: {
          id?: string
          name: string
          team_id: string
          gender: string
          join_date: string
          leave_date?: string | null
        }
        Update: {
          id?: string
          name?: string
          team_id?: string
          gender?: string
          join_date?: string
          leave_date?: string | null
        }
      }
      seasons: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          active: boolean
        }
        Insert: {
          id?: string
          name: string
          start_date: string
          end_date: string
          active?: boolean
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          end_date?: string
          active?: boolean
        }
      }
      team_performances: {
        Row: {
          id: string
          match_id: string
          team_id: string
          total_pins: number
          points: number
          auxiliary_points: number
        }
        Insert: {
          id?: string
          match_id: string
          team_id: string
          total_pins: number
          points: number
          auxiliary_points: number
        }
        Update: {
          id?: string
          match_id?: string
          team_id?: string
          total_pins?: number
          points?: number
          auxiliary_points?: number
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          venue: string
          schedule: Json
          start_date: string
          end_date: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          venue: string
          schedule: Json
          start_date: string
          end_date?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          venue?: string
          schedule?: Json
          start_date?: string
          end_date?: string | null
          created_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'manager' | 'reader'
          created_at: string | null
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'manager' | 'reader'
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'manager' | 'reader'
          created_at?: string | null
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
      user_role: 'admin' | 'manager' | 'reader'
    }
  }
}
