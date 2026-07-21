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
      campaigns: {
        Row: {
          audience_size: number
          budget: number
          channel: string
          created_at: string
          id: string
          leads_generated: number
          name: string
          notes: string | null
          spend: number
          status: string
          updated_at: string
        }
        Insert: {
          audience_size?: number
          budget?: number
          channel: string
          created_at?: string
          id?: string
          leads_generated?: number
          name: string
          notes?: string | null
          spend?: number
          status?: string
          updated_at?: string
        }
        Update: {
          audience_size?: number
          budget?: number
          channel?: string
          created_at?: string
          id?: string
          leads_generated?: number
          name?: string
          notes?: string | null
          spend?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      carriers: {
        Row: {
          avg_salary: number | null
          created_at: string
          hiring: boolean
          id: string
          locations: string | null
          name: string
          openings: number
        }
        Insert: {
          avg_salary?: number | null
          created_at?: string
          hiring?: boolean
          id?: string
          locations?: string | null
          name: string
          openings?: number
        }
        Update: {
          avg_salary?: number | null
          created_at?: string
          hiring?: boolean
          id?: string
          locations?: string | null
          name?: string
          openings?: number
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string
          id: string
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          id?: string
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string
          full_name: string
          funding_notes: string | null
          funding_path: string | null
          id: string
          message: string | null
          phone: string | null
          program: string | null
          score: number
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          funding_notes?: string | null
          funding_path?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          program?: string | null
          score?: number
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          funding_notes?: string | null
          funding_path?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          program?: string | null
          score?: number
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          paid_date: string | null
          status: string
          student_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          paid_date?: string | null
          status?: string
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          paid_date?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      placements: {
        Row: {
          carrier_id: string | null
          carrier_name: string | null
          created_at: string
          id: string
          placed_date: string | null
          salary: number | null
          status: string
          student_id: string | null
          student_name: string | null
        }
        Insert: {
          carrier_id?: string | null
          carrier_name?: string | null
          created_at?: string
          id?: string
          placed_date?: string | null
          salary?: number | null
          status?: string
          student_id?: string | null
          student_name?: string | null
        }
        Update: {
          carrier_id?: string | null
          carrier_name?: string | null
          created_at?: string
          id?: string
          placed_date?: string | null
          salary?: number | null
          status?: string
          student_id?: string | null
          student_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "placements_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          cohort: string | null
          created_at: string
          email: string | null
          enrollment_date: string
          full_name: string
          hours_completed: number
          hours_required: number
          id: string
          instructor_name: string | null
          phone: string | null
          program: string
          progress_pct: number
          status: string
          updated_at: string
        }
        Insert: {
          cohort?: string | null
          created_at?: string
          email?: string | null
          enrollment_date?: string
          full_name: string
          hours_completed?: number
          hours_required?: number
          id?: string
          instructor_name?: string | null
          phone?: string | null
          program?: string
          progress_pct?: number
          status?: string
          updated_at?: string
        }
        Update: {
          cohort?: string | null
          created_at?: string
          email?: string | null
          enrollment_date?: string
          full_name?: string
          hours_completed?: number
          hours_required?: number
          id?: string
          instructor_name?: string | null
          phone?: string | null
          program?: string
          progress_pct?: number
          status?: string
          updated_at?: string
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
      vehicles: {
        Row: {
          driver_name: string | null
          id: string
          lat: number
          lng: number
          location_name: string | null
          speed: number
          status: string
          unit_number: string
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          driver_name?: string | null
          id?: string
          lat?: number
          lng?: number
          location_name?: string | null
          speed?: number
          status?: string
          unit_number: string
          updated_at?: string
          vehicle_type?: string
        }
        Update: {
          driver_name?: string | null
          id?: string
          lat?: number
          lng?: number
          location_name?: string | null
          speed?: number
          status?: string
          unit_number?: string
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "staff" | "instructor"
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
      app_role: ["admin", "staff", "instructor"],
    },
  },
} as const
