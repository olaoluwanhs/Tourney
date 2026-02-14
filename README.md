# Tourney

A WebAssembly-powered tournament management library for JavaScript/TypeScript applications.

## Installation

```bash
npm install tourney
```

## Usage

```typescript
import { TournamentWasm } from "tourney";

// Initialize WASM runtime (call once before using the library)
await TournamentWasm.init({
  wasmUrl: "/wasm/tournament.wasm", // Optional, defaults to /wasm/tournament.wasm
  wasmExecUrl: "/wasm/wasm_exec.js", // Optional, defaults to /wasm/wasm_exec.js
});

// Create a new tournament
const tournament = TournamentWasm.create("My Tournament", "scheduled");

// Add draws (rounds)
const drawId = tournament.addDraw(1, 4); // Round 1 with 4 expected matches

// Add matches to a draw
const matchId = tournament.addMatchToDraw(drawId, 2); // Match with 2 players

// Add players to a match
tournament.addPlayerToGame(matchId, {
  kind: "user",
  id: "player-1",
  name: "Alice",
  associatedImage: undefined,
});

tournament.addPlayerToGame(matchId, {
  kind: "user",
  id: "player-2",
  name: "Bob",
  associatedImage: undefined,
});

// Add scores
tournament.addScoreToGame(matchId, "player-1", 100);
tournament.addScoreToGame(matchId, "player-2", 95);

// Get winner
const winner = tournament.getWinner(matchId);
console.log(winner); // { playerId: 'player-1', score: 100 }

// Check game status
const isCompleted = tournament.isGameCompleted(matchId);
const isFull = tournament.isGameFull(matchId);

// Export tournament state as JSON
const tournamentData = tournament.marshal();

// Load tournament from JSON
const loadedTournament = TournamentWasm.fromJSON(tournamentData);
```

## Building from Source

```bash
# Install dependencies
npm install

# Generate types from JTD schemas
npm run types-gen

# Build WASM binary
npm run wasm-build

# Build TypeScript library (ESM + CJS)
npm run build:ts

# Build everything
npm run build
```

## Publishing

```bash
# Build and publish to npm
npm publish
```

The `prepublishOnly` hook ensures types, WASM, and library code are built before publishing.

## WASM Assets

The package includes pre-built WASM binaries in `packages/lib/wasm/`:

- `tournament.wasm` - The compiled Go tournament logic
- `wasm_exec.js` - Go's WebAssembly runtime glue code

Make sure to serve these files from your web server and pass the correct URLs to `TournamentWasm.init()`.

## License

ISC

## Author

Olaoluwa Babatunde
