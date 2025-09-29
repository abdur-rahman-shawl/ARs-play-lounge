'use client';

import { FormEvent, useMemo, useState } from 'react';
import clsx from 'clsx';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { usePartyPlayers } from '@/hooks/usePartyPlayers';
import { darePrompts, truthPrompts } from '@/data/truth-or-dare';

type Phase = 'idle' | 'spinning' | 'revealed';

type PlayMode = 'truth' | 'dare';

const spinDuration = 2000;

const pickRandom = (list: string[], history: string[]) => {
  if (list.length === 0) return '';

  const available = list.filter((item) => !history.includes(item));
  const pool = available.length ? available : list;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
};

export function TruthOrDareScreen() {
  const { players, addPlayer, removePlayer } = usePartyPlayers();
  const [playerInput, setPlayerInput] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [mode, setMode] = useState<PlayMode>('truth');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [truthHistory, setTruthHistory] = useState<string[]>([]);
  const [dareHistory, setDareHistory] = useState<string[]>([]);
  const [rotation, setRotation] = useState(0);

  const activePlayer = players.length ? players[activeIndex % players.length] : null;

  const playerInitials = useMemo(() =>
    players.map((player) => ({
      id: player.id,
      label: player.name.slice(0, 2).toUpperCase(),
    })),
  [players]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    addPlayer(playerInput);
    setPlayerInput('');
    if (!players.length) {
      setActiveIndex(0);
    }
  };

  const beginSpin = () => {
    if (!players.length || phase === 'spinning') return;

    const nextMode: PlayMode = Math.random() > 0.5 ? 'truth' : 'dare';
    setMode(nextMode);
    setPhase('spinning');

    const extraTurns = 360 * 3; // spin three times for flair
    const offset = nextMode === 'truth' ? 45 : 225; // align pointer with segment
    const targetRotation = rotation + extraTurns + offset + Math.floor(Math.random() * 45);
    setRotation(targetRotation);

    window.setTimeout(() => {
      const source = nextMode === 'truth' ? truthPrompts : darePrompts;
      const history = nextMode === 'truth' ? truthHistory : dareHistory;
      const picked = pickRandom(source, history);
      setCurrentPrompt(picked);
      if (nextMode === 'truth') {
        setTruthHistory((prev) => (prev.length > 18 ? prev.slice(10) : prev).concat(picked));
      } else {
        setDareHistory((prev) => (prev.length > 18 ? prev.slice(10) : prev).concat(picked));
      }
      setPhase('revealed');
    }, spinDuration);
  };

  const nextPlayer = () => {
    if (!players.length) return;
    setActiveIndex((index) => (index + 1) % players.length);
    setPhase('idle');
    setCurrentPrompt('');
  };

  const newPromptSameMode = () => {
    const source = mode === 'truth' ? truthPrompts : darePrompts;
    const history = mode === 'truth' ? truthHistory : dareHistory;
    const picked = pickRandom(source, history);
    setCurrentPrompt(picked);
    if (mode === 'truth') {
      setTruthHistory((prev) => (prev.length > 18 ? prev.slice(10) : prev).concat(picked));
    } else {
      setDareHistory((prev) => (prev.length > 18 ? prev.slice(10) : prev).concat(picked));
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <GlassCard className="p-8">
        <form className="flex flex-wrap items-center gap-3" onSubmit={handleSubmit}>
          <label className="flex flex-col text-xs uppercase tracking-[0.3em] text-slate-400">
            Add Player
            <input
              value={playerInput}
              onChange={(event) => setPlayerInput(event.target.value)}
              placeholder="Name"
              className="mt-2 min-w-[180px] rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-accent-neon focus:outline-none"
            />
          </label>
          <Button type="submit" disabled={!playerInput.trim()}>
            Save Player
          </Button>
          {players.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              {players.map((player, index) => (
                <span
                  key={player.id}
                  className={clsx(
                    'flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5',
                    activeIndex === index && 'border-accent-neon text-white',
                  )}
                >
                  {player.name}
                  <button
                    type="button"
                    onClick={() => removePlayer(player.id)}
                    className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-slate-400 hover:border-red-400 hover:text-red-300"
                    aria-label={`Remove ${player.name}`}
                  >
                    ?
                  </button>
                </span>
              ))}
            </div>
          )}
        </form>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <GlassCard className="flex flex-col items-center gap-6 p-10">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Next Up</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              {activePlayer ? activePlayer.name : 'Add players to begin'}
            </h2>
          </div>

          <div className="relative flex h-64 w-64 items-center justify-center">
            <div className="absolute -top-6 h-10 w-10 rounded-full bg-accent-neon/80 shadow-glow" />
            <div
              className="neon-ring relative flex h-full w-full items-center justify-center rounded-full bg-white/5"
              style={{ transform: `rotate(${rotation}deg)`, transition: phase === 'spinning' ? `transform ${spinDuration}ms cubic-bezier(0.22, 1, 0.36, 1)` : undefined }}
            >
              <div className="absolute inset-0 grid grid-cols-2">
                <div className="rounded-l-full bg-emerald-400/50 text-center text-lg font-semibold uppercase tracking-widest text-emerald-100">
                  <span className="absolute inset-0 flex items-center justify-center rotate-[-90deg]">Truth</span>
                </div>
                <div className="rounded-r-full bg-rose-500/60 text-center text-lg font-semibold uppercase tracking-widest text-rose-100">
                  <span className="absolute inset-0 flex items-center justify-center rotate-[-90deg]">Dare</span>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={beginSpin} disabled={!players.length || phase === 'spinning'}>
            {phase === 'spinning' ? 'Spinning...' : 'Spin the Wheel'}
          </Button>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between gap-6 p-10">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              {phase === 'revealed' ? `${mode === 'truth' ? 'Truth' : 'Dare'} Prompt` : 'Ready for launch'}
            </p>
            <h3 className="text-2xl font-semibold text-white">
              {phase === 'revealed'
                ? currentPrompt
                : 'Spin the wheel to uncover your next challenge.'}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={newPromptSameMode} disabled={phase !== 'revealed'}>
              New {mode === 'truth' ? 'Truth' : 'Dare'}
            </Button>
            <Button onClick={nextPlayer} variant="ghost" disabled={!players.length}>
              Next Player ->
            </Button>
          </div>

          {players.length > 1 && (
            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
              {playerInitials.map((badge, index) => (
                <span
                  key={badge.id}
                  className={clsx(
                    'flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5',
                    activeIndex === index && 'border-accent-neon bg-accent-neon/20 text-white',
                  )}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}




