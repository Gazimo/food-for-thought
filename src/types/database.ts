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
