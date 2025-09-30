'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { usePartyPlayers } from '@/hooks/usePartyPlayers';

type TriviaQuestion = {
  id: string;
  category: string;
  type: 'multiple' | 'boolean';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  correctAnswer: string;
  options: string[];
};

type TriviaStatus = 'idle' | 'loading' | 'ready' | 'error' | 'finished';

type DifficultyOption = {
  label: string;
  value: 'any' | 'easy' | 'medium' | 'hard';
};

type TypeOption = {
  label: string;
  value: 'any' | 'multiple' | 'boolean';
};

const difficultyOptions: DifficultyOption[] = [
  { label: 'Any difficulty', value: 'any' },
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];

const typeOptions: TypeOption[] = [
  { label: 'Any type', value: 'any' },
  { label: 'Multiple choice', value: 'multiple' },
  { label: 'True / False', value: 'boolean' },
];

const questionAmounts = [5, 10, 15, 20];

const difficultyBadge = {
  easy: 'text-emerald-200 border-emerald-300/50',
  medium: 'text-amber-200 border-amber-300/50',
  hard: 'text-rose-200 border-rose-300/50',
};

const formatDifficulty = (value: TriviaQuestion['difficulty']) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const sumScores = (scores: Record<string, number>) =>
  Object.values(scores).reduce((total, value) => total + value, 0);

export function TriviaScreen() {
  const { players } = usePartyPlayers();
  const [status, setStatus] = useState<TriviaStatus>('idle');
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [hasAwarded, setHasAwarded] = useState(false);
  const [amount, setAmount] = useState(10);
  const [difficulty, setDifficulty] = useState<DifficultyOption['value']>('any');
  const [type, setType] = useState<TypeOption['value']>('any');
  const [scores, setScores] = useState<Record<string, number>>({});

  const nextQuestionTimeout = useRef<number | null>(null);

  const activePlayer = players.length
    ? players[questionIndex % players.length]
    : null;

  const currentQuestion = questions[questionIndex];

  const totalQuestions = questions.length;
  const answeredCount = Math.min(status === 'finished' ? totalQuestions : questionIndex, totalQuestions);

  const zeroScores = useMemo(() => {
    return players.reduce<Record<string, number>>((acc, player) => {
      acc[player.id] = 0;
      return acc;
    }, {});
  }, [players]);

  useEffect(() => {
    setScores((prev) => {
      const next: Record<string, number> = {};
      players.forEach((player) => {
        next[player.id] = prev[player.id] ?? 0;
      });
      return next;
    });
  }, [players]);

  useEffect(() => {
    return () => {
      if (nextQuestionTimeout.current) {
        window.clearTimeout(nextQuestionTimeout.current);
      }
    };
  }, []);

  const loadQuestions = async () => {
    setStatus('loading');
    setError('');
    setRevealed(false);
    setHasAwarded(false);

    const params = new URLSearchParams();
    params.set('amount', String(amount));
    if (difficulty !== 'any') params.set('difficulty', difficulty);
    if (type !== 'any') params.set('type', type);

    try {
      const response = await fetch(`/api/trivia?${params.toString()}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? 'Trivia service returned an error.');
      }

      const data = await response.json();
      const pulledQuestions = (data.questions ?? []) as TriviaQuestion[];

      if (!pulledQuestions.length) {
        throw new Error('No questions available for these settings. Try another mix.');
      }

      setQuestions(pulledQuestions);
      setQuestionIndex(0);
      setScores(zeroScores);
      setRevealed(false);
      setHasAwarded(false);
      setStatus('ready');
    } catch (requestError) {
      setStatus('error');
      setError(requestError instanceof Error ? requestError.message : 'Unable to load questions.');
    }
  };

  const advanceQuestion = () => {
    setHasAwarded(false);
    setRevealed(false);

    if (questionIndex + 1 >= questions.length) {
      setStatus('finished');
    } else {
      setQuestionIndex((previous) => previous + 1);
    }
  };

  const handleReveal = () => {
    if (status !== 'ready') return;
    setRevealed(true);
  };

  const handleMarkCorrect = () => {
    if (status !== 'ready' || !activePlayer || hasAwarded) return;

    setScores((prev) => ({
      ...prev,
      [activePlayer.id]: (prev[activePlayer.id] ?? 0) + 1,
    }));
    setHasAwarded(true);
    setRevealed(true);
  };

  const handleNextQuestion = () => {
    if (!questions.length) return;

    if (nextQuestionTimeout.current) {
      window.clearTimeout(nextQuestionTimeout.current);
    }

    nextQuestionTimeout.current = window.setTimeout(() => {
      advanceQuestion();
      nextQuestionTimeout.current = null;
    }, 100);
  };

  const handleResetScores = () => {
    setScores(zeroScores);
  };

  const handlePlayAgain = () => {
    setQuestionIndex(0);
    setStatus('idle');
    setQuestions([]);
    setScores(zeroScores);
    setRevealed(false);
    setHasAwarded(false);
  };

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const diff = (scores[b.id] ?? 0) - (scores[a.id] ?? 0);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
  }, [players, scores]);

  const awardLabel = activePlayer ? 'Award point to ' + activePlayer.name : 'Award point';

  return (
    <div className="flex flex-col gap-8">
      <GlassCard className="p-8">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex w-full max-w-[160px] flex-col text-xs uppercase tracking-[0.3em] text-slate-400">
            Questions
            <select
              className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-accent-neon focus:outline-none"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            >
              {questionAmounts.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="flex w-full max-w-[180px] flex-col text-xs uppercase tracking-[0.3em] text-slate-400">
            Difficulty
            <select
              className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-accent-neon focus:outline-none"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as DifficultyOption['value'])}
            >
              {difficultyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex w-full max-w-[200px] flex-col text-xs uppercase tracking-[0.3em] text-slate-400">
            Question Type
            <select
              className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-accent-neon focus:outline-none"
              value={type}
              onChange={(event) => setType(event.target.value as TypeOption['value'])}
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <Button onClick={loadQuestions} disabled={status === 'loading'}>
            {status === 'loading' ? 'Loading questions...' : 'Load questions'}
          </Button>

          <div className="ml-auto text-right text-xs text-slate-400">
            {status === 'ready' && totalQuestions > 0 && (
              <p>
                Question {questionIndex + 1} of {totalQuestions}
              </p>
            )}
            {status === 'finished' && (
              <p>Round complete ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ {totalQuestions} questions</p>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </p>
        )}
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <GlassCard className="flex flex-col gap-6 p-10">
          {status === 'idle' && (
            <div className="text-center text-sm text-slate-300">
              Load a fresh set of questions to kick off trivia night.
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center text-sm text-slate-300">
              Fetching questions from Open Trivia DB...
            </div>
          )}

          {status === 'error' && (
            <div className="text-center text-sm text-rose-200">
              {error || 'Something went sideways. Try loading again.'}
            </div>
          )}

          {status === 'finished' && (
            <div className="flex flex-col items-start gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Great run</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Trivia round complete</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Reload to grab a new batch of questions or tweak the filters for a fresh challenge.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={loadQuestions}>Load new set</Button>
                <Button variant="ghost" onClick={handlePlayAgain}>
                  Clear board
                </Button>
              </div>
            </div>
          )}

          {status === 'ready' && currentQuestion && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px]">
                  {currentQuestion.category}
                </span>
                <span
                  className={clsx(
                    'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase',
                    difficultyBadge[currentQuestion.difficulty],
                  )}
                >
                  {formatDifficulty(currentQuestion.difficulty)}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-300">
                  {currentQuestion.type === 'boolean' ? 'True / False' : 'Multiple choice'}
                </span>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Question</p>
                <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
                  {currentQuestion.question}
                </h2>
              </div>

              <ul className="flex flex-col gap-3">
                {currentQuestion.options.map((option) => {
                  const isCorrect = option === currentQuestion.correctAnswer;
                  return (
                    <li
                      key={option}
                      className={clsx(
                        'rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 transition',
                        revealed && isCorrect && 'border-emerald-300/70 bg-emerald-500/15 text-emerald-100 shadow-glow',
                      )}
                    >
                      {option}
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleReveal} variant={revealed ? 'ghost' : 'default'} disabled={revealed}>
                  {revealed ? 'Answer revealed' : 'Reveal answer'}
                </Button>
                <Button onClick={handleMarkCorrect} disabled={!activePlayer || hasAwarded}>
                  {awardLabel}
                </Button>
                <Button variant="ghost" onClick={handleNextQuestion}>
                  Next question
                </Button>
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard className="flex flex-col gap-6 p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Scoreboard</p>
              <h3 className="mt-1 text-xl font-semibold text-white">
                {players.length ? 'Track the crew' : 'Add players from another game to keep score'}
              </h3>
            </div>
            <Button variant="ghost" onClick={handleResetScores} disabled={!players.length}>
              Reset
            </Button>
          </div>

          <div className="space-y-2 text-sm text-slate-300">
            <p>Total points: {sumScores(scores)}</p>
            <p>
              Questions asked: {answeredCount} / {totalQuestions}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {players.length === 0 && (
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Use the player lobby in Truth or Dare or add names later to track points here.
              </p>
            )}

            {sortedPlayers.map((player) => (
              <div
                key={player.id}
                className={clsx(
                  'flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100',
                  activePlayer && activePlayer.id === player.id && 'border-accent-neon bg-accent-neon/10 text-white',
                )}
              >
                <span className="font-medium">{player.name}</span>
                <span className="text-base font-semibold text-white">{scores[player.id] ?? 0}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}