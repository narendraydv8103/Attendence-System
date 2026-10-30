import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { AdminDashboardData } from '../../types';
import { Users, BookOpen, GraduationCap, CheckCircle2, ShieldAlert, BarChart3, PieChart } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await API.get('/dashboard');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const monthlyChartData = {
    labels: data?.charts.monthlyAttendance.map((m) => m.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Total Attendance Logs',
        data: data?.charts.monthlyAttendance.map((m) => m.attendanceCount) || [12, 19, 25, 30, 45, 60],
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderRadius: 8,
      },
    ],
  };

  const deptChartData = {
    labels: data?.charts.deptDistribution.map((d) => d.department) || ['Computer Science', 'Electrical', 'Mechanical'],
    datasets: [
      {
        data: data?.charts.deptDistribution.map((d) => d.studentCount) || [45, 20, 15],
        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-rose-950/50 via-slate-900 to-indigo-950/60 border border-rose-500/20 shadow-2xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-3">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Executive Analytics & Management
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          University Administration Hub
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-xl">
          Real-time oversight of system metrics, department distribution, user provisioning, and institution-wide attendance performance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{data?.stats.totalStudents || 0}</div>
            <div className="text-xs font-medium text-slate-400">Total Enrolled Students</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{data?.stats.totalTeachers || 0}</div>
            <div className="text-xs font-medium text-slate-400">Faculty Teachers</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{data?.stats.totalCourses || 0}</div>
            <div className="text-xs font-medium text-slate-400">Active Courses</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{data?.stats.attendanceToday || 0}</div>
            <div className="text-xs font-medium text-slate-400">Today's Attendance Scans</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Attendance Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              Monthly Attendance Trends
            </h3>
            <span className="text-xs font-semibold text-slate-400">Across All Departments</span>
          </div>
          <div className="h-64 w-full">
            <Bar
              data={monthlyChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                  y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
                },
              }}
            />
          </div>
        </div>

        {/* Department Distribution Doughnut */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-400" />
                Department Breakdown
              </h3>
            </div>
            <div className="h-56 w-full flex items-center justify-center">
              <Doughnut
                data={deptChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
