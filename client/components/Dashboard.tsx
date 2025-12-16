import React, { useEffect, useState } from 'react';
import { 
  Users, 
  DollarSign, 
  CalendarCheck, 
  TrendingUp,
  Loader2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { supabase } from '../services/supabaseClient';
import { Database } from '../types/database';

interface ChartData {
  name: string;
  revenue: number;
  attendance: number;
}

type PaymentData = Pick<Database['public']['Tables']['payments']['Row'], 'amount_ils' | 'created_at'>;
type AttendanceData = Pick<Database['public']['Tables']['attendance']['Row'], 'session_date' | 'status'>;

const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
      <p className={`text-xs mt-2 font-medium ${subtext.includes('+') ? 'text-green-600' : 'text-slate-400'}`}>
        {subtext}
      </p>
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="text-white" size={24} />
    </div>
  </div>
);

// מיפוי ימים לעברית לגרפים
const DAY_NAMES_HE: Record<string, string> = {
  'Sun': 'א׳', 'Mon': 'ב׳', 'Tue': 'ג׳', 'Wed': 'ד׳', 'Thu': 'ה׳', 'Fri': 'ו׳', 'Sat': 'ש׳'
};

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    monthlyRevenue: 0,
    activeClasses: 0,
    avgAttendance: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString();

        // ביצוע כל השאילתות במקביל באמצעות Promise.all
        const [
          { count: studentsCount },
          { count: classesCount },
          { data: payments },
          { data: weekPayments },
          { data: weekAttendance }
        ] = await Promise.all([
          // שאילתה 1: מספר תלמידים
          supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'STUDENT'),
          
          // שאילתה 2: מספר שיעורים פעילים
          supabase
            .from('classes')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true),

          // שאילתה 3: הכנסות החודש (שולפים רק את הסכום לחיסכון בתעבורה)
          supabase
            .from('payments')
            .select('amount_ils')
            .gte('created_at', firstDayOfMonth),

          // שאילתה 4: נתונים לגרף הכנסות שבועי
          supabase
            .from('payments')
            .select('amount_ils, created_at')
            .gte('created_at', sevenDaysAgoStr),

          // שאילתה 5: נתונים לגרף נוכחות שבועי
          supabase
            .from('attendance')
            .select('session_date, status')
            .gte('session_date', sevenDaysAgoStr)
            .eq('status', 'PRESENT')
        ]);

        // חישוב הכנסות
        const monthlyRevenue = payments?.reduce((sum, p: any) => sum + Number(p.amount_ils), 0) || 0;

        // עיבוד נתונים לגרפים
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const chartMap = new Map<string, ChartData>();

        // אתחול 7 הימים האחרונים
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(now.getDate() - i);
          const dayNameEng = days[d.getDay()];
          const dayNameHeb = DAY_NAMES_HE[dayNameEng];
          const dateKey = d.toISOString().split('T')[0];
          
          chartMap.set(dateKey, { name: dayNameHeb, revenue: 0, attendance: 0 });
        }

        // מילוי נתוני הכנסות
        weekPayments?.forEach((p: any) => {
          const dateKey = new Date(p.created_at).toISOString().split('T')[0];
          if (chartMap.has(dateKey)) {
            const current = chartMap.get(dateKey)!;
            current.revenue += Number(p.amount_ils);
          }
        });

        // מילוי נתוני נוכחות
        weekAttendance?.forEach((a: any) => {
           const dateKey = a.session_date; 
           if (chartMap.has(dateKey)) {
             const current = chartMap.get(dateKey)!;
             current.attendance += 1;
           }
        });

        const formattedChartData = Array.from(chartMap.values());
        const totalAttendance = weekAttendance?.length || 0;
        const avgAtt = totalAttendance > 0 ? Math.round((totalAttendance / 7) * 10) / 10 : 0; 

        setStats({
          totalStudents: studentsCount || 0,
          activeClasses: classesCount || 0,
          monthlyRevenue,
          avgAttendance: avgAtt 
        });
        
        setChartData(formattedChartData);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <Loader2 className="animate-spin mr-2" /> טוען נתונים...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">מבט על</h2>
          <p className="text-slate-500">ברוך שובך, מנהל המערכת.</p>
        </div>
        <div className="text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
          {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">מגמת הכנסות (7 ימים אחרונים)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'right' }}
                  formatter={(value: number) => [`₪${value}`, 'הכנסות']}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">נוכחות שבועית</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: 'right' }}
                   formatter={(value: number) => [value, 'נוכחים']}
                />
                <Line type="monotone" dataKey="attendance" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};