import React, { useState, useEffect } from 'react';
import { AuthShowcase } from './AuthShowcase';
import { LoginView } from './LoginView';
import { SignupView } from './SignupView';
import { TwoFactorView } from './TwoFactorView';
import { ForgotPasswordView } from './ForgotPasswordView';
import { ResetPasswordView } from './ResetPasswordView';
import type { AuthStep, AuthRole, XavorianAuthEvent, AuthWidgetProps } from '../types/auth';
import xavorianWordmark from '../assets/xavorian-wordmark.svg';

export const AuthWidget: React.FC<AuthWidgetProps> = ({
  initialStep = 'login',
  defaultRole = 'buyer',
  redirectUrl = '/dashboard',
  onSuccess,
  onExit,
  isEmbedded = false,
  showShowcase = true,
}) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>(initialStep);
  const [stepContext, setStepContext] = useState<any>({
    email: '',
    phone: '',
    accountType: defaultRole,
  });

  useEffect(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  const handleStepChange = (step: AuthStep, context?: any) => {
    if (context) {
      setStepContext((prev: any) => ({ ...prev, ...context }));
    }
    setCurrentStep(step);
  };

  const handleSuccess = (event: XavorianAuthEvent) => {
    // Notify host application via postMessage
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage(event, '*');
    }

    if (onSuccess) {
      onSuccess(event);
    }
  };

  return (
    <div
      className={`w-full flex items-center justify-center font-sans text-neutral-800 transition-all ${
        isEmbedded ? 'p-2 sm:p-4' : 'min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8'
      }`}
    >
      <div
        className={`w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-neutral-200/80 bg-white grid ${
          showShowcase ? 'lg:grid-cols-12' : 'grid-cols-1'
        }`}
      >
        {/* Left Side Showcase Panel */}
        {showShowcase && <AuthShowcase />}

        {/* Right Side Form Panel */}
        <div
          className={`${
            showShowcase ? 'lg:col-span-7' : 'col-span-1'
          } p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white relative`}
        >
          {/* Mobile branding header */}
          <div className="lg:hidden text-center space-y-2 mb-6">
            <img src={xavorianWordmark} alt="Xavorian" className="h-8 w-auto mx-auto" />
            <p className="text-xs text-neutral-500 font-medium">
              Verified Real Estate Authentication Layer
            </p>
          </div>

          {/* Close button if provided */}
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          )}

          {/* Step Views */}
          {currentStep === 'login' && (
            <LoginView
              onStepChange={handleStepChange}
              onSuccess={handleSuccess}
            />
          )}

          {currentStep === 'signup' && (
            <SignupView
              defaultRole={defaultRole}
              onStepChange={handleStepChange}
              onSuccess={handleSuccess}
            />
          )}

          {currentStep === 'two_factor' && (
            <TwoFactorView
              email={stepContext.email || 'user@example.com'}
              phone={stepContext.phone}
              purpose={stepContext.purpose || 'login'}
              onStepChange={handleStepChange}
              onSuccess={handleSuccess}
            />
          )}

          {currentStep === 'forgot_password' && (
            <ForgotPasswordView
              initialEmail={stepContext.email}
              onStepChange={handleStepChange}
            />
          )}

          {currentStep === 'reset_password' && (
            <ResetPasswordView onStepChange={handleStepChange} />
          )}
        </div>
      </div>
    </div>
  );
};
