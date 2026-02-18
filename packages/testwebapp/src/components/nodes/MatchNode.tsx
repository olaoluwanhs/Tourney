import { Handle, Position } from "@xyflow/react";
import type { Game, GameScore } from "../../hooks/useTournament";
import "./nodes.css";

function ordinalShort(n: number): string {
    if (n === 1) return "1st";
    if (n === 2) return "2nd";
    if (n === 3) return "3rd";
    return `${n}th`;
}

export interface MatchNodeData {
    drawId: string;
    game: Game;
    onAddPlayer: (gameId: string) => void;
    onAddScore: (game: Game) => void;
    onSettleGame: (gameId: string) => void;
    onRemoveMatch: (drawId: string, matchId: string) => void;
}

interface MatchNodeProps {
    data: MatchNodeData;
}

function topScore(scores: GameScore[]): GameScore | undefined {
    return scores.reduce<GameScore | undefined>(
        (max, s) => (!max || s.score > max.score ? s : max),
        undefined,
    );
}

export function MatchNode({ data }: MatchNodeProps) {
    const { drawId, game, onAddPlayer, onAddScore, onSettleGame, onRemoveMatch } =
        data;

    const gameId = game.id ?? "unknown";
    const isFull = game.players.length >= game.expectedNumberOfPlayers;
    const winner = game.settled ? topScore(game.scores) : undefined;

    return (
        <div className={`match-node${game.settled ? " settled" : ""}`}>
            <Handle type="target" position={Position.Top} id="from-draw" />

            <div className="match-node-header">
                <span className="match-label">Match</span>
                {game.settled && <span className="settled-badge">Settled</span>}
                <button
                    className="node-icon-btn danger"
                    title="Remove match"
                    onClick={() => onRemoveMatch(drawId, gameId)}
                >
                    ✕
                </button>
            </div>

            {/* Players */}
            <div className="match-players">
                {game.players.length === 0 ? (
                    <span className="match-empty">No players</span>
                ) : (
                    game.players.map((p, i) => {
                        if (p.kind === "user") {
                            const scoreEntry = game.scores.find((s) => s.playerId === p.id);
                            const isWinner = winner?.playerId === p.id;
                            return (
                                <div
                                    key={p.id}
                                    className={`player-row${isWinner ? " winner" : ""}`}
                                >
                                    <div className="player-avatar-sm">
                                        {p.associatedImage ? (
                                            <img src={p.associatedImage} alt={p.name} />
                                        ) : (
                                            p.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <span className="player-row-name">{p.name}</span>
                                    {scoreEntry !== undefined ? (
                                        <span className="player-score">{scoreEntry.score}</span>
                                    ) : (
                                        <span className="player-score no-score">—</span>
                                    )}
                                    {isWinner && <span className="winner-crown">👑</span>}
                                </div>
                            );
                        }
                        if (p.kind === "id") {
                            // Parse "<position>-<matchId>" — matchId may itself contain dashes
                            const dashIdx = p.value.indexOf("-");
                            const pos = dashIdx > -1 ? parseInt(p.value.slice(0, dashIdx)) : NaN;
                            const matchId = dashIdx > -1 ? p.value.slice(dashIdx + 1) : p.value;
                            const hasError = !!p.error;
                            return (
                                <div
                                    key={i}
                                    className={`player-row ref-row${hasError ? " ref-error" : ""}`}
                                    title={hasError ? p.error : p.value}
                                >
                                    <div className="player-avatar-sm ref-avatar">
                                        {isNaN(pos) ? "?" : `#${pos}`}
                                    </div>
                                    <span className="player-row-name ref-name">
                                        {hasError
                                            ? `Error: ${p.error}`
                                            : `${ordinalShort(pos)} of ${matchId}`}
                                    </span>
                                    {!hasError && (
                                        <span className="ref-pending-badge">pending</span>
                                    )}
                                </div>
                            );
                        }
                        return null;
                    })
                )}
            </div>

            {/* Capacity */}
            <div className="match-capacity">
                {game.players.length} / {game.expectedNumberOfPlayers} players
            </div>

            {/* Actions */}
            <div className="match-actions">
                {!isFull && (
                    <button
                        className="node-action-btn"
                        onClick={() => onAddPlayer(gameId)}
                        title="Assign player"
                    >
                        + Player
                    </button>
                )}
                <button
                    className="node-action-btn"
                    onClick={() => onAddScore(game)}
                    title="Enter scores"
                >
                    Scores
                </button>
                {!game.settled && (
                    <button
                        className="node-action-btn settle"
                        onClick={() => onSettleGame(gameId)}
                        title="Mark as settled"
                    >
                        Settle
                    </button>
                )}
            </div>
        </div>
    );
}
