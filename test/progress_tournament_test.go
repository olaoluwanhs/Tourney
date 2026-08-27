package core_test

import (
	"encoding/json"
	"testing"

	"github.com/olaoluwanhs/Tourney/core"
	generated_go "github.com/olaoluwanhs/Tourney/types/generated_go"
	"github.com/olaoluwanhs/Tourney/utils"
)

func loadProgressTournamentFixtures(t *testing.T) []core.TournamentLogic {
	t.Helper()

	data := readJSON(t, "json/tournament_progress_example.json")

	var tournaments []generated_go.Tournament
	if err := json.Unmarshal(data, &tournaments); err != nil {
		t.Fatalf("failed to unmarshal tournament progress fixture: %v", err)
	}

	logicTournaments := make([]core.TournamentLogic, 0, len(tournaments))
	for _, tournament := range tournaments {
		logicTournaments = append(logicTournaments, buildTournamentLogic(tournament))
	}

	return logicTournaments
}

func buildTournamentLogic(tournament generated_go.Tournament) core.TournamentLogic {
	logic := core.TournamentLogic{
		Tournament: tournament,
		Draws:      make([]core.DrawLogic, 0, len(tournament.Draws)),
	}

	for _, draw := range tournament.Draws {
		drawLogic := core.DrawLogic{
			Draws:   draw,
			Matches: make([]core.GameLogic, 0, len(draw.Matches)),
		}
		for _, match := range draw.Matches {
			drawLogic.Matches = append(drawLogic.Matches, core.GameLogic{Game: match.Game})
		}
		logic.Draws = append(logic.Draws, drawLogic)
	}

	return logic
}

func assertUserPlayer(t *testing.T, player generated_go.Player, expectedId, expectedName, expectedImage string) {
	t.Helper()

	if player.Kind != generated_go.PlayerKindUser {
		t.Fatalf("expected player kind %q, got %q", generated_go.PlayerKindUser, player.Kind)
	}
	if player.PlayerUser.Id != expectedId {
		t.Fatalf("expected player id %q, got %q", expectedId, player.PlayerUser.Id)
	}
	if player.PlayerUser.Name != expectedName {
		t.Fatalf("expected player name %q, got %q", expectedName, player.PlayerUser.Name)
	}
	if *player.PlayerUser.AssociatedImage != expectedImage {
		t.Fatalf("expected player image %q, got %q", expectedImage, *player.PlayerUser.AssociatedImage)
	}
}

func TestProgressTournament_KnockoutFixture(t *testing.T) {
	tournaments := loadProgressTournamentFixtures(t)
	if len(tournaments) < 1 {
		t.Fatalf("expected at least 1 tournament fixture")
	}

	tournament := tournaments[0]
	if len(tournament.Draws) < 2 {
		t.Fatalf("expected at least 2 draws in knockout fixture")
	}

	// Mark draw 2 as incomplete to force progression.
	tournament.Draws[1].ExpectedNumberOfMatches = 3

	if err := tournament.ProgressTournamentLogic(); err != nil {
		t.Fatalf("ProgressTournamentLogic returned error: %v", err)
	}

	// Export the json of the progressed tournament into a file
	progressedTournamentJSON, err := json.MarshalIndent(tournament, "", " ")
	if err != nil {
		t.Fatalf("failed to marshal progressed tournament: %v", err)
	}
	utils.WriteFile("results/progress_tournament_result.json", progressedTournamentJSON)

	matchOnePlayers := tournament.Draws[1].Matches[0].Game.Players
	if len(matchOnePlayers) != 2 {
		t.Fatalf("expected 2 players in draw 2 match 1, got %d", len(matchOnePlayers))
	}
	assertUserPlayer(t, matchOnePlayers[0], "player-1", "Ava", "https://example.com/images/player-1.png")
	assertUserPlayer(t, matchOnePlayers[1], "player-4", "Maya", "https://example.com/images/player-4.png")

	matchTwoPlayers := tournament.Draws[1].Matches[1].Game.Players
	if len(matchTwoPlayers) != 2 {
		t.Fatalf("expected 2 players in draw 2 match 2, got %d", len(matchTwoPlayers))
	}
	assertUserPlayer(t, matchTwoPlayers[0], "player-5", "Zoe", "https://example.com/images/player-5.png")
	assertUserPlayer(t, matchTwoPlayers[1], "player-8", "Nora", "https://example.com/images/player-8.png")
}

func TestProgressTournament_TopTwoAdvanceFixture(t *testing.T) {
	tournaments := loadProgressTournamentFixtures(t)
	if len(tournaments) < 2 {
		t.Fatalf("expected at least 2 tournament fixtures")
	}

	tournament := tournaments[1]
	if len(tournament.Draws) < 2 {
		t.Fatalf("expected at least 2 draws in top-two fixture")
	}

	// Mark draw 2 as incomplete to force progression.
	tournament.Draws[1].ExpectedNumberOfMatches = 2

	if err := tournament.ProgressTournamentLogic(); err != nil {
		t.Fatalf("ProgressTournamentLogic returned error: %v", err)
	}

	// Export the json of the progressed tournament into a file
	progressedTournamentJSON, err := json.MarshalIndent(tournament, "", " ")
	if err != nil {
		t.Fatalf("failed to marshal progressed tournament: %v", err)
	}
	utils.WriteFile("results/progress_tournament_result.json", progressedTournamentJSON)

	players := tournament.Draws[1].Matches[0].Game.Players
	if len(players) != 4 {
		t.Fatalf("expected 4 players in draw 2 match 1, got %d", len(players))
	}
	assertUserPlayer(t, players[0], "bravo", "Ben", "https://example.com/images/bravo.png")
	assertUserPlayer(t, players[1], "delta", "Drew", "https://example.com/images/delta.png")
	assertUserPlayer(t, players[2], "foxtrot", "Finn", "https://example.com/images/foxtrot.png")
	assertUserPlayer(t, players[3], "golf", "Gia", "https://example.com/images/golf.png")
}

func TestProgressTournament_SeatPlacementFixture(t *testing.T) {
	tournaments := loadProgressTournamentFixtures(t)
	if len(tournaments) < 3 {
		t.Fatalf("expected at least 3 tournament fixtures")
	}

	tournament := tournaments[2]
	if len(tournament.Draws) < 2 {
		t.Fatalf("expected at least 2 draws in seat placement fixture")
	}

	// Mark draw 2 as incomplete to force progression.
	tournament.Draws[1].ExpectedNumberOfMatches = 2

	if err := tournament.ProgressTournamentLogic(); err != nil {
		t.Fatalf("ProgressTournamentLogic returned error: %v", err)
	}

	// Export the json of the progressed tournament into a file
	progressedTournamentJSON, err := json.MarshalIndent(tournament, "", " ")
	if err != nil {
		t.Fatalf("failed to marshal progressed tournament: %v", err)
	}
	utils.WriteFile("results/progress_tournament_result.json", progressedTournamentJSON)

	// t3m5: seat-1-t3m1 → seat 1 of t3m1 = Ava (player-1)
	//        seat-2-t3m2 → seat 2 of t3m2 = Maya (player-4)
	matchOnePlayers := tournament.Draws[1].Matches[0].Game.Players
	if len(matchOnePlayers) != 2 {
		t.Fatalf("expected 2 players in draw 2 match 1, got %d", len(matchOnePlayers))
	}
	assertUserPlayer(t, matchOnePlayers[0], "player-1", "Ava", "https://example.com/images/player-1.png")
	assertUserPlayer(t, matchOnePlayers[1], "player-4", "Maya", "https://example.com/images/player-4.png")

	// t3m6: seat-1-t3m3 → seat 1 of t3m3 = Zoe (player-5)
	//        seat-2-t3m4 → seat 2 of t3m4 = Nora (player-8)
	matchTwoPlayers := tournament.Draws[1].Matches[1].Game.Players
	if len(matchTwoPlayers) != 2 {
		t.Fatalf("expected 2 players in draw 2 match 2, got %d", len(matchTwoPlayers))
	}
	assertUserPlayer(t, matchTwoPlayers[0], "player-5", "Zoe", "https://example.com/images/player-5.png")
	assertUserPlayer(t, matchTwoPlayers[1], "player-8", "Nora", "https://example.com/images/player-8.png")
}
