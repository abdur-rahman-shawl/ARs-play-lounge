# Play Lounge

Play Lounge is a couch-friendly party hub built with **Next.js 14** and **Tailwind CSS**, inspired by the PlayStation Home launcher. It runs on a single shared device (one PC for the room) and lets players jump between mini-games without juggling phones.

## Getting Started

```bash
cd play-lounge
npm install
npm run dev
```

The dev server runs at http://localhost:3000. Hot reloading is enabled by default.

> Trivia Night pulls questions from the public [Open Trivia DB](https://opentdb.com/). No API key is required, but the device needs outbound internet access.

## Current Games

- **Truth or Dare** – Neon spinner, shared player roster, curated prompts.
- **Trivia Night** – Live question decks from Open Trivia DB with rotating scoreboard.
- **Coming soon** stubs are in the games registry: Drawing Telephone, Wavelength Lite, and more.

## Project Structure

- `app/` – App Router pages (hub, game routes, layout).
- `components/` – UI primitives and game-specific components.
- `hooks/` – Shared React hooks (e.g., player roster stored in localStorage).
- `data/` – Prompt banks and game data.
- `lib/` – Game registry and utilities.
- `docs/` – `play-lounge-dev-log.txt` (running log) and architecture plan.

## Development Logs

All decisions, ideas, and changes are tracked in `docs/play-lounge-dev-log.txt`. Update it as you add features.

## Roadmap Ideas

- Add confetti/audio polish to Truth or Dare.
- Expand Trivia Night with category picker history and streak badges.
- Build additional games (Drawing Telephone, Rapid Dare Wheel, etc.).
- Implement a persistent top navigation and lounge stats.
- Package as an offline-friendly PWA for easier distribution.

## Scripts

- `npm run dev` – Start Next.js in development.
- `npm run build` – Production build.
- `npm run start` – Start the built app.
- `npm run lint` – Lint via ESLint/Next.

Happy building and have an awesome sleepover!