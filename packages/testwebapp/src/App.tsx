import { useRef, useState } from "react";
import "./App.css";
import { useTournament } from "./hooks/useTournament";
import type { Game, Tournament } from "./hooks/useTournament";
import { CreateTournamentForm } from "./components/CreateTournamentForm";
import { TournamentHeader } from "./components/TournamentHeader";
import { TournamentTree } from "./components/TournamentTree";
import { Leaderboard } from "./components/Leaderboard";
import { AddDrawModal } from "./components/modals/AddDrawModal";
import { AddMatchModal } from "./components/modals/AddMatchModal";
import { AddPlayerModal } from "./components/modals/AddPlayerModal";
import { AddScoreModal } from "./components/modals/AddScoreModal";

type ModalState =
  | { type: "none" }
  | { type: "addDraw" }
  | { type: "addMatch"; drawId: string }
  | { type: "addPlayerRoster" }
  | { type: "assignPlayer"; gameId: string; drawIndex: number; assignedIds: string[]; assignedRefs: string[] }
  | { type: "addScore"; game: Game };

function App() {
  const {
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
  } = useTournament();

  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const importRef = useRef<HTMLInputElement>(null);

  const closeModal = () => setModal({ type: "none" });

  // ── Import from JSON file ─────────────────────────────────────
  const handleImportClick = () => importRef.current?.click();

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string) as Tournament;
        importJSON(parsed);
      } catch {
        alert("Invalid JSON — could not parse tournament.");
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = "";
  };

  // ── No tournament yet ─────────────────────────────────────────
  if (!tournament) {
    return (
      <CreateTournamentForm
        onCreate={create}
        onImport={importJSON}
      />
    );
  }

  const roster = tournament.leaderboard;

  return (
    <div className="app-layout">
      {/* Header */}
      <TournamentHeader
        tournament={tournament}
        onStatusChange={updateStatus}
        onAddDraw={() => setModal({ type: "addDraw" })}
        onAddPlayer={() => setModal({ type: "addPlayerRoster" })}
        onImport={handleImportClick}
        onExport={exportJSON}
      />

      {/* Main area: tree + sidebar */}
      <div className="app-main">
        <TournamentTree
          tournament={tournament}
          onAddMatch={(drawId) => setModal({ type: "addMatch", drawId })}
          onRemoveDraw={removeDraw}
          onAddPlayer={(gameId) => {
            const assignedIds: string[] = [];
            const assignedRefs: string[] = [];
            let drawIndex = 0;
            for (let di = 0; di < tournament.draws.length; di++) {
              for (const m of tournament.draws[di].matches) {
                if (m.game.id === gameId) {
                  drawIndex = di;
                  for (const p of m.game.players) {
                    if (p.kind === "user") assignedIds.push(p.id);
                    if (p.kind === "id") assignedRefs.push(p.value);
                  }
                }
              }
            }
            setModal({ type: "assignPlayer", gameId, drawIndex, assignedIds, assignedRefs });
          }}
          onAddScore={(game) => setModal({ type: "addScore", game })}
          onSettleGame={settleGame}
          onRemoveMatch={removeMatch}
        />
        <Leaderboard
          players={roster}
          onAddPlayer={() => setModal({ type: "addPlayerRoster" })}
          onRemovePlayer={removePlayerFromRoster}
        />
      </div>

      {/* Modals */}
      {modal.type === "addDraw" && (
        <AddDrawModal
          onClose={closeModal}
          onAdd={addDraw}
          currentRoundCount={tournament.draws.length}
        />
      )}

      {modal.type === "addMatch" && (
        <AddMatchModal
          drawId={modal.drawId}
          onClose={closeModal}
          onAdd={addMatch}
        />
      )}

      {modal.type === "addPlayerRoster" && (
        <AddPlayerModal
          mode="roster"
          onClose={closeModal}
          onAdd={addPlayerToRoster}
        />
      )}

      {modal.type === "assignPlayer" && (
        <AddPlayerModal
          mode="assign"
          gameId={modal.gameId}
          previousDraws={tournament.draws.slice(0, modal.drawIndex)}
          roster={roster}
          assignedPlayerIds={modal.assignedIds}
          assignedRefs={modal.assignedRefs}
          onClose={closeModal}
          onAssign={addPlayerToGame}
        />
      )}

      {modal.type === "addScore" && (
        <AddScoreModal
          game={modal.game}
          roster={roster}
          onClose={closeModal}
          onSave={addScore}
        />
      )}

      {/* Hidden import file input */}
      <input
        type="file"
        accept=".json,application/json"
        ref={importRef}
        style={{ display: "none" }}
        onChange={handleImportFile}
      />
    </div>
  );
}

export default App;

