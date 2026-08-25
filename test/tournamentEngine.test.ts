import { describe, it, expect } from "vitest";
import { TournamentEngine } from "../packages/lib/tournamentEngine";
import type {
  Tournament,
  GameScore,
  Player,
} from "../types/generated_typescript/index";

// ---- Test data ----

/**
 * Knockout fixture: 4 matches in draw 1, 2 matches in draw 2 (PlayerId slots),
 * 1 match in draw 3. Draw 1 is fully settled.
 */
const knockoutFixture: Tournament = {
  id: "tournament-1",
  name: "Knockout Open",
  status: "ongoing",
  draws: [
    {
      expectedNumberOfMatches: 4,
      id: "t1_d1",
      round: 1,
      matches: [
        {
          game: {
            expectedNumberOfPlayers: 2,
            id: "t1m1",
            settled: true,
            players: [
              {
                kind: "user",
                id: "player-1",
                name: "Ava",
                associatedImage: "https://example.com/images/player-1.png",
              },
              {
                kind: "user",
                id: "player-2",
                name: "Noah",
                associatedImage: "https://example.com/images/player-2.png",
              },
            ],
            scores: [
              { playerId: "player-1", score: 21 },
              { playerId: "player-2", score: 18 },
            ],
          },
        },
        {
          game: {
            expectedNumberOfPlayers: 2,
            id: "t1m2",
            settled: true,
            players: [
              {
                kind: "user",
                id: "player-3",
                name: "Liam",
                associatedImage: "https://example.com/images/player-3.png",
              },
              {
                kind: "user",
                id: "player-4",
                name: "Maya",
                associatedImage: "https://example.com/images/player-4.png",
              },
            ],
            scores: [
              { playerId: "player-3", score: 15 },
              { playerId: "player-4", score: 19.5 },
            ],
          },
        },
        {
          game: {
            expectedNumberOfPlayers: 2,
            id: "t1m3",
            settled: true,
            players: [
              {
                kind: "user",
                id: "player-5",
                name: "Zoe",
                associatedImage: "https://example.com/images/player-5.png",
              },
              {
                kind: "user",
                id: "player-6",
                name: "Kai",
                associatedImage: "https://example.com/images/player-6.png",
              },
            ],
            scores: [
              { playerId: "player-5", score: 17 },
              { playerId: "player-6", score: 12 },
            ],
          },
        },
        {
          game: {
            expectedNumberOfPlayers: 2,
            id: "t1m4",
            settled: true,
            players: [
              {
                kind: "user",
                id: "player-7",
                name: "Eli",
                associatedImage: "https://example.com/images/player-7.png",
              },
              {
                kind: "user",
                id: "player-8",
                name: "Nora",
                associatedImage: "https://example.com/images/player-8.png",
              },
            ],
            scores: [
              { playerId: "player-7", score: 20 },
              { playerId: "player-8", score: 22 },
            ],
          },
        },
      ],
    },
    {
      expectedNumberOfMatches: 2,
      id: "t1_d2",
      round: 2,
      matches: [
        {
          game: {
            expectedNumberOfPlayers: 2,
            id: "t1m5",
            settled: false,
            players: [
              { kind: "id", value: "1-t1m1" },
              { kind: "id", value: "1-t1m2" },
            ],
            scores: [],
          },
        },
        {
          game: {
            expectedNumberOfPlayers: 2,
            id: "t1m6",
            settled: false,
            players: [
              { kind: "id", value: "1-t1m3" },
              { kind: "id", value: "1-t1m4" },
            ],
            scores: [],
          },
        },
      ],
    },
    {
      expectedNumberOfMatches: 1,
      id: "t1_d3",
      round: 3,
      matches: [
        {
          game: {
            expectedNumberOfPlayers: 2,
            id: "t1m7",
            settled: false,
            players: [
              { kind: "id", value: "1-t1m5" },
              { kind: "id", value: "1-t1m6" },
            ],
            scores: [],
          },
        },
      ],
    },
  ],
  leaderboard: [
    {
      kind: "user",
      id: "player-1",
      name: "Ava",
      associatedImage: "https://example.com/images/player-1.png",
    },
    {
      kind: "user",
      id: "player-2",
      name: "Noah",
      associatedImage: "https://example.com/images/player-2.png",
    },
    {
      kind: "user",
      id: "player-3",
      name: "Liam",
      associatedImage: "https://example.com/images/player-3.png",
    },
    {
      kind: "user",
      id: "player-4",
      name: "Maya",
      associatedImage: "https://example.com/images/player-4.png",
    },
    {
      kind: "user",
      id: "player-5",
      name: "Zoe",
      associatedImage: "https://example.com/images/player-5.png",
    },
    {
      kind: "user",
      id: "player-6",
      name: "Kai",
      associatedImage: "https://example.com/images/player-6.png",
    },
    {
      kind: "user",
      id: "player-7",
      name: "Eli",
      associatedImage: "https://example.com/images/player-7.png",
    },
    {
      kind: "user",
      id: "player-8",
      name: "Nora",
      associatedImage: "https://example.com/images/player-8.png",
    },
  ],
};

