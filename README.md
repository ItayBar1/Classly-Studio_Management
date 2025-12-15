# Classly - Studio Management Platform

Classly is a modern, comprehensive dashboard designed for managing dance studios, fitness centers, and educational programs. Built with **React**, **TypeScript**, and **Vite**, it combines administrative management tools with AI-powered marketing capabilities.

## 🚀 Features

### 📊 Interactive Dashboard
A centralized hub for studio analytics and performance tracking:
* **Key Metrics:** Instant view of total students, monthly revenue, active classes, and attendance rates.
* **Visual Analytics:** Interactive bar and line charts (powered by Recharts) for tracking revenue trends and weekly attendance.

### 👥 Student Management
A robust system for managing student rosters:
* **Search & Filter:** Quickly find students by name or email, and filter by specific classes.
* **Sorting:** Sort student lists by name, enrollment status, or join date.
* **Status Tracking:** Visual indicators for Active, Pending, and Suspended enrollment statuses.
* **Data Export:** Built-in functionality to export student data to CSV for external use.

### ✨ AI Marketing Studio
Generate professional marketing assets directly from the dashboard:
* **Powered by Gemini:** Integrates with Google's Gemini 3 Pro model to create high-quality images from text descriptions.
* **Customization:** Support for multiple aspect ratios (1:1, 16:9, 9:16, etc.) and resolutions (1K, 2K, 4K).
* **Workflow:** Generate, preview, and download marketing materials for social media and print.

## 🛠️ Tech Stack

* **Frontend:** React 19, TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **Charts:** Recharts
* **AI Integration:** Google GenAI SDK (`@google/genai`)

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
    Create a `.env` file in the root directory and add your Google Gemini API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

## 📂 Project Structure

```text
src/
├── components/       # Core application components
│   ├── Dashboard.tsx         # Analytics and stats view
│   ├── StudentManagement.tsx # Student list and controls
│   ├── ImageGenerator.tsx    # AI marketing tool interface
│   └── Sidebar.tsx           # Main navigation
├── services/         # External service integrations
│   └── geminiService.ts      # Google GenAI configuration
├── types.ts          # TypeScript definitions
└── App.tsx           # Main layout and routing logic