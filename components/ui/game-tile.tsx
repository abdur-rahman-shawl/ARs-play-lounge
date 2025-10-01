import Link from "next/link";
import clsx from "clsx";
import type { GameMeta } from "@/lib/games";

export function GameTile({ game }: { game: GameMeta }) {
  const href = game.status === "available" ? (`/games/${game.slug}` as const) : undefined;
  const isDisabled = game.status !== "available";

  return (
    <Link
      href={href ?? "#"}
      aria-disabled={isDisabled}
      className={clsx(
        "group relative flex h-48 w-full flex-col justify-between overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-6 text-left transition hover:border-white/40 hover:bg-white/10",
        isDisabled && "pointer-events-none opacity-70",
      )}
    >
      <div
        className="absolute inset-0 opacity-0 transition group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at top left, ${game.accent}, transparent)` }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.35em] text-slate-300">
          {game.status === "available" ? "Ready" : "In Dev"}
        </span>
        <h2 className="text-2xl font-semibold text-white">{game.title}</h2>
        <p className="text-sm text-slate-300">{game.tagline}</p>
      </div>
      <div className="relative text-sm font-medium text-accent-neon">
        {isDisabled ? (
          "Coming Soon"
        ) : (
          <span className="inline-flex items-center gap-1">
            Jump In
            <span aria-hidden="true">›</span>
          </span>
        )}
      </div>
    </Link>
  );
}
