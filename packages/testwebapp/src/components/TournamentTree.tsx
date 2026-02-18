import { useMemo } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    type Node,
    type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Draws, Game, Tournament } from "../hooks/useTournament";
import { DrawNode, type DrawNodeData } from "./nodes/DrawNode";
import { MatchNode, type MatchNodeData } from "./nodes/MatchNode";
import "./TournamentTree.css";

// Layout constants
const COL_WIDTH = 320;      // horizontal space per round column
const DRAW_NODE_WIDTH = 185;
const MATCH_NODE_WIDTH = 215;
const DRAW_NODE_HEIGHT = 110;
const MATCH_NODE_HEIGHT = 195;
const MATCH_V_GAP = 24;      // gap between matches in a column
const DRAW_Y = 20;
const MATCH_TOP = DRAW_Y + DRAW_NODE_HEIGHT + 40;

const nodeTypes = {
    drawNode: DrawNode,
    matchNode: MatchNode,
};

interface TournamentTreeProps {
    tournament: Tournament;
    onAddMatch: (drawId: string) => void;
    onRemoveDraw: (drawId: string) => void;
    onAddPlayer: (gameId: string) => void;
    onAddScore: (game: Game) => void;
    onSettleGame: (gameId: string) => void;
    onRemoveMatch: (drawId: string, matchId: string) => void;
}

function buildNodesAndEdges(
    draws: Draws[],
    handlers: Omit<TournamentTreeProps, "tournament">,
): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    draws.forEach((draw, drawIndex) => {
        const colX = drawIndex * COL_WIDTH;
        const drawNodeId = `draw-${draw.id}`;
        const matchCount = draw.matches.length;

        // DrawNode — horizontally centered in the match column
        const drawX =
            colX + MATCH_NODE_WIDTH / 2 - DRAW_NODE_WIDTH / 2;

        const drawData: DrawNodeData = {
            drawId: draw.id,
            round: draw.round,
            expectedNumberOfMatches: draw.expectedNumberOfMatches,
            matchCount,
            onAddMatch: handlers.onAddMatch,
            onRemoveDraw: handlers.onRemoveDraw,
        };

        nodes.push({
            id: drawNodeId,
            type: "drawNode",
            position: { x: drawX, y: DRAW_Y },
            data: drawData as unknown as Record<string, unknown>,
        });

        // Round-progression edge: draw N source → draw N+1 target
        if (drawIndex < draws.length - 1) {
            const nextDraw = draws[drawIndex + 1];
            edges.push({
                id: `edge-roundprog-${drawIndex}`,
                source: drawNodeId,
                sourceHandle: "to-next",
                target: `draw-${nextDraw.id}`,
                targetHandle: "from-prev",
                type: "smoothstep",
                animated: true,
                style: { stroke: "#646cff", strokeDasharray: "6 3", strokeWidth: 1.5 },
                label: "→",
                labelStyle: { fill: "#646cff", fontSize: 11 },
            });
        }

        // MatchNodes for this draw
        draw.matches.forEach((match, matchIndex) => {
            const matchNodeId = `match-${match.game.id}`;
            const matchX = colX;
            const matchY =
                MATCH_TOP + matchIndex * (MATCH_NODE_HEIGHT + MATCH_V_GAP);

            const matchData: MatchNodeData = {
                drawId: draw.id,
                game: match.game,
                onAddPlayer: handlers.onAddPlayer,
                onAddScore: handlers.onAddScore,
                onSettleGame: handlers.onSettleGame,
                onRemoveMatch: handlers.onRemoveMatch,
            };

            nodes.push({
                id: matchNodeId,
                type: "matchNode",
                position: { x: matchX, y: matchY },
                data: matchData as unknown as Record<string, unknown>,
            });

            // Edge: draw → match (vertical connector within the column)
            edges.push({
                id: `edge-${drawNodeId}-to-${matchNodeId}`,
                source: drawNodeId,
                sourceHandle: "to-matches",
                target: matchNodeId,
                targetHandle: "from-draw",
                type: "smoothstep",
                style: { stroke: "#4a4a78", strokeWidth: 1.5 },
            });
        });

    });

    return { nodes, edges };
}

export function TournamentTree({
    tournament,
    onAddMatch,
    onRemoveDraw,
    onAddPlayer,
    onAddScore,
    onSettleGame,
    onRemoveMatch,
}: TournamentTreeProps) {
    const { nodes, edges } = useMemo(() => {
        return buildNodesAndEdges(tournament.draws, {
            onAddMatch,
            onRemoveDraw,
            onAddPlayer,
            onAddScore,
            onSettleGame,
            onRemoveMatch,
        });
    }, [
        tournament,
        onAddMatch,
        onRemoveDraw,
        onAddPlayer,
        onAddScore,
        onSettleGame,
        onRemoveMatch,
    ]);

    return (
        <div className="tournament-tree-canvas">
            {tournament.draws.length === 0 ? (
                <div className="tree-empty">
                    <span className="tree-empty-icon">🏆</span>
                    <p>No draws yet. Click <strong>+ Draw</strong> in the header to add a round.</p>
                </div>
            ) : (
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.25}
                    maxZoom={2}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background color="#2a2a42" gap={20} />
                    <Controls />
                    <MiniMap
                        nodeColor={(n) =>
                            n.type === "drawNode" ? "#646cff" : "#2a2a42"
                        }
                        style={{ background: "#0d0d1a", border: "1px solid #2a2a42" }}
                    />
                </ReactFlow>
            )}
        </div>
    );
}
