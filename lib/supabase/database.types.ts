export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      follows: {
        Row: {
          created_at: string
          target_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          target_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          target_id?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_plan_entries: {
        Row: {
          date: string
          id: string
          meal_type: string
          recipe_id: string
          recipe_image: string | null
          recipe_macros: Json
          recipe_title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          date: string
          id?: string
          meal_type: string
          recipe_id: string
          recipe_image?: string | null
          recipe_macros: Json
          recipe_title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          meal_type?: string
          recipe_id?: string
          recipe_image?: string | null
          recipe_macros?: Json
          recipe_title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_type_config: {
        Row: {
          enabled_types: Json
          updated_at: string
          user_id: string
          weekday: number
        }
        Insert: {
          enabled_types?: Json
          updated_at?: string
          user_id: string
          weekday: number
        }
        Update: {
          enabled_types?: Json
          updated_at?: string
          user_id?: string
          weekday?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_shopping_list_id: string | null
          is_public: boolean
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_shopping_list_id?: string | null
          is_public?: boolean
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_shopping_list_id?: string | null
          is_public?: boolean
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_shopping_list_id_fkey"
            columns: ["default_shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: number
          id: string
          image: string | null
          ingredients: Json
          is_favorite: boolean
          macro_mode: string
          macros: Json
          portions: number
          rating: number | null
          steps: Json
          tags: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at: number
          id: string
          image?: string | null
          ingredients?: Json
          is_favorite?: boolean
          macro_mode?: string
          macros?: Json
          portions?: number
          rating?: number | null
          steps?: Json
          tags?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: number
          id?: string
          image?: string | null
          ingredients?: Json
          is_favorite?: boolean
          macro_mode?: string
          macros?: Json
          portions?: number
          rating?: number | null
          steps?: Json
          tags?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_recipes: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          recipe_id: string
          recipe_snapshot: Json
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          recipe_id?: string
          recipe_snapshot: Json
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          recipe_id?: string
          recipe_snapshot?: Json
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          amount: string
          category: string | null
          checked: boolean
          created_at: number
          id: string
          list_id: string
          name: string
          recipe_id: string | null
          recipe_title: string | null
          updated_at: string
        }
        Insert: {
          amount?: string
          category?: string | null
          checked?: boolean
          created_at: number
          id: string
          list_id: string
          name: string
          recipe_id?: string | null
          recipe_title?: string | null
          updated_at?: string
        }
        Update: {
          amount?: string
          category?: string | null
          checked?: boolean
          created_at?: number
          id?: string
          list_id?: string
          name?: string
          recipe_id?: string | null
          recipe_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_invites: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          invitee_id: string
          list_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          invitee_id: string
          list_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          invitee_id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_invites_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_members: {
        Row: {
          joined_at: string
          list_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          list_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          list_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_shopping_list_member: {
        Args: { target_list_id: string }
        Returns: boolean
      }
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
  public: {
    Enums: {},
  },
} as const
