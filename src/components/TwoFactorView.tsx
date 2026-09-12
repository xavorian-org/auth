import React, { useState, useRef, useEffect } from 'react';
import { Mail, Smartphone, KeyRound, ShieldAlert, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTwoFactor } from '../hooks/useTwoFactor';
import type { AuthStep, TwoFactorMethod, XavorianAuthEvent } from '../types/auth';

interface TwoFactorViewProps {
  email: string;
  phone?: string;
  purpose?: 'login' | 'signup' | 'security_check';
  onStepChange: (step: AuthStep, context?: any) => void;
  onSuccess?: (event: XavorianAuthEvent) => void;
}

export const TwoFactorView: React.FC<TwoFactorViewProps> = ({
  email,
  phone = '+234 801 234 5678',
  purpose = 'login',
  onStepChange,
  onSuccess,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleVerificationSuccess = () => {
    const authEvent: XavorianAuthEvent = {
      type: 'xavorian_auth_event',
      event: 'VERIFY_SUCCESS',
      data: {
        email,
        targetPath: '/dashboard',
        timestamp: new Date().toISOString(),
      },
    };

    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage(authEvent, '*');
    }

    onSuccess?.(authEvent);
  };

  const {
    method,
    isVerifying,
    isSending,
    error,
    successMessage,
    countdown,
    canResend,
    sendCode,
    verifyCode,
    switchMethod,
  } = useTwoFactor({
    initialMethod: 'email',
    email,
    phone,
    purpose,
    onSuccess: handleVerificationSuccess,
  });

  // Handle single digit input
  const handleDigitChange = (index: number, value: string) => {
    // Check if pasting 6 digits
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || '';
        }
        setDigits(newDigits);
        const lastIdx = Math.min(pasted.length - 1, 5);
        inputRefs.current[lastIdx]?.focus();

        if (pasted.length === 6) {
          verifyCode(pasted);
        }
        return;
      }
    }

    const cleanChar = value.slice(-1).replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = cleanChar;
    setDigits(newDigits);

    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      verifyCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Mask destination
  const getMaskedDestination = () => {
    if (method === 'email') {
      const parts = email.split('@');
      if (parts.length < 2) return email;
      const name = parts[0];
      const maskedName = name.length > 3 ? `${name.slice(0, 2)}***${name.slice(-1)}` : `${name}***`;
      return `${maskedName}@${parts[1]}`;
    } else if (method === 'sms') {
      return phone.replace(/(\+234\s?\d{3})\d{4}(\d{3})/, '$1 **** $2');
    }
    return 'Your Authenticator Application (Google Authenticator / Authy)';
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onStepChange('login')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </button>
        <span className="text-[11px] font-mono text-neutral-400">Step 2 of 2</span>
      </div>

      {/* Title */}
      <div className="space-y-1.5 text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
          <ShieldAlert className="w-3.5 h-3.5" />
          Two-Factor Authentication (2FA)
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 font-heading">
          Verify your identity
        </h2>
        <p className="text-xs text-neutral-500 leading-relaxed font-normal">
          We protect high-value Nigerian property transactions with multi-factor verification.
        </p>
      </div>

      {/* 2FA Channels Switcher */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100/90 rounded-xl border border-neutral-200/70">
        <button
          type="button"
          onClick={() => {
            switchMethod('email');
            setDigits(['', '', '', '', '', '']);
          }}
          className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            method === 'email'
              ? 'bg-white text-primary shadow-xs border border-neutral-200/60'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Email Code
        </button>

        <button
          type="button"
          onClick={() => {
            switchMethod('sms');
            setDigits(['', '', '', '', '', '']);
          }}
          className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            method === 'sms'
              ? 'bg-white text-primary shadow-xs border border-neutral-200/60'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          SMS / Phone
        </button>

        <button
          type="button"
          onClick={() => {
            switchMethod('authenticator');
            setDigits(['', '', '', '', '', '']);
          }}
          className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            method === 'authenticator'
              ? 'bg-white text-primary shadow-xs border border-neutral-200/60'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          App (TOTP)
        </button>
      </div>

      {/* Destination notice */}
      <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 text-left space-y-1">
        <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
          {method === 'email' ? 'Code Dispatched To' : method === 'sms' ? 'SMS Dispatched To' : 'Enter 6-digit Authenticator Token'}
        </div>
        <div className="text-xs font-bold text-neutral-800 break-all font-mono">
          {getMaskedDestination()}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs text-left">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Success banner */}
      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-emerald-700 text-xs text-left">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      {/* 6 Digit Input Slots */}
      <div className="space-y-3">
        <div className="flex justify-between items-center gap-1.5 sm:gap-2">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl border border-neutral-300 bg-white shadow-xs focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              autoFocus={idx === 0}
            />
          ))}
        </div>

        {/* Resend button / Countdown */}
        <div className="flex items-center justify-between text-xs pt-1">
          <button
            type="button"
            onClick={sendCode}
            disabled={!canResend || isSending}
            className="inline-flex items-center gap-1 font-semibold text-primary disabled:text-neutral-400 hover:underline disabled:no-underline disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${isSending ? 'animate-spin' : ''}`} />
            {canResend ? 'Resend Security Code' : `Resend code in ${countdown}s`}
          </button>

          <span className="text-[11px] text-neutral-400">Expires in 10 mins</span>
        </div>
      </div>

      {/* Verify action button */}
      <button
        type="button"
        disabled={isVerifying || digits.join('').length !== 6}
        onClick={() => verifyCode()}
        className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isVerifying ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Confirming Security Token…</span>
          </>
        ) : (
          <span>Verify & Unlock Account</span>
        )}
      </button>

      {/* Security guarantee footer */}
      <div className="pt-2 text-center text-[11px] text-neutral-400 leading-normal">
        🔒 Xavorian Zero-Fraud Protocol: We never share your security codes with 3rd parties or call asking for verification codes.
      </div>
    </div>
  );
};
