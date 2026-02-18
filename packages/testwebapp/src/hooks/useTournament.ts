import { useCallback, useRef, useState } from "react";
import { TournamentWasm } from "../../../lib/wasmTournament";
import type {
  Draws,
  Game,
  GameScore,
  Player,
  PlayerId,
  PlayerUser,
  Tournament,
} from "../../../../types/generated_typescript/index";

export type {
  Draws,
  Game,
  GameScore,
  Player,
  PlayerId,
  PlayerUser,
  Tournament,
};

export interface UseTournamentReturn {
  tournament: Tournament | null;
  create: (name: string, status: Tournament["status"]) => void;
  importJSON: (payload: Tournament) => void;
  exportJSON: () => void;
  addDraw: (expectedNumberOfMatches: number, round?: number) => void;
  removeDraw: (drawId: string) => void;
  addMatch: (drawId: string, expectedNumberOfPlayers: number) => void;
  removeMatch: (drawId: string, matchId: string) => void;
  addPlayerToRoster: (player: PlayerUser) => void;
  removePlayerFromRoster: (playerId: string) => void;
  addPlayerToGame: (gameId: string, player: Player) => void;
  addScore: (gameId: string, playerId: string, score: number) => void;
  settleGame: (gameId: string) => void;
  updateStatus: (status: Tournament["status"]) => void;
}

export function useTournament(): UseTournamentReturn {
  const instanceRef = useRef<TournamentWasm | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);

  // Snapshot the tournament state after each mutation
  const sync = useCallback(() => {
    if (!instanceRef.current) return;
    setTournament({ ...instanceRef.current.tournamentObject });
  }, []);

  const create = useCallback(
    (name: string, status: Tournament["status"]) => {
      const inst = TournamentWasm.create(name, status);
      instanceRef.current = inst;
      sync();
    },
    [sync],
  );

  const importJSON = useCallback(
    (payload: Tournament) => {
      const inst = TournamentWasm.fromJSON(payload);
      instanceRef.current = inst;
      sync();
    },
    [sync],
  );

  const exportJSON = useCallback(() => {
    if (!instanceRef.current) return;
    const data = JSON.stringify(instanceRef.current.tournamentObject, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${instanceRef.current.name || "tournament"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const addDraw = useCallback(
    (expectedNumberOfMatches: number, round?: number) => {
      if (!instanceRef.current) return;
      instanceRef.current.addDraw(expectedNumberOfMatches, round);
      sync();
    },
    [sync],
  );

  const removeDraw = useCallback(
    (drawId: string) => {
      if (!instanceRef.current) return;
      instanceRef.current.removeDraw(drawId);
      sync();
    },
    [sync],
  );

  const addMatch = useCallback(
    (drawId: string, expectedNumberOfPlayers: number) => {
      if (!instanceRef.current) return;
      instanceRef.current.addMatchToDraw(drawId, expectedNumberOfPlayers);
      sync();
    },
    [sync],
  );

  const removeMatch = useCallback(
    (drawId: string, matchId: string) => {
      if (!instanceRef.current) return;
      instanceRef.current.removeMatchFromDraw(drawId, matchId);
      sync();
    },
    [sync],
  );

  const addPlayerToRoster = useCallback(
    (player: PlayerUser) => {
      if (!instanceRef.current) return;
      const current = instanceRef.current.leaderboard;
      instanceRef.current.updateLeaderboard([...current, player]);
      sync();
    },
    [sync],
  );

  const removePlayerFromRoster = useCallback(
    (playerId: string) => {
      if (!instanceRef.current) return;
      const current = instanceRef.current.leaderboard;
      instanceRef.current.updateLeaderboard(
        current.filter(
          (p: Player) => !(p.kind === "user" && p.id === playerId),
        ),
      );
      sync();
    },
    [sync],
  );

  const addPlayerToGame = useCallback(
    (gameId: string, player: Player) => {
      if (!instanceRef.current) return;
      instanceRef.current.addPlayerToGame(gameId, player);
      sync();
    },
    [sync],
  );

  const addScore = useCallback(
    (gameId: string, playerId: string, score: number) => {
      if (!instanceRef.current) return;
      instanceRef.current.addScoreToGame(gameId, playerId, score);
      sync();
    },
    [sync],
  );

  const settleGame = useCallback(
    (gameId: string) => {
      if (!instanceRef.current) return;
      instanceRef.current.settleGame(gameId);
      sync();
    },
    [sync],
  );

  const updateStatus = useCallback(
    (status: Tournament["status"]) => {
      if (!instanceRef.current) return;
      instanceRef.current.updateStatus(status);
      sync();
    },
    [sync],
  );

  return {
    tournament,
    create,
    importJSON,
    exportJSON,
    addDraw,
    removeDraw,
    addMatch,
    removeMatch,
    addPlayerToRoster,
    removePlayerFromRoster,
    addPlayerToGame,
    addScore,
    settleGame,
    updateStatus,
  };
}
