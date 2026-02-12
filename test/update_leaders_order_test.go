package core_test

import (
	"encoding/json"
	"testing"

	generated_go "github.com/olaoluwanhs/Tourney/types/generated_go"
	"github.com/olaoluwanhs/Tourney/utils"
)

func TestUpdateLeadersBoardOrder(t *testing.T) {
	data := readJSON(t, "json/tournament_progress_example.json")

	var tournamentData []generated_go.Tournament
	if err := json.Unmarshal(data, &tournamentData); err != nil {
		t.Fatalf("failed to unmarshal tournament fixture: %v", err)
	}

	// Build tournament logic
	tournament := buildTournamentLogic(tournamentData[0])

	// Get initial leaderboard order
	t.Logf("Initial leaderboard order:")
	for i, player := range tournament.Leaderboard {
		if player.Kind == "user" {
			t.Logf("  %d. %s (ID: %s)", i+1, player.PlayerUser.Name, player.PlayerUser.Id)
		}
	}

	// Update leaderboard order
	if err := tournament.UpdateLeadersBoardOrder(); err != nil {
		t.Fatalf("UpdateLeadersBoardOrder returned error: %v", err)
	}

	// Log updated leaderboard order
	t.Logf("Updated leaderboard order:")
	for i, player := range tournament.Leaderboard {
		if player.Kind == "user" {
			t.Logf("  %d. %s (ID: %s)", i+1, player.PlayerUser.Name, player.PlayerUser.Id)
		}
	}

	// Export the result to a JSON file
	resultData, err := json.MarshalIndent(tournament.Tournament, "", "  ")
	if err != nil {
		t.Fatalf("failed to marshal tournament result: %v", err)
	}

	utils.WriteFile("results/update_leaders_order_result.json", resultData)
	t.Logf("Result exported to results/update_leaders_order_result.json")
}
