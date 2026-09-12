import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, MapPin, Building, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';
import type { AuthStep, AuthRole, XavorianAuthEvent } from '../types/auth';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

interface SignupViewProps {
  onStepChange: (step: AuthStep, context?: any) => void;
  onSuccess?: (event: XavorianAuthEvent) => void;
  defaultRole?: AuthRole;
}

export const SignupView: React.FC<SignupViewProps> = ({
  onStepChange,
  onSuccess,
  defaultRole = 'buyer',
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState<AuthRole>(defaultRole);
  const [age, setAge] = useState('');
  const [locationState, setLocationState] = useState('Lagos');
  const [locationCity, setLocationCity] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute password strength
  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-rose-500 text-rose-600' };
    if (score <= 3) return { level: 2, label: 'Good', color: 'bg-amber-500 text-amber-600' };
    return { level: 3, label: 'Strong & Secure', color: 'bg-emerald-500 text-emerald-600' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const ageNumber = parseInt(age, 10);
    if (isNaN(ageNumber) || ageNumber < 16) {
      setError('You must be at least 16 years old to create a Xavorian account.');
      return;
    }

    if (!locationState || !locationCity.trim()) {
      setError('Please provide your Nigerian State and City for property location matching.');
      return;
    }

    if (!agreeTerms) {
      setError('Please accept the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    setLoading(true);

    try {
      const data = await authService.signUp({
        email,
        password,
        fullName,
        accountType,
        age: ageNumber,
        locationState,
        locationCity,
        phone,
      });

      const authEvent: XavorianAuthEvent = {
        type: 'xavorian_auth_event',
        event: 'SIGNUP_SUCCESS',
        data: {
          userId: data.user?.id,
          email: data.user?.email,
          role: accountType,
          session: data.session,
          targetPath: '/onboarding',
          timestamp: new Date().toISOString(),
        },
      };

      if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage(authEvent, '*');
      }

      onSuccess?.(authEvent);

      // Transition to 2FA verification step
      onStepChange('two_factor', {
        email,
        phone,
        fullName,
        accountType,
        purpose: 'signup',
      });
    } catch (err: any) {
      setError(err?.message || 'Could not complete registration. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-5">
      {/* Header */}
      <div className="space-y-1 text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          Verified Registration
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 font-heading">
          Create account
        </h2>
        <p className="text-xs text-neutral-500 font-normal">
          Join Nigeria's transparent, fraud-protected property network
        </p>
      </div>

      {/* Role Selector Tabs */}
      <div className="space-y-1 text-left">
        <label className="text-xs font-semibold text-neutral-700">Select Account Role</label>
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-neutral-100/80 rounded-xl border border-neutral-200/70">
          {[
            { id: 'buyer' as AuthRole, label: 'Buyer' },
            { id: 'seller' as AuthRole, label: 'Seller' },
            { id: 'agent' as AuthRole, label: 'Agent' },
            { id: 'developer' as AuthRole, label: 'Developer' },
          ].map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setAccountType(role.id)}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                accountType === role.id
                  ? 'bg-white text-primary shadow-xs border border-neutral-200/50'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Full Name */}
        <div className="space-y-1 text-left">
          <label htmlFor="signup-name" className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-neutral-400" />
            Full Legal Name (as on NIMC / Passport)
          </label>
          <input
            id="signup-name"
            type="text"
            placeholder="e.g. Babatunde Adeyemi"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full h-10 px-3 rounded-xl text-sm border border-neutral-200 bg-neutral-50/50 hover:bg-white focus:bg-white transition-all shadow-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>

        {/* Email */}
        <div className="space-y-1 text-left">
          <label htmlFor="signup-email" className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-neutral-400" />
            Email Address
          </label>
          <input
            id="signup-email"
            type="email"
            placeholder="babatunde@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-10 px-3 rounded-xl text-sm border border-neutral-200 bg-neutral-50/50 hover:bg-white focus:bg-white transition-all shadow-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>

        {/* Password & Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1 text-left">
            <label htmlFor="signup-pass" className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              Password
            </label>
            <div className="relative">
              <input
                id="signup-pass"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-10 px-3 pr-8 rounded-xl text-sm border border-neutral-200 bg-neutral-50/50 focus:bg-white shadow-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label htmlFor="signup-confirm" className="text-xs font-semibold text-neutral-700">
              Confirm Password
            </label>
            <input
              id="signup-confirm"
              type={showPassword ? 'text' : 'password'}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl text-sm border border-neutral-200 bg-neutral-50/50 focus:bg-white shadow-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Password strength indicator */}
        {password && (
          <div className="flex items-center gap-2 pt-0.5">
            <div className="flex gap-1 flex-1 h-1 bg-neutral-200 rounded-full overflow-hidden">
              <div className={`h-full transition-all ${strength.level >= 1 ? 'w-1/3 bg-rose-500' : 'w-0'}`} />
              <div className={`h-full transition-all ${strength.level >= 2 ? 'w-1/3 bg-amber-500' : 'w-0'}`} />
              <div className={`h-full transition-all ${strength.level >= 3 ? 'w-1/3 bg-emerald-500' : 'w-0'}`} />
            </div>
            <span className="text-[10px] font-semibold text-neutral-600">
              {strength.label}
            </span>
          </div>
        )}

        {/* Age and State/City */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="space-y-1 text-left col-span-1">
            <label htmlFor="signup-age" className="text-xs font-semibold text-neutral-700">
              Age (16+)
            </label>
            <input
              id="signup-age"
              type="number"
              placeholder="18"
              min="16"
              max="110"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl text-sm border border-neutral-200 bg-neutral-50/50 focus:bg-white shadow-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div className="space-y-1 text-left col-span-1">
            <label htmlFor="signup-state" className="text-xs font-semibold text-neutral-700">
              State
            </label>
            <select
              id="signup-state"
              value={locationState}
              onChange={(e) => setLocationState(e.target.value)}
              className="w-full h-10 px-2 rounded-xl text-xs border border-neutral-200 bg-neutral-50/50 focus:bg-white shadow-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium"
            >
              {NIGERIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 text-left col-span-1">
            <label htmlFor="signup-city" className="text-xs font-semibold text-neutral-700">
              City
            </label>
            <input
              id="signup-city"
              type="text"
              placeholder="e.g. Ikeja"
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl text-sm border border-neutral-200 bg-neutral-50/50 focus:bg-white shadow-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Terms agreement */}
        <label className="flex items-start gap-2 pt-1 text-left cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary/20 border-neutral-300"
          />
          <span className="text-[11px] text-neutral-500 leading-snug">
            I agree to the Xavorian <span className="text-primary font-medium hover:underline">Terms of Service</span> and acknowledge identity checks per NDPR data compliance.
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-primary hover:bg-primary/90 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating Account…</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="pt-2 text-center text-xs text-neutral-500 border-t border-neutral-100">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onStepChange('login')}
          className="text-primary font-bold hover:underline"
        >
          Sign in
        </button>
      </div>
    </div>
  );
};
