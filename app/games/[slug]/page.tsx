import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getGameBySlug } from "@/lib/games";
import { TruthOrDareScreen } from "@/components/games/truth-or-dare/truth-or-dare-screen";
import { TriviaScreen } from "@/components/games/trivia/trivia-screen";

type GamePageProps = {
  params: {
    slug: string;
  };
};

export default function GamePage({ params }: GamePageProps) {
  const game = getGameBySlug(params.slug);

  if (!game) {
    notFound();
  }

  const renderGame = () => {
    switch (game.slug) {
      case "truth-or-dare":
        return (
          <Suspense fallback={<p className="text-slate-300">Loading the wheel...</p>}>
            <TruthOrDareScreen />
          </Suspense>
        );
      case "trivia-night":
        return (
          <Suspense fallback={<p className="text-slate-300">Loading the question deck...</p>}>
            <TriviaScreen />
          </Suspense>
        );
      default:
        return (
          <section className="glass-panel p-10 text-slate-300">
            <h2 className="mb-2 text-2xl font-semibold text-white">Coming soon</h2>
            <p>We are crafting this experience. Head back to the lounge to pick another game.</p>
          </section>
        );
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12 md:px-10 md:py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300 transition hover:border-accent-neon hover:bg-accent-neon/10 hover:text-white"
        >
          Back to Lounge
        </Link>
        <span className="text-[10px] uppercase tracking-[0.4em] text-slate-500">
          Switch games anytime
        </span>
      </div>

      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Play Lounge</p>
        <h1 className="text-4xl font-semibold text-white md:text-5xl">{game.title}</h1>
        <p className="text-sm text-slate-300 md:text-base">{game.tagline}</p>
      </header>

      {renderGame()}
    </main>
  );
}