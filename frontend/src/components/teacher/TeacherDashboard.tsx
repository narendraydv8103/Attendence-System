import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { Course, Lecture, Attendance } from '../../types';
import {
  Play,
  QrCode,
  Users,
  CheckCircle2,
  Clock,
  Maximize2,
  Square,
  BookOpen,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { StartLectureModal } from './StartLectureModal';
import { ProjectorModal } from './ProjectorModal';
import { getSocket, joinLectureRoom, leaveLectureRoom } from '../../services/socket';

export const TeacherDashboard: React.FC = () => {
  const [activeLecture, setActiveLecture] = useState<any>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isStartModalOpen, setIsStartModalOpen] = useState<boolean>(false);
  const [isProjectorOpen, setIsProjectorOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  useEffect(() => {
    if (activeLecture?._id) {
      joinLectureRoom(activeLecture._id);
      const socket = getSocket();

      const handleAttendanceMarked = (newAtt: Attendance) => {
        setAttendances((prev) => {
          if (prev.some((a) => a._id === newAtt._id)) return prev;
          return [newAtt, ...prev];
        });
      };

      const handleQRRefreshed = (qrData: any) => {
        setActiveLecture((prev: any) =>
          prev ? { ...prev, qrImageData: qrData.qrImageData, qrToken: qrData.qrToken } : null
        );
      };

      socket.on('attendance_marked', handleAttendanceMarked);
      socket.on('qr_refreshed', handleQRRefreshed);

      return () => {
        leaveLectureRoom(activeLecture._id);
        socket.off('attendance_marked', handleAttendanceMarked);
        socket.off('qr_refreshed', handleQRRefreshed);
      };
    }
  }, [activeLecture]);

  const fetchTeacherData = async () => {
    setIsLoading(true);
    try {
      const [activeRes, coursesRes] = await Promise.all([
        API.get('/lecture/active'),
        API.get('/teacher/courses'),
      ]);

      if (activeRes.data.success && activeRes.data.active) {
        setActiveLecture(activeRes.data.lecture);
        setAttendances(activeRes.data.attendances || []);
      } else {
        setActiveLecture(null);
        setAttendances([]);
      }

      if (coursesRes.data.success) {
        setCourses(coursesRes.data.courses);
      }
    } catch (err) {
      console.error('Failed to load teacher dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndLecture = async () => {
    if (!activeLecture) return;
    try {
      const res = await API.post('/lecture/end', { lectureId: activeLecture._id });
      if (res.data.success) {
        setActiveLecture(null);
        setAttendances([]);
        setIsProjectorOpen(false);
      }
    } catch (err) {
      console.error('Failed to end lecture:', err);
    }
  };

  const handleRefreshQR = async () => {
    if (!activeLecture) return;
    try {
      const res = await API.post('/qr/generate', { lectureId: activeLecture._id });
      if (res.data.success && res.data.qrData) {
        setActiveLecture((prev: any) => ({
          ...prev,
          qrImageData: res.data.qrData.qrImageData,
          qrToken: res.data.qrData.qrToken,
        }));
      }
    } catch (err) {
      console.error('Failed to refresh QR:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/20 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Faculty Control Panel
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Faculty Live Attendance Portal
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Launch dynamic QR sessions on projector screens, track live student attendance with real-time sockets, and export reports.
            </p>
          </div>

          {!activeLecture ? (
            <button
              onClick={() => setIsStartModalOpen(true)}
              className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition transform hover:-translate-y-1 active:translate-y-0"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start New Lecture Session</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsProjectorOpen(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Projector View</span>
              </button>
              <button
                onClick={handleEndLecture}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600/30 font-bold text-xs transition"
              >
                <Square className="w-4 h-4" />
                <span>End Lecture</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active Session Card (If Active) */}
      {activeLecture && (
        <div className="p-6 rounded-3xl bg-slate-900 border-2 border-emerald-500/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-bl-xl flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span> Live Active Session
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Live QR Image Box */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <img
                src={activeLecture.qrImageData}
                alt="Active QR"
                className="w-44 h-44 object-contain rounded-xl bg-white p-2 border-2 border-indigo-500/40"
              />
              <button
                onClick={handleRefreshQR}
                className="mt-3 flex items-center gap-1.5 text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh QR Token
              </button>
            </div>

            {/* Session Info */}
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  {activeLecture.course?.code || 'CS401'}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {activeLecture.course?.name || 'Active Course Session'}
                </h3>
                <div className="text-xs text-slate-400 mt-1">
                  Semester {activeLecture.semester} • Section {activeLecture.section}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Started: {new Date(activeLecture.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-indigo-400" />
                  30s Security Auto-Refresh
                </div>
              </div>
            </div>

            {/* Student counter widget */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center">
              <div className="text-4xl font-black text-emerald-400">{attendances.length}</div>
              <div className="text-xs font-bold text-slate-300 mt-1 uppercase tracking-wider">
                Students Present
              </div>
              <button
                onClick={() => setIsProjectorOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Launch Projector Display
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Attendance Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Live Scanned Attendance Feed
          </h3>
          <span className="text-xs font-semibold text-slate-400">Real-time Socket Updates</span>
        </div>

        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Roll Number</th>
                <th className="px-6 py-4">Department / Section</th>
                <th className="px-6 py-4">Scan Time</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {attendances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                    No active attendance scanned yet for this session.
                  </td>
                </tr>
              ) : (
                attendances.map((att) => (
                  <tr key={att._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img
                        src={att.studentId?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={att.studentId?.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700"
                      />
                      <span className="font-bold text-white">{att.studentId?.name || 'Student'}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-indigo-400">
                      {att.studentId?.rollNumber || 'CS-2024-001'}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {att.studentId?.departmentName || 'Computer Science'} (Sec {att.studentId?.section || 'A'})
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Present
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Start Lecture Modal */}
      <StartLectureModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        onStarted={(lecture) => {
          setActiveLecture(lecture);
          setAttendances([]);
          setIsProjectorOpen(true);
        }}
      />

      {/* Projector Modal */}
      <ProjectorModal
        isOpen={isProjectorOpen}
        onClose={() => setIsProjectorOpen(false)}
        lecture={activeLecture}
        attendances={attendances}
        onEndLecture={handleEndLecture}
        onRefreshQR={handleRefreshQR}
      />
    </div>
  );
};
