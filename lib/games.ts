export type GameMeta = {
  slug: string;
  title: string;
  tagline: string;
  status: "available" | "coming-soon";
  accent: string;
  heroImage?: string;
};

export const games: GameMeta[] = [
  {
    slug: 'truth-or-dare',
    title: 'Truth or Dare',
    tagline: 'Spin the neon wheel and test your courage.',
    status: 'available',
    accent: '#22d3ee',
  },
  {
    slug: 'trivia-night',
    title: 'Trivia Night',
    tagline: 'Pull live questions from Open Trivia DB.',
    status: 'available',
    accent: '#facc15',
  },
  {
    slug: 'drawing-telephone',
    title: 'Drawing Telephone',
    tagline: 'Sketch, guess, and reveal hilarious storyboards.',
    status: 'coming-soon',
    accent: '#8b5cf6',
  },
  {
    slug: 'wavelength-lite',
    title: 'Wavelength Lite',
    tagline: 'Sync minds and slide to the hidden target.',
    status: 'coming-soon',
    accent: '#f97316',
  },
];

export const getGameBySlug = (slug: string) =>
  games.find((game) => game.slug === slug);