import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';
import type { AuthStep } from '../types/auth';

interface ForgotPasswordViewProps {
  initialEmail?: string;
  onStepChange: (step: AuthStep, context?: any) => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({
  initialEmail = '',
  onStepChange,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.sendPasswordReset(email);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'Could not send recovery link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-start">
        <button
          type="button"
          onClick={() => onStepChange('login')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </button>
      </div>

      {/* Header */}
      <div className="space-y-1.5 text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
          Account Recovery
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 font-heading">
          Reset password
        </h2>
        <p className="text-xs text-neutral-500 font-normal">
          Enter your verified email and we'll dispatch a secure recovery link
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs text-left">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {!sent ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label htmlFor="recovery-email" className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-neutral-400" />
              Registered Email Address
            </label>
            <input
              id="recovery-email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-11 px-3.5 rounded-xl text-sm border border-neutral-200 bg-neutral-50/50 hover:bg-white focus:bg-white transition-all shadow-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sending Recovery Link…</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1 text-center">
            <h3 className="text-base font-bold text-neutral-900">Check your inbox</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              We sent a password reset link to <strong className="font-semibold text-neutral-900">{email}</strong>. Click the link in your email to set a new password.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onStepChange('login')}
            className="w-full h-10 bg-white border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold hover:bg-emerald-50 transition-colors"
          >
            Return to Sign In
          </button>
        </div>
      )}
    </div>
  );
};
