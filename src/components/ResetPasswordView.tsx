import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';
import type { AuthStep } from '../types/auth';

interface ResetPasswordViewProps {
  onStepChange: (step: AuthStep) => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ onStepChange }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    try {
      await authService.updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        onStepChange('login');
      }, 2500);
    } catch (err: any) {
      setError(err?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-1.5 text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
          Security Update
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 font-heading">
          Set new password
        </h2>
        <p className="text-xs text-neutral-500 font-normal">
          Create a secure password to protect your account and transactions
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs text-left">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label htmlFor="new-pass" className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              New Password
            </label>
            <div className="relative">
              <input
                id="new-pass"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-11 px-3.5 pr-10 rounded-xl text-sm border border-neutral-200 bg-neutral-50/50 hover:bg-white focus:bg-white transition-all shadow-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label htmlFor="confirm-new-pass" className="text-xs font-semibold text-neutral-700">
              Confirm New Password
            </label>
            <input
              id="confirm-new-pass"
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
                <span>Updating Password…</span>
              </>
            ) : (
              <>
                <span>Save New Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-900">Password updated!</h3>
          <p className="text-xs text-neutral-600">
            Your password has been changed securely. Redirecting to sign in…
          </p>
        </div>
      )}
    </div>
  );
};
