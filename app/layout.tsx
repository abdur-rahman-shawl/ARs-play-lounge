import type { Metadata } from 'next';
import './globals.css';
import { Lexend } from 'next/font/google';

const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend' });

export const metadata: Metadata = {
  title: 'Play Lounge',
  description: 'A couch-friendly party games hub built with Next.js.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${lexend.variable} font-sans bg-backdrop text-slate-100 antialiased`}
      >
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.35),_transparent_55%)]">
          {children}
        </div>
      </body>
    </html>
  );
}
