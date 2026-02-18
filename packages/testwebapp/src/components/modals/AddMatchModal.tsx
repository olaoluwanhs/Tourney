import { useState } from "react";
import { Modal } from "./Modal";

interface AddMatchModalProps {
    drawId: string;
    onClose: () => void;
    onAdd: (drawId: string, expectedNumberOfPlayers: number) => void;
}

export function AddMatchModal({ drawId, onClose, onAdd }: AddMatchModalProps) {
    const [playerCount, setPlayerCount] = useState(2);

    const handleSubmit = () => {
        onAdd(drawId, playerCount);
        onClose();
    };

    return (
        <Modal title="Add Match to Draw" onClose={onClose}>
            <div className="form-group">
                <label>Expected Number of Players</label>
                <input
                    type="number"
                    min={2}
                    value={playerCount}
                    onChange={(e) =>
                        setPlayerCount(Math.max(2, parseInt(e.target.value) || 2))
                    }
                />
            </div>
            <div className="modal-actions">
                <button className="btn-secondary" onClick={onClose}>
                    Cancel
                </button>
                <button className="btn-primary" onClick={handleSubmit}>
                    Add Match
                </button>
            </div>
        </Modal>
    );
}