/**
 * Top-two advance fixture: 2 matches in draw 1 (4 players each, settled),
 * 1 match in draw 2 with PlayerId slots taking top 2 from each draw-1 match.
 */
const topTwoFixture: Tournament = {
  id: "tournament-2",
  name: "Top Two Advance",
  status: "ongoing",
  draws: [
    {
      expectedNumberOfMatches: 2,
      id: "t2_d1",
      round: 1,
      matches: [
        {
          game: {
            expectedNumberOfPlayers: 4,
            id: "t2m1",
            settled: true,
            players: [
              {
                kind: "user",
                id: "alpha",
                name: "Aria",
                associatedImage: "https://example.com/images/alpha.png",
              },
              {
                kind: "user",
                id: "bravo",
                name: "Ben",
                associatedImage: "https://example.com/images/bravo.png",
              },
              {
                kind: "user",
                id: "charlie",
                name: "Cleo",
                associatedImage: "https://example.com/images/charlie.png",
              },
              {
                kind: "user",
                id: "delta",
                name: "Drew",
                associatedImage: "https://example.com/images/delta.png",
              },
            ],
            scores: [
              { playerId: "alpha", score: 9 },
              { playerId: "bravo", score: 12 },
              { playerId: "charlie", score: 6.5 },
              { playerId: "delta", score: 11 },
            ],
          },
        },
        {
          game: {
            expectedNumberOfPlayers: 4,
            id: "t2m2",
            settled: true,
            players: [
              {
                kind: "user",
                id: "echo",
                name: "Elle",
                associatedImage: "https://example.com/images/echo.png",
              },
              {
                kind: "user",
                id: "foxtrot",
                name: "Finn",
                associatedImage: "https://example.com/images/foxtrot.png",
              },
              {
                kind: "user",
                id: "golf",
                name: "Gia",
                associatedImage: "https://example.com/images/golf.png",
              },
              {
                kind: "user",
                id: "hotel",
                name: "Hugo",
                associatedImage: "https://example.com/images/hotel.png",
              },
            ],
            scores: [
              { playerId: "echo", score: 7 },
              { playerId: "foxtrot", score: 14 },
              { playerId: "golf", score: 13 },
              { playerId: "hotel", score: 8 },
            ],
          },
        },
      ],
    },
    {
      expectedNumberOfMatches: 1,
      id: "t2_d2",
      round: 2,
      matches: [
        {
          game: {
            expectedNumberOfPlayers: 4,
            id: "t2m3",
            settled: false,
            players: [
              { kind: "id", value: "1-t2m1" },
              { kind: "id", value: "2-t2m1" },
              { kind: "id", value: "1-t2m2" },
              { kind: "id", value: "2-t2m2" },
            ],
            scores: [],
          },
        },
      ],
    },
  ],
  leaderboard: [
    {
      kind: "user",
      id: "alpha",
      name: "Aria",
      associatedImage: "https://example.com/images/alpha.png",
    },
    {
      kind: "user",
      id: "bravo",
      name: "Ben",
      associatedImage: "https://example.com/images/bravo.png",
    },
    {
      kind: "user",
      id: "charlie",
      name: "Cleo",
      associatedImage: "https://example.com/images/charlie.png",
    },
    {
      kind: "user",
      id: "delta",
      name: "Drew",
      associatedImage: "https://example.com/images/delta.png",
    },
    {
      kind: "user",
      id: "echo",
      name: "Elle",
      associatedImage: "https://example.com/images/echo.png",
    },
    {
      kind: "user",
      id: "foxtrot",
      name: "Finn",
      associatedImage: "https://example.com/images/foxtrot.png",
    },
    {
      kind: "user",
      id: "golf",
      name: "Gia",
      associatedImage: "https://example.com/images/golf.png",
    },
    {
      kind: "user",
      id: "hotel",
      name: "Hugo",
      associatedImage: "https://example.com/images/hotel.png",
    },
  ],
};

