import React from 'react';
import { 
  Users, 
  DollarSign, 
  CalendarCheck, 
  TrendingUp 
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

const data = [
  { name: 'Mon', revenue: 4000, attendance: 24 },
  { name: 'Tue', revenue: 3000, attendance: 18 },
  { name: 'Wed', revenue: 2000, attendance: 35 },
  { name: 'Thu', revenue: 2780, attendance: 28 },
  { name: 'Fri', revenue: 1890, attendance: 15 },
  { name: 'Sat', revenue: 2390, attendance: 45 },
  { name: 'Sun', revenue: 3490, attendance: 30 },
];

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

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
          <p className="text-slate-500">Welcome back, Administrator.</p>
        </div>
        <div className="text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value="1,248" 
          subtext="+12% from last month" 
          icon={Users} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Monthly Revenue" 
          value="$48,200" 
          subtext="+8.1% from last month" 
          icon={DollarSign} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Active Classes" 
          value="24" 
          subtext="3 classes ending soon" 
          icon={CalendarCheck} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Avg. Attendance" 
          value="85%" 
          subtext="+2% increase" 
          icon={TrendingUp} 
          color="bg-orange-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Weekly Attendance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
