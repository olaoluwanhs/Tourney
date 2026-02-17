var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
        throw new Error(`WASM function ${name} is not available. Did you call init()?`);
    }
    return fn;
}
function loadScript(url) {
    return __awaiter(this, void 0, void 0, function* () {
        yield new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = url;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${url}`));
            document.head.appendChild(script);
        });
    });
}
function loadWasm(wasmUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!window.Go) {
            throw new Error("wasm_exec.js did not register Go in the global scope");
        }
        const go = new window.Go();
        const response = yield fetch(wasmUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch WASM at ${wasmUrl}`);
        }
        if ("instantiateStreaming" in WebAssembly) {
            try {
                const { instance } = yield WebAssembly.instantiateStreaming(response, go.importObject);
                yield go.run(instance);
                return instance;
            }
            catch (error) {
                const bytes = yield response.arrayBuffer();
                const { instance } = yield WebAssembly.instantiate(bytes, go.importObject);
                yield go.run(instance);
                return instance;
            }
        }
        const bytes = yield response.arrayBuffer();
        const { instance } = yield WebAssembly.instantiate(bytes, go.importObject);
        yield go.run(instance);
        return instance;
    });
}
export class TournamentWasm {
    constructor(tournament) {
        this.wasmId = null;
        this.tournament = tournament;
    }
    initWasm() {
        return __awaiter(this, arguments, void 0, function* (options = {}) {
            var _a, _b;
            if (wasmState.ready) {
                return;
            }
            const wasmExecUrl = (_a = options.wasmExecUrl) !== null && _a !== void 0 ? _a : "/wasm_exec.js";
            const wasmUrl = (_b = options.wasmUrl) !== null && _b !== void 0 ? _b : "/tournament.wasm";
            yield loadScript(wasmExecUrl);
            yield loadWasm(wasmUrl);
            wasmState.ready = true;
            this.wasmId = Math.random().toString(36).substring(2, 10);
        });
    }
    static create(name, status) {
        const tournamentID = "tournament_" + Math.random().toString(36).substring(2, 10);
        const tournament = {
            name,
            id: tournamentID,
            status,
            draws: [],
            leaderboard: [],
        };
        return new TournamentWasm(tournament);
    }
    static fromJSON(payload) {
        let tournamentId = payload.id;
        if (!tournamentId) {
            tournamentId =
                "tournament_" + Math.random().toString(36).substring(2, 10);
        }
        return new TournamentWasm(Object.assign(Object.assign({}, payload), { id: tournamentId }));
    }
    get id() {
        return this.tournament.id;
    }
    get name() {
        return this.tournament.name;
    }
    get status() {
        return this.tournament.status;
    }
    get draws() {
        return this.tournament.draws;
    }
    get leaderboard() {
        return this.tournament.leaderboard;
    }
    get tournamentObject() {
        return this.tournament;
    }
    addDraw(expectedNumberOfMatches, round) {
        // Pass in the expected number of matches in the draw and the position of the round in the tournament
        let position = round !== null && round !== void 0 ? round : this.tournament.draws.length + 1;
        // Add the draw at the position
        this.tournament.draws.splice(position - 1, 0, {
            id: "draw_" + Math.random().toString(36).substring(2, 10),
            round: position,
            matches: [],
            expectedNumberOfMatches,
        });
    }
    removeDraw(drawId) {
        this.tournament.draws = this.tournament.draws.filter((d) => d.id !== drawId);
    }
    updateStatus(status) {
        // Update local state
        this.tournament.status = status;
    }
    // WASM Dependent Methods
    // This require that you've called initWasm() and that the WASM module is loaded and ready to use
    progress() {
        if (!this.wasmId) {
            throw new Error("WASM tournament ID not available");
        }
        const fn = ensureFn(window.progressTournamentObject, "progressTournamentObject");
        const updatedTournamentJson = unwrap(fn(JSON.stringify(this.tournament)));
        const res = JSON.parse(updatedTournamentJson);
        this.tournament = res;
    }
    updateLeaderboard(players) {
        this.tournament.leaderboard = players;
    }
    // WASM Independent Methods
    // These methods manipulate the tournament state locally and do not require the WASM module to be loaded. You can use these methods to set up your tournament before calling progress() for the first time.
    findMatch(matchId) {
        for (const draw of this.tournament.draws) {
            for (const match of draw.matches) {
                if (match.game.id === matchId) {
                    return match.game;
                }
            }
        }
        return undefined;
    }
    findDraw(drawId) {
        return this.tournament.draws.find((d) => d.id === drawId);
    }
    addMatchToDraw(drawId, expectedNumberOfPlayers) {
        const draw = this.findDraw(drawId);
        if (!draw) {
            throw new Error(`Draw with id ${drawId} not found`);
        }
        const newGame = {
            id: "game_" + Math.random().toString(36).substring(2, 10),
            expectedNumberOfPlayers,
            players: [],
            scores: [],
            settled: false,
        };
        const newMatch = {
            game: newGame,
        };
        draw.matches.push(newMatch);
    }
    removeMatchFromDraw(drawId, matchId) {
        const draw = this.findDraw(drawId);
        if (!draw) {
            throw new Error(`Draw with id ${drawId} not found`);
        }
        draw.matches = draw.matches.filter((match) => match.game.id !== matchId);
    }
    addPlayerToGame(gameId, player) {
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
    addScoreToGame(gameId, playerId, score) {
        const game = this.findMatch(gameId);
        if (!game) {
            throw new Error(`Game with id ${gameId} not found`);
        }
        // Check if player exists in the game
        const playerExists = game.players.some((p) => p.kind === "user" && p.id === playerId);
        if (!playerExists) {
            throw new Error(`Player ${playerId} not found in game ${gameId}`);
        }
        // Check if score already exists for this player
        const existingScoreIndex = game.scores.findIndex((s) => s.playerId === playerId);
        if (existingScoreIndex >= 0) {
            // Update existing score
            game.scores[existingScoreIndex].score = score;
        }
        else {
            // Add new score
            game.scores.push({ playerId, score });
        }
    }
    getScore(gameId, playerId) {
        const game = this.findMatch(gameId);
        if (!game) {
            return null;
        }
        const score = game.scores.find((s) => s.playerId === playerId);
        return score ? score.score : null;
    }
    getWinner(gameId) {
        const game = this.findMatch(gameId);
        if (!game || game.scores.length === 0) {
            return null;
        }
        const winner = game.scores.reduce((max, current) => current.score > max.score ? current : max);
        return {
            playerId: winner.playerId,
            score: winner.score,
            player: this.tournament.leaderboard.find((p) => p.kind === "user" && p.id === winner.playerId),
        };
    }
    isGameCompleted(gameId) {
        const game = this.findMatch(gameId);
        if (!game) {
            return false;
        }
        return (game.settled &&
            game.players.length >= game.expectedNumberOfPlayers &&
            game.scores.length >= game.expectedNumberOfPlayers);
    }
    isGameFull(gameId) {
        const game = this.findMatch(gameId);
        if (!game) {
            return false;
        }
        return game.players.length >= game.expectedNumberOfPlayers;
    }
    settleGame(gameId) {
        const game = this.findMatch(gameId);
        if (game) {
            game.settled = true;
        }
    }
}
