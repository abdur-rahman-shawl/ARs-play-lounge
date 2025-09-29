'use client';

import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'play-lounge:players';

type Player = {
  id: string;
  name: string;
};

const makeId = () => crypto.randomUUID();

export function usePartyPlayers() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Player[];
        setPlayers(parsed);
      }
    } catch (error) {
      console.warn('Failed to restore players', error);
    }
  }, []);

  useEffect(() => {
    if (!players.length) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  }, [players]);

  const actions = useMemo(
    () => ({
      addPlayer(name: string) {
        if (!name.trim()) return;
        setPlayers((prev) => [...prev, { id: makeId(), name: name.trim() }]);
      },
      removePlayer(id: string) {
        setPlayers((prev) => prev.filter((player) => player.id !== id));
      },
      renamePlayer(id: string, name: string) {
        setPlayers((prev) =>
          prev.map((player) =>
            player.id === id ? { ...player, name: name.trim() } : player,
          ),
        );
      },
      resetPlayers() {
        setPlayers([]);
      },
    }),
    [],
  );

  return { players, ...actions };
}
