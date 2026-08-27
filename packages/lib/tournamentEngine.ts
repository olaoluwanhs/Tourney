import type {
  Draws,
  DrawsMatch,
  Game,
  GameScore,
  Player,
  PlayerId,
  PlayerUser,
  Tournament,
} from "../../types/generated_typescript/index";

/**
 * Pure-TypeScript tournament engine with no WASM dependency.
 * Holds a Tournament object and provides mutation, query, and progression methods.
 *
 * For progression logic (progress, updateLeaderboardOrder), this class implements
 * pure-TypeScript equivalents of the Go WASM functions from the Tourney core library.
 */
export class TournamentEngine {
  tournament: Tournament;

  private constructor(tournament: Tournament) {
    this.tournament = tournament;
  }

  // ---- Static factories ----

  /**
   * Create a new tournament with the given name and status.
   */
  static create(name: string, status: Tournament["status"]): TournamentEngine {
    const tournamentID =
      "tournament_" + Math.random().toString(36).substring(2, 10);

    const tournament: Tournament = {
      name,
      id: tournamentID,
      status,
      draws: [],
      leaderboard: [],
    };

    return new TournamentEngine(tournament);
  }

  /**
   * Load a tournament from an existing Tournament object (e.g. parsed from JSON).
   */
  static fromJSON(payload: Tournament): TournamentEngine {
    let tournamentId = payload.id;
    if (!tournamentId) {
      tournamentId =
        "tournament_" + Math.random().toString(36).substring(2, 10);
    }
    return new TournamentEngine({ ...payload, id: tournamentId });
  }

  // ---- Serialisation ----

  /**
   * Export the current tournament state as a plain object.
   */
  toJSON(): Tournament {
    return this.tournament;
  }

  // ---- Getters ----

  get id(): string {
    return this.tournament.id;
  }

  get name(): string {
    return this.tournament.name;
  }

  get status(): Tournament["status"] {
    return this.tournament.status;
  }

  get draws(): Draws[] {
    return this.tournament.draws;
  }

  get leaderboard(): Player[] {
    return this.tournament.leaderboard;
  }

  // ---- Mutation: Draws ----

  /**
   * Add a new draw (round) at the given position or appended at the end.
   */
  addDraw(expectedNumberOfMatches: number, round?: number): void {
    const position = round ?? this.tournament.draws.length + 1;

    this.tournament.draws.splice(position - 1, 0, {
      id: "draw_" + Math.random().toString(36).substring(2, 10),
      round: position,
      matches: [],
      expectedNumberOfMatches,
    });
  }

  /**
   * Remove a draw by its ID.
   */
  removeDraw(drawId: string): void {
    this.tournament.draws = this.tournament.draws.filter(
      (d) => d.id !== drawId,
    );
  }

  /**
   * Update the tournament status.
   */
  updateStatus(status: Tournament["status"]): void {
    this.tournament.status = status;
  }

  // ---- Mutation: Matches / Games ----

  /**
   * Add a new match (game) to an existing draw.
   */
  addMatchToDraw(drawId: string, expectedNumberOfPlayers: number): void {
    const draw = this.findDraw(drawId);
    if (!draw) {
      throw new Error(`Draw with id ${drawId} not found`);
    }

    const newGame: Game = {
      id: "game_" + Math.random().toString(36).substring(2, 10),
      expectedNumberOfPlayers,
      players: [],
      scores: [],
      settled: false,
    };

    const newMatch: DrawsMatch = {
      game: newGame,
    };

    draw.matches.push(newMatch);
  }

  /**
   * Remove a match (game) from a draw by its game ID.
   */
  removeMatchFromDraw(drawId: string, matchId: string): void {
    const draw = this.findDraw(drawId);
    if (!draw) {
      throw new Error(`Draw with id ${drawId} not found`);
    }

    draw.matches = draw.matches.filter((match) => match.game.id !== matchId);
  }

  // ---- Mutation: Players ----

  /**
   * Add a player to the tournament roster (leaderboard).
   * The player must have kind === "user".
   */
  addPlayerToRoster(player: Player): void {
    if (player.kind !== "user") {
      throw new Error("Only user-type players can be added to the roster");
    }

    const exists = this.tournament.leaderboard.some(
      (p) => p.kind === "user" && p.id === player.id,
    );
    if (exists) {
      throw new Error(`Player ${player.id} already exists in the roster`);
    }

    this.tournament.leaderboard.push(player);
  }

  /**
   * Remove a player from the tournament roster by ID.
   */
  removePlayerFromRoster(playerId: string): void {
    this.tournament.leaderboard = this.tournament.leaderboard.filter(
      (p) => !(p.kind === "user" && p.id === playerId),
    );
  }

  /**
   * Add a player to a specific game (match).
   */
  addPlayerToGame(gameId: string, player: Player): void {
    const game = this.findMatch(gameId);
    if (!game) {
      throw new Error(`Game with id ${gameId} not found`);
    }

    // Check if player already exists in the game
    const playerExists = game.players.some((p) => {
      if (p.kind === "user" && player.kind === "user") {
        return p.id === player.id;
      }
      return false;
    });

    if (playerExists) {
      throw new Error(`Player already exists in game ${gameId}`);
    }

    // Check if game is already full
    if (game.players.length >= game.expectedNumberOfPlayers) {
      throw new Error(`Game ${gameId} is already full`);
    }

    game.players.push(player);
  }

  // ---- Mutation: Scores ----

  /**
   * Add or update a score for a player in a game.
   */
  addScoreToGame(gameId: string, playerId: string, score: number): void {
    const game = this.findMatch(gameId);
    if (!game) {
      throw new Error(`Game with id ${gameId} not found`);
    }

    // Check if player exists in the game
    const playerExists = game.players.some(
      (p) => p.kind === "user" && p.id === playerId,
    );

    if (!playerExists) {
      throw new Error(`Player ${playerId} not found in game ${gameId}`);
    }

    // Check if score already exists for this player
    const existingScoreIndex = game.scores.findIndex(
      (s) => s.playerId === playerId,
    );

    if (existingScoreIndex >= 0) {
      // Update existing score
      game.scores[existingScoreIndex].score = score;
    } else {
      // Add new score
      game.scores.push({ playerId, score });
    }
  }

  /**
   * Mark a game as settled (completed).
   */
  settleGame(gameId: string): void {
    const game = this.findMatch(gameId);
    if (game) {
      game.settled = true;
    }
  }

  // ---- Query ----

  /**
   * Get a player's score in a specific game.
   * Returns the score value, or null if the game or score entry is not found.
   */
  getScore(gameId: string, playerId: string): number | null {
    const game = this.findMatch(gameId);
    if (!game) {
      return null;
    }
    const score = game.scores.find((s) => s.playerId === playerId);
    return score ? score.score : null;
  }

  /**
   * Get the current winner (highest score) of a game.
   * Returns null if the game has no scores.
   */
  getWinner(
    gameId: string,
  ): { playerId: string; score: number; player: Player } | null {
    const game = this.findMatch(gameId);
    if (!game || game.scores.length === 0) {
      return null;
    }

    const topScore = game.scores.reduce((max, current) =>
      current.score > max.score ? current : max,
    );

    return {
      playerId: topScore.playerId,
      score: topScore.score,
      player: this.tournament.leaderboard.find(
        (p) => p.kind === "user" && p.id === topScore.playerId,
      ) as Player,
    };
  }

  /**
   * Check whether a game is fully completed (settled, full of players, and all have scores).
   */
  isGameCompleted(gameId: string): boolean {
    const game = this.findMatch(gameId);
    if (!game) {
      return false;
    }
    return (
      game.settled &&
      game.players.length >= game.expectedNumberOfPlayers &&
      game.scores.length >= game.expectedNumberOfPlayers
    );
  }

  /**
   * Check whether a game has reached its expected number of players.
   */
  isGameFull(gameId: string): boolean {
    const game = this.findMatch(gameId);
    if (!game) {
      return false;
    }
    return game.players.length >= game.expectedNumberOfPlayers;
  }

  /**
   * Find a game (match) by its ID across all draws.
   */
  findMatch(matchId: string): Game | undefined {
    for (const draw of this.tournament.draws) {
      for (const match of draw.matches) {
        if (match.game.id === matchId) {
          return match.game;
        }
      }
    }
    return undefined;
  }

  /**
   * Find a draw by its ID.
   */
  findDraw(drawId: string): Draws | undefined {
    return this.tournament.draws.find((d) => d.id === drawId);
  }

  // ---- Progression Methods ----

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
  progress(): void {
    for (const draw of this.tournament.draws) {
      const completedMatches = draw.matches.filter(
        (m) =>
          m.game.settled &&
          m.game.players.length >= m.game.expectedNumberOfPlayers &&
          m.game.scores.length >= m.game.expectedNumberOfPlayers,
      ).length;

      if (completedMatches < draw.expectedNumberOfMatches) {
        // Not all matches in this draw are done; try to resolve PlayerId slots
        for (const match of draw.matches) {
          for (let i = 0; i < match.game.players.length; i++) {
            const player = match.game.players[i];
            if (player.kind !== "id") {
              continue; // Already resolved
            }

            const playerIdSlot = player as PlayerId;
            const parts = playerIdSlot.value.split("-");

            // Detect mode: "seat" prefix → seat mode, otherwise score-rank mode
            if (parts[0] === "seat") {
              // Format: "seat-<seatIndex>-<matchId>"
              if (parts.length < 3) {
                playerIdSlot.error =
                  "Invalid seat PlayerId format. Expected 'seat-<seatIndex>-<matchId>'";
                continue;
              }

              const seatIndexStr = parts[1];
              const sourceMatchId = parts.slice(2).join("-");
              const seatIndex = parseInt(seatIndexStr, 10);

              if (isNaN(seatIndex) || seatIndex < 1) {
                playerIdSlot.error = `Invalid seat index in PlayerId: '${seatIndexStr}'`;
                continue;
              }

              // Find the source match
              const sourceGame = this.findMatch(sourceMatchId);
              if (!sourceGame) {
                playerIdSlot.error = `Source match '${sourceMatchId}' not found`;
                continue;
              }

              // Get the player at the specified seat index
              if (seatIndex > sourceGame.players.length) {
                playerIdSlot.error = `Seat index ${seatIndex} is out of range for match '${sourceMatchId}' (only ${sourceGame.players.length} players)`;
                continue;
              }

              const seatPlayer = sourceGame.players[seatIndex - 1];
              if (seatPlayer.kind !== "user") {
                playerIdSlot.error = `Player at seat ${seatIndex} in match '${sourceMatchId}' is not a resolved user (kind=${seatPlayer.kind})`;
                continue;
              }

              const targetPlayerId = (seatPlayer as PlayerUser).id;

              // Find the player in the leaderboard
              const leaderboardPlayer = this.tournament.leaderboard.find(
                (p) => p.kind === "user" && p.id === targetPlayerId,
              );

              if (!leaderboardPlayer) {
                playerIdSlot.error = `Player '${targetPlayerId}' not found in leaderboard`;
                continue;
              }

              // Mutate the slot to a PlayerUser
              match.game.players[i] = {
                kind: "user",
                id: (leaderboardPlayer as PlayerUser).id,
                name: (leaderboardPlayer as PlayerUser).name,
                associatedImage: (leaderboardPlayer as PlayerUser)
                  .associatedImage,
              };
            } else {
              // Score-rank mode: format "<position>-<matchId>"
              if (parts.length < 2) {
                playerIdSlot.error =
                  "Invalid PlayerId format. Expected '<position>-<matchId>'";
                continue;
              }

              const positionStr = parts[0];
              const sourceMatchId = parts.slice(1).join("-");
              const position = parseInt(positionStr, 10);

              if (isNaN(position) || position < 1) {
                playerIdSlot.error = `Invalid position in PlayerId: '${positionStr}'`;
                continue;
              }

              // Find the source match
              const sourceGame = this.findMatch(sourceMatchId);
              if (!sourceGame) {
                playerIdSlot.error = `Source match '${sourceMatchId}' not found`;
                continue;
              }

              // Get scores from the source match, sorted descending
              if (sourceGame.scores.length === 0) {
                playerIdSlot.error = `Source match '${sourceMatchId}' has no scores`;
                continue;
              }

              const sortedScores = [...sourceGame.scores].sort(
                (a, b) => b.score - a.score,
              );

              if (position > sortedScores.length) {
                playerIdSlot.error = `Position ${position} is out of range for match '${sourceMatchId}' (only ${sortedScores.length} players)`;
                continue;
              }

              const winnerScore = sortedScores[position - 1];

              // Find the player in the leaderboard
              const leaderboardPlayer = this.tournament.leaderboard.find(
                (p) => p.kind === "user" && p.id === winnerScore.playerId,
              );

              if (!leaderboardPlayer) {
                playerIdSlot.error = `Player '${winnerScore.playerId}' not found in leaderboard`;
                continue;
              }

              // Mutate the slot to a PlayerUser
              match.game.players[i] = {
                kind: "user",
                id: (leaderboardPlayer as PlayerUser).id,
                name: (leaderboardPlayer as PlayerUser).name,
                associatedImage: (leaderboardPlayer as PlayerUser)
                  .associatedImage,
              };
            }
          }
        }

        // Only progress the first incomplete draw
        break;
      }
    }

    // After resolving, re-sort leaderboard
    this.updateLeaderboardOrder();
  }

  /**
   * Re-sort the leaderboard by cumulative score across all settled games.
   *
   * Accumulates GameScore.score per player across all settled matches,
   * then re-sorts leaderboard (user players only) by total score descending.
   */
  updateLeaderboardOrder(): void {
    // Accumulate scores across all settled games
    const scoreMap = new Map<string, number>();

    for (const draw of this.tournament.draws) {
      for (const match of draw.matches) {
        if (!match.game.settled) {
          continue;
        }
        for (const score of match.game.scores) {
          const current = scoreMap.get(score.playerId) ?? 0;
          scoreMap.set(score.playerId, current + score.score);
        }
      }
    }

    // Separate user players from PlayerId slots
    const userPlayers = this.tournament.leaderboard.filter(
      (p) => p.kind === "user",
    );

    // Sort by total score descending
    userPlayers.sort((a, b) => {
      const scoreA = scoreMap.get((a as PlayerUser).id) ?? 0;
      const scoreB = scoreMap.get((b as PlayerUser).id) ?? 0;
      return scoreB - scoreA;
    });

    // Replace leaderboard with sorted user players (preserving any PlayerId slots at the end)
    const idSlots = this.tournament.leaderboard.filter((p) => p.kind === "id");
    this.tournament.leaderboard = [...userPlayers, ...idSlots];
  }
}
