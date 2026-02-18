import { Handle, Position } from "@xyflow/react";
import "./nodes.css";

export interface DrawNodeData {
    drawId: string;
    round: number;
    expectedNumberOfMatches: number;
    matchCount: number;
    onAddMatch: (drawId: string) => void;
    onRemoveDraw: (drawId: string) => void;
}

interface DrawNodeProps {
    data: DrawNodeData;
}

export function DrawNode({ data }: DrawNodeProps) {
    const { drawId, round, expectedNumberOfMatches, matchCount, onAddMatch, onRemoveDraw } =
        data;

    const isFull = matchCount >= expectedNumberOfMatches;

    return (
        <div className="draw-node">
            {/* Receives from previous draw's progression arrow */}
            <Handle type="target" position={Position.Left} id="from-prev" />
            {/* Emits to its own match nodes below */}
            <Handle type="source" position={Position.Bottom} id="to-matches" />
            {/* Emits to the next draw's left target */}
            <Handle type="source" position={Position.Right} id="to-next" />

            <div className="draw-node-header">
                <span className="draw-round-label">Round {round}</span>
                <button
                    className="node-icon-btn danger"
                    title="Remove draw"
                    onClick={() => onRemoveDraw(drawId)}
                >
                    ✕
                </button>
            </div>
            <div className="draw-node-meta">
                <span className={`draw-count ${isFull ? "full" : ""}`}>
                    {matchCount} / {expectedNumberOfMatches} matches
                </span>
            </div>
            <button
                className="node-add-btn"
                onClick={() => onAddMatch(drawId)}
                disabled={isFull}
                title={isFull ? "Draw is full" : "Add a match to this draw"}
            >
                + Add Match
            </button>
        </div>
    );
}
