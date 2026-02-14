const wasmState = {
  ready: false,
};
function unwrap(result) {
  const parsed = JSON.parse(result);
  if (!parsed.ok) {
    throw new Error(parsed.error || "Unknown WASM error");
  }
  return parsed.value;
}
function ensureFn(fn, name) {
  if (!fn) {
    throw new Error(
      `WASM function ${name} is not available. Did you call init()?`,
    );
  }
  return fn;
}
async function loadScript(url) {
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(script);
  });
}
async function loadWasm(wasmUrl) {
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
export class TournamentWasm {
  constructor(id) {
    this.id = id;
  }
  static async init(options = {}) {
    if (wasmState.ready) {
      return;
    }
    const wasmExecUrl = options.wasmExecUrl ?? "/wasm/wasm_exec.js";
    const wasmUrl = options.wasmUrl ?? "/wasm/tournament.wasm";
    await loadScript(wasmExecUrl);
    await loadWasm(wasmUrl);
    wasmState.ready = true;
  }
  static create(name, status) {
    if (!wasmState.ready) {
      throw new Error("WASM not initialized. Call TournamentWasm.init first.");
    }
    const fn = ensureFn(window.tourneyNewTournament, "tourneyNewTournament");
    const id = unwrap(fn(name, status));
    return new TournamentWasm(id);
  }
  static fromJSON(payload) {
    if (!wasmState.ready) {
      throw new Error("WASM not initialized. Call TournamentWasm.init first.");
    }
    const fn = ensureFn(
      window.tourneyTournamentFromJSON,
      "tourneyTournamentFromJSON",
    );
    const id = unwrap(fn(JSON.stringify(payload)));
    return new TournamentWasm(id);
  }
  addDraw(round, expectedNumberOfMatches) {
    const fn = ensureFn(
      window.tourneyTournamentAddDraw,
      "tourneyTournamentAddDraw",
    );
    return unwrap(fn(this.id, round, expectedNumberOfMatches));
  }
  removeDraw(drawId) {
    const fn = ensureFn(
      window.tourneyTournamentRemoveDraw,
      "tourneyTournamentRemoveDraw",
    );
    unwrap(fn(this.id, drawId));
  }
  updateStatus(status) {
    const fn = ensureFn(
      window.tourneyTournamentUpdateStatus,
      "tourneyTournamentUpdateStatus",
    );
    unwrap(fn(this.id, status));
  }
  progress() {
    const fn = ensureFn(
      window.tourneyTournamentProgress,
      "tourneyTournamentProgress",
    );
    unwrap(fn(this.id));
  }
  marshal() {
    const fn = ensureFn(
      window.tourneyTournamentMarshal,
      "tourneyTournamentMarshal",
    );
    const payload = unwrap(fn(this.id));
    return JSON.parse(payload);
  }
  findMatch(matchId) {
    const fn = ensureFn(
      window.tourneyTournamentFindMatch,
      "tourneyTournamentFindMatch",
    );
    const payload = unwrap(fn(this.id, matchId));
    return JSON.parse(payload);
  }
  findDraw(drawId) {
    const fn = ensureFn(
      window.tourneyTournamentFindDraw,
      "tourneyTournamentFindDraw",
    );
    const payload = unwrap(fn(this.id, drawId));
    return JSON.parse(payload);
  }
  addMatchToDraw(drawId, expectedNumberOfPlayers) {
    const fn = ensureFn(window.tourneyDrawAddMatch, "tourneyDrawAddMatch");
    return unwrap(fn(drawId, expectedNumberOfPlayers));
  }
  removeMatchFromDraw(drawId, matchId) {
    const fn = ensureFn(
      window.tourneyDrawRemoveMatch,
      "tourneyDrawRemoveMatch",
    );
    unwrap(fn(drawId, matchId));
  }
  addPlayerToGame(gameId, player) {
    const fn = ensureFn(window.tourneyGameAddPlayer, "tourneyGameAddPlayer");
    unwrap(fn(gameId, JSON.stringify(player)));
  }
  addScoreToGame(gameId, playerId, score) {
    const fn = ensureFn(window.tourneyGameAddScore, "tourneyGameAddScore");
    unwrap(fn(gameId, playerId, score));
  }
  getScore(gameId, playerId) {
    const fn = ensureFn(window.tourneyGameGetScore, "tourneyGameGetScore");
    return unwrap(fn(gameId, playerId));
  }
  getWinner(gameId) {
    const fn = ensureFn(window.tourneyGameGetWinner, "tourneyGameGetWinner");
    return unwrap(fn(gameId));
  }
  isGameCompleted(gameId) {
    const fn = ensureFn(
      window.tourneyGameIsCompleted,
      "tourneyGameIsCompleted",
    );
    return unwrap(fn(gameId));
  }
  isGameFull(gameId) {
    const fn = ensureFn(window.tourneyGameIsFull, "tourneyGameIsFull");
    return unwrap(fn(gameId));
  }
}
