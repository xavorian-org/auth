import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import xavorianWordmark from '../assets/xavorian-wordmark.svg';

interface FeatureCard {
  badge: string;
  title: string;
  text: string;
  stat: string;
  highlight: string;
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    badge: 'Vetted Properties',
    title: 'Audit-Checked Listings',
    text: 'Every property listing on Xavorian has passed our online title audits — cross-referenced against state land registry records to prevent ownership fraud.',
    stat: '100% Title Verified',
    highlight: 'State Registry Verified',
  },
  {
    badge: 'Trusted Network',
    title: 'KYC-Verified Users & Agents',
    text: 'Transact with confidence. Every buyer, landlord, and licensed agent on the platform completes identity verification against NIMC/BVN records.',
    stat: 'NIMC / BVN Verified',
    highlight: 'Zero Fake Brokers',
  },
  {
    badge: 'Safe Payments',
    title: 'Secure Milestone Deals',
    text: 'Track your legal documentation, verified bank settlements, and property handover updates in one clean, transparent dashboard.',
    stat: 'End-to-End Escrow Safe',
    highlight: 'Guaranteed Protection',
  },
];

export const AuthShowcase: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % FEATURE_CARDS.length);
        setIsVisible(true);
      }, 350);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const card = FEATURE_CARDS[currentIdx];

  return (
    <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 xl:p-12 text-white relative overflow-hidden h-full min-h-[660px] bg-gradient-to-br from-neutral-950 via-[#0B0F19] to-neutral-900 border-r border-neutral-800/80">
      {/* Dynamic background ambient glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* Top Branding */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src={xavorianWordmark}
            alt="Xavorian"
            style={{ height: '28px', width: 'auto', maxHeight: '28px', display: 'inline-block' }}
            className="h-7 w-auto brightness-0 invert"
          />
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/10 text-neutral-200 border border-white/15 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Secure Auth Layer
        </span>
      </div>

      {/* Hero center messaging */}
      <div className="relative z-10 my-auto py-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary-200 border border-primary/40 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-primary-300" />
          The Nigerian Standard for Safe Property
        </div>
        <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight font-heading">
          Where verified property meets transparent peace of mind.
        </h1>
        <p className="text-sm text-neutral-300 font-normal leading-relaxed max-w-sm">
          Protected authentication protecting your identity, legal titles, and escrow milestones across Nigeria.
        </p>
      </div>

      {/* Showcase Card Section */}
      <div className="relative z-10 space-y-4">
        <div
          className={`backdrop-blur-xl bg-white/[0.08] border border-white/15 p-6 rounded-2xl space-y-3 shadow-2xl transition-all duration-300 transform ${
            isVisible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-3 scale-98'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/30 text-primary-200 border border-primary/50 uppercase tracking-wider">
              {card.badge}
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {card.highlight}
            </span>
          </div>

          <h3 className="text-base font-bold text-white leading-snug">
            {card.title}
          </h3>

          <p className="text-xs text-neutral-200 leading-relaxed">
            "{card.text}"
          </p>

          <div className="flex items-center gap-3 pt-3 border-t border-white/10">
            <div className="p-2 bg-primary/20 rounded-xl border border-primary/30 shrink-0">
              <ShieldCheck className="w-4 h-4 text-primary-300" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Xavorian Shield</h4>
              <p className="text-[10px] text-neutral-400">{card.stat}</p>
            </div>
          </div>
        </div>

        {/* Indicator dots */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {FEATURE_CARDS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => {
                  setCurrentIdx(i);
                  setIsVisible(true);
                }, 200);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIdx ? 'w-6 bg-primary' : 'w-1.5 bg-neutral-600 hover:bg-neutral-400'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
