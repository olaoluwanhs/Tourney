import type {
  Draws,
  Game,
  Player,
  Tournament,
} from "../../types/generated_typescript/index";

type WasmResult<T> = {
  ok: boolean;
  value?: T;
  error?: string;
};

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
    tourneyTournamentAddDraw?: (
      tournamentId: string,
      round: number,
      expectedMatches: number,
    ) => string;
    tourneyTournamentRemoveDraw?: (
      tournamentId: string,
      drawId: string,
    ) => string;
    tourneyTournamentUpdateStatus?: (
      tournamentId: string,
      status: string,
    ) => string;
    tourneyTournamentProgress?: (tournamentId: string) => string;
    tourneyTournamentMarshal?: (tournamentId: string) => string;
    tourneyTournamentFindMatch?: (
      tournamentId: string,
      matchId: string,
    ) => string;
    tourneyTournamentFindDraw?: (
      tournamentId: string,
      drawId: string,
    ) => string;
    tourneyDrawAddMatch?: (drawId: string, expectedPlayers: number) => string;
    tourneyDrawRemoveMatch?: (drawId: string, matchId: string) => string;
    tourneyGameAddPlayer?: (gameId: string, playerJson: string) => string;
    tourneyGameAddScore?: (
      gameId: string,
      playerId: string,
      score: number,
    ) => string;
    tourneyGameGetScore?: (gameId: string, playerId: string) => string;
    tourneyGameGetWinner?: (gameId: string) => string;
    tourneyGameIsCompleted?: (gameId: string) => string;
    tourneyGameIsFull?: (gameId: string) => string;
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
  private id: string;

  private constructor(id: string) {
    this.id = id;
  }

  static async init(options: WasmInitOptions = {}): Promise<void> {
    if (wasmState.ready) {
      return;
    }
    const wasmExecUrl = options.wasmExecUrl ?? "/wasm/wasm_exec.js";
    const wasmUrl = options.wasmUrl ?? "/wasm/tournament.wasm";

    await loadScript(wasmExecUrl);
    await loadWasm(wasmUrl);
    wasmState.ready = true;
  }

  static create(name: string, status: Tournament["status"]): TournamentWasm {
    if (!wasmState.ready) {
      throw new Error("WASM not initialized. Call TournamentWasm.init first.");
    }
    const fn = ensureFn(window.tourneyNewTournament, "tourneyNewTournament");
    const id = unwrap<string>(fn(name, status));
    return new TournamentWasm(id);
  }

  static fromJSON(payload: Tournament): TournamentWasm {
    if (!wasmState.ready) {
      throw new Error("WASM not initialized. Call TournamentWasm.init first.");
    }
    const fn = ensureFn(
      window.tourneyTournamentFromJSON,
      "tourneyTournamentFromJSON",
    );
    const id = unwrap<string>(fn(JSON.stringify(payload)));
    return new TournamentWasm(id);
  }

  addDraw(round: number, expectedNumberOfMatches: number): string {
    const fn = ensureFn(
      window.tourneyTournamentAddDraw,
      "tourneyTournamentAddDraw",
    );
    return unwrap<string>(fn(this.id, round, expectedNumberOfMatches));
  }

  removeDraw(drawId: string): void {
    const fn = ensureFn(
      window.tourneyTournamentRemoveDraw,
      "tourneyTournamentRemoveDraw",
    );
    unwrap<void>(fn(this.id, drawId));
  }

  updateStatus(status: Tournament["status"]): void {
    const fn = ensureFn(
      window.tourneyTournamentUpdateStatus,
      "tourneyTournamentUpdateStatus",
    );
    unwrap<void>(fn(this.id, status));
  }

  progress(): void {
    const fn = ensureFn(
      window.tourneyTournamentProgress,
      "tourneyTournamentProgress",
    );
    unwrap<void>(fn(this.id));
  }

  marshal(): Tournament {
    const fn = ensureFn(
      window.tourneyTournamentMarshal,
      "tourneyTournamentMarshal",
    );
    const payload = unwrap<string>(fn(this.id));
    return JSON.parse(payload) as Tournament;
  }

  findMatch(matchId: string): Game {
    const fn = ensureFn(
      window.tourneyTournamentFindMatch,
      "tourneyTournamentFindMatch",
    );
    const payload = unwrap<string>(fn(this.id, matchId));
    return JSON.parse(payload) as Game;
  }

  findDraw(drawId: string): Draws {
    const fn = ensureFn(
      window.tourneyTournamentFindDraw,
      "tourneyTournamentFindDraw",
    );
    const payload = unwrap<string>(fn(this.id, drawId));
    return JSON.parse(payload) as Draws;
  }

  addMatchToDraw(drawId: string, expectedNumberOfPlayers: number): string {
    const fn = ensureFn(window.tourneyDrawAddMatch, "tourneyDrawAddMatch");
    return unwrap<string>(fn(drawId, expectedNumberOfPlayers));
  }

  removeMatchFromDraw(drawId: string, matchId: string): void {
    const fn = ensureFn(
      window.tourneyDrawRemoveMatch,
      "tourneyDrawRemoveMatch",
    );
    unwrap<void>(fn(drawId, matchId));
  }

  addPlayerToGame(gameId: string, player: Player): void {
    const fn = ensureFn(window.tourneyGameAddPlayer, "tourneyGameAddPlayer");
    unwrap<void>(fn(gameId, JSON.stringify(player)));
  }

  addScoreToGame(gameId: string, playerId: string, score: number): void {
    const fn = ensureFn(window.tourneyGameAddScore, "tourneyGameAddScore");
    unwrap<void>(fn(gameId, playerId, score));
  }

  getScore(gameId: string, playerId: string): number | null {
    const fn = ensureFn(window.tourneyGameGetScore, "tourneyGameGetScore");
    return unwrap<number | null>(fn(gameId, playerId));
  }

  getWinner(gameId: string): WinnerResult | null {
    const fn = ensureFn(window.tourneyGameGetWinner, "tourneyGameGetWinner");
    return unwrap<WinnerResult | null>(fn(gameId));
  }

  isGameCompleted(gameId: string): boolean {
    const fn = ensureFn(
      window.tourneyGameIsCompleted,
      "tourneyGameIsCompleted",
    );
    return unwrap<boolean>(fn(gameId));
  }

  isGameFull(gameId: string): boolean {
    const fn = ensureFn(window.tourneyGameIsFull, "tourneyGameIsFull");
    return unwrap<boolean>(fn(gameId));
  }
}
