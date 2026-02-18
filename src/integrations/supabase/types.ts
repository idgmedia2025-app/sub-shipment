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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          company: string
          created_at: string
          customer_id: string | null
          email: string
          id: string
          language: string
          lead_id: string | null
          message: string | null
          name: string
          phone: string
          preferred_date: string
          preferred_time: string
          service: string
          status: string
        }
        Insert: {
          company: string
          created_at?: string
          customer_id?: string | null
          email: string
          id?: string
          language: string
          lead_id?: string | null
          message?: string | null
          name: string
          phone: string
          preferred_date: string
          preferred_time: string
          service: string
          status?: string
        }
        Update: {
          company?: string
          created_at?: string
          customer_id?: string | null
          email?: string
          id?: string
          language?: string
          lead_id?: string | null
          message?: string | null
          name?: string
          phone?: string
          preferred_date?: string
          preferred_time?: string
          service?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          company: string
          created_at: string
          email: string
          id: string
          is_deleted: boolean
          name: string
          phone: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company: string
          created_at?: string
          email: string
          id?: string
          is_deleted?: boolean
          name: string
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          id?: string
          is_deleted?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      invites: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          commercial_no: string | null
          converted_at: string | null
          converted_from_invoice_id: string | null
          created_at: string
          currency: string
          customer_id: string
          discount: number
          id: string
          invoice_type: string
          items: Json
          paid_at: string | null
          proforma_no: string | null
          sent_at: string | null
          shipment_id: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          commercial_no?: string | null
          converted_at?: string | null
          converted_from_invoice_id?: string | null
          created_at?: string
          currency?: string
          customer_id: string
          discount?: number
          id?: string
          invoice_type: string
          items?: Json
          paid_at?: string | null
          proforma_no?: string | null
          sent_at?: string | null
          shipment_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          commercial_no?: string | null
          converted_at?: string | null
          converted_from_invoice_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string
          discount?: number
          id?: string
          invoice_type?: string
          items?: Json
          paid_at?: string | null
          proforma_no?: string | null
          sent_at?: string | null
          shipment_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_converted_from_invoice_id_fkey"
            columns: ["converted_from_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          customer_id: string | null
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          customer_id?: string | null
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          customer_id: string | null
          email: string
          id: string
          is_active: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          email: string
          id?: string
          is_active?: boolean
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          cargo_description: string | null
          container_type: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          destination: string
          eta_date: string | null
          height_cm: number | null
          id: string
          is_deleted: boolean
          length_cm: number | null
          notes: string | null
          origin: string
          status: string
          tracking_number: string
          type: string
          updated_at: string
          updated_by: string | null
          vehicle_type: string | null
          volume_cbm: number | null
          volumetric_weight: number | null
          weight_kg: number | null
          width_cm: number | null
        }
        Insert: {
          cargo_description?: string | null
          container_type?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          destination: string
          eta_date?: string | null
          height_cm?: number | null
          id?: string
          is_deleted?: boolean
          length_cm?: number | null
          notes?: string | null
          origin: string
          status?: string
          tracking_number: string
          type: string
          updated_at?: string
          updated_by?: string | null
          vehicle_type?: string | null
          volume_cbm?: number | null
          volumetric_weight?: number | null
          weight_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          cargo_description?: string | null
          container_type?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          destination?: string
          eta_date?: string | null
          height_cm?: number | null
          id?: string
          is_deleted?: boolean
          length_cm?: number | null
          notes?: string | null
          origin?: string
          status?: string
          tracking_number?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
          vehicle_type?: string | null
          volume_cbm?: number | null
          volumetric_weight?: number | null
          weight_kg?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          event_time: string
          id: string
          location: string
          shipment_id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          event_time: string
          id?: string
          location: string
          shipment_id: string
          status?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          event_time?: string
          id?: string
          location?: string
          shipment_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      create_appointment_and_customer: {
        Args: { payload: Json }
        Returns: Json
      }
      generate_invoice_number: { Args: { _type: string }; Returns: string }
      get_public_tracking: { Args: { _tracking_number: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
