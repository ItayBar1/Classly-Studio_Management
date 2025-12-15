# Classly - Studio Management Platform

Classly is a modern, comprehensive dashboard designed for managing dance studios, fitness centers, and educational programs. The platform streamlines administrative tasks ranging from student registration and class scheduling to payment tracking and attendance monitoring.

Built with performance and user experience in mind, utilizing the latest web technologies.

## 🚀 Key Features

### 📊 Administrative Dashboard
A centralized hub for real-time analytics:
* **Key Metrics:** Instant view of total students, monthly revenue, active classes, and attendance rates.
* **Visual Analytics:** Interactive charts (powered by Recharts) for tracking revenue trends and weekly attendance.

### 👥 Student Management
Robust system for managing student rosters:
* **Search & Filter:** Advanced filtering by name, email, or enrolled class.
* **Data Export:** Built-in functionality to export student data to CSV.
* **Status Tracking:** Visual indicators for enrollment status (Active, Pending, Suspended).

### 📅 Class Schedule
Dynamic weekly timetable view:
* **Class Management:** View classes by day, including time slots, levels, and locations.
* **Capacity Tracking:** Visual indicators for class occupancy vs. maximum capacity.
* **Instructor Details:** Automatic integration with instructor profiles.

### 🔐 Authentication & Security
* **Secure Access:** Powered by Supabase Auth for robust login and signup flows.
* **Role-Based:** Designed to support different views for Admins, Instructors, and Students.

## 🛠️ Tech Stack

**Client:**
* **Framework:** React 19
* **Build Tool:** Vite
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **Charts:** Recharts

**Backend & Database:**
* **Infrastructure:** Supabase (PostgreSQL)
* **Authentication:** Supabase Auth
* **Realtime:** Supabase Realtime

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd classly-studio-management
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

## 📂 Project Structure

```text
client/
├── components/          # Application components
│   ├── AuthPage.tsx     # Login and Signup logic
│   ├── Dashboard.tsx    # Analytics and stats view
│   ├── StudentManagement.tsx # Student list and controls
│   ├── ClassSchedule.tsx     # Visual weekly schedule
│   └── Sidebar.tsx      # Main navigation
├── services/
│   └── supabaseClient.ts # Supabase client configuration
├── types/
│   ├── types.ts         # General TypeScript definitions
│   └── database.ts      # Auto-generated DB types
└── App.tsx              # Main layout and routing logic