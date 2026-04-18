// Hand-written types matching supabase/migrations/001_initial_schema.sql.
// Keep in sync with the SQL file. If/when we add the Supabase CLI, this can be
// replaced with `supabase gen types typescript --local`.

import type { Ingredient, Macros, MealType } from '@/lib/types'

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string
          user_id: string
          title: string
          portions: number
          is_favorite: boolean
          ingredients: Ingredient[]
          steps: string[]
          image: string | null
          macros: Macros
          macro_mode: 'auto' | 'manual'
          tags: string[]
          rating: number | null
          created_at: number
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          title: string
          portions?: number
          is_favorite?: boolean
          ingredients?: Ingredient[]
          steps?: string[]
          image?: string | null
          macros?: Macros
          macro_mode?: 'auto' | 'manual'
          tags?: string[]
          rating?: number | null
          created_at: number
        }
        Update: Partial<Database['public']['Tables']['recipes']['Insert']>
      }
      shopping_items: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: string
          checked: boolean
          category: string | null
          recipe_id: string | null
          recipe_title: string | null
          created_at: number
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          name: string
          amount?: string
          checked?: boolean
          category?: string | null
          recipe_id?: string | null
          recipe_title?: string | null
          created_at: number
        }
        Update: Partial<Database['public']['Tables']['shopping_items']['Insert']>
      }
      meal_plan_entries: {
        Row: {
          id: string
          user_id: string
          date: string
          meal_type: MealType
          recipe_id: string
          recipe_title: string
          recipe_macros: Macros
          recipe_image: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          meal_type: MealType
          recipe_id: string
          recipe_title: string
          recipe_macros: Macros
          recipe_image?: string | null
        }
        Update: Partial<Database['public']['Tables']['meal_plan_entries']['Insert']>
      }
      meal_type_config: {
        Row: {
          user_id: string
          weekday: number
          enabled_types: MealType[]
          updated_at: string
        }
        Insert: {
          user_id: string
          weekday: number
          enabled_types?: MealType[]
        }
        Update: Partial<Database['public']['Tables']['meal_type_config']['Insert']>
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Used by the write-behind queue to identify which table an operation targets.
export type SyncableTable = keyof Database['public']['Tables']

export type { Json }
