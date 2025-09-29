import { ReactNode } from 'react';
import { GlassCard } from './glass-card';

export function HubHeader({ children }: { children: ReactNode }) {
  return (
    <GlassCard className="mb-10 flex flex-col gap-6 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Play Lounge</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
          Choose your night mission
        </h1>
      </div>
      <p className="max-w-2xl text-sm text-slate-300 md:text-base">
        Invite the crew, grab the snacks, and hop between hand-crafted party games. Start with Truth or Dare, with more chaos modules unlocking soon.
      </p>
      {children}
    </GlassCard>
  );
}
