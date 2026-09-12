import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import type { TwoFactorMethod } from '../types/auth';

interface UseTwoFactorProps {
  initialMethod?: TwoFactorMethod;
  email: string;
  phone?: string;
  purpose?: 'login' | 'signup' | 'security_check';
  onSuccess?: () => void;
}

export const useTwoFactor = ({
  initialMethod = 'email',
  email,
  phone,
  purpose = 'login',
  onSuccess,
}: UseTwoFactorProps) => {
  const [method, setMethod] = useState<TwoFactorMethod>(initialMethod);
  const [code, setCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Timer countdown
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const sendCode = useCallback(async () => {
    setIsSending(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await authService.sendTwoFactorCode({
        email,
        phone,
        method,
        purpose,
      });
      setSuccessMessage(res.message);
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch security code');
    } finally {
      setIsSending(false);
    }
  }, [email, phone, method, purpose]);

  const verifyCode = useCallback(
    async (overrideCode?: string) => {
      const targetCode = (overrideCode ?? code).trim();
      if (targetCode.length !== 6) {
        setError('Please enter all 6 digits of your security code');
        return;
      }

      setIsVerifying(true);
      setError(null);
      try {
        const res = await authService.verifyTwoFactorCode({
          email,
          phone,
          code: targetCode,
          method,
          purpose,
        });

        if (!res.valid) {
          setError(res.error || 'Invalid code. Please try again.');
          return;
        }

        setSuccessMessage('Identity confirmed successfully!');
        if (onSuccess) {
          onSuccess();
        }
      } catch (err: any) {
        setError(err?.message || 'Verification failed');
      } finally {
        setIsVerifying(false);
      }
    },
    [code, email, phone, method, purpose, onSuccess]
  );

  const switchMethod = (newMethod: TwoFactorMethod) => {
    setMethod(newMethod);
    setCode('');
    setError(null);
    setSuccessMessage(null);
    setCountdown(30);
    setCanResend(false);
  };

  return {
    method,
    code,
    setCode,
    isVerifying,
    isSending,
    error,
    successMessage,
    countdown,
    canResend,
    sendCode,
    verifyCode,
    switchMethod,
  };
};
