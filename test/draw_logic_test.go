package core_test

import (
	"testing"

	"github.com/olaoluwanhs/Tourney/core"
)

func TestNewDrawInitialState(t *testing.T) {
	d := core.NewDraw(1, 3)

	if d.Id == "" {
		t.Fatalf("expected draw id to be set")
	}
	if d.Round != 1 {
		t.Fatalf("expected round 1, got %d", d.Round)
	}
	if d.ExpectedNumberOfMatches != 3 {
		t.Fatalf("expected ExpectedNumberOfMatches 3, got %d", d.ExpectedNumberOfMatches)
	}
	if len(d.Matches) != 0 {
		t.Fatalf("expected 0 matches, got %d", len(d.Matches))
	}
}

func TestAddAndRemoveMatch(t *testing.T) {
	d := core.NewDraw(1, 3)

	// add a match
	if _, err := d.AddMatchToDraw(2, 3); err != nil {
		t.Fatalf("unexpected error adding match: %v", err)
	}
	if len(d.Matches) != 1 {
		t.Fatalf("expected 1 match, got %d", len(d.Matches))
	}

	// capture id and remove
	matchId := ""
	if d.Matches[0].Game.Id != nil {
		matchId = *d.Matches[0].Game.Id
	}
	if matchId == "" {
		t.Fatalf("expected match id to be set")
	}

	if _, err := d.RemoveMatchFromDraw(matchId); err != nil {
		t.Fatalf("unexpected error removing match: %v", err)
	}
	if len(d.Matches) != 0 {
		t.Fatalf("expected 0 matches after removal, got %d", len(d.Matches))
	}

	// removing non-existent match should error
	if _, err := d.RemoveMatchFromDraw("non-existent-id"); err == nil {
		t.Fatalf("expected error when removing non-existent match, got nil")
	}
}

func TestAddMatchCreatesGameWithExpectedPlayers(t *testing.T) {
	d := core.NewDraw(2, 1)
	if _, err := d.AddMatchToDraw(4, 1); err != nil {
		t.Fatalf("add match: %v", err)
	}
	if len(d.Matches) != 1 {
		t.Fatalf("expected 1 match, got %d", len(d.Matches))
	}
	g := d.Matches[0].Game
	if g.ExpectedNumberOfPlayers != 4 {
		t.Fatalf("expected game to have 4 expected players, got %d", g.ExpectedNumberOfPlayers)
	}
	// ensure scores slice exists
	if g.Scores == nil {
		t.Fatalf("expected Scores slice to be initialized")
	}
	// ensure players slice exists (should be empty)
	if g.Players == nil {
		t.Fatalf("expected Players slice to be initialized")
	}
	// type-check by adding a score via method on GameLogic wrapper
	gl := core.GameLogic{Game: g}
	if _, err := gl.AddScore("p1", 5.0); err != nil {
		t.Fatalf("add score to match game: %v", err)
	}
	s, ok := gl.GetScore("p1")
	if !ok || s != 5.0 {
		t.Fatalf("expected score 5.0 for p1, got %v (ok=%v)", s, ok)
	}
}
