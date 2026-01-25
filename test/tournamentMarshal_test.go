package core_test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/olaoluwanhs/Tourney/core"
	generated_go "github.com/olaoluwanhs/Tourney/types/generated_go"
)

func readJSON(t *testing.T, path string) []byte {
	t.Helper()
	absPath, err := filepath.Abs(path)
	if err != nil {
		t.Fatalf("failed to get absolute path for %s: %v", path, err)
	}
	data, err := os.ReadFile(absPath)
	if err != nil {
		t.Fatalf("failed to read %s: %v", path, err)
	}
	return data
}

var testTournament core.TournamentLogic

func TestMarshalTournamentJsonFromExample(t *testing.T) {
	data := readJSON(t, "json/tournament_example.json")

	var input generated_go.Tournament
	if err := json.Unmarshal(data, &input); err != nil {
		t.Fatalf("failed to unmarshal fixture: %v", err)
	}

	tournament, err := core.MarshalTournamentJson(data)
	if err != nil {
		t.Fatalf("MarshalTournamentJson returned error: %v", err)
	}

	if tournament.Name != input.Name {
		t.Fatalf("expected name %q, got %q", input.Name, tournament.Name)
	}
	if tournament.Status != input.Status {
		t.Fatalf("expected status %q, got %q", input.Status, tournament.Status)
	}
	if tournament.Id == "" {
		t.Fatalf("expected generated tournament id to be set")
	}
	if tournament.Id == input.Id {
		t.Fatalf("expected new tournament id to differ from fixture id; got %s", tournament.Id)
	}
	if len(tournament.Draws) != 0 {
		t.Fatalf("MarshalTournamentJson should not populate draws; got %d", len(tournament.Draws))
	}
	if len(tournament.Leaderboard) != 0 {
		t.Fatalf("MarshalTournamentJson should not populate leaderboard; got %d", len(tournament.Leaderboard))
	}

	testTournament = *tournament

	// Print the tournament for visual inspection (optional)
	t.Logf("Marshalled Tournament: %+v", tournament)
}

func TestAddAndRemoveDrawUsingFixture(t *testing.T) {
	data := readJSON(t, "json/draws_example.json")

	var draw generated_go.Draws
	if err := json.Unmarshal(data, &draw); err != nil {
		t.Fatalf("failed to unmarshal draw fixture: %v", err)
	}

	drawLogic := &core.DrawLogic{Draws: draw}

	var tournament *core.TournamentLogic

	if testTournament.Id != "" {
		tournament = &testTournament
	} else {
		tournament = core.NewTournament("Test Tournament", generated_go.TournamentStatusTournamentStatusScheduled)
	}

	if _, err := tournament.AddDraw(drawLogic); err != nil {
		t.Fatalf("AddDraw returned error: %v", err)
	}
	if got := len(tournament.Draws); got != 1 {
		t.Fatalf("expected 1 draw after add, got %d", got)
	}

	if _, err := tournament.RemoveDraw(drawLogic.Id); err != nil {
		t.Fatalf("RemoveDraw returned error: %v", err)
	}
	if got := len(tournament.Draws); got != 0 {
		t.Fatalf("expected 0 draws after remove, got %d", got)
	}

	if _, err := tournament.RemoveDraw(drawLogic.Id); err == nil {
		t.Fatalf("expected error when removing non-existent draw id")
	}

	// Print the tournament for visual inspection (optional)
	t.Logf("Marshalled Tournament: %+v", tournament)
}

func TestUpdateStatus(t *testing.T) {

	var tournament *core.TournamentLogic

	if testTournament.Id != "" {
		tournament = &testTournament
	} else {
		tournament = core.NewTournament("Test Tournament", generated_go.TournamentStatusTournamentStatusScheduled)
	}

	if _, err := tournament.UpdateStatus(generated_go.TournamentStatusTournamentStatusCompleted); err != nil {
		t.Fatalf("UpdateStatus returned error: %v", err)
	}
	if tournament.Status != generated_go.TournamentStatusTournamentStatusCompleted {
		t.Fatalf("expected status to be updated to %q, got %q", generated_go.TournamentStatusTournamentStatusCompleted, tournament.Status)
	}

	// Print the tournament for visual inspection (optional)
	t.Logf("Marshalled Tournament: %+v", tournament)
}
