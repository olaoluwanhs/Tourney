"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentEngine = exports.TournamentWasm = void 0;
// Main entry point for Tourney npm package
var wasmTournament_1 = require("./packages/lib/wasmTournament");
Object.defineProperty(exports, "TournamentWasm", { enumerable: true, get: function () { return wasmTournament_1.TournamentWasm; } });
var tournamentEngine_1 = require("./packages/lib/tournamentEngine");
Object.defineProperty(exports, "TournamentEngine", { enumerable: true, get: function () { return tournamentEngine_1.TournamentEngine; } });
