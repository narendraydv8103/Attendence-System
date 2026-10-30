import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Lecture } from '../../types';
import { History, FileSpreadsheet, FileText, Calendar, Users, CheckCircle2, Download } from 'lucide-react';

export const LectureHistory: React.FC = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await API.get('/lecture/history');
      if (res.data.success) {
        setLectures(res.data.lectures);
      }
    } catch (err) {
      console.error('Failed to load lecture history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = (lectureId?: string) => {
    const url = lectureId ? `/api/reports/excel?lectureId=${lectureId}` : `/api/reports/excel`;
    window.open(url, '_blank');
  };

  const handleExportPDF = (lectureId?: string) => {
    const url = lectureId ? `/api/reports/pdf?lectureId=${lectureId}` : `/api/reports/pdf`;
    window.open(url, '_blank');
  };

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
            Faculty Lecture Archives & Reports
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Export attendance spreadsheets (.xlsx) and printable PDF reports for any past session.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExportExcel()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export All Excel
          </button>
          <button
            onClick={() => handleExportPDF()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition"
          >
            <FileText className="w-4 h-4" /> Export All PDF
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Sem & Section</th>
                <th className="px-6 py-4">Session Date & Time</th>
                <th className="px-6 py-4">Attendance Count</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {lectures.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No past lectures recorded yet.
                  </td>
                </tr>
              ) : (
                lectures.map((lec) => (
                  <tr key={lec._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{lec.course?.name || 'Academic Course'}</div>
                      <div className="text-[10px] text-indigo-400 font-mono mt-0.5">{lec.course?.code || 'CS401'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      Sem {lec.semester} • Sec {lec.section}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(lec.startTime).toLocaleDateString()} at{' '}
                        {new Date(lec.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                        <Users className="w-3.5 h-3.5" />
                        {lec.totalPresent || 0} Present
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleExportExcel(lec._id)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 transition"
                        title="Download Excel Sheet"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleExportPDF(lec._id)}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800 transition"
                        title="Download PDF Summary"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
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
