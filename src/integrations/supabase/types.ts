export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      events: {
        Row: {
          allow_rsvp_edit: boolean | null
          created_at: string
          custom_event_id: string | null
          details: Json
          host_id: string
          id: string
          name: string
          page_name: string
          rsvp_config: Json | null
          template_id: string
          wishes_enabled: boolean
        }
        Insert: {
          allow_rsvp_edit?: boolean | null
          created_at?: string
          custom_event_id?: string | null
          details: Json
          host_id: string
          id?: string
          name: string
          page_name: string
          rsvp_config?: Json | null
          template_id: string
          wishes_enabled?: boolean
        }
        Update: {
          allow_rsvp_edit?: boolean | null
          created_at?: string
          custom_event_id?: string | null
          details?: Json
          host_id?: string
          id?: string
          name?: string
          page_name?: string
          rsvp_config?: Json | null
          template_id?: string
          wishes_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "events_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_event_access: {
        Row: {
          can_access: boolean
          created_at: string
          event_detail_id: string
          event_id: string
          guest_id: string
          id: string
        }
        Insert: {
          can_access?: boolean
          created_at?: string
          event_detail_id: string
          event_id: string
          guest_id: string
          id?: string
        }
        Update: {
          can_access?: boolean
          created_at?: string
          event_detail_id?: string
          event_id?: string
          guest_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_event_access_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_event_access_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          accepted: boolean
          accepted_at: string | null
          created_at: string
          custom_guest_id: string | null
          event_id: string
          id: string
          mobile_number: string
          name: string
          rsvp_data: Json | null
          user_id: string | null
          viewed: boolean
          viewed_at: string | null
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string | null
          created_at?: string
          custom_guest_id?: string | null
          event_id: string
          id?: string
          mobile_number: string
          name: string
          rsvp_data?: Json | null
          user_id?: string | null
          viewed?: boolean
          viewed_at?: string | null
        }
        Update: {
          accepted?: boolean
          accepted_at?: string | null
          created_at?: string
          custom_guest_id?: string | null
          event_id?: string
          id?: string
          mobile_number?: string
          name?: string
          rsvp_data?: Json | null
          user_id?: string | null
          viewed?: boolean
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          mobile_number: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          mobile_number: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          mobile_number?: string
          name?: string
        }
        Relationships: []
      }
      rsvp_field_definitions: {
        Row: {
          created_at: string | null
          display_order: number | null
          event_id: string
          field_label: string
          field_name: string
          field_options: Json | null
          field_type: string
          id: string
          is_required: boolean | null
          placeholder_text: string | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          event_id: string
          field_label: string
          field_name: string
          field_options?: Json | null
          field_type: string
          id?: string
          is_required?: boolean | null
          placeholder_text?: string | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          event_id?: string
          field_label?: string
          field_name?: string
          field_options?: Json | null
          field_type?: string
          id?: string
          is_required?: boolean | null
          placeholder_text?: string | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_field_definitions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          component_name: string
          created_at: string
          external_url: string | null
          field_types: Json | null
          fields: Json
          id: string
          name: string
          pages: Json
          template_type: string | null
          template_version: string | null
          theme_config: Json | null
          thumbnail_url: string | null
          ui_config: Json | null
          validation_rules: Json | null
        }
        Insert: {
          component_name: string
          created_at?: string
          external_url?: string | null
          field_types?: Json | null
          fields: Json
          id?: string
          name: string
          pages: Json
          template_type?: string | null
          template_version?: string | null
          theme_config?: Json | null
          thumbnail_url?: string | null
          ui_config?: Json | null
          validation_rules?: Json | null
        }
        Update: {
          component_name?: string
          created_at?: string
          external_url?: string | null
          field_types?: Json | null
          fields?: Json
          id?: string
          name?: string
          pages?: Json
          template_type?: string | null
          template_version?: string | null
          theme_config?: Json | null
          thumbnail_url?: string | null
          ui_config?: Json | null
          validation_rules?: Json | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wish_likes: {
        Row: {
          created_at: string
          guest_id: string
          id: string
          wish_id: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          id?: string
          wish_id: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          id?: string
          wish_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wish_likes_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wish_likes_wish_id_fkey"
            columns: ["wish_id"]
            isOneToOne: false
            referencedRelation: "wishes"
            referencedColumns: ["id"]
          },
        ]
      }
      wishes: {
        Row: {
          created_at: string
          event_id: string
          guest_id: string | null
          guest_name: string
          id: string
          is_approved: boolean
          likes_count: number
          photo_url: string | null
          wish_text: string
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_id?: string | null
          guest_name: string
          id?: string
          is_approved?: boolean
          likes_count?: number
          photo_url?: string | null
          wish_text: string
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_id?: string | null
          guest_name?: string
          id?: string
          is_approved?: boolean
          likes_count?: number
          photo_url?: string | null
          wish_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishes_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_wish_likes: {
        Args: { wish_id: string }
        Returns: undefined
      }
      event_has_guests: {
        Args: { event_uuid: string }
        Returns: boolean
      }
      generate_short_id: {
        Args: { length: number }
        Returns: string
      }
      generate_unique_event_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_unique_guest_id: {
        Args: { event_uuid: string }
        Returns: string
      }
      get_event_custom_rsvp_fields: {
        Args: { event_uuid: string }
        Returns: {
          id: string
          field_name: string
          field_label: string
          field_type: string
          is_required: boolean
          field_options: Json
          placeholder_text: string
          validation_rules: Json
          display_order: number
        }[]
      }
      get_guest_visible_events: {
        Args: { p_guest_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      increment_wish_likes: {
        Args: { wish_id: string }
        Returns: undefined
      }
      user_can_view_event: {
        Args: { event_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
