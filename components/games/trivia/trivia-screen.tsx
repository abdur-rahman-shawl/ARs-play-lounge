"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { OptionPicker, OptionItem } from "@/components/ui/option-picker";
import { usePartyPlayers } from "@/hooks/usePartyPlayers";
import type { PartyPlayer } from "@/hooks/usePartyPlayers";

type TriviaQuestion = {
  id: string;
  category: string;
  type: "multiple" | "boolean";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  correctAnswer: string;
  options: string[];
};

type TriviaStatus = "setup" | "loading" | "active" | "summary" | "error";

type DifficultyValue = "any" | "easy" | "medium" | "hard";
type TypeValue = "any" | "multiple" | "boolean";

type CategoryOption = {
  id: string;
  name: string;
};

type TriviaAssignments = Record<string, TriviaQuestion[]>;

const MAX_TOTAL_QUESTIONS = 50;

const difficultyOptions: { label: string; value: DifficultyValue }[] = [
  { label: "Any difficulty", value: "any" },
  { label: "Easy", value: "easy" },
  { label: "Medium", value: "medium" },
  { label: "Hard", value: "hard" },
];

const typeOptions: { label: string; value: TypeValue }[] = [
  { label: "Any type", value: "any" },
  { label: "Multiple choice", value: "multiple" },
  { label: "True / False", value: "boolean" },
];

const perPlayerOptions = Array.from({ length: 10 }, (_, index) => index + 1);
const perPlayerSelectOptions = perPlayerOptions.map((value) => ({
  value: String(value),
  label: String(value),
}));
const difficultySelectOptions = difficultyOptions.map((option) => ({
  value: option.value,
  label: option.label,
}));
const typeSelectOptions = typeOptions.map((option) => ({
  value: option.value,
  label: option.label,
}));

const difficultyBadge: Record<"easy" | "medium" | "hard", string> = {
  easy: "text-emerald-200 border-emerald-300/50",
  medium: "text-amber-200 border-amber-300/50",
  hard: "text-rose-200 border-rose-300/50",
};

const formatDifficulty = (value: TriviaQuestion["difficulty"]) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const sumScores = (scores: Record<string, number>) =>
  Object.values(scores).reduce((total, value) => total + value, 0);

const buildAssignments = (
  players: PartyPlayer[],
  deck: TriviaQuestion[]
): TriviaAssignments => {
  const assignments: TriviaAssignments = {};
  players.forEach((player) => {
    assignments[player.id] = [];
  });

  deck.forEach((question, index) => {
    const player = players[index % players.length];
    assignments[player.id].push(question);
  });

  return assignments;
};

const toAmountParam = (value: number) =>
  Math.min(Math.max(Math.floor(value), 1), MAX_TOTAL_QUESTIONS);

