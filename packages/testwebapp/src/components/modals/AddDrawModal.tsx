import { useState } from "react";
import { Modal } from "./Modal";

interface AddDrawModalProps {
    onClose: () => void;
    onAdd: (expectedNumberOfMatches: number, round?: number) => void;
    currentRoundCount: number;
}

export function AddDrawModal({
    onClose,
    onAdd,
    currentRoundCount,
}: AddDrawModalProps) {
    const [matchCount, setMatchCount] = useState(2);
    const [roundPos, setRoundPos] = useState<string>("");

    const handleSubmit = () => {
        const round = roundPos.trim() !== "" ? parseInt(roundPos) : undefined;
        onAdd(matchCount, round);
        onClose();
    };

    return (
        <Modal title="Add Draw (Round)" onClose={onClose}>
            <div className="form-group">
                <label>Expected Number of Matches</label>
                <input
                    type="number"
                    min={1}
                    value={matchCount}
                    onChange={(e) => setMatchCount(Math.max(1, parseInt(e.target.value) || 1))}
                />
            </div>
            <div className="form-group">
                <label>
                    Round Position (optional — defaults to Round {currentRoundCount + 1})
                </label>
                <input
                    type="number"
                    min={1}
                    placeholder={`${currentRoundCount + 1}`}
                    value={roundPos}
                    onChange={(e) => setRoundPos(e.target.value)}
                />
            </div>
            <div className="modal-actions">
                <button className="btn-secondary" onClick={onClose}>
                    Cancel
                </button>
                <button className="btn-primary" onClick={handleSubmit}>
                    Add Draw
                </button>
            </div>
        </Modal>
    );
}
