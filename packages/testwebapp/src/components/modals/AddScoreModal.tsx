import { useState } from "react";
import type { Game, Player } from "../../hooks/useTournament";
import { Modal } from "./Modal";

interface AddScoreModalProps {
    game: Game;
    roster: Player[];
    onClose: () => void;
    onSave: (gameId: string, playerId: string, score: number) => void;
}

function getPlayerName(roster: Player[], playerId: string): string {
    const p = roster.find((r) => r.kind === "user" && r.id === playerId);
    return p && p.kind === "user" ? p.name : playerId;
}

export function AddScoreModal({
    game,
    roster,
    onClose,
    onSave,
}: AddScoreModalProps) {
    const userPlayers = game.players.filter((p) => p.kind === "user");

    const [scores, setScores] = useState<Record<string, string>>(() => {
        const init: Record<string, string> = {};
        for (const p of userPlayers) {
            if (p.kind === "user") {
                const existing = game.scores.find((s) => s.playerId === p.id);
                init[p.id] = existing ? String(existing.score) : "";
            }
        }
        return init;
    });

    const handleSave = () => {
        for (const [playerId, rawScore] of Object.entries(scores)) {
            const parsed = parseFloat(rawScore);
            if (!isNaN(parsed)) {
                onSave(game.id ?? "", playerId, parsed);
            }
        }
        onClose();
    };

    return (
        <Modal title="Enter Scores" onClose={onClose}>
            {userPlayers.length === 0 ? (
                <p className="empty-roster">No players in this match yet.</p>
            ) : (
                <>
                    {userPlayers.map((p) => {
                        if (p.kind !== "user") return null;
                        return (
                            <div className="score-row" key={p.id}>
                                <span className="player-name">
                                    {getPlayerName(roster, p.id)}
                                </span>
                                <input
                                    type="number"
                                    placeholder="Score"
                                    value={scores[p.id] ?? ""}
                                    onChange={(e) =>
                                        setScores((prev) => ({ ...prev, [p.id]: e.target.value }))
                                    }
                                />
                            </div>
                        );
                    })}
                </>
            )}
            <div className="modal-actions">
                <button className="btn-secondary" onClick={onClose}>
                    Cancel
                </button>
                <button className="btn-primary" onClick={handleSave}>
                    Save Scores
                </button>
            </div>
        </Modal>
    );
}
