import { useRef, useState } from "react";
import type { Tournament } from "../hooks/useTournament";
import "./CreateTournamentForm.css";

interface CreateTournamentFormProps {
    onCreate: (name: string, status: Tournament["status"]) => void;
    onImport: (payload: Tournament) => void;
}

export function CreateTournamentForm({
    onCreate,
    onImport,
}: CreateTournamentFormProps) {
    const [name, setName] = useState("");
    const [status, setStatus] = useState<Tournament["status"]>("scheduled");
    const fileRef = useRef<HTMLInputElement>(null);

    const handleCreate = () => {
        if (!name.trim()) return;
        onCreate(name.trim(), status);
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const parsed = JSON.parse(evt.target?.result as string) as Tournament;
                onImport(parsed);
            } catch {
                alert("Invalid JSON file — could not parse tournament.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="create-form-screen">
            <div className="create-form-card">
                <div className="create-form-icon">🏆</div>
                <h1 className="create-form-title">Tournament Manager</h1>
                <p className="create-form-subtitle">
                    Create a new tournament or import an existing one.
                </p>

                <div className="create-divider-label">New Tournament</div>

                <div className="create-field">
                    <label htmlFor="tname">Tournament Name</label>
                    <input
                        id="tname"
                        type="text"
                        placeholder="e.g. Spring Championship 2026"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        autoFocus
                    />
                </div>

                <div className="create-field">
                    <label htmlFor="tstatus">Initial Status</label>
                    <select
                        id="tstatus"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as Tournament["status"])}
                    >
                        <option value="scheduled">Scheduled</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                <button
                    className="create-btn-primary"
                    onClick={handleCreate}
                    disabled={!name.trim()}
                >
                    Create Tournament
                </button>

                <div className="create-divider">
                    <span>or</span>
                </div>

                <button
                    className="create-btn-import"
                    onClick={() => fileRef.current?.click()}
                >
                    Import from JSON
                </button>
                <input
                    type="file"
                    accept=".json,application/json"
                    ref={fileRef}
                    style={{ display: "none" }}
                    onChange={handleImportFile}
                />
            </div>
        </div>
    );
}
