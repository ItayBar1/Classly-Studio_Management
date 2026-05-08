import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Users,
  DollarSign,
  CalendarCheck,
  TrendingUp,
  Building2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { DashboardService } from "../../services/api";
import { API_ERRORS } from "../../constants/errors";
import { StatCard } from "../common/StatCard";
import { PageHeader } from "../common/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "../common/StateDisplay";

interface ChartData {
  name: string;
  revenue: number;
  attendance: number;
}


interface DashboardProps {
  onTabChange: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onTabChange }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noStudio, setNoStudio] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    monthlyRevenue: 0,
    activeClasses: 0,
    avgAttendance: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await DashboardService.getAdminStats();
        setStats({
          totalStudents: data.totalStudents,
          monthlyRevenue: data.monthlyRevenue,
          activeClasses: data.activeClasses,
          avgAttendance: data.avgAttendance,
        });
        setChartData(data.chartData);
      } catch (error: any) {
        console.error("Failed to load dashboard:", error);
        if (
          error?.response?.status === 400 &&
          error?.response?.data?.error === API_ERRORS.STUDIO_ID_MISSING
        ) {
          setNoStudio(true);
        } else {
          setError("שגיאה בטעינת הנתונים. אנא נסה שוב מאוחר יותר.");
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  if (noStudio) {
    return (
      <EmptyState
        icon={Building2}
        title="ברוך הבא ל-Classly!"
        description="הסטודיו שלך עדיין לא הוגדר. כדי להתחיל, עבור למסך הניהול וצור את פרטי הסטודיו."
        action={{
          label: "עבור להגדרת הסטודיו",
          onClick: () => onTabChange("administration"),
        }}
      />
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <Helmet>
        <title>לוח בקרה | Classly</title>
      </Helmet>
      <PageHeader
        title="מבט על"
        subtitle="ברוך שובך, מנהל המערכת."
        rightContent={
          <div className="text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-full dark:bg-slate-800 dark:text-slate-400">
            {new Date().toLocaleDateString("he-IL", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title='סה"כ תלמידים'
          value={stats.totalStudents.toLocaleString()}
          subtext="רשומות פעילות"
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="הכנסות החודש"
          value={`₪${stats.monthlyRevenue.toLocaleString()}`}
          subtext="חודש נוכחי"
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="שיעורים פעילים"
          value={stats.activeClasses}
          subtext="רצים כעת במערכת"
          icon={CalendarCheck}
          color="bg-indigo-500"
        />
        <StatCard
          title="ממוצע נוכחות"
          value={stats.avgAttendance}
          subtext="ממוצע ליום (7 ימים)"
          icon={TrendingUp}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 mb-4 dark:text-slate-100">
            מגמת הכנסות (7 ימים אחרונים)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    textAlign: "right",
                  }}
                  formatter={(value: number) => [`₪${value}`, "הכנסות"]}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 mb-4 dark:text-slate-100">
            נוכחות שבועית
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    textAlign: "right",
                  }}
                  formatter={(value: number) => [value, "נוכחים"]}
                />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
