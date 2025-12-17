// client/types/types.ts

// Enum definitions matching the Database
export type UserRole = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' | 'PARENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type EnrollmentStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type ClassLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Base User Interface
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  studio_id: string | null;
  phone_number?: string | null;
  profile_image_url?: string | null;
  created_at?: string;
  last_login_at?: string | null;
}

// Student Interface (Extends User)
export interface Student extends User {
  // Fields specific to student views or joined data
  enrolledClass?: string; // For display in tables
  joinDate?: string;      // Usually mapped from created_at
  parent_id?: string | null;
}

// Instructor Interface (Extends User)
export interface Instructor extends User {
  bio?: string;
  specialties?: string[];
}

// Class/Course Interface
export interface ClassSession {
  id: string;
  studio_id: string;
  name: string;
  description?: string | null;
  instructor_id: string;
  instructor?: {           // Joined data from API
    full_name: string;
    profile_image_url?: string | null;
  }; 
  day_of_week: DayOfWeek;
  start_time: string;      // Format: "HH:MM"
  end_time: string;        // Format: "HH:MM"
  max_capacity: number;
  current_enrollment: number;
  level: ClassLevel;
  location_room?: string | null;
  price_ils: number;
  is_active: boolean;
  category_id?: string | null;
}

// Enrollment Interface
export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  status: EnrollmentStatus;
  enrollment_date: string;
  class?: ClassSession; // Joined data if needed
}

// Payment Record Interface
export interface PaymentRecord {
  id: string;
  student_id: string;
  amount_ils: number;
  status: PaymentStatus;
  payment_method: string;
  created_at: string;
  invoice_number: string | null;
  description?: string | null;
  student_name?: string; // Optional for admin display
}

// Dashboard Statistics Interface
export interface DashboardStats {
  totalStudents: number;
  monthlyRevenue: number;
  activeClasses: number;
  avgAttendance: number;
  chartData: Array<{
    name: string;     // e.g., "Sunday" or "Jan"
    revenue: number;
    attendance: number;
  }>;
}

export interface InstructorStats {
  myCoursesCount: number;
  myStudentsCount: number;
  todayClassesCount: number;
  nextClass: ClassSession | null;
}