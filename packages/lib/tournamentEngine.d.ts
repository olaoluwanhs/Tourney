import type { Draws, Game, Player, Tournament } from "../../types/generated_typescript/index";
/**
 * Pure-TypeScript tournament engine with no WASM dependency.
 * Holds a Tournament object and provides mutation, query, and progression methods.
 *
 * For progression logic (progress, updateLeaderboardOrder), this class implements
 * pure-TypeScript equivalents of the Go WASM functions from the Tourney core library.
 */
export declare class TournamentEngine {
    tournament: Tournament;
    private constructor();
    /**
     * Create a new tournament with the given name and status.
     */
    static create(name: string, status: Tournament["status"]): TournamentEngine;
    /**
     * Load a tournament from an existing Tournament object (e.g. parsed from JSON).
     */
    static fromJSON(payload: Tournament): TournamentEngine;
    /**
     * Export the current tournament state as a plain object.
     */
    toJSON(): Tournament;
    get id(): string;
    get name(): string;
    get status(): Tournament["status"];
    get draws(): Draws[];
    get leaderboard(): Player[];
    /**
     * Add a new draw (round) at the given position or appended at the end.
     */
    addDraw(expectedNumberOfMatches: number, round?: number): void;
    /**
     * Remove a draw by its ID.
     */
    removeDraw(drawId: string): void;
    /**
     * Update the tournament status.
     */
    updateStatus(status: Tournament["status"]): void;
    /**
     * Add a new match (game) to an existing draw.
     */
    addMatchToDraw(drawId: string, expectedNumberOfPlayers: number): void;
    /**
     * Remove a match (game) from a draw by its game ID.
     */
    removeMatchFromDraw(drawId: string, matchId: string): void;
    /**
     * Add a player to the tournament roster (leaderboard).
     * The player must have kind === "user".
     */
    addPlayerToRoster(player: Player): void;
    /**
     * Remove a player from the tournament roster by ID.
     */
    removePlayerFromRoster(playerId: string): void;
    /**
     * Add a player to a specific game (match).
     */
    addPlayerToGame(gameId: string, player: Player): void;
    /**
     * Add or update a score for a player in a game.
     */
    addScoreToGame(gameId: string, playerId: string, score: number): void;
    /**
     * Mark a game as settled (completed).
     */
    settleGame(gameId: string): void;
    /**
     * Get a player's score in a specific game.
     * Returns the score value, or null if the game or score entry is not found.
     */
    getScore(gameId: string, playerId: string): number | null;
    /**
     * Get the current winner (highest score) of a game.
     * Returns null if the game has no scores.
     */
    getWinner(gameId: string): {
        playerId: string;
        score: number;
        player: Player;
    } | null;
    /**
     * Check whether a game is fully completed (settled, full of players, and all have scores).
     */
    isGameCompleted(gameId: string): boolean;
    /**
     * Check whether a game has reached its expected number of players.
     */
    isGameFull(gameId: string): boolean;
    /**
     * Find a game (match) by its ID across all draws.
     */
    findMatch(matchId: string): Game | undefined;
    /**
     * Find a draw by its ID.
     */
    findDraw(drawId: string): Draws | undefined;
    /**
     * Progress the tournament to the next round.
     *
     * Walks draws in order; finds the first draw where completed matches < expectedNumberOfMatches.
     * For each PlayerId slot (value = "<position>-<matchId>"), resolves the referenced match's
     * scores sorted descending, maps position -> player, and mutates the slot to a PlayerUser
     * (looked up in the leaderboard).
     *
     * Sets `error` on invalid definitions (bad format, missing match, out-of-range position,
     * player not in leaderboard).
     *
     * After progression, re-sorts the leaderboard by cumulative score.
     */
    progress(): void;
    /**
     * Re-sort the leaderboard by cumulative score across all settled games.
     *
     * Accumulates GameScore.score per player across all settled matches,
     * then re-sorts leaderboard (user players only) by total score descending.
     */
    updateLeaderboardOrder(): void;
}
//# sourceMappingURL=tournamentEngine.d.ts.map