import type { Draws, Game, Player, Tournament } from "../../types/generated_typescript/index";
declare global {
    interface Window {
        Go: new () => {
            importObject: WebAssembly.Imports;
            run: (instance: WebAssembly.Instance) => Promise<void>;
        };
        progressTournamentObject?: (tournamentJson: string) => string;
        updateTournamentLeaderboard?: (tournamentJson: string) => string;
    }
}
export type WasmInitOptions = {
    wasmUrl?: string;
    wasmExecUrl?: string;
};
export declare class TournamentWasm {
    private wasmId;
    tournament: Tournament;
    private constructor();
    initWasm(options?: WasmInitOptions): Promise<void>;
    static create(name: string, status: Tournament["status"]): TournamentWasm;
    static fromJSON(payload: Tournament): TournamentWasm;
    get id(): string;
    get name(): string;
    get status(): Tournament["status"];
    get draws(): Draws[];
    get leaderboard(): Player[];
    get tournamentObject(): Tournament;
    addDraw(expectedNumberOfMatches: number, round?: number): void;
    removeDraw(drawId: string): void;
    updateStatus(status: Tournament["status"]): void;
    progress(): void;
    updateLeaderboard(players: Player[]): void;
    findMatch(matchId: string): Game | undefined;
    findDraw(drawId: string): Draws | undefined;
    addMatchToDraw(drawId: string, expectedNumberOfPlayers: number): void;
    removeMatchFromDraw(drawId: string, matchId: string): void;
    addPlayerToGame(gameId: string, player: Player): void;
    addScoreToGame(gameId: string, playerId: string, score: number): void;
    getScore(gameId: string, playerId: string): number | null;
    getWinner(gameId: string): {
        playerId: string;
        score: number;
        player: Player;
    } | null;
    isGameCompleted(gameId: string): boolean;
    isGameFull(gameId: string): boolean;
    settleGame(gameId: string): void;
}
//# sourceMappingURL=wasmTournament.d.ts.map