import { useState } from "react";
import type {
  Draws,
  Player,
  PlayerId,
  PlayerUser,
} from "../../hooks/useTournament";
import { Modal } from "./Modal";
import "./AddPlayerModal.css";

// ── Types ─────────────────────────────────────────────────────
type AddPlayerModalProps =
  | {
      mode: "roster";
      onClose: () => void;
      onAdd: (player: PlayerUser) => void;
    }
  | {
      mode: "assign";
      gameId: string;
      /** All draws that come before the current draw. Empty = first draw. */
      previousDraws: Draws[];
      roster: Player[];
      /** Already-assigned real user IDs in this game */
      assignedPlayerIds: string[];
      /** Already-assigned reference values, e.g. ["1-t1m1", "seat-1-t1m2"] */
      assignedRefs: string[];
      onClose: () => void;
      onAssign: (gameId: string, player: Player) => void;
    };

// ── Helpers ───────────────────────────────────────────────────
function genId() {
  return "player_" + Math.random().toString(36).substring(2, 10);
}

function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

// ── Component ─────────────────────────────────────────────────
export function AddPlayerModal(props: AddPlayerModalProps) {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [tab, setTab] = useState<"roster" | "reference" | "seat">("roster");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [selectedPosition, setSelectedPosition] = useState(1);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState(1);

  // ── Roster creation mode ────────────────────────────────────
  if (props.mode === "roster") {
    const handleSubmit = () => {
      if (!name.trim()) return;
      const player: PlayerUser = {
        kind: "user",
        id: genId(),
        name: name.trim(),
        associatedImage: image.trim() || undefined,
      };
      props.onAdd(player);
      props.onClose();
    };

    return (
      <Modal title="Add Player to Roster" onClose={props.onClose}>
        <div className="form-group">
          <label>Player Name</label>
          <input
            type="text"
            placeholder="e.g. Alice"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label>Avatar URL (optional)</label>
          <input
            type="url"
            placeholder="https://..."
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={props.onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            Add Player
          </button>
        </div>
      </Modal>
    );
  }

  // ── Assign mode ──────────────────────────────────────────────
  const {
    gameId,
    previousDraws,
    roster,
    assignedPlayerIds,
    assignedRefs,
    onAssign,
    onClose,
  } = props;

  const isFirstDraw = previousDraws.length === 0;
  const userPlayers = roster.filter((p): p is PlayerUser => p.kind === "user");

  // Flatten all matches from previous draws for the reference picker
  const previousMatches = previousDraws.flatMap((draw) =>
    draw.matches.map((m) => ({
      drawRound: draw.round,
      matchId: m.game.id ?? "",
      expectedPlayers: m.game.expectedNumberOfPlayers,
    })),
  );

  const selectedMatchMeta = previousMatches.find(
    (m) => m.matchId === selectedMatchId,
  );
  const maxPositions = selectedMatchMeta?.expectedPlayers ?? 1;

  const handleAssignRoster = (player: PlayerUser) => {
    onAssign(gameId, player);
    onClose();
  };

  const handleAssignReference = () => {
    if (!selectedMatchId) return;
    const refValue = `${selectedPosition}-${selectedMatchId}`;
    if (assignedRefs.includes(refValue)) return;
    const ref: PlayerId = { kind: "id", value: refValue, error: undefined };
    onAssign(gameId, ref);
    onClose();
  };

  const handleAssignSeatReference = () => {
    if (!selectedMatchId) return;
    const refValue = `seat-${selectedSeatIndex}-${selectedMatchId}`;
    if (assignedRefs.includes(refValue)) return;
    const ref: PlayerId = { kind: "id", value: refValue, error: undefined };
    onAssign(gameId, ref);
    onClose();
  };

  // First draw can only assign real players — no previous match references exist
  const activeTab = isFirstDraw ? "roster" : tab;

  return (
    <Modal title="Assign Player to Match" onClose={onClose}>
      {/* Tab switcher — only shown when a previous draw exists */}
      {!isFirstDraw && (
        <div className="apm-tabs">
          <button
            className={`apm-tab${activeTab === "roster" ? " active" : ""}`}
            onClick={() => setTab("roster")}
          >
            From Roster
          </button>
          <button
            className={`apm-tab${activeTab === "reference" ? " active" : ""}`}
            onClick={() => setTab("reference")}
          >
            From Match Result
          </button>
          <button
            className={`apm-tab${activeTab === "seat" ? " active" : ""}`}
            onClick={() => setTab("seat")}
          >
            From Seat
          </button>
        </div>
      )}

      {/* ── Tab: Real player from global roster ── */}
      {activeTab === "roster" && (
        <>
          {userPlayers.length === 0 ? (
            <p className="empty-roster">
              No players in roster yet. Add players via the header first.
            </p>
          ) : (
            <div className="player-list">
              {userPlayers.map((p) => {
                const isAssigned = assignedPlayerIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={`player-list-item${isAssigned ? " assigned" : ""}`}
                    onClick={() => !isAssigned && handleAssignRoster(p)}
                  >
                    {p.associatedImage ? (
                      <img
                        src={p.associatedImage}
                        alt={p.name}
                        className="player-avatar"
                      />
                    ) : (
                      <div className="player-avatar-placeholder">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{p.name}</span>
                    {isAssigned && (
                      <span className="apm-tag">already assigned</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Position reference from a previous match ── */}
      {activeTab === "reference" && (
        <>
          <p className="apm-ref-hint">
            This slot is a placeholder. When the tournament is progressed, it
            will be replaced by the player who finished at the chosen position
            in the selected match. Format:{" "}
            <code>&lt;position&gt;-&lt;matchId&gt;</code>
          </p>
          {previousMatches.length === 0 ? (
            <p className="empty-roster">No matches in previous draws yet.</p>
          ) : (
            <>
              <div className="form-group">
                <label>Source Match</label>
                <select
                  value={selectedMatchId}
                  onChange={(e) => {
                    setSelectedMatchId(e.target.value);
                    setSelectedPosition(1);
                  }}
                >
                  <option value="">— select a match —</option>
                  {previousMatches.map((m) => (
                    <option key={m.matchId} value={m.matchId}>
                      Round {m.drawRound} — {m.matchId}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMatchId && (
                <div className="form-group">
                  <label>Finishing Position</label>
                  <select
                    value={selectedPosition}
                    onChange={(e) =>
                      setSelectedPosition(parseInt(e.target.value))
                    }
                  >
                    {Array.from({ length: maxPositions }, (_, i) => i + 1).map(
                      (pos) => {
                        const refVal = `${pos}-${selectedMatchId}`;
                        const used = assignedRefs.includes(refVal);
                        return (
                          <option key={pos} value={pos} disabled={used}>
                            {ordinal(pos)} place{pos === 1 ? " (Winner)" : ""}
                            {used ? " — already assigned" : ""}
                          </option>
                        );
                      },
                    )}
                  </select>
                </div>
              )}

              {selectedMatchId && (
                <div className="apm-ref-preview">
                  <span className="apm-ref-label">Saves as:</span>
                  <code className="apm-ref-code">
                    {selectedPosition}-{selectedMatchId}
                  </code>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Tab: Seat reference from a previous match ── */}
      {activeTab === "seat" && (
        <>
          <p className="apm-ref-hint">
            This slot is a placeholder. When the tournament is progressed, it
            will be replaced by the player who occupies the chosen seat in the
            selected match — regardless of who wins or loses. Format:{" "}
            <code>seat-&lt;seatIndex&gt;-&lt;matchId&gt;</code>
          </p>
          {previousMatches.length === 0 ? (
            <p className="empty-roster">No matches in previous draws yet.</p>
          ) : (
            <>
              <div className="form-group">
                <label>Source Match</label>
                <select
                  value={selectedMatchId}
                  onChange={(e) => {
                    setSelectedMatchId(e.target.value);
                    setSelectedSeatIndex(1);
                  }}
                >
                  <option value="">— select a match —</option>
                  {previousMatches.map((m) => (
                    <option key={m.matchId} value={m.matchId}>
                      Round {m.drawRound} — {m.matchId}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMatchId && (
                <div className="form-group">
                  <label>Seat Number</label>
                  <select
                    value={selectedSeatIndex}
                    onChange={(e) =>
                      setSelectedSeatIndex(parseInt(e.target.value))
                    }
                  >
                    {Array.from({ length: maxPositions }, (_, i) => i + 1).map(
                      (seat) => {
                        const refVal = `seat-${seat}-${selectedMatchId}`;
                        const used = assignedRefs.includes(refVal);
                        return (
                          <option key={seat} value={seat} disabled={used}>
                            Seat {seat}
                            {seat === 1 ? " (Player 1)" : ""}
                            {used ? " — already assigned" : ""}
                          </option>
                        );
                      },
                    )}
                  </select>
                </div>
              )}

              {selectedMatchId && (
                <div className="apm-ref-preview">
                  <span className="apm-ref-label">Saves as:</span>
                  <code className="apm-ref-code">
                    seat-{selectedSeatIndex}-{selectedMatchId}
                  </code>
                </div>
              )}
            </>
          )}
        </>
      )}

      <div className="modal-actions">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        {activeTab === "reference" && (
          <button
            className="btn-primary"
            onClick={handleAssignReference}
            disabled={
              !selectedMatchId ||
              assignedRefs.includes(`${selectedPosition}-${selectedMatchId}`)
            }
          >
            Assign Reference
          </button>
        )}
        {activeTab === "seat" && (
          <button
            className="btn-primary"
            onClick={handleAssignSeatReference}
            disabled={
              !selectedMatchId ||
              assignedRefs.includes(
                `seat-${selectedSeatIndex}-${selectedMatchId}`,
              )
            }
          >
            Assign Seat Reference
          </button>
        )}
      </div>
    </Modal>
  );
}
