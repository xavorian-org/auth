import React, { useState } from 'react';
import { AuthWidget } from './components/AuthWidget';
import type { AuthStep, AuthRole, XavorianAuthEvent } from './types/auth';
import { ShieldCheck, Monitor, Layers, Radio } from 'lucide-react';

export const App: React.FC = () => {
  const [initialStep, setInitialStep] = useState<AuthStep>('login');
  const [defaultRole, setDefaultRole] = useState<AuthRole>('buyer');
  const [isEmbedded, setIsEmbedded] = useState<boolean>(false);
  const [showShowcase, setShowShowcase] = useState<boolean>(true);
  const [lastEvent, setLastEvent] = useState<XavorianAuthEvent | null>(null);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Test Control Bar (helps previewing all auth states) */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-900 leading-none">
              Xavorian Authentication Microservice & Widget
            </h1>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Standalone Auth Layer (Vite + Supabase 2FA)
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Step Selector */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
            {(['login', 'signup', 'two_factor', 'forgot_password'] as AuthStep[]).map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setInitialStep(step)}
                className={`px-2.5 py-1 rounded-md capitalize font-semibold transition-all ${
                  initialStep === step
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {step.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Toggle showcase */}
          <button
            type="button"
            onClick={() => setShowShowcase(!showShowcase)}
            className={`px-2.5 py-1 rounded-lg border font-semibold transition-all flex items-center gap-1 ${
              showShowcase
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-700 border-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {showShowcase ? 'Showcase ON' : 'Showcase OFF'}
          </button>

          {/* Toggle embedded fit */}
          <button
            type="button"
            onClick={() => setIsEmbedded(!isEmbedded)}
            className={`px-2.5 py-1 rounded-lg border font-semibold transition-all flex items-center gap-1 ${
              isEmbedded
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-neutral-700 border-neutral-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            {isEmbedded ? 'Widget Mode' : 'Portal Mode'}
          </button>
        </div>
      </header>

      {/* Main Widget Area */}
      <main className="flex-1 flex items-center justify-center p-4">
        <AuthWidget
          initialStep={initialStep}
          defaultRole={defaultRole}
          isEmbedded={isEmbedded}
          showShowcase={showShowcase}
          onSuccess={(event) => {
            console.log('[Auth Host] Received Auth Success Event:', event);
            setLastEvent(event);
          }}
        />
      </main>

      {/* Event Stream Log Footer (if event fired) */}
      {lastEvent && (
        <div className="bg-neutral-900 text-neutral-200 border-t border-neutral-800 p-3 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-emerald-400 font-bold">{lastEvent.event}</span>
            <span className="text-neutral-400">Target: {lastEvent.data?.targetPath}</span>
            {lastEvent.data?.email && (
              <span className="text-neutral-400">User: {lastEvent.data.email}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setLastEvent(null)}
            className="text-neutral-400 hover:text-white text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
