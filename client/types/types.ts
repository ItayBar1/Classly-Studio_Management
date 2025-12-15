export type UserRole = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export type EnrollmentStatus = 'Active' | 'Pending' | 'Suspended';

export interface Student extends User {
  email: string;
  phone: string;
  enrolledClass: string;
  status: EnrollmentStatus;
  joinDate: string;
}

export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export interface ImageGenerationConfig {
  prompt: string;
  size: ImageSize;
  aspectRatio: AspectRatio;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
  config: ImageGenerationConfig;
}

export interface ClassSession {
  id: string;
  name: string;
  instructor: string;
  instructorAvatar: string;
  startTime: string; // e.g., "09:00"
  duration: number; // in minutes
  dayOfWeek: string;
  students: number;
  capacity: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  room: string;
  category: string;
  color: string; // Tailwind color class (e.g., 'indigo')
}
