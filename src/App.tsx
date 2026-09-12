import React, { useState, useEffect } from 'react';
import { AuthWidget } from './components/AuthWidget';
import type { AuthStep, AuthRole, XavorianAuthEvent } from './types/auth';
import { Shield, Lock, ExternalLink, HelpCircle, CheckCircle2 } from 'lucide-react';
import xavorianWordmark from './assets/xavorian-wordmark.svg';

export const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('login');
  const [defaultRole, setDefaultRole] = useState<AuthRole>('buyer');
  const [isEmbedded, setIsEmbedded] = useState<boolean>(false);
  const [showShowcase, setShowShowcase] = useState<boolean>(true);
  const [showDebugToolbar, setShowDebugToolbar] = useState<boolean>(false);

  // Parse URL query parameters for dynamic configuration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      
      const stepParam = params.get('step') || params.get('view') || params.get('mode');
      if (stepParam && ['login', 'signup', 'two_factor', 'forgot_password'].includes(stepParam)) {
        setCurrentStep(stepParam as AuthStep);
      }

      const roleParam = params.get('role');
      if (roleParam && ['buyer', 'seller', 'agent', 'developer'].includes(roleParam)) {
        setDefaultRole(roleParam as AuthRole);
      }

      if (params.get('embedded') === 'true' || window.self !== window.top) {
        setIsEmbedded(true);
        setShowShowcase(false);
      }

      if (params.get('debug') === 'true' || params.get('dev') === 'true') {
        setShowDebugToolbar(true);
      }
    }
  }, []);

  const handleAuthSuccess = (event: XavorianAuthEvent) => {
    console.log('[Xavorian Auth Portal] Auth Success Event:', event);

    // If running in iframe, communicate via postMessage
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage(event, '*');
      return;
    }

    // If standalone portal, redirect to destination or platform dashboard
    const targetUrl = event.data?.targetPath || 'https://xavorian.com/dashboard';
    if (typeof window !== 'undefined') {
      window.location.href = targetUrl;
    }
  };

  // If explicitly requested as embedded or loaded inside an iframe, render clean standalone widget
  if (isEmbedded) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-transparent p-2">
        <AuthWidget
          initialStep={currentStep}
          defaultRole={defaultRole}
          isEmbedded={true}
          showShowcase={false}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between selection:bg-purple-100 selection:text-purple-900">
      {/* Top Header */}
      <header className="w-full border-b border-neutral-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a
            href="https://xavorian.com"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
            title="Return to Xavorian Platform"
          >
            <img
              src={xavorianWordmark}
              alt="Xavorian"
              style={{ height: '28px', width: 'auto', maxHeight: '28px', display: 'inline-block' }}
              className="h-7 w-auto"
            />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
              <Shield className="w-3 h-3 text-purple-600" />
              Auth Gateway
            </span>
          </a>

          <div className="flex items-center gap-3">
            <a
              href="https://xavorian.com"
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors hidden sm:inline-flex items-center gap-1"
            >
              Main Platform
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </a>
            <div className="h-4 w-px bg-neutral-200 hidden sm:block" />
            <a
              href="https://xavorian.com/help"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100/80 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
              <span>Need Help?</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Authentication Canvas */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative">
        {/* Subtle background ambient light */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="w-full max-w-5xl my-auto">
          <AuthWidget
            initialStep={currentStep}
            defaultRole={defaultRole}
            isEmbedded={false}
            showShowcase={showShowcase}
            onSuccess={handleAuthSuccess}
          />
        </div>
      </main>

      {/* Footer Security Badges */}
      <footer className="w-full border-t border-neutral-200/80 bg-white/60 backdrop-blur-sm py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              256-Bit SSL Encrypted
            </span>
            <span className="hidden sm:inline text-neutral-300">•</span>
            <span className="inline-flex items-center gap-1 text-neutral-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
              NIMC / BVN Verified Network
            </span>
            <span className="hidden sm:inline text-neutral-300">•</span>
            <span>NDPR Data Privacy Compliant</span>
          </div>

          <div className="flex items-center gap-3 text-neutral-400">
            <span>© {new Date().getFullYear()} Xavorian Technologies Ltd.</span>
          </div>
        </div>
      </footer>

      {/* Optional Debug Pill (toggle via ?debug=true or pressing Ctrl+Shift+D) */}
      {showDebugToolbar && (
        <div className="fixed bottom-4 right-4 bg-neutral-900 text-white rounded-xl shadow-2xl p-2.5 flex items-center gap-2 text-xs z-50 border border-neutral-700">
          <span className="font-semibold text-purple-400">Dev Tool:</span>
          {(['login', 'signup', 'two_factor', 'forgot_password'] as AuthStep[]).map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => setCurrentStep(step)}
              className={`px-2 py-1 rounded capitalize font-medium transition-colors ${
                currentStep === step ? 'bg-purple-600 text-white' : 'hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              {step.replace('_', ' ')}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowShowcase(!showShowcase)}
            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
          >
            {showShowcase ? 'Hide Showcase' : 'Show Showcase'}
          </button>
          <button
            type="button"
            onClick={() => setShowDebugToolbar(false)}
            className="text-neutral-500 hover:text-white px-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
