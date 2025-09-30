import Link from "next/link";
import { games } from "@/lib/games";
import { HubHeader } from "@/components/ui/hub-header";
import { GameTile } from "@/components/ui/game-tile";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-6 py-12 md:px-10 md:py-16">
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

      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-slate-400">
            Featured Experiences
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {games.map((game) => (
            <GameTile key={game.slug} game={game} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-slate-400">
          Meet the Developer
        </h2>
        <div className="glass-panel flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-100 shadow-glow md:flex-row md:items-center md:justify-between">
          <div className="flex-1 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Crew captain</p>
            <h3 className="text-2xl font-semibold text-white md:text-3xl">
              Abdur Rahman • 23 • Bangalore
            </h3>
            <p className="text-sm text-slate-300 md:text-base">
              Code tinkerer, neon enthusiast, and unofficial snack curator for your sleepover. When he isn&apos;t wiring party games, he&apos;s probably debating chai ratios or tweaking gradients at 3&nbsp;AM.
            </p>
            <ul className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
              <li className="flex items-center gap-2">
                <span className="text-accent-neon">•</span>
                Ships experiences that survive remote power cuts and loud laughter.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-neon">•</span>
                Plays hype DJ, bug squasher, and rule negotiator for every round.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-neon">•</span>
                Collects trivia facts so you don&apos;t have to Google mid-game.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent-neon">•</span>
                Motto: “If it glows and runs offline, the night is saved.”
              </li>
            </ul>
          </div>
          <div className="mt-6 flex w-full max-w-xs flex-col gap-3 md:mt-0">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Say hi</span>
            <p className="text-sm text-slate-300">
              Fancy a feature idea or just want to swap story prompts? Drop a note and let&apos;s plan the next chaos module.
            </p>
            <a
              href="mailto:hi@abdur.codes"
              className="inline-flex items-center justify-center rounded-2xl border border-accent-neon/60 bg-accent-neon/10 px-4 py-2 text-sm font-semibold text-accent-neon transition hover:bg-accent-neon/20"
            >
              Ping Abdur
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
