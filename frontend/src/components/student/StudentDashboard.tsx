import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Course, StudentStats } from '../../types';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  TrendingUp,
  Award,
  Clock,
  Calendar,
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface StudentDashboardProps {
  onOpenScanModal: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onOpenScanModal }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setIsLoading(true);
    try {
      const [coursesRes, statsRes] = await Promise.all([
        API.get('/student/courses'),
        API.get('/student/stats'),
      ]);

      if (coursesRes.data.success) {
        setCourses(coursesRes.data.courses);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = {
    labels: stats?.monthlyStats.map((m) => m.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Attended Classes',
        data: stats?.monthlyStats.map((m) => m.attended) || [4, 8, 12, 10, 15, 18],
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8', stepSize: 2 } },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const overallPct = stats?.overallPercentage ?? 100;
  const isLowAttendance = overallPct < 75;

  return (
    <div className="space-y-8">
      {/* Banner / Header */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/20 overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <Award className="w-3.5 h-3.5 text-indigo-400" /> Academic Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, Student! 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Scan teacher QR codes in real-time to mark your attendance instantly and track your course stats.
            </p>
          </div>

          <button
            onClick={onOpenScanModal}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0"
          >
            <QrCode className="w-5 h-5 animate-pulse" />
            <span>Scan Classroom QR Now</span>
          </button>
        </div>
      </div>

      {/* Low Attendance Alert */}
      {isLowAttendance && (
        <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-rose-100">Low Attendance Warning!</h4>
            <p className="text-xs text-rose-300/80 mt-0.5">
              Your overall attendance is below 75% ({overallPct}%). An automated email alert has been dispatched to your registered address. Ensure you attend upcoming classes!
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{stats?.totalCourses || courses.length}</div>
            <div className="text-xs font-medium text-slate-400">Enrolled Courses</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{stats?.totalAttended || 0}</div>
            <div className="text-xs font-medium text-slate-400">Classes Attended</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{stats?.totalLectures || 0}</div>
            <div className="text-xs font-medium text-slate-400">Total Conducted</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-slate-800">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
              isLowAttendance
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}
          >
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-2xl font-black ${isLowAttendance ? 'text-rose-400' : 'text-emerald-400'}`}>
              {overallPct}%
            </div>
            <div className="text-xs font-medium text-slate-400">Overall Attendance</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Courses Breakdown & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course Progress Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Course-wise Attendance
            </h3>
            <span className="text-xs font-semibold text-slate-400">Section A • Semester 4</span>
          </div>

          <div className="space-y-4">
            {courses.length === 0 ? (
              <div className="glass-card p-8 rounded-2xl text-center text-slate-400">
                No enrolled courses found for your section.
              </div>
            ) : (
              courses.map((course) => {
                const pct = course.percentage ?? 100;
                const isLow = pct < 75;
                return (
                  <div
                    key={course._id}
                    className="glass-card p-5 rounded-2xl border border-slate-800/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                          {course.code}
                        </span>
                        <h4 className="text-base font-bold text-white mt-0.5">{course.name}</h4>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Faculty: {course.teacher?.name || 'Assigned Instructor'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-black ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {pct}%
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {course.attendedLectures || 0} / {course.totalLectures || 0} classes
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLow ? 'bg-gradient-to-r from-rose-500 to-red-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Attendance Trend Chart */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Monthly Distribution
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                Last 6 Months
              </span>
            </div>
            <div className="h-64 w-full">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Target Threshold: <strong className="text-emerald-400">75% Minimum</strong></span>
            <span className="text-indigo-400 font-semibold">Active Term</span>
          </div>
        </div>
      </div>
    </div>
  );
};
