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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      agreement_versions: {
        Row: {
          content: string
          content_hash: string
          created_at: string
          effective_date: string
          id: string
          version: string
        }
        Insert: {
          content: string
          content_hash: string
          created_at?: string
          effective_date?: string
          id?: string
          version: string
        }
        Update: {
          content?: string
          content_hash?: string
          created_at?: string
          effective_date?: string
          id?: string
          version?: string
        }
        Relationships: []
      }
      booking_events: {
        Row: {
          actor: string
          booking_id: string
          created_at: string
          from_state: string | null
          id: string
          meta: Json
          to_state: string
        }
        Insert: {
          actor?: string
          booking_id: string
          created_at?: string
          from_state?: string | null
          id?: string
          meta?: Json
          to_state: string
        }
        Update: {
          actor?: string
          booking_id?: string
          created_at?: string
          from_state?: string | null
          id?: string
          meta?: Json
          to_state?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          addl_hours: number | null
          addl_rate_cents: number | null
          agreement_content_hash: string | null
          agreement_signed: boolean
          agreement_template_version: string | null
          amount_paid_cents: number
          balance_cents: number | null
          balance_due_date: string | null
          balance_link: string | null
          balance_payment_intent_id: string | null
          balance_status: string | null
          base_cents: number | null
          class_session_id: string | null
          client_email: string | null
          client_name: string | null
          client_notes: string | null
          client_phone: string | null
          concierge_agreement_sent_at: string | null
          concierge_channel: string | null
          concierge_fallback_used: boolean | null
          concierge_status: string | null
          confirmation_channels: string[] | null
          confirmation_sent_at: string | null
          consent: boolean
          created_at: string
          currency: string
          deposit_cents: number | null
          duration_hours: number | null
          duration_minutes: number | null
          event_date: string | null
          event_location: string | null
          event_start_time: string | null
          event_type: string | null
          executed_pdf_url: string | null
          experience: string | null
          id: string
          marketing_opt_in: boolean
          paid_at: string | null
          payment_mode: string | null
          product: string
          resource: string | null
          signature_value: string | null
          signed_at: string | null
          signer_ip: string | null
          signer_name: string | null
          signer_user_agent: string | null
          station_count: number | null
          status: Database["public"]["Enums"]["booking_status"]
          stripe_charge_id: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          total_cents: number | null
          updated_at: string
        }
        Insert: {
          addl_hours?: number | null
          addl_rate_cents?: number | null
          agreement_content_hash?: string | null
          agreement_signed?: boolean
          agreement_template_version?: string | null
          amount_paid_cents?: number
          balance_cents?: number | null
          balance_due_date?: string | null
          balance_link?: string | null
          balance_payment_intent_id?: string | null
          balance_status?: string | null
          base_cents?: number | null
          class_session_id?: string | null
          client_email?: string | null
          client_name?: string | null
          client_notes?: string | null
          client_phone?: string | null
          concierge_agreement_sent_at?: string | null
          concierge_channel?: string | null
          concierge_fallback_used?: boolean | null
          concierge_status?: string | null
          confirmation_channels?: string[] | null
          confirmation_sent_at?: string | null
          consent?: boolean
          created_at?: string
          currency?: string
          deposit_cents?: number | null
          duration_hours?: number | null
          duration_minutes?: number | null
          event_date?: string | null
          event_location?: string | null
          event_start_time?: string | null
          event_type?: string | null
          executed_pdf_url?: string | null
          experience?: string | null
          id?: string
          marketing_opt_in?: boolean
          paid_at?: string | null
          payment_mode?: string | null
          product?: string
          resource?: string | null
          signature_value?: string | null
          signed_at?: string | null
          signer_ip?: string | null
          signer_name?: string | null
          signer_user_agent?: string | null
          station_count?: number | null
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          total_cents?: number | null
          updated_at?: string
        }
        Update: {
          addl_hours?: number | null
          addl_rate_cents?: number | null
          agreement_content_hash?: string | null
          agreement_signed?: boolean
          agreement_template_version?: string | null
          amount_paid_cents?: number
          balance_cents?: number | null
          balance_due_date?: string | null
          balance_link?: string | null
          balance_payment_intent_id?: string | null
          balance_status?: string | null
          base_cents?: number | null
          class_session_id?: string | null
          client_email?: string | null
          client_name?: string | null
          client_notes?: string | null
          client_phone?: string | null
          concierge_agreement_sent_at?: string | null
          concierge_channel?: string | null
          concierge_fallback_used?: boolean | null
          concierge_status?: string | null
          confirmation_channels?: string[] | null
          confirmation_sent_at?: string | null
          consent?: boolean
          created_at?: string
          currency?: string
          deposit_cents?: number | null
          duration_hours?: number | null
          duration_minutes?: number | null
          event_date?: string | null
          event_location?: string | null
          event_start_time?: string | null
          event_type?: string | null
          executed_pdf_url?: string | null
          experience?: string | null
          id?: string
          marketing_opt_in?: boolean
          paid_at?: string | null
          payment_mode?: string | null
          product?: string
          resource?: string | null
          signature_value?: string | null
          signed_at?: string | null
          signer_ip?: string | null
          signer_name?: string | null
          signer_user_agent?: string | null
          station_count?: number | null
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          total_cents?: number | null
          updated_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      booking_status:
        | "draft"
        | "pending_agreement"
        | "agreement_signed"
        | "deposit_paid"
        | "paid_in_full"
        | "confirmed"
        | "balance_due"
        | "settled"
        | "completed"
        | "cancelled"
        | "expired"
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
      app_role: ["admin", "moderator", "user"],
      booking_status: [
        "draft",
        "pending_agreement",
        "agreement_signed",
        "deposit_paid",
        "paid_in_full",
        "confirmed",
        "balance_due",
        "settled",
        "completed",
        "cancelled",
        "expired",
      ],
    },
  },
} as const
