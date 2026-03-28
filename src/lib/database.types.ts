export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      yeasts: {
        Row: {
          id: string;
          name: string;
          rarity: number;
          season: string | null;
          description: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          rarity: number;
          season?: string | null;
          description: string;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          rarity?: number;
          season?: string | null;
          description?: string;
          image_url?: string | null;
          created_at?: string;
        };
      };
      breads: {
        Row: {
          id: string;
          name: string;
          yeast_id: string;
          toppings: Json;
          season: string | null;
          description: string;
          taste_description: string;
          recommendation: string;
          shop_name: string | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          yeast_id: string;
          toppings?: Json;
          season?: string | null;
          description: string;
          taste_description: string;
          recommendation: string;
          shop_name?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          yeast_id?: string;
          toppings?: Json;
          season?: string | null;
          description?: string;
          taste_description?: string;
          recommendation?: string;
          shop_name?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
      };
      user_yeasts: {
        Row: {
          id: string;
          user_id: string;
          yeast_id: string;
          duplicate_count: number;
          obtained_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          yeast_id: string;
          duplicate_count?: number;
          obtained_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          yeast_id?: string;
          duplicate_count?: number;
          obtained_at?: string;
        };
      };
      user_breads: {
        Row: {
          id: string;
          user_id: string;
          bread_id: string;
          custom_toppings: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bread_id: string;
          custom_toppings?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bread_id?: string;
          custom_toppings?: Json;
          created_at?: string;
        };
      };
      fermentations: {
        Row: {
          id: string;
          user_id: string;
          yeast_id: string;
          bread_id: string | null;
          started_at: string;
          completed_at: string;
          status: string;
          temperature_bonus: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          yeast_id: string;
          bread_id?: string | null;
          started_at?: string;
          completed_at?: string;
          status?: string;
          temperature_bonus?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          yeast_id?: string;
          bread_id?: string | null;
          started_at?: string;
          completed_at?: string;
          status?: string;
          temperature_bonus?: boolean;
        };
      };
      points: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          scanned_at: string;
          daily_token: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount?: number;
          scanned_at?: string;
          daily_token: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          scanned_at?: string;
          daily_token?: string;
        };
      };
      coupons: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          redeemed: boolean;
          issued_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          redeemed?: boolean;
          issued_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          redeemed?: boolean;
          issued_at?: string;
        };
      };
      daily_tokens: {
        Row: {
          id: string;
          store_id: string;
          token: string;
          valid_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id?: string;
          token: string;
          valid_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          token?: string;
          valid_date?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