export function TriviaScreen() {
  const { players, addPlayer, removePlayer, renamePlayer, movePlayer } =
    usePartyPlayers();

  const [status, setStatus] = useState<TriviaStatus>("setup");
  const [error, setError] = useState("");
  const [capacityNotice, setCapacityNotice] = useState("");

  const [questionsPerPlayer, setQuestionsPerPlayer] = useState<number>(3);
  const [activeQuestionsPerPlayer, setActiveQuestionsPerPlayer] = useState<
    number | null
  >(null);
  const [difficulty, setDifficulty] = useState<DifficultyValue>("any");
  const [type, setType] = useState<TypeValue>("any");
  const [category, setCategory] = useState<string>("any");

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");
  const categorySelectOptions = useMemo<OptionItem[]>(() => [
    { value: "any", label: "Any category" },
    ...categories.map((option) => ({
      value: option.id,
      label: option.name,
    })),
  ], [categories]);

  const [questionsByPlayer, setQuestionsByPlayer] = useState<TriviaAssignments>(
    {}
  );
  const [scores, setScores] = useState<Record<string, number>>({});
  const [currentRound, setCurrentRound] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [hasAwarded, setHasAwarded] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [awardFlash, setAwardFlash] = useState(false);
  const [settingsLocked, setSettingsLocked] = useState(false);

  const nextQuestionTimeout = useRef<number | null>(null);

  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setRenameDrafts((prev) => {
      const next: Record<string, string> = {};
      if (Object.prototype.hasOwnProperty.call(prev, "__new")) {
        next.__new = prev.__new;
      }
      players.forEach((player) => {
        next[player.id] = prev[player.id] ?? player.name;
      });
      return next;
    });
  }, [players]);

  useEffect(() => {
    if (status === "setup") {
      setSettingsLocked(false);
    }
  }, [status]);

  useEffect(() => {
    const controller = new AbortController();
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await fetch("/api/trivia/categories", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load categories");
        }

        const data = await response.json();
        const list = Array.isArray(data.categories)
          ? (data.categories as CategoryOption[])
          : [];
        const normalized = list.map((item) => ({
          id: String((item as unknown as { id: number | string }).id ?? ""),
          name: (item as unknown as { name: string }).name ?? "Unknown",
        }));
        setCategories(normalized);
        setCategoriesError("");
      } catch (requestError) {
        if (controller.signal.aborted) return;
        console.warn("Trivia categories request failed", requestError);
        setCategoriesError("Unable to load categories; using Any category.");
        setCategories([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCategories(false);
        }
      }
    };

    loadCategories();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => {
      if (nextQuestionTimeout.current) {
        window.clearTimeout(nextQuestionTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    setScores((prev) => {
      const next: Record<string, number> = {};
      players.forEach((player) => {
        next[player.id] = prev[player.id] ?? 0;
      });
      return next;
    });
  }, [players]);

  const zeroScores = useMemo(() => {
    return players.reduce<Record<string, number>>((acc, player) => {
      acc[player.id] = 0;
      return acc;
    }, {});
  }, [players]);

  const activePlayers = players;
  const totalRounds = activeQuestionsPerPlayer ?? 0;
  const totalQuestions = totalRounds * activePlayers.length;

  const activePlayer =
    status === "active" || status === "summary"
      ? activePlayers[currentPlayerIndex] ?? null
      : null;

  const currentQuestion =
    status === "active" && activePlayer
      ? questionsByPlayer[activePlayer.id]?.[currentRound]
      : undefined;

  const answeredCount =
    status === "active"
      ? completedCount
      : status === "summary"
      ? totalQuestions
      : 0;

  const awardLabel = activePlayer
    ? `Mark correct for ${activePlayer.name}`
    : "Mark correct";

  const plannedTotalQuestions = activePlayers.length * questionsPerPlayer;
  const rosterIsLocked = settingsLocked;

  const triggerAwardFlash = () => {
    setAwardFlash(true);
    window.setTimeout(() => setAwardFlash(false), 450);
  };

  const handleRenameBlur = (playerId: string) => {
    const draft = renameDrafts[playerId];
    if (draft && draft.trim()) {
      const trimmed = draft.trim();
      renamePlayer(playerId, trimmed);
      setRenameDrafts((prev) => ({ ...prev, [playerId]: trimmed }));
    } else {
      setRenameDrafts((prev) => ({
        ...prev,
        [playerId]: players.find((p) => p.id === playerId)?.name ?? "",
      }));
    }
  };

  const handleStartGame = async (reuseNotice = false) => {
    if (!activePlayers.length) {
      setError("Add at least one player to start trivia.");
      setStatus("setup");
      return;
    }

    const desiredPerPlayer = questionsPerPlayer;
    const desiredTotal = activePlayers.length * desiredPerPlayer;

    let effectivePerPlayer = desiredPerPlayer;
    let notice = "";

    if (desiredTotal > MAX_TOTAL_QUESTIONS) {
      effectivePerPlayer = Math.floor(
        MAX_TOTAL_QUESTIONS / activePlayers.length
      );
      if (effectivePerPlayer <= 0) {
        setError(
          "Too many players for the 50-question limit. Remove a few players or reduce questions per player."
        );
        setStatus("setup");
        setSettingsLocked(false);
        return;
      }
      notice = `Limited to ${MAX_TOTAL_QUESTIONS} questions total. Each player will get ${effectivePerPlayer} question${
        effectivePerPlayer === 1 ? "" : "s"
      }.`;
    }

    const fetchAmount = toAmountParam(
      effectivePerPlayer * activePlayers.length
    );

    setStatus("loading");
    setError("");
    setSettingsLocked(true);
    if (!reuseNotice) {
      setCapacityNotice("");
    }
    setActiveQuestionsPerPlayer(null);
    setQuestionsByPlayer({});
    setScores(zeroScores);
    setCurrentRound(0);
    setCurrentPlayerIndex(0);
    setRevealed(false);
    setHasAwarded(false);
    setCompletedCount(0);

    const params = new URLSearchParams();
    params.set("amount", String(fetchAmount));
    if (difficulty !== "any") params.set("difficulty", difficulty);
    if (type !== "any") params.set("type", type);
    if (category !== "any") params.set("category", category);

    try {
      const response = await fetch(`/api/trivia?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Trivia service returned an error.");
      }

      const data = await response.json();
      const pulledQuestions = (data.questions ?? []) as TriviaQuestion[];

      if (pulledQuestions.length < fetchAmount) {
        throw new Error(
          "Open Trivia DB did not return enough questions for these settings. Try different filters or fewer questions per player."
        );
      }

      const assignments = buildAssignments(
        activePlayers,
        pulledQuestions.slice(0, fetchAmount)
      );

      setQuestionsByPlayer(assignments);
      setActiveQuestionsPerPlayer(effectivePerPlayer);
      setCapacityNotice(notice);
      setStatus("active");
      setRevealed(false);
      setHasAwarded(false);
      setCompletedCount(0);
    } catch (requestError) {
      console.error("Trivia fetch failed", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load trivia questions."
      );
      setStatus("error");
      setSettingsLocked(false);
      setActiveQuestionsPerPlayer(null);
    }
  };

  const handleReveal = () => {
    if (status !== "active" || !currentQuestion) return;
    setRevealed(true);
  };

  const handleMarkCorrect = () => {
    if (
      status !== "active" ||
      !activePlayer ||
      !currentQuestion ||
      hasAwarded ||
      !revealed
    )
      return;

    setScores((prev) => ({
      ...prev,
      [activePlayer.id]: (prev[activePlayer.id] ?? 0) + 1,
    }));
    setHasAwarded(true);
    triggerAwardFlash();
  };

  const transitionToNextQuestion = () => {
    if (!activePlayers.length) {
      setStatus("summary");
      return;
    }

    const lastPlayerIndex = activePlayers.length - 1;
    const isLastPlayer = currentPlayerIndex >= lastPlayerIndex;
    const isLastRound = currentRound >= totalRounds - 1;

    if (isLastPlayer && isLastRound) {
      setStatus("summary");
      setRevealed(false);
      setHasAwarded(false);
      return;
    }

    if (isLastPlayer) {
      setCurrentPlayerIndex(0);
      setCurrentRound((prev) => prev + 1);
    } else {
      setCurrentPlayerIndex((prev) => prev + 1);
    }

    setRevealed(false);
    setHasAwarded(false);
  };

  const handleNextQuestion = () => {
    if (status !== "active" || !currentQuestion) return;

    if (nextQuestionTimeout.current) {
      window.clearTimeout(nextQuestionTimeout.current);
    }

    setCompletedCount((prev) => prev + 1);

    nextQuestionTimeout.current = window.setTimeout(() => {
      transitionToNextQuestion();
      nextQuestionTimeout.current = null;
    }, 120);
  };

  const handleResetScores = () => {
    setScores(zeroScores);
  };

  const handlePlayAgain = () => {
    setQuestionsByPlayer({});
    setActiveQuestionsPerPlayer(null);
    setCompletedCount(0);
    setCapacityNotice("");
    setError("");
    setScores(zeroScores);
    setCurrentRound(0);
    setCurrentPlayerIndex(0);
    setRevealed(false);
    setHasAwarded(false);
    setStatus("setup");
    setSettingsLocked(false);
  };

  const handleReplaySameSettings = () => {
    handleStartGame(true);
  };

  const sortedPlayers = useMemo(() => {
    return [...activePlayers].sort((a, b) => {
      const diff = (scores[b.id] ?? 0) - (scores[a.id] ?? 0);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
  }, [activePlayers, scores]);

  return (
    <div className="flex flex-col gap-8">
      <GlassCard className="space-y-6 p-8">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex w-full max-w-xs flex-col text-xs uppercase tracking-[0.3em] text-slate-400">
            Add Player / Team
            <div className="mt-2 flex gap-3">
              <input
                disabled={rosterIsLocked}
                value={renameDrafts["__new"] ?? ""}
                onChange={(event) =>
                  setRenameDrafts((prev) => ({
                    ...prev,
                    __new: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    const value = renameDrafts["__new"] ?? "";
                    if (value.trim()) {
                      addPlayer(value.trim());
                      setRenameDrafts((prev) => ({ ...prev, __new: "" }));
                    }
                  }
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:border-accent-neon focus:outline-none"
                placeholder="Name"
              />
              <Button
                type="button"
                onClick={() => {
                  const value = renameDrafts["__new"] ?? "";
                  if (value.trim()) {
                    addPlayer(value.trim());
                    setRenameDrafts((prev) => ({ ...prev, __new: "" }));
                  }
                }}
                disabled={rosterIsLocked}
              >
                Save
              </Button>
            </div>
          </label>

          <div className="ml-auto text-right text-xs text-slate-400">
            <p>
              Planned questions: {plannedTotalQuestions} / {MAX_TOTAL_QUESTIONS}
            </p>
            {totalRounds > 0 && (
              <p>
                Active deck: {totalRounds} question
                {totalRounds === 1 ? "" : "s"} per player
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {activePlayers.length === 0 && (
            <p className="text-sm text-slate-300">
              Add a few names to get started. Players sync across games.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {activePlayers.map((player, index) => (
              <div
                key={player.id}
                className={clsx(
                  "flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3",
                  rosterIsLocked && "bg-white/10"
                )}
              >
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {index + 1}
                </span>
                {rosterIsLocked ? (
                  <span className="text-sm font-medium text-white">
                    {player.name}
                  </span>
                ) : (
                  <input
                    value={renameDrafts[player.id] ?? player.name}
                    onChange={(event) =>
                      setRenameDrafts((prev) => ({
                        ...prev,
                        [player.id]: event.target.value,
                      }))
                    }
                    onBlur={() => handleRenameBlur(player.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleRenameBlur(player.id);
                      }
                    }}
                    className="flex-1 min-w-[140px] rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-accent-neon focus:outline-none"
                  />
                )}

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => movePlayer(player.id, "up")}
                    disabled={rosterIsLocked || index === 0}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 transition hover:border-accent-neon hover:text-white disabled:opacity-40"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => movePlayer(player.id, "down")}
                    disabled={
                      rosterIsLocked || index === activePlayers.length - 1
                    }
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 transition hover:border-accent-neon hover:text-white disabled:opacity-40"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    onClick={() => removePlayer(player.id)}
                    disabled={rosterIsLocked}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-rose-200 transition hover:border-rose-400 hover:text-rose-100 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col text-xs uppercase tracking-[0.3em] text-slate-400">
            Questions / Player
            <div className="mt-2">
              <OptionPicker
                label="Questions per player"
                value={String(questionsPerPlayer)}
                options={perPlayerSelectOptions}
                onChange={(val) => setQuestionsPerPlayer(Number(val))}
                disabled={rosterIsLocked}
              />
            </div>
          </div>

          <div className="flex flex-col text-xs uppercase tracking-[0.3em] text-slate-400">
            Difficulty
            <div className="mt-2">
              <OptionPicker
                label="Difficulty"
                value={difficulty}
                options={difficultySelectOptions}
                onChange={(val) => setDifficulty(val as DifficultyValue)}
                disabled={rosterIsLocked}
              />
            </div>
          </div>

          <div className="flex flex-col text-xs uppercase tracking-[0.3em] text-slate-400">
            Question Type
            <div className="mt-2">
              <OptionPicker
                label="Question type"
                value={type}
                options={typeSelectOptions}
                onChange={(val) => setType(val as TypeValue)}
                disabled={rosterIsLocked}
              />
            </div>
          </div>

          <div className="flex flex-col text-xs uppercase tracking-[0.3em] text-slate-400">
            Category
            <div className="mt-2">
              <OptionPicker
                label="Category"
                value={category}
                options={categorySelectOptions}
                onChange={(val) => setCategory(val)}
                disabled={rosterIsLocked || isLoadingCategories}
              />
            </div>
            {categoriesError && (
              <span className="mt-2 text-[11px] text-amber-200">
                {categoriesError}
              </span>
            )}
          </div>
        </div>
        {capacityNotice && (
          <p className="rounded-2xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {capacityNotice}
          </p>
        )}

        {error && status === "error" && (
          <p className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => handleStartGame(false)}
            disabled={
              status === "loading" ||
              rosterIsLocked ||
              activePlayers.length === 0
            }
          >
            {status === "loading" ? "Loading questions..." : "Start round"}
          </Button>
          {status === "error" && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStatus("setup")}
            >
              Try again
            </Button>
          )}
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <GlassCard className="flex flex-col gap-6 p-10">
          {status === "setup" && (
            <div className="text-center text-sm text-slate-300">
              Configure the roster and filters above, then start a round to pull
              live questions.
            </div>
          )}

          {status === "loading" && (
            <div className="text-center text-sm text-slate-300">
              Fetching questions from Open Trivia DB...
            </div>
          )}

          {status === "active" && currentQuestion && activePlayer && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px]">
                  {currentQuestion.category}
                </span>
                <span
                  className={clsx(
                    "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase",
                    difficultyBadge[currentQuestion.difficulty]
                  )}
                >
                  {formatDifficulty(currentQuestion.difficulty)}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-300">
                  {currentQuestion.type === "boolean"
                    ? "True / False"
                    : "Multiple choice"}
                </span>
                <span className="rounded-full border border-accent-neon/70 bg-accent-neon/10 px-3 py-1 text-[11px] text-accent-neon">
                  {`Round ${currentRound + 1} of ${totalRounds}`}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-300">
                  {`Player: ${activePlayer.name}`}
                </span>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                  Question
                </p>
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
                        "rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 transition",
                        revealed &&
                          isCorrect &&
                          "border-emerald-300/70 bg-emerald-500/15 text-emerald-100 shadow-glow"
                      )}
                    >
                      {option}
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleReveal}
                  variant={revealed ? "ghost" : "default"}
                  disabled={revealed}
                >
                  {revealed ? "Answer revealed" : "Reveal answer"}
                </Button>
                <Button
                  onClick={handleMarkCorrect}
                  disabled={!activePlayer || hasAwarded || !revealed}
                >
                  {awardLabel}
                </Button>
                <Button variant="ghost" onClick={handleNextQuestion}>
                  Next question
                </Button>
              </div>
            </div>
          )}

          {status === "summary" && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Great run
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                  Trivia round complete
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Reload to grab a new batch of questions or tweak the filters
                  for a fresh challenge.
                </p>
              </div>

              <div className="flex flex-col gap-3 text-sm text-slate-200">
                {activePlayers.map((player) => {
                  const correct = scores[player.id] ?? 0;
                  const asked =
                    questionsByPlayer[player.id]?.length ??
                    activeQuestionsPerPlayer ??
                    0;
                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <span className="font-semibold text-white">
                        {player.name}
                      </span>
                      <span className="text-slate-200">
                        {correct} / {asked} correct
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleReplaySameSettings}>
                  Play again (same settings)
                </Button>
                <Button variant="ghost" onClick={handlePlayAgain}>
                  Adjust settings
                </Button>
              </div>
            </div>
          )}

          {status === "error" && !error && (
            <div className="text-center text-sm text-slate-300">
              Something went sideways while loading questions. Try again.
            </div>
          )}
        </GlassCard>

        <GlassCard className="flex flex-col gap-6 p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Scoreboard
              </p>
              <h3 className="mt-1 text-xl font-semibold text-white">
                {activePlayers.length
                  ? "Track the crew"
                  : "Add players to keep score"}
              </h3>
            </div>
            <Button
              variant="ghost"
              onClick={handleResetScores}
              disabled={!activePlayers.length}
            >
              Reset
            </Button>
          </div>

          <div className="space-y-2 text-sm text-slate-300">
            <p>Total points: {sumScores(scores)}</p>
            <p>
              Questions progressed: {answeredCount} /{" "}
              {totalQuestions || plannedTotalQuestions}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {activePlayers.length === 0 && (
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Use the roster tools above to add names. Scores persist across
                games until you reset.
              </p>
            )}

            {sortedPlayers.map((player) => (
              <div
                key={player.id}
                className={clsx(
                  "flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100",
                  activePlayer &&
                    activePlayer.id === player.id &&
                    status === "active" &&
                    "border-accent-neon bg-accent-neon/10 text-white",
                  awardFlash &&
                    activePlayer &&
                    activePlayer.id === player.id &&
                    hasAwarded &&
                    "animate-pulse"
                )}
              >
                <span className="font-medium">{player.name}</span>
                <span className="text-base font-semibold text-white">
                  {scores[player.id] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
