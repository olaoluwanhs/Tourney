// Main entry point for Tourney npm package
export {
  TournamentWasm,
  type WasmInitOptions,
} from "./packages/lib/wasmTournament";

export { TournamentEngine } from "./packages/lib/tournamentEngine";

// Export generated types
export type {
  Composed,
  Player,
  Draws,
  DrawsMatch,
  Game,
  GameScore,
  PlayerId,
  PlayerUser,
  Tournament,
} from "./types/generated_typescript/index";
