# Tourney

Tourney is a tournament management library available both as a **Go package** and as a **JavaScript/TypeScript npm package**. The core tournament logic is written in Go, which allows it to be used in serverless backend environments as well as compiled to WebAssembly for use directly in the browser.

A built-in **developer UI** is also shipped with the npm package, giving you a visual way to design, build, and inspect tournament structures without writing any code.

---

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Go Package](#go-package)
  - [Installation](#go-installation)
  - [Types](#go-types)
  - [Tournament Logic](#tournament-logic)
  - [Draw Logic](#draw-logic)
  - [Game Logic](#game-logic)
  - [Progressing a Tournament](#progressing-a-tournament)
  - [Updating the Leaderboard](#updating-the-leaderboard)
- [JavaScript / TypeScript Library](#javascript--typescript-library)
  - [Installation](#js-installation)
  - [Initializing WASM](#initializing-wasm)
  - [Creating a Tournament](#creating-a-tournament)
  - [Managing Draws and Matches](#managing-draws-and-matches)
  - [Players and Scores](#players-and-scores)
  - [Progressing the Tournament](#progressing-the-tournament)
  - [Serializing and Loading](#serializing-and-loading)
  - [Full API Reference](#full-api-reference)
- [Developer UI](#developer-ui)
- [Data Types](#data-types)
- [Player References — Cross-Draw Progression](#player-references--cross-draw-progression)
- [Building from Source](#building-from-source)
- [Project Structure](#project-structure)
- [License](#license)

---

## Overview

Tournament management involves a hierarchy of concepts:

```
Tournament
  └── Draw (a round or stage)
        └── Match (a DrawsMatch)
              └── Game (the actual contest)
                    ├── Players (real users or position references)
                    └── Scores
```

Tourney models this hierarchy with a clean type system and provides logic for:

- Creating and structuring tournaments
- Adding players — including **position references** that resolve to actual players from previous rounds at runtime
- Recording scores and settling games
- Progressing the tournament to the next stage (resolving position references via WASM or Go)
- Ranking the leaderboard by total accumulated score

---

## Core Concepts

### Tournament Status

A tournament has one of three statuses: `"scheduled"` | `"ongoing"` | `"completed"`.

### Draws

A **draw** represents a round or stage of the tournament. Each draw has an expected number of matches and an ordered set of `DrawsMatch` entries.

### Matches and Games

Each entry in a draw is a `DrawsMatch` wrapping a `Game`. A game holds the list of players, their scores, and a `settled` flag indicating the game is over.

### Players

A player is either:

- **`PlayerUser`** — a real participant with an `id` and `name`.
- **`PlayerId`** — a placeholder that references a position from a previous match outcome (see [Player References](#player-references--cross-draw-progression)).

### Leaderboard

The tournament-level leaderboard is a list of `PlayerUser` entries, sorted by total accumulated score across all settled matches by calling `updateLeaderboard`.

---

## Go Package

### Go Installation

```bash
go get github.com/olaoluwanhs/Tourney
```

Import the core package in your Go code:

```go
import "github.com/olaoluwanhs/Tourney/core"
```

Generated Go types are available separately if needed:

```go
import generated_go "github.com/olaoluwanhs/Tourney/types/generated_go"
```

### Go Types

The following types are defined in the generated Go types package:

| Type               | Description                                     |
| ------------------ | ----------------------------------------------- |
| `Tournament`       | Root tournament object                          |
| `Draws`            | A single draw (round/stage)                     |
| `DrawsMatch`       | A match entry within a draw, wrapping a `Game`  |
| `Game`             | The game/contest with players and scores        |
| `GameScore`        | A player ID paired with a score value           |
| `Player`           | A union of `PlayerUser` and `PlayerId`          |
| `PlayerUser`       | A real tournament participant                   |
| `PlayerId`         | A position reference to a previous match result |
| `TournamentStatus` | `"scheduled"` \| `"ongoing"` \| `"completed"`   |

### Tournament Logic

```go
// Create a new tournament
t := core.NewTournament("Championship 2026", "scheduled")

// Add a draw (a round)
draw := core.NewDraw(1, 4) // round 1, expecting 4 matches
t.AddDraw(draw)

// Remove a draw
t.RemoveDraw(drawId)

// Update tournament status
t.UpdateStatus("ongoing")
```

### Draw Logic

```go
draw := core.NewDraw(1, 4) // round number, expected matches

// Add a match with an expected number of players
draw.AddMatchToDraw(2, 4) // 2 players expected, 4 total spots in draw

// Remove a match by ID
draw.RemoveMatchFromDraw(matchId)
```

### Game Logic

```go
game := core.NewGame(2) // expects 2 players

// Add a player
player := generated_go.Player{
    Kind: "user",
    PlayerUser: generated_go.PlayerUser{
        Id:   "player-1",
        Name: "Alice",
    },
}
game.AddPlayer(&player)

// Add a score
game.AddScore("player-1", 100)

// Retrieve a score
score, found := game.GetScore("player-1")

// Check whether the game is full
full := game.IsFull()

// Check whether the game is completed (all players, all scores, settled)
completed := game.IsCompleted()

// Get the winner (highest score)
playerId, score, found := game.GetWinner()
```

Settling a game is done by setting `game.Settled = true` directly on the struct.

### Progressing a Tournament

When your tournament has multiple draws and players in later draws are defined as **position references** (e.g. `"1-<matchId>"`), call `ProgressTournamentLogic` to resolve them to actual players:

```go
err := t.ProgressTournamentLogic()
if err != nil {
    log.Fatal(err)
}
```

This method walks through each draw, finds ones with unresolved `PlayerId` references, looks up the referenced match's scores (sorted descending), picks the player at the given position, and mutates the placeholder in place with the real `PlayerUser` data.

See [Player References](#player-references--cross-draw-progression) for the full explanation of the reference format.

### Updating the Leaderboard

Call `UpdateLeadersBoardOrder` to re-rank the leaderboard by total accumulated score across all settled matches:

```go
err := t.UpdateLeadersBoardOrder()
if err != nil {
    log.Fatal(err)
}
```

---

## JavaScript / TypeScript Library

The JavaScript library wraps the Go core via WebAssembly. It is **browser-only** — Node.js is not supported because the WASM runtime depends on browser globals.

### JS Installation

```bash
npm install @olaoluwanhs/tourney
```

```typescript
import { TournamentWasm } from "@olaoluwanhs/tourney";
```

> **Note:** `TournamentWasm` is a **named export**, not a default export.

### Initializing WASM

WASM initialization is required only if you intend to call `progress()`. All other methods work without it. Call `initWasm()` once before using WASM-dependent features, and make sure your web server serves the WASM assets.

```typescript
const tournament = TournamentWasm.create("My Tournament", "scheduled");

await tournament.initWasm({
  wasmUrl: "/tournament.wasm", // defaults to /tournament.wasm
  wasmExecUrl: "/wasm_exec.js", // defaults to /wasm_exec.js
});
```

Copy the WASM assets from the package into your public directory:

```
node_modules/@olaoluwanhs/tourney/packages/lib/wasm/tournament.wasm  →  public/tournament.wasm
node_modules/@olaoluwanhs/tourney/packages/lib/wasm/wasm_exec.js     →  public/wasm_exec.js
```

### Creating a Tournament

```typescript
// Create a brand-new tournament
const tournament = TournamentWasm.create("Championship 2026", "scheduled");

console.log(tournament.id); // auto-generated ID
console.log(tournament.name); // "Championship 2026"
console.log(tournament.status); // "scheduled"
console.log(tournament.draws); // []
console.log(tournament.leaderboard); // []

// Load from a previously exported JSON object
const tournament = TournamentWasm.fromJSON(savedTournamentObject);
```

### Managing Draws and Matches

```typescript
// Add a draw — returns void; access the draw via tournament.draws
tournament.addDraw(4); // 4 expected matches, auto-assigned round number
tournament.addDraw(4, 1); // explicitly set as round 1

const drawId = tournament.draws[0].id;

// Add a match to a draw (expects 2 players)
tournament.addMatchToDraw(drawId, 2);

const matchId = tournament.draws[0].matches[0].game.id;

// Remove a match
tournament.removeMatchFromDraw(drawId, matchId);

// Remove a draw
tournament.removeDraw(drawId);

// Find a draw or match by ID
const draw = tournament.findDraw(drawId);
const game = tournament.findMatch(matchId);
```

### Players and Scores

#### Adding real players

```typescript
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
```

#### Adding position references (for draws after the first)

Players in later draws often aren't known in advance — they are whoever finishes in a specific position in an earlier match. Encode this as a `PlayerId`:

```typescript
// "1-<matchId>" means: the player who ranked 1st in the given match
tournament.addPlayerToGame(semifinalMatchId, {
  kind: "id",
  value: `1-${quarterfinalMatchId}`, // winner of the quarterfinal
});

tournament.addPlayerToGame(semifinalMatchId, {
  kind: "id",
  value: `2-${otherQuarterfinalMatchId}`, // runner-up of another quarterfinal
});
```

Call `tournament.progress()` (after WASM init) to resolve these references once the referenced matches are settled.

#### Scores and settling

```typescript
tournament.addScoreToGame(matchId, "player-1", 100);
tournament.addScoreToGame(matchId, "player-2", 85);

// Mark the game as over
tournament.settleGame(matchId);

// Query results
const winner = tournament.getWinner(matchId);
// { playerId: "player-1", score: 100, player: PlayerUser }

const score = tournament.getScore(matchId, "player-1"); // 100
const completed = tournament.isGameCompleted(matchId); // true
const full = tournament.isGameFull(matchId); // true
```

#### Leaderboard

```typescript
tournament.updateLeaderboard([
  { kind: "user", id: "player-1", name: "Alice" },
  { kind: "user", id: "player-2", name: "Bob" },
]);
```

### Progressing the Tournament

Once matches in the current draw are settled and the next draw's games have `PlayerId` references set up, call `progress()` to resolve them:

```typescript
// Requires initWasm() to have been called first
tournament.progress();
```

This sends the full tournament JSON to the WASM module, which resolves every `PlayerId` reference by looking up the actual player from the referenced match's sorted scores, then updates the local tournament object in place.

### Serializing and Loading

```typescript
// Get the plain tournament object (suitable for JSON.stringify or storage)
const snapshot: Tournament = tournament.tournamentObject;

// Save to JSON
const json = JSON.stringify(snapshot);

// Restore from JSON
const restored = TournamentWasm.fromJSON(JSON.parse(json));
```

### Full API Reference

#### Static methods

| Method                                | Description                                           |
| ------------------------------------- | ----------------------------------------------------- |
| `TournamentWasm.create(name, status)` | Create a new tournament                               |
| `TournamentWasm.fromJSON(payload)`    | Restore a tournament from a plain `Tournament` object |

#### Instance properties

| Property           | Type                                      | Description                |
| ------------------ | ----------------------------------------- | -------------------------- |
| `id`               | `string`                                  | Tournament ID              |
| `name`             | `string`                                  | Tournament name            |
| `status`           | `"scheduled" \| "ongoing" \| "completed"` | Current status             |
| `draws`            | `Draws[]`                                 | All draws in order         |
| `leaderboard`      | `Player[]`                                | Current leaderboard        |
| `tournamentObject` | `Tournament`                              | Full plain-object snapshot |

#### Instance methods

| Method                                    | WASM required | Description                                        |
| ----------------------------------------- | :-----------: | -------------------------------------------------- |
| `initWasm(options?)`                      |       —       | Load WASM runtime; call once before `progress()`   |
| `addDraw(expectedMatches, round?)`        |      No       | Add a draw/round                                   |
| `removeDraw(drawId)`                      |      No       | Remove a draw                                      |
| `addMatchToDraw(drawId, expectedPlayers)` |      No       | Add a match to a draw                              |
| `removeMatchFromDraw(drawId, matchId)`    |      No       | Remove a match                                     |
| `addPlayerToGame(gameId, player)`         |      No       | Add a `PlayerUser` or `PlayerId` to a game         |
| `addScoreToGame(gameId, playerId, score)` |      No       | Record or update a player's score                  |
| `getScore(gameId, playerId)`              |      No       | Retrieve a player's score                          |
| `getWinner(gameId)`                       |      No       | Get the highest-scoring player                     |
| `isGameFull(gameId)`                      |      No       | Check if all player slots are filled               |
| `isGameCompleted(gameId)`                 |      No       | Check if settled with all players and scores       |
| `settleGame(gameId)`                      |      No       | Mark a game as settled                             |
| `updateStatus(status)`                    |      No       | Update tournament status                           |
| `updateLeaderboard(players)`              |      No       | Replace the leaderboard list                       |
| `findDraw(drawId)`                        |      No       | Find a draw by ID                                  |
| `findMatch(matchId)`                      |      No       | Find a game by ID                                  |
| `progress()`                              |    **Yes**    | Resolve `PlayerId` references for the current draw |

---

## Developer UI

Tourney ships a built-in visual UI for designing and managing tournaments. It is intended as a developer tool — useful for building out a tournament structure, verifying logic, and exporting the resulting JSON for use in your application.

Launch it with:

```bash
npx @olaoluwanhs/tourney launch-ui
```

This starts a local Vite development server (on port 1234 by default) and opens the tournament builder in your browser. Features include:

- Create a tournament by name and status
- Add draws (rounds) and matches visually via a node-and-arrow canvas (React Flow)
- Add real players or position references to each game
- Record scores and settle games
- Inspect the leaderboard
- Import and export the full tournament as JSON

---

## Data Types

All types are available from the package:

```typescript
import type {
  Tournament,
  Draws,
  DrawsMatch,
  Game,
  GameScore,
  Player,
  PlayerId,
  PlayerUser,
} from "@olaoluwanhs/tourney";
```

### `Tournament`

```typescript
interface Tournament {
  id: string;
  name: string;
  status: "scheduled" | "ongoing" | "completed";
  draws: Draws[];
  leaderboard: Player[];
}
```

### `Draws`

```typescript
interface Draws {
  id: string;
  round: number;
  expectedNumberOfMatches: number;
  matches: DrawsMatch[];
}
```

### `DrawsMatch` / `Game`

```typescript
interface DrawsMatch {
  game: Game;
}

interface Game {
  id: string | undefined;
  expectedNumberOfPlayers: number;
  players: Player[];
  scores: GameScore[];
  settled: boolean;
}

interface GameScore {
  playerId: string;
  score: number;
}
```

### `Player`

```typescript
type Player = PlayerUser | PlayerId;

// A real tournament participant
interface PlayerUser {
  kind: "user";
  id: string;
  name: string;
  associatedImage?: string;
}

// A position reference resolved at progression time
interface PlayerId {
  kind: "id";
  value: string; // format: "<position>-<matchId>"
  error?: string; // set by progress() if resolution fails
}
```

---

## Player References — Cross-Draw Progression

In knockout or multi-stage tournaments, the players who participate in later draws are determined by the results of earlier ones. Tourney handles this with **position references**.

### Format

```
"<position>-<matchId>"
```

- `position` — the 1-indexed rank by descending score (1 = highest scorer, 2 = second highest, etc.)
- `matchId` — the `id` of the game from any previous draw

### Example

```
"1-game_abc123"   →  the winner (1st place) of match game_abc123
"2-game_abc123"   →  the runner-up of match game_abc123
"1-game_xyz789"   →  the winner of a different match
```

### How resolution works

When `progress()` (JS) or `ProgressTournamentLogic()` (Go) is called:

1. The engine scans each draw in order, stopping at the first incomplete one.
2. For every `PlayerId` slot in that draw's matches, it splits the value on `"-"` to extract the position and match ID.
3. It looks up that match, sorts its scores in descending order, and picks the player at (position − 1).
4. The `PlayerId` slot is mutated in place to become a full `PlayerUser` with the real player's data.
5. Any resolution failure (match not found, position out of range, player not on leaderboard) sets the `error` field on the `PlayerId` instead of crashing.

> **Important:** The player must be present in the tournament's leaderboard for resolution to succeed. Make sure you call `updateLeaderboard` with all participants before calling `progress()`.

---

## Building from Source

```bash
# Clone the repository
git clone https://github.com/olaoluwanhs/Tourney.git
cd Tourney

# Install JS dependencies
npm install

# Generate Go and TypeScript types from JTD schemas
npm run types-gen

# Compile Go core to WebAssembly
npm run wasm-build

# Build TypeScript library (ESM + CJS)
npm run build:ts

# Build everything in one step
npm run build
```

### Go tests

```bash
go test ./test/...
# or via npm:
npm test
```

### Running the developer UI locally

```bash
npm run dev-webapp
```

This starts the Vite dev server at `http://localhost:1234`.

---

## Project Structure

```
Tourney/
├── core/                        # Go — tournament business logic
│   ├── tournament_logic.go      # TournamentLogic: create, add/remove draws, status
│   ├── draw_logic.go            # DrawLogic: add/remove matches
│   ├── game_logic.go            # GameLogic: players, scores, winner, completion
│   ├── progress_tournament_logic.go  # Resolve PlayerId references across draws
│   ├── update_leaders_order.go  # Sort leaderboard by cumulative score
│   ├── find_in_tournament.go    # Helper: find a match anywhere in the tree
│   └── errors.go                # Sentinel error messages
├── cmd/
│   └── wasm/
│       └── main.go              # Compiles to tournament.wasm; exposes JS globals
├── types/
│   ├── generated_go/            # Go structs (generated from JTD schemas)
│   └── generated_typescript/   # TypeScript types (generated from JTD schemas)
├── jtd/                         # JTD schema source files for type generation
├── packages/
│   ├── lib/                     # The publishable JS/TS library
│   │   ├── wasmTournament.ts    # TournamentWasm class
│   │   └── wasm/                # Pre-built WASM binaries (tournament.wasm, wasm_exec.js)
│   └── testwebapp/              # Developer UI (React + Vite + React Flow)
├── test/                        # Go unit tests
├── index.ts                     # Library entry point
├── package.json                 # npm package manifest
├── go.mod                       # Go module definition
└── testwebapp.js                # CLI entry for `npx @olaoluwanhs/tourney launch-ui`
```

---

## License

ISC — see [LICENSE](LICENSE) for details.

**Author:** Olaoluwa Babatunde
