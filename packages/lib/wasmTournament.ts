import type {
  Draws,
  DrawsMatch,
  Game,
  Player,
  Tournament,
} from "../../types/generated_typescript/index";

type WasmResult<T> = {
  ok: boolean;
  value?: T;
  error?: string;
};

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

const wasmState = {
  ready: false,
};

function unwrap<T>(result: string): T {
  const parsed = JSON.parse(result) as WasmResult<T>;
  if (!parsed.ok) {
    throw new Error(parsed.error || "Unknown WASM error");
  }
  return parsed.value as T;
}

function ensureFn<T extends (...args: never[]) => string>(
  fn: T | undefined,
  name: string,
): T {
  if (!fn) {
    throw new Error(
      `WASM function ${name} is not available. Did you call init()?`,
    );
  }
  return fn;
}

async function loadScript(url: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(script);
  });
}

async function loadWasm(wasmUrl: string): Promise<WebAssembly.Instance> {
  if (!window.Go) {
    throw new Error("wasm_exec.js did not register Go in the global scope");
  }
  const go = new window.Go();
  const response = await fetch(wasmUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch WASM at ${wasmUrl}`);
  }

  if ("instantiateStreaming" in WebAssembly) {
    try {
      const { instance } = await WebAssembly.instantiateStreaming(
        response,
        go.importObject,
      );
      await go.run(instance);
      return instance;
    } catch (error) {
      const bytes = await response.arrayBuffer();
      const { instance } = await WebAssembly.instantiate(
        bytes,
        go.importObject,
      );
      await go.run(instance);
      return instance;
    }
  }

  const bytes = await response.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes, go.importObject);
  await go.run(instance);
  return instance;
}

export type WasmInitOptions = {
  wasmUrl?: string;
  wasmExecUrl?: string;
};

export class TournamentWasm {
  private wasmId: string | null = null;
  tournament: Tournament;

  private constructor(tournament: Tournament) {
    this.tournament = tournament;
  }

  async initWasm(options: WasmInitOptions = {}): Promise<void> {
    if (wasmState.ready) {
      return;
    }
    const wasmExecUrl = options.wasmExecUrl ?? "/wasm_exec.js";
    const wasmUrl = options.wasmUrl ?? "/tournament.wasm";

    await loadScript(wasmExecUrl);
    await loadWasm(wasmUrl);
    wasmState.ready = true;
    this.wasmId = Math.random().toString(36).substring(2, 10);
  }

  static create(name: string, status: Tournament["status"]): TournamentWasm {
    const tournamentID =
      "tournament_" + Math.random().toString(36).substring(2, 10);

    const tournament: Tournament = {
      name,
      id: tournamentID,
      status,
      draws: [],
      leaderboard: [],
    };

    return new TournamentWasm(tournament);
  }

  static fromJSON(payload: Tournament): TournamentWasm {
    let tournamentId = payload.id;
    if (!tournamentId) {
      tournamentId =
        "tournament_" + Math.random().toString(36).substring(2, 10);
    }
    return new TournamentWasm({ ...payload, id: tournamentId });
  }

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

  get tournamentObject(): Tournament {
    return this.tournament;
  }

  addDraw(expectedNumberOfMatches: number, round?: number) {
    // Pass in the expected number of matches in the draw and the position of the round in the tournament
    let position = round ?? this.tournament.draws.length + 1;

    // Add the draw at the position
    this.tournament.draws.splice(position - 1, 0, {
      id: "draw_" + Math.random().toString(36).substring(2, 10),
      round: position,
      matches: [],
      expectedNumberOfMatches,
    });
  }

  removeDraw(drawId: string): void {
    this.tournament.draws = this.tournament.draws.filter(
      (d) => d.id !== drawId,
    );
  }

  updateStatus(status: Tournament["status"]): void {
    // Update local state
    this.tournament.status = status;
  }

  // WASM Dependent Methods
  // This require that you've called initWasm() and that the WASM module is loaded and ready to use

  progress(): void {
    if (!this.wasmId) {
      throw new Error("WASM tournament ID not available");
    }

    const fn = ensureFn(
      window.progressTournamentObject,
      "progressTournamentObject",
    );
    const updatedTournamentJson = unwrap<string>(
      fn(JSON.stringify(this.tournament)),
    );
    const res = JSON.parse(updatedTournamentJson) as Tournament;
    this.tournament = res;
  }

  updateLeaderboard(players: Player[]): void {
    this.tournament.leaderboard = players;
  }

  // WASM Independent Methods
  // These methods manipulate the tournament state locally and do not require the WASM module to be loaded. You can use these methods to set up your tournament before calling progress() for the first time.

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

  findDraw(drawId: string): Draws | undefined {
    return this.tournament.draws.find((d) => d.id === drawId);
  }

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

  removeMatchFromDraw(drawId: string, matchId: string): void {
    const draw = this.findDraw(drawId);
    if (!draw) {
      throw new Error(`Draw with id ${drawId} not found`);
    }

    draw.matches = draw.matches.filter((match) => match.game.id !== matchId);
  }

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

  getScore(gameId: string, playerId: string): number | null {
    const game = this.findMatch(gameId);
    if (!game) {
      return null;
    }
    const score = game.scores.find((s) => s.playerId === playerId);
    return score ? score.score : null;
  }

  getWinner(
    gameId: string,
  ): { playerId: string; score: number; player: Player } | null {
    const game = this.findMatch(gameId);
    if (!game || game.scores.length === 0) {
      return null;
    }

    const winner = game.scores.reduce((max, current) =>
      current.score > max.score ? current : max,
    );

    return {
      playerId: winner.playerId,
      score: winner.score,
      player: this.tournament.leaderboard.find(
        (p) => p.kind === "user" && p.id === winner.playerId,
      ) as Player,
    };
  }

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

  isGameFull(gameId: string): boolean {
    const game = this.findMatch(gameId);
    if (!game) {
      return false;
    }
    return game.players.length >= game.expectedNumberOfPlayers;
  }

  settleGame(gameId: string): void {
    const game = this.findMatch(gameId);
    if (game) {
      game.settled = true;
    }
  }
}
