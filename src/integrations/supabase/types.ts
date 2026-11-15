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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      admin_secrets: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      card_credits: {
        Row: {
          amount: number
          card_id: string
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          points: number
        }
        Insert: {
          amount: number
          card_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          points?: number
        }
        Update: {
          amount?: number
          card_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: "card_credits_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "customer_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_transactions: {
        Row: {
          amount: number
          buyer_user_id: string | null
          card_id: string
          category: string | null
          color: string | null
          created_at: string
          currency: string
          id: string
          points_earned: number
          product_id: string | null
          product_name: string
          quantity: number
          size: string | null
        }
        Insert: {
          amount: number
          buyer_user_id?: string | null
          card_id: string
          category?: string | null
          color?: string | null
          created_at?: string
          currency?: string
          id?: string
          points_earned?: number
          product_id?: string | null
          product_name: string
          quantity?: number
          size?: string | null
        }
        Update: {
          amount?: number
          buyer_user_id?: string | null
          card_id?: string
          category?: string | null
          color?: string | null
          created_at?: string
          currency?: string
          id?: string
          points_earned?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "customer_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          label: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          label: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          label?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_cards: {
        Row: {
          balance: number
          card_number: string
          card_title: string
          created_at: string
          cvv: string
          email: string | null
          full_name: string
          id: string
          is_owner_card: boolean
          phone: string | null
          points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          card_number: string
          card_title?: string
          created_at?: string
          cvv: string
          email?: string | null
          full_name: string
          id?: string
          is_owner_card?: boolean
          phone?: string | null
          points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          card_number?: string
          card_title?: string
          created_at?: string
          cvv?: string
          email?: string | null
          full_name?: string
          id?: string
          is_owner_card?: boolean
          phone?: string | null
          points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          file_url: string
          id: string
          is_visible: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_url: string
          id?: string
          is_visible?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_url?: string
          id?: string
          is_visible?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          category: string | null
          color: string | null
          created_at: string
          currency: string
          customer_name: string
          email: string | null
          id: string
          note: string | null
          payment_method: string
          phone: string
          product_id: string | null
          product_name: string
          quantity: number
          size: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          category?: string | null
          color?: string | null
          created_at?: string
          currency?: string
          customer_name: string
          email?: string | null
          id?: string
          note?: string | null
          payment_method?: string
          phone: string
          product_id?: string | null
          product_name: string
          quantity?: number
          size?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          color?: string | null
          created_at?: string
          currency?: string
          customer_name?: string
          email?: string | null
          id?: string
          note?: string | null
          payment_method?: string
          phone?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          size?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      posters: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          message: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          message?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          message?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          colors: string[]
          compare_price: number | null
          created_at: string
          currency: string
          description: string | null
          gallery: string[]
          id: string
          image_url: string | null
          is_featured: boolean
          is_visible: boolean
          name: string
          price: number
          sizes: string[]
          slug: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: string
          colors?: string[]
          compare_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          gallery?: string[]
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_visible?: boolean
          name: string
          price?: number
          sizes?: string[]
          slug?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          colors?: string[]
          compare_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          gallery?: string[]
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_visible?: boolean
          name?: string
          price?: number
          sizes?: string[]
          slug?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_credit: {
        Args: { _amount: number; _card_id: string; _note?: string }
        Returns: number
      }
      admin_add_points: {
        Args: { _card_id: string; _note?: string; _points: number }
        Returns: number
      }
      admin_redeem_points: {
        Args: { _card_id: string; _points: number }
        Returns: Json
      }
      admin_secret_is_set: { Args: { _key: string }; Returns: boolean }
      admin_set_secret: {
        Args: { _key: string; _value: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      issue_my_card: {
        Args: { _full_name?: string; _phone?: string }
        Returns: string
      }
      spend_card: {
        Args: {
          _card_number: string
          _color?: string
          _cvv: string
          _product_id: string
          _quantity?: number
          _size?: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const
