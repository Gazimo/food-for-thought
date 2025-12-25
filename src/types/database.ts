export interface Database {
  public: {
    Tables: {
      dishes: {
        Row: {
          id: number;
          name: string;
          acceptable_guesses: string[];
          country: string;
          image_url: string | null;
          ingredients: string[];
          blurb: string;
          protein_per_serving: number;
          recipe: {
            ingredients: string[];
            instructions: string[];
          };
          tags: string[];
          release_date: string;
          coordinates: [number, number] | null;
          region: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          acceptable_guesses: string[];
          country: string;
          image_url?: string | null;
          ingredients: string[];
          blurb: string;
          protein_per_serving: number;
          recipe: {
            ingredients: string[];
            instructions: string[];
          };
          tags: string[];
          release_date: string;
          coordinates?: [number, number] | null;
          region?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          acceptable_guesses?: string[];
          country?: string;
          image_url?: string | null;
          ingredients?: string[];
          blurb?: string;
          protein_per_serving?: number;
          recipe?: {
            ingredients: string[];
            instructions: string[];
          };
          tags?: string[];
          release_date?: string;
          coordinates?: [number, number] | null;
          region?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      game_scores: {
        Row: {
          id: number;
          dish_date: string;
          dish_id: number | null;
          session_id: string;
          dish_score: number;
          country_score: number;
          protein_score: number;
          total_score: number;
          dish_guesses: number;
          country_guesses: number;
          protein_guesses: number;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          dish_date: string;
          dish_id?: number | null;
          session_id: string;
          dish_score: number;
          country_score: number;
          protein_score: number;
          total_score: number;
          dish_guesses: number;
          country_guesses: number;
          protein_guesses: number;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          dish_date?: string;
          dish_id?: number | null;
          session_id?: string;
          dish_score?: number;
          country_score?: number;
          protein_score?: number;
          total_score?: number;
          dish_guesses?: number;
          country_guesses?: number;
          protein_guesses?: number;
          completed_at?: string;
          created_at?: string;
        };
      };
      pasta: {
        Row: {
          id: number;
          name: string;
          acceptable_guesses: string[];
          pasta_about: string[];
          pasta_description: string | null;
          pasta_image_url: string | null;
          sauce_name: string;
          sauce_acceptable_guesses: string[];
          sauce_ingredients: string[];
          sauce_instructions: string[];
          sauce_description: string | null;
          sauce_image_url: string | null;
          region: string;
          region_coordinates: { lat: number; lng: number } | null;
          protein_per_serving: number;
          origin_story: string | null;
          fun_fact: string | null;
          tags: string[];
          release_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          acceptable_guesses?: string[];
          pasta_about?: string[];
          pasta_description?: string | null;
          pasta_image_url?: string | null;
          sauce_name: string;
          sauce_acceptable_guesses?: string[];
          sauce_ingredients?: string[];
          sauce_instructions?: string[];
          sauce_description?: string | null;
          sauce_image_url?: string | null;
          region: string;
          region_coordinates?: { lat: number; lng: number } | null;
          protein_per_serving?: number;
          origin_story?: string | null;
          fun_fact?: string | null;
          tags?: string[];
          release_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          acceptable_guesses?: string[];
          pasta_about?: string[];
          pasta_description?: string | null;
          pasta_image_url?: string | null;
          sauce_name?: string;
          sauce_acceptable_guesses?: string[];
          sauce_ingredients?: string[];
          sauce_instructions?: string[];
          sauce_description?: string | null;
          sauce_image_url?: string | null;
          region?: string;
          region_coordinates?: { lat: number; lng: number } | null;
          protein_per_serving?: number;
          origin_story?: string | null;
          fun_fact?: string | null;
          tags?: string[];
          release_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      pasta_leaderboard: {
        Row: {
          id: number;
          pasta_date: string;
          pasta_id: number | null;
          session_id: string;
          pasta_score: number;
          sauce_score: number;
          region_score: number;
          protein_score: number;
          total_score: number;
          pasta_guesses: number;
          sauce_guesses: number;
          region_guesses: number;
          protein_guesses: number;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          pasta_date: string;
          pasta_id?: number | null;
          session_id: string;
          pasta_score?: number;
          sauce_score?: number;
          region_score?: number;
          protein_score?: number;
          total_score?: number;
          pasta_guesses?: number;
          sauce_guesses?: number;
          region_guesses?: number;
          protein_guesses?: number;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          pasta_date?: string;
          pasta_id?: number | null;
          session_id?: string;
          pasta_score?: number;
          sauce_score?: number;
          region_score?: number;
          protein_score?: number;
          total_score?: number;
          pasta_guesses?: number;
          sauce_guesses?: number;
          region_guesses?: number;
          protein_guesses?: number;
          completed_at?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type DishRow = Database["public"]["Tables"]["dishes"]["Row"];
export type DishInsert = Database["public"]["Tables"]["dishes"]["Insert"];
export type DishUpdate = Database["public"]["Tables"]["dishes"]["Update"];

export type GameScoreRow = Database["public"]["Tables"]["game_scores"]["Row"];
export type GameScoreInsert =
  Database["public"]["Tables"]["game_scores"]["Insert"];
export type GameScoreUpdate =
  Database["public"]["Tables"]["game_scores"]["Update"];

export type PastaRow = Database["public"]["Tables"]["pasta"]["Row"];
export type PastaInsert = Database["public"]["Tables"]["pasta"]["Insert"];
export type PastaUpdate = Database["public"]["Tables"]["pasta"]["Update"];

export type PastaLeaderboardRow = Database["public"]["Tables"]["pasta_leaderboard"]["Row"];
export type PastaLeaderboardInsert =
  Database["public"]["Tables"]["pasta_leaderboard"]["Insert"];
export type PastaLeaderboardUpdate =
  Database["public"]["Tables"]["pasta_leaderboard"]["Update"];
