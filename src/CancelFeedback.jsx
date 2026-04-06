import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronRight, Home, MessageSquare } from 'lucide-react';
import { apiUrl } from './config/api';

const CANCEL_REASONS = [
  { id: 'wait_too_long',     label: '⏱️  Wait time too long' },
  { id: 'mistake',           label: '🙈  Requested by mistake' },
  { id: 'found_help',        label: '🤝  Found help elsewhere' },
  { id: 'price_too_high',    label: '💸  Price was too high' },
  { id: 'wrong_service',     label: '🔧  Wrong service selected' },
  { id: 'emergency_resolved', label: '✅  Emergency resolved on its own' },
  { id: 'other',             label: '💬  Other reason' },
];

const CancelFeedback = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const authToken = localStorage.getItem('authToken');

  const [selectedReason, setSelectedReason] = useState(null);
  const [comment, setComment]               = useState('');
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [submitted, setSubmitted]           = useState(false);
  const [error, setError]                   = useState(null);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Persist the cancellation reason (best-effort — we still navigate home even on failure)
      await fetch(apiUrl(`/api/requests/${requestId}/cancel-reason`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ reason: selectedReason, comment }),
      });
    } catch {
      /* non-blocking — ignore network errors */
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  const goHome = () => navigate('/');

  // ── Thank-you screen ─────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
        <div className="relative w-full max-w-md text-center">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-400 mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-300" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Thank You!</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Your feedback helps us improve Road Rescue for everyone. We're sorry your experience
            was interrupted — we hope to serve you better next time.
          </p>
          <button
            onClick={goHome}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            <Home size={18} /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Main feedback form ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col items-center justify-center p-4 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />

      <div className="relative w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center border-2 border-orange-400 mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-300" />
          </div>
          <h1 className="text-2xl font-bold text-white">Request Cancelled</h1>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            Help us understand what happened so we can serve you better.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 shadow-2xl backdrop-blur-sm">

          <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
            Why did you cancel? <span className="text-red-400">*</span>
          </p>

          {/* Reason chips */}
          <div className="space-y-2 mb-6">
            {CANCEL_REASONS.map((r) => {
              const isActive = selectedReason === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReason(r.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  <span>{r.label}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isActive ? 'border-blue-400 bg-blue-500' : 'border-slate-500'
                  }`}>
                    {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Optional comment */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">
              <MessageSquare size={14} />
              Additional Comments <span className="text-slate-500 font-normal normal-case">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about what happened..."
              rows={3}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-colors"
              maxLength={300}
            />
            <p className="text-right text-xs text-slate-500 mt-1">{comment.length}/300</p>
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={goHome}
              className="flex-1 py-3.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-2xl transition-colors text-sm"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              className={`flex-1 py-3.5 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all ${
                !selectedReason || isSubmitting
                  ? 'bg-blue-800/50 text-blue-400 cursor-not-allowed opacity-60'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              {isSubmitting ? 'Submitting...' : (
                <>Submit Feedback <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Your feedback is anonymous and helps improve our service.
        </p>
      </div>
    </div>
  );
};

export default CancelFeedback;
