export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone_number: string | null
          profile_image_url: string | null
          role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' | 'PARENT'
          studio_id: string | null
          status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
          last_login_at: string | null
          login_count: number | null
          preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
          role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' | 'PARENT'
          studio_id?: string | null
          status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
          last_login_at?: string | null
          login_count?: number | null
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
          role?: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' | 'PARENT'
          studio_id?: string | null
          status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
          last_login_at?: string | null
          login_count?: number | null
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      studios: {
        Row: {
          id: string
          name: string
          description: string | null
          admin_id: string
          address: string | null
          city: string | null
          coordinates: unknown | null // Point type in Postgres
          contact_email: string | null
          contact_phone: string | null
          website_url: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_code: string | null
          cancellation_deadline_hours: number | null
          refund_percentage: number | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          admin_id: string
          address?: string | null
          city?: string | null
          coordinates?: unknown | null
          contact_email?: string | null
          contact_phone?: string | null
          website_url?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_code?: string | null
          cancellation_deadline_hours?: number | null
          refund_percentage?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          admin_id?: string
          address?: string | null
          city?: string | null
          coordinates?: unknown | null
          contact_email?: string | null
          contact_phone?: string | null
          website_url?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_code?: string | null
          cancellation_deadline_hours?: number | null
          refund_percentage?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          studio_id: string
          category_id: string | null
          name: string
          description: string | null
          instructor_id: string
          day_of_week: number | null
          start_time: string
          end_time: string
          timezone: string | null
          location_room: string | null
          location_building: string | null
          max_capacity: number
          current_enrollment: number | null
          age_range_min: number | null
          age_range_max: number | null
          level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS' | null
          price_ils: number
          billing_cycle: 'MONTHLY' | 'SEMESTER' | 'YEARLY' | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          studio_id: string
          category_id?: string | null
          name: string
          description?: string | null
          instructor_id: string
          day_of_week?: number | null
          start_time: string
          end_time: string
          timezone?: string | null
          location_room?: string | null
          location_building?: string | null
          max_capacity: number
          current_enrollment?: number | null
          age_range_min?: number | null
          age_range_max?: number | null
          level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS' | null
          price_ils: number
          billing_cycle?: 'MONTHLY' | 'SEMESTER' | 'YEARLY' | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          studio_id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          instructor_id?: string
          day_of_week?: number | null
          start_time?: string
          end_time?: string
          timezone?: string | null
          location_room?: string | null
          location_building?: string | null
          max_capacity?: number
          current_enrollment?: number | null
          age_range_min?: number | null
          age_range_max?: number | null
          level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS' | null
          price_ils?: number
          billing_cycle?: 'MONTHLY' | 'SEMESTER' | 'YEARLY' | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          studio_id: string
          student_id: string
          class_id: string
          parent_id: string | null
          enrollment_date: string | null
          status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | null
          payment_status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | null
          total_amount_due: number
          total_amount_paid: number
          start_date: string
          end_date: string | null
          cancellation_reason: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          studio_id: string
          student_id: string
          class_id: string
          parent_id?: string | null
          enrollment_date?: string | null
          status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | null
          payment_status?: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | null
          total_amount_due?: number
          total_amount_paid?: number
          start_date: string
          end_date?: string | null
          cancellation_reason?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          studio_id?: string
          student_id?: string
          class_id?: string
          parent_id?: string | null
          enrollment_date?: string | null
          status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | null
          payment_status?: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | null
          total_amount_due?: number
          total_amount_paid?: number
          start_date?: string
          end_date?: string | null
          cancellation_reason?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}