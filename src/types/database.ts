export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      dishes: {
        Row: {
          acceptable_guesses: string[] | null
          blurb: string | null
          coordinates: string | null
          country: string
          created_at: string | null
          fun_fact: string | null
          id: number
          image_url: string | null
          ingredients: string[] | null
          name: string
          protein_per_serving: number | null
          recipe: Json | null
          region: string | null
          release_date: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          acceptable_guesses?: string[] | null
          blurb?: string | null
          coordinates?: string | null
          country: string
          created_at?: string | null
          fun_fact?: string | null
          id?: number
          image_url?: string | null
          ingredients?: string[] | null
          name: string
          protein_per_serving?: number | null
          recipe?: Json | null
          region?: string | null
          release_date: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          acceptable_guesses?: string[] | null
          blurb?: string | null
          coordinates?: string | null
          country?: string
          created_at?: string | null
          fun_fact?: string | null
          id?: number
          image_url?: string | null
          ingredients?: string[] | null
          name?: string
          protein_per_serving?: number | null
          recipe?: Json | null
          region?: string | null
          release_date?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      game_scores: {
        Row: {
          completed_at: string | null
          country_guesses: number | null
          country_score: number | null
          created_at: string | null
          dish_date: string
          dish_guesses: number | null
          dish_id: number | null
          dish_score: number | null
          id: number
          protein_guesses: number | null
          protein_score: number | null
          session_id: string
          total_score: number | null
        }
        Insert: {
          completed_at?: string | null
          country_guesses?: number | null
          country_score?: number | null
          created_at?: string | null
          dish_date: string
          dish_guesses?: number | null
          dish_id?: number | null
          dish_score?: number | null
          id?: number
          protein_guesses?: number | null
          protein_score?: number | null
          session_id: string
          total_score?: number | null
        }
        Update: {
          completed_at?: string | null
          country_guesses?: number | null
          country_score?: number | null
          created_at?: string | null
          dish_date?: string
          dish_guesses?: number | null
          dish_id?: number | null
          dish_score?: number | null
          id?: number
          protein_guesses?: number | null
          protein_score?: number | null
          session_id?: string
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_scores_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      pasta: {
        Row: {
          acceptable_guesses: string[] | null
          created_at: string | null
          fun_fact: string | null
          id: number
          name: string
          origin_story: string | null
          pasta_about: string[] | null
          pasta_description: string | null
          pasta_image_url: string | null
          protein_per_serving: number | null
          region: string
          region_coordinates: Json | null
          release_date: string
          sauce_acceptable_guesses: string[] | null
          sauce_description: string | null
          sauce_image_url: string | null
          sauce_ingredients: string[] | null
          sauce_instructions: string[] | null
          sauce_name: string
          updated_at: string | null
        }
        Insert: {
          acceptable_guesses?: string[] | null
          created_at?: string | null
          fun_fact?: string | null
          id?: number
          name: string
          origin_story?: string | null
          pasta_about?: string[] | null
          pasta_description?: string | null
          pasta_image_url?: string | null
          protein_per_serving?: number | null
          region: string
          region_coordinates?: Json | null
          release_date: string
          sauce_acceptable_guesses?: string[] | null
          sauce_description?: string | null
          sauce_image_url?: string | null
          sauce_ingredients?: string[] | null
          sauce_instructions?: string[] | null
          sauce_name: string
          updated_at?: string | null
        }
        Update: {
          acceptable_guesses?: string[] | null
          created_at?: string | null
          fun_fact?: string | null
          id?: number
          name?: string
          origin_story?: string | null
          pasta_about?: string[] | null
          pasta_description?: string | null
          pasta_image_url?: string | null
          protein_per_serving?: number | null
          region?: string
          region_coordinates?: Json | null
          release_date?: string
          sauce_acceptable_guesses?: string[] | null
          sauce_description?: string | null
          sauce_image_url?: string | null
          sauce_ingredients?: string[] | null
          sauce_instructions?: string[] | null
          sauce_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pasta_leaderboard: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: number
          pasta_date: string
          pasta_guesses: number | null
          pasta_id: number | null
          pasta_score: number | null
          protein_guesses: number | null
          protein_score: number | null
          region_guesses: number | null
          region_score: number | null
          sauce_guesses: number | null
          sauce_score: number | null
          session_id: string
          total_score: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: number
          pasta_date: string
          pasta_guesses?: number | null
          pasta_id?: number | null
          pasta_score?: number | null
          protein_guesses?: number | null
          protein_score?: number | null
          region_guesses?: number | null
          region_score?: number | null
          sauce_guesses?: number | null
          sauce_score?: number | null
          session_id: string
          total_score?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: number
          pasta_date?: string
          pasta_guesses?: number | null
          pasta_id?: number | null
          pasta_score?: number | null
          protein_guesses?: number | null
          protein_score?: number | null
          region_guesses?: number | null
          region_score?: number | null
          sauce_guesses?: number | null
          sauce_score?: number | null
          session_id?: string
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pasta_leaderboard_pasta_id_fkey"
            columns: ["pasta_id"]
            isOneToOne: false
            referencedRelation: "pasta"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      game_daily_stats: {
        Row: {
          avg_country_guesses: number | null
          avg_dish_guesses: number | null
          avg_protein_guesses: number | null
          avg_score: number | null
          dish_date: string | null
          max_score: number | null
          median_score: number | null
          min_score: number | null
          total_players: number | null
        }
        Relationships: []
      }
      game_player_stats: {
        Row: {
          avg_score: number | null
          best_score: number | null
          first_game_date: string | null
          games_played: number | null
          last_game_date: string | null
          perfect_games: number | null
          session_id: string | null
        }
        Relationships: []
      }
      pasta_daily_stats: {
        Row: {
          avg_pasta_guesses: number | null
          avg_protein_guesses: number | null
          avg_region_guesses: number | null
          avg_sauce_guesses: number | null
          avg_score: number | null
          max_score: number | null
          median_score: number | null
          min_score: number | null
          pasta_date: string | null
          total_players: number | null
        }
        Relationships: []
      }
      pasta_player_stats: {
        Row: {
          avg_score: number | null
          best_score: number | null
          first_game_date: string | null
          games_played: number | null
          last_game_date: string | null
          perfect_games: number | null
          session_id: string | null
        }
        Relationships: []
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

