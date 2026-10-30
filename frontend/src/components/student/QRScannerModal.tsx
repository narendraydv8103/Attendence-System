import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Modal } from '../common/Modal';
import { QrCode, CheckCircle2, AlertTriangle, RefreshCw, Keyboard, Camera } from 'lucide-react';
import API from '../../services/api';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string, isLowAttendance?: boolean, coursePercentage?: number) => void;
  onError: (message: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [scannerMode, setScannerMode] = useState<'camera' | 'manual'>('camera');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen && scannerMode === 'camera') {
      const timeout = setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          'reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          /* verbose= */ false
        );

        scanner.render(
          async (decodedText) => {
            scanner.clear();
            await processScannedQR(decodedText);
          },
          (error) => {
            // Ignore frame scan errors
          }
        );

        scannerRef.current = scanner;
      }, 300);

      return () => {
        clearTimeout(timeout);
        if (scannerRef.current) {
          try {
            scannerRef.current.clear();
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      };
    }
  }, [isOpen, scannerMode]);

  const processScannedQR = async (qrDataStr: string) => {
    setIsSubmitting(true);
    setScanSuccess(null);
    try {
      const res = await API.post('/attendance/scan', { qrData: qrDataStr });
      if (res.data.success) {
        setScanSuccess(res.data.message || 'Attendance Marked Successfully!');
        const isLow = res.data.coursePercentage && res.data.coursePercentage < 75;
        onSuccess(res.data.message, isLow, res.data.coursePercentage);
        setTimeout(() => {
          setScanSuccess(null);
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to mark attendance';
      onError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processScannedQR(manualCode.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Lecture QR Code" maxWidth="md">
      <div className="space-y-6">
        {/* Toggle Mode buttons */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setScannerMode('camera')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
              scannerMode === 'camera'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => setScannerMode('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
              scannerMode === 'manual'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Manual Code Entry</span>
          </button>
        </div>

        {scanSuccess ? (
          <div className="p-8 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center animate-bounce-short">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-emerald-200">{scanSuccess}</h4>
            <p className="text-xs text-emerald-400/80 mt-2">Verified with dynamic session token</p>
          </div>
        ) : scannerMode === 'camera' ? (
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 min-h-[300px] flex items-center justify-center">
            <div id="reader" className="w-full"></div>
            {isSubmitting && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
                <span className="text-sm font-semibold text-slate-200">Verifying QR Code...</span>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Paste QR Code Payload JSON or Token
              </label>
              <textarea
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder='{"lectureId":"...","token":"...","expiresAt":"..."}'
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !manualCode.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Attendance Code</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <span>
            QR codes auto-refresh every 30 seconds for dynamic security. Ensure your scanner captures the live code shown on screen.
          </span>
        </div>
      </div>
    </Modal>
  );
};
