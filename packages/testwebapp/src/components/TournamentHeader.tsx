import type { Tournament } from "../hooks/useTournament";
import "./TournamentHeader.css";

interface TournamentHeaderProps {
    tournament: Tournament;
    onStatusChange: (status: Tournament["status"]) => void;
    onAddDraw: () => void;
    onAddPlayer: () => void;
    onImport: () => void;
    onExport: () => void;
}

export function TournamentHeader({
    tournament,
    onStatusChange,
    onAddDraw,
    onAddPlayer,
    onImport,
    onExport,
}: TournamentHeaderProps) {
    return (
        <header className="tournament-header">
            <div className="header-left">
                <h1 className="tournament-name">{tournament.name}</h1>
                <select
                    className="status-select"
                    value={tournament.status}
                    onChange={(e) =>
                        onStatusChange(e.target.value as Tournament["status"])
                    }
                >
                    <option value="scheduled">Scheduled</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                </select>
                <span className={`status-badge status-${tournament.status}`}>
                    {tournament.status}
                </span>
            </div>
            <div className="header-right">
                <button className="header-btn" onClick={onAddPlayer}>
                    + Player
                </button>
                <button className="header-btn" onClick={onAddDraw}>
                    + Draw
                </button>
                <button className="header-btn secondary" onClick={onImport}>
                    Import JSON
                </button>
                <button className="header-btn secondary" onClick={onExport}>
                    Export JSON
                </button>
            </div>
        </header>
    );
}
