import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { QrCode, RefreshCw, Square, Users, Maximize2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import API from '../../services/api';
import { getSocket, joinLectureRoom, leaveLectureRoom } from '../../services/socket';
import { Attendance } from '../../types';

interface ProjectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lecture: any;
  attendances: Attendance[];
  onEndLecture: () => void;
  onRefreshQR: () => void;
}

export const ProjectorModal: React.FC<ProjectorModalProps> = ({
  isOpen,
  onClose,
  lecture,
  attendances: initialAttendances,
  onEndLecture,
  onRefreshQR,
}) => {
  const [attendances, setAttendances] = useState<Attendance[]>(initialAttendances);
  const [qrImage, setQrImage] = useState<string>(lecture?.qrImageData || '');
  const [timeLeft, setTimeLeft] = useState<number>(lecture?.durationSeconds || 30);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    setAttendances(initialAttendances);
  }, [initialAttendances]);

  useEffect(() => {
    if (lecture?.qrImageData) {
      setQrImage(lecture.qrImageData);
    }
  }, [lecture]);

  // Socket room connection & live attendance / QR refresh listeners
  useEffect(() => {
    if (isOpen && lecture?._id) {
      joinLectureRoom(lecture._id);
      const socket = getSocket();

      const handleAttendanceMarked = (newAttendance: Attendance) => {
        setAttendances((prev) => {
          if (prev.some((a) => a._id === newAttendance._id)) return prev;
          return [newAttendance, ...prev];
        });
      };

      const handleQRRefreshed = (qrData: any) => {
        if (qrData.qrImageData) {
          setQrImage(qrData.qrImageData);
          setTimeLeft(lecture.durationSeconds || 30);
        }
      };

      socket.on('attendance_marked', handleAttendanceMarked);
      socket.on('qr_refreshed', handleQRRefreshed);

      return () => {
        leaveLectureRoom(lecture._id);
        socket.off('attendance_marked', handleAttendanceMarked);
        socket.off('qr_refreshed', handleQRRefreshed);
      };
    }
  }, [isOpen, lecture]);

  // Dynamic countdown timer effect & auto-refresh trigger
  useEffect(() => {
    if (!isOpen || !lecture) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          triggerAutoRefresh();
          return lecture.durationSeconds || 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, lecture]);

  const triggerAutoRefresh = async () => {
    if (!lecture?._id || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const res = await API.post('/qr/generate', { lectureId: lecture._id });
      if (res.data.success && res.data.qrData?.qrImageData) {
        setQrImage(res.data.qrData.qrImageData);
      }
    } catch (err) {
      console.error('Auto QR refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!lecture) return null;

  const duration = lecture.durationSeconds || 30;
  const timerPercentage = Math.round((timeLeft / duration) * 100);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Classroom Projector View - Dynamic QR" maxWidth="4xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side: Large QR Code with Timer Ring */}
        <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-950 border border-slate-800 text-center">
          <div className="relative mb-6">
            {/* Pulsing ring outline */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-lg animate-pulse-slow"></div>

            {/* QR Code Container */}
            <div className="relative p-4 rounded-2xl bg-white shadow-2xl border-4 border-indigo-600/30">
              {qrImage ? (
                <img src={qrImage} alt="Live Attendance QR" className="w-64 h-64 sm:w-72 sm:h-72 object-contain" />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-slate-900 text-slate-500">
                  Generating QR...
                </div>
              )}
            </div>
          </div>

          {/* Countdown timer ring & status */}
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" className="text-slate-800" fill="transparent" />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-indigo-500 transition-all duration-1000"
                  fill="transparent"
                  strokeDasharray={150}
                  strokeDashoffset={150 - (150 * timerPercentage) / 100}
                />
              </svg>
              <span className="absolute font-black text-sm text-white">{timeLeft}s</span>
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Dynamic Anti-Proxy Code
              </div>
              <div className="text-xs text-slate-400">Auto-refreshes every {duration}s</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-6 w-full max-w-sm">
            <button
              onClick={triggerAutoRefresh}
              disabled={isRefreshing}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Now</span>
            </button>

            <button
              onClick={onEndLecture}
              className="flex-1 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Square className="w-3.5 h-3.5" />
              <span>End Session</span>
            </button>
          </div>
        </div>

        {/* Right Side: Live Attendance Ticker */}
        <div className="flex flex-col h-full justify-between space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-white">Live Student Roster</h4>
                <p className="text-xs text-slate-400">Course: {lecture.course?.code || 'CS401'}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400">{attendances.length}</span>
              <span className="text-xs font-semibold text-slate-400 block">Present</span>
            </div>
          </div>

          {/* Scrollable list of scanned students */}
          <div className="glass-card rounded-2xl border border-slate-800 p-4 max-h-[320px] overflow-y-auto space-y-2">
            {attendances.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Waiting for students to scan QR code...
              </div>
            ) : (
              attendances.map((att) => (
                <div
                  key={att._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 animate-bounce-short"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={att.studentId?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={att.studentId?.name}
                      className="w-8 h-8 rounded-full object-cover border border-indigo-500/30"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{att.studentId?.name || 'Student'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {att.studentId?.rollNumber || 'CS-2024-001'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      {new Date(att.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
