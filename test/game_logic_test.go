package core_test

import (
	"testing"

	"github.com/olaoluwanhs/Tourney/core"
	generated_go "github.com/olaoluwanhs/Tourney/types/generated_go"
)

func TestNewGameInitialState(t *testing.T) {
	g := core.NewGame(2)

	if g.Game.Id == nil {
		t.Fatalf("expected game id to be set")
	}
	if g.Game.ExpectedNumberOfPlayers != 2 {
		t.Fatalf("expected ExpectedNumberOfPlayers 2, got %d", g.Game.ExpectedNumberOfPlayers)
	}
	if len(g.Players) != 0 {
		t.Fatalf("expected 0 players, got %d", len(g.Players))
	}
	if len(g.Scores) != 0 {
		t.Fatalf("expected 0 scores, got %d", len(g.Scores))
	}
}

func TestAddPlayerAndIsFull(t *testing.T) {
	g := core.NewGame(2)

	p1 := &generated_go.Player{
		Kind: generated_go.PlayerKindUser,
		PlayerUser: generated_go.PlayerUser{
			Id:   "p1",
			Name: "Player 1",
		},
	}

	if _, err := g.AddPlayer(p1); err != nil {
		t.Fatalf("unexpected error adding first player: %v", err)
	}
	if len(g.Players) != 1 {
		t.Fatalf("expected 1 player, got %d", len(g.Players))
	}
	if g.IsFull() {
		t.Fatalf("game should not be full after 1 player")
	}

	p2 := &generated_go.Player{
		Kind: generated_go.PlayerKindUser,
		PlayerUser: generated_go.PlayerUser{
			Id:   "p2",
			Name: "Player 2",
		},
	}

	if _, err := g.AddPlayer(p2); err != nil {
		t.Fatalf("unexpected error adding second player: %v", err)
	}
	if !g.IsFull() {
		t.Fatalf("game should be full after 2 players")
	}

	p3 := &generated_go.Player{
		Kind: generated_go.PlayerKindUser,
		PlayerUser: generated_go.PlayerUser{
			Id:   "p3",
			Name: "Player 3",
		},
	}

	if _, err := g.AddPlayer(p3); err == nil {
		t.Fatalf("expected error when adding player to full game, got nil")
	}
}

func TestAddScoreAndGetWinner(t *testing.T) {
	g := core.NewGame(2)

	p1 := &generated_go.Player{Kind: generated_go.PlayerKindUser, PlayerUser: generated_go.PlayerUser{Id: "p1", Name: "Player 1"}}
	p2 := &generated_go.Player{Kind: generated_go.PlayerKindUser, PlayerUser: generated_go.PlayerUser{Id: "p2", Name: "Player 2"}}

	if _, err := g.AddPlayer(p1); err != nil {
		t.Fatalf("add player1: %v", err)
	}
	if _, err := g.AddPlayer(p2); err != nil {
		t.Fatalf("add player2: %v", err)
	}

	if _, err := g.AddScore("p1", 10.5); err != nil {
		t.Fatalf("add score p1: %v", err)
	}
	if _, err := g.AddScore("p2", 20.0); err != nil {
		t.Fatalf("add score p2: %v", err)
	}

	s, ok := g.GetScore("p2")
	if !ok || s != 20.0 {
		t.Fatalf("expected p2 score 20.0, got %v (ok=%v)", s, ok)
	}

	winnerId, winnerScore, ok := g.GetWinner()
	if !ok {
		t.Fatalf("expected a winner, got none")
	}
	if winnerId != "p2" || winnerScore != 20.0 {
		t.Fatalf("unexpected winner: id=%s score=%v", winnerId, winnerScore)
	}
}
