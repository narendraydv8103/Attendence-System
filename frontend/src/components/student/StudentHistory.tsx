import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Attendance } from '../../types';
import { History, CheckCircle2, QrCode, Search, Calendar, Filter } from 'lucide-react';

export const StudentHistory: React.FC = () => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await API.get('/attendance/history');
      if (res.data.success) {
        setAttendances(res.data.attendances);
      }
    } catch (err) {
      console.error('Failed to load attendance history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = attendances.filter((att) => {
    const courseName = att.courseId?.name || '';
    const courseCode = att.courseId?.code || '';
    const query = search.toLowerCase();
    return courseName.toLowerCase().includes(query) || courseCode.toLowerCase().includes(query);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" />
            Attendance History Log
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Verified scan records with timestamps and teacher session tokens.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Course Name</th>
                <th className="px-6 py-4">Course Code</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No attendance records found matching your query.
                  </td>
                </tr>
              ) : (
                filtered.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 text-white font-bold">
                      {record.courseId?.name || 'Academic Course'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                        {record.courseId?.code || 'CS401'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(record.timestamp).toLocaleDateString()} at{' '}
                        {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px]">
                        <QrCode className="w-3 h-3" /> QR Dynamic Token
                      </span>
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
    </div>
  );
};
