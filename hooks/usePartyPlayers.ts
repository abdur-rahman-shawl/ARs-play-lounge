"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "play-lounge:players";

export type PartyPlayer = {
  id: string;
  name: string;
};

const makeId = () => crypto.randomUUID();

export function usePartyPlayers() {
  const [players, setPlayers] = useState<PartyPlayer[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PartyPlayer[];
        setPlayers(parsed);
      }
    } catch (error) {
      console.warn("Failed to restore players", error);
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
        const trimmed = name.trim();
        if (!trimmed) return;
        setPlayers((prev) => [...prev, { id: makeId(), name: trimmed }]);
      },
      removePlayer(id: string) {
        setPlayers((prev) => prev.filter((player) => player.id !== id));
      },
      renamePlayer(id: string, name: string) {
        const trimmed = name.trim();
        if (!trimmed) return;
        setPlayers((prev) =>
          prev.map((player) => (player.id === id ? { ...player, name: trimmed } : player)),
        );
      },
      movePlayer(id: string, direction: "up" | "down") {
        setPlayers((prev) => {
          const index = prev.findIndex((player) => player.id === id);
          if (index === -1) return prev;

          const targetIndex = direction === "up" ? index - 1 : index + 1;
          if (targetIndex < 0 || targetIndex >= prev.length) {
            return prev;
          }

          const next = [...prev];
          const [moved] = next.splice(index, 1);
          next.splice(targetIndex, 0, moved);
          return next;
        });
      },
      resetPlayers() {
        setPlayers([]);
      },
    }),
    [],
  );

  return { players, ...actions };
}