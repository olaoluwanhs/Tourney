import type { Draws, Game, Player, Tournament } from "../../types/generated_typescript/index";
type WinnerResult = {
    playerId: string;
    score: number;
};
declare global {
    interface Window {
        Go: new () => {
            importObject: WebAssembly.Imports;
            run: (instance: WebAssembly.Instance) => Promise<void>;
        };
        tourneyNewTournament?: (name: string, status: string) => string;
        tourneyTournamentFromJSON?: (payload: string) => string;
        tourneyTournamentAddDraw?: (tournamentId: string, round: number, expectedMatches: number) => string;
        tourneyTournamentRemoveDraw?: (tournamentId: string, drawId: string) => string;
        tourneyTournamentUpdateStatus?: (tournamentId: string, status: string) => string;
        tourneyTournamentProgress?: (tournamentId: string) => string;
        tourneyTournamentMarshal?: (tournamentId: string) => string;
        tourneyTournamentFindMatch?: (tournamentId: string, matchId: string) => string;
        tourneyTournamentFindDraw?: (tournamentId: string, drawId: string) => string;
        tourneyDrawAddMatch?: (drawId: string, expectedPlayers: number) => string;
        tourneyDrawRemoveMatch?: (drawId: string, matchId: string) => string;
        tourneyGameAddPlayer?: (gameId: string, playerJson: string) => string;
        tourneyGameAddScore?: (gameId: string, playerId: string, score: number) => string;
        tourneyGameGetScore?: (gameId: string, playerId: string) => string;
        tourneyGameGetWinner?: (gameId: string) => string;
        tourneyGameIsCompleted?: (gameId: string) => string;
        tourneyGameIsFull?: (gameId: string) => string;
    }
}
export type WasmInitOptions = {
    wasmUrl?: string;
    wasmExecUrl?: string;
};
export declare class TournamentWasm {
    private id;
    private constructor();
    static init(options?: WasmInitOptions): Promise<void>;
    static create(name: string, status: Tournament["status"]): TournamentWasm;
    static fromJSON(payload: Tournament): TournamentWasm;
    addDraw(round: number, expectedNumberOfMatches: number): string;
    removeDraw(drawId: string): void;
    updateStatus(status: Tournament["status"]): void;
    progress(): void;
    marshal(): Tournament;
    findMatch(matchId: string): Game;
    findDraw(drawId: string): Draws;
    addMatchToDraw(drawId: string, expectedNumberOfPlayers: number): string;
    removeMatchFromDraw(drawId: string, matchId: string): void;
    addPlayerToGame(gameId: string, player: Player): void;
    addScoreToGame(gameId: string, playerId: string, score: number): void;
    getScore(gameId: string, playerId: string): number | null;
    getWinner(gameId: string): WinnerResult | null;
    isGameCompleted(gameId: string): boolean;
    isGameFull(gameId: string): boolean;
}
export {};
//# sourceMappingURL=wasmTournament.d.ts.map