import type { Player } from "../hooks/useTournament";
import "./Leaderboard.css";

interface LeaderboardProps {
    players: Player[];
    onAddPlayer: () => void;
    onRemovePlayer: (playerId: string) => void;
}

export function Leaderboard({
    players,
    onAddPlayer,
    onRemovePlayer,
}: LeaderboardProps) {
    const userPlayers = players.filter((p) => p.kind === "user");

    return (
        <aside className="leaderboard-panel">
            <div className="leaderboard-header">
                <h2 className="leaderboard-title">Players</h2>
                <span className="leaderboard-count">{userPlayers.length}</span>
            </div>

            <div className="leaderboard-list">
                {userPlayers.length === 0 ? (
                    <p className="leaderboard-empty">
                        No players yet. Add players using the button below.
                    </p>
                ) : (
                    userPlayers.map((p, idx) => {
                        if (p.kind !== "user") return null;
                        return (
                            <div key={p.id} className="leaderboard-row">
                                <span className="lb-rank">#{idx + 1}</span>
                                <div className="lb-avatar">
                                    {p.associatedImage ? (
                                        <img src={p.associatedImage} alt={p.name} />
                                    ) : (
                                        p.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <span className="lb-name">{p.name}</span>
                                <button
                                    className="lb-remove-btn"
                                    title="Remove player"
                                    onClick={() => onRemovePlayer(p.id)}
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            <button className="lb-add-btn" onClick={onAddPlayer}>
                + Add Player
            </button>
        </aside>
    );
}
