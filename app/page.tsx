import Link from "next/link";
import { games } from "@/lib/games";
import { HubHeader } from "@/components/ui/hub-header";
import { GameTile } from "@/components/ui/game-tile";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12 md:px-10 md:py-16">
      <HubHeader>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/games/truth-or-dare"
            className="inline-flex items-center gap-2 rounded-2xl border border-accent-neon/60 bg-accent-neon/20 px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-accent-neon/30"
          >
            Launch Truth or Dare ->
          </Link>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
            More games unlocking soon
          </span>
        </div>
      </HubHeader>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-slate-400">
          Featured Experiences
        </h2>
        <div className="flex w-full gap-4 overflow-x-auto pb-3">
          {games.map((game) => (
            <GameTile key={game.slug} game={game} />
          ))}
        </div>
      </section>
    </main>
  );
}