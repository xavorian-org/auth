import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import type { AuthStep, XavorianAuthEvent } from '../types/auth';

interface LoginViewProps {
  onStepChange: (step: AuthStep, context?: any) => void;
  onSuccess?: (event: XavorianAuthEvent) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onStepChange, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // If user enabled 2FA or system requires 2FA, jump to 2FA screen
      if (require2FA) {
        // Dispatch 2FA code first
        await authService.sendTwoFactorCode({
          email,
          method: 'email',
          purpose: 'login',
        });
        onStepChange('two_factor', { email, password, rememberMe, purpose: 'login' });
        return;
      }

      // Direct sign in
      const data = await authService.signIn({ email, password });
      await authService.logSessionAudit(data.user?.id);

      const authEvent: XavorianAuthEvent = {
        type: 'xavorian_auth_event',
        event: 'LOGIN_SUCCESS',
        data: {
          userId: data.user?.id,
          email: data.user?.email,
          role: data.user?.user_metadata?.account_type || 'buyer',
          session: data.session,
          targetPath: '/dashboard',
          timestamp: new Date().toISOString(),
        },
      };

      // Post message to parent if inside iframe
      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage(authEvent, '*');
      }

      onSuccess?.(authEvent);
    } catch (err: any) {
      const msg = err?.message || 'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1.5 text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          Secure Sign In
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 font-heading">
          Welcome back
        </h2>
        <p className="text-xs text-neutral-500 font-normal">
          Enter your verified credentials to access your Xavorian workspace
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5 text-left">
          <label htmlFor="auth-email" className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-neutral-400" />
            Email Address
          </label>
          <input
            id="auth-email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full h-11 px-3.5 rounded-xl text-sm border border-neutral-200 bg-neutral-50/50 hover:bg-white focus:bg-white transition-all shadow-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>

        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <label htmlFor="auth-password" className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              Password
            </label>
            <button
              type="button"
              onClick={() => onStepChange('forgot_password', { email })}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full h-11 px-3.5 pr-10 rounded-xl text-sm border border-neutral-200 bg-neutral-50/50 hover:bg-white focus:bg-white transition-all shadow-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Options Row */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-neutral-300"
            />
            <span className="text-xs text-neutral-600 font-medium">Remember this device</span>
          </label>

          <button
            type="button"
            onClick={() => setRequire2FA(!require2FA)}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
              require2FA
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            {require2FA ? '✓ 2FA Guard Active' : '+ Verify with 2FA'}
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-primary hover:bg-primary/90 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Authenticating…</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Signup */}
      <div className="pt-2 text-center text-xs text-neutral-500 border-t border-neutral-100">
        Don't have a verified account?{' '}
        <button
          type="button"
          onClick={() => onStepChange('signup')}
          className="text-primary font-bold hover:underline"
        >
          Create account
        </button>
      </div>
    </div>
  );
};