// ---- Helpers ----

function assertUserPlayer(
  player: Player,
  expectedId: string,
  expectedName: string,
) {
  expect(player.kind).toBe("user");
  if (player.kind === "user") {
    expect(player.id).toBe(expectedId);
    expect(player.name).toBe(expectedName);
  }
}

// ---- Tests ----

describe("TournamentEngine", () => {
  describe("progress() — Knockout fixture", () => {
    it("resolves PlayerId slots from prior-draw scores (sorted descending)", () => {
      const engine = TournamentEngine.fromJSON(
        structuredClone(knockoutFixture),
      );

      // Set expectedNumberOfMatches to 3 on draw 2 to force progression
      engine.tournament.draws[1].expectedNumberOfMatches = 3;

      engine.progress();

      // Draw 2, match 1 (t1m5) should have winners of t1m1[1] and t1m2[1]
      const match5 = engine.findMatch("t1m5")!;
      expect(match5.players.length).toBe(2);
      assertUserPlayer(match5.players[0], "player-1", "Ava"); // Position 1 of t1m1 (score 21)
      assertUserPlayer(match5.players[1], "player-4", "Maya"); // Position 1 of t1m2 (score 19.5)

      // Draw 2, match 2 (t1m6) should have winners of t1m3[1] and t1m4[1]
      const match6 = engine.findMatch("t1m6")!;
      expect(match6.players.length).toBe(2);
      assertUserPlayer(match6.players[0], "player-5", "Zoe"); // Position 1 of t1m3 (score 17)
      assertUserPlayer(match6.players[1], "player-8", "Nora"); // Position 1 of t1m4 (score 22)

      // Draw 3 should NOT be progressed (PlayerId slots remain because draw 2 is incomplete)
      const match7 = engine.findMatch("t1m7")!;
      expect(match7.players[0]).toHaveProperty("kind", "id");
      expect(match7.players[1]).toHaveProperty("kind", "id");
    });
  });

  describe("progress() — Top-two advance fixture", () => {
    it("resolves PlayerId slots with multi-player advancement", () => {
      const engine = TournamentEngine.fromJSON(structuredClone(topTwoFixture));

      engine.progress();

      // Draw 2, match 1 (t2m3) should have top 2 from each draw-1 match
      // t2m1 sorted: bravo(12), delta(11), alpha(9), charlie(6.5)
      // t2m2 sorted: foxtrot(14), golf(13), hotel(8), echo(7)
      const match3 = engine.findMatch("t2m3")!;
      expect(match3.players.length).toBe(4);
      assertUserPlayer(match3.players[0], "bravo", "Ben"); // Position 1 of t2m1
      assertUserPlayer(match3.players[1], "delta", "Drew"); // Position 2 of t2m1
      assertUserPlayer(match3.players[2], "foxtrot", "Finn"); // Position 1 of t2m2
      assertUserPlayer(match3.players[3], "golf", "Gia"); // Position 2 of t2m2
    });
  });

  describe("progress() — error cases", () => {
    it("sets error on invalid PlayerId format", () => {
      const bad: Tournament = structuredClone(knockoutFixture);
      // Malformed PlayerId (no dash)
      (bad.draws[1].matches[0].game.players[0] as any) = {
        kind: "id",
        value: "invalid",
      };

      const engine = TournamentEngine.fromJSON(bad);
      engine.progress();

      const game = engine.findMatch("t1m5")!;
      expect((game.players[0] as any).error).toContain(
        "Invalid PlayerId format",
      );
    });

    it("sets error when source match is not found", () => {
      const bad: Tournament = structuredClone(knockoutFixture);
      // Reference a non-existent match
      (bad.draws[1].matches[0].game.players[0] as any) = {
        kind: "id",
        value: "1-nonexistent",
      };

      const engine = TournamentEngine.fromJSON(bad);
      engine.progress();

      const game = engine.findMatch("t1m5")!;
      expect((game.players[0] as any).error).toContain("not found");
    });

    it("sets error when position is out of range", () => {
      const bad: Tournament = structuredClone(knockoutFixture);
      // Position 99 is out of range (only 2 players)
      (bad.draws[1].matches[0].game.players[0] as any) = {
        kind: "id",
        value: "99-t1m1",
      };

      const engine = TournamentEngine.fromJSON(bad);
      engine.progress();

      const game = engine.findMatch("t1m5")!;
      expect((game.players[0] as any).error).toContain("out of range");
    });

    it("sets error when referenced player is not in leaderboard", () => {
      const bad: Tournament = structuredClone(knockoutFixture);
      // Make ALL scores in t1m1 point to players not in the leaderboard
      bad.draws[0].matches[0].game.scores = [
        { playerId: "unknown-player", score: 10 },
        { playerId: "another-unknown", score: 5 },
      ];

      const engine = TournamentEngine.fromJSON(bad);
      engine.progress();

      const game = engine.findMatch("t1m5")!;
      const p0 = game.players[0] as any;
      expect(p0.error).toContain("not found in leaderboard");
    });
  });

  describe("updateLeaderboardOrder()", () => {
    it("sorts leaderboard by cumulative score descending", () => {
      const engine = TournamentEngine.fromJSON(structuredClone(topTwoFixture));
      // Manually settle all games in draw 2 and add scores
      const match3 = engine.findMatch("t2m3")!;
      match3.settled = true;
      match3.scores = [
        { playerId: "foxtrot", score: 10 },
        { playerId: "bravo", score: 8 },
        { playerId: "golf", score: 6 },
        { playerId: "delta", score: 4 },
      ];

      engine.updateLeaderboardOrder();

      // Cumulative scores:
      // foxtrot: 14 (draw1) + 10 (draw2) = 24
      // bravo: 12 + 8 = 20
      // golf: 13 + 6 = 19
      // delta: 11 + 4 = 15
      // alpha: 9
      // hotel: 8
      // echo: 7
      // charlie: 6.5
      const lb = engine.leaderboard;
      expect(lb.length).toBe(8);
      expect(lb[0]).toHaveProperty("id", "foxtrot");
      expect(lb[1]).toHaveProperty("id", "bravo");
      expect(lb[2]).toHaveProperty("id", "golf");
      expect(lb[3]).toHaveProperty("id", "delta");
      expect(lb[4]).toHaveProperty("id", "alpha");
      expect(lb[5]).toHaveProperty("id", "hotel");
      expect(lb[6]).toHaveProperty("id", "echo");
      expect(lb[7]).toHaveProperty("id", "charlie");
    });

    it("preserves PlayerId slots at the end of leaderboard", () => {
      const engine = TournamentEngine.fromJSON(structuredClone(topTwoFixture));
      // Add a PlayerId slot to leaderboard
      engine.tournament.leaderboard.push({
        kind: "id",
        value: "1-t2m3",
      });

      engine.updateLeaderboardOrder();

      const lb = engine.leaderboard;
      // All user players should be first, then the PlayerId slot at the end
      const userCount = lb.filter((p) => p.kind === "user").length;
      expect(userCount).toBe(8);
      expect(lb[lb.length - 1]).toHaveProperty("kind", "id");
    });
  });
});
