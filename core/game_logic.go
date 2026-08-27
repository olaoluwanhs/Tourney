package core

import (
	"fmt"

	"github.com/google/uuid"
	generated_go "github.com/olaoluwanhs/Tourney/types/generated_go"
)

type GameLogic struct {
	generated_go.Game
}

func NewGame(expectedNumberOfPlayers uint32) *GameLogic {
	u := uuid.New().String()

	g := generated_go.Game{
		Id:                      &u,
		Scores:                  []generated_go.GameScore{},
		ExpectedNumberOfPlayers: expectedNumberOfPlayers,
		Players:                 []generated_go.Player{},
	}

	return &GameLogic{
		Game: g,
	}
}

// AddPlayer adds a player to the game
func (g *GameLogic) AddPlayer(player *generated_go.Player) (*GameLogic, error) {
	if uint32(len(g.Players)) >= g.ExpectedNumberOfPlayers {
		return nil, fmt.Errorf("game is full: expected %d players", g.ExpectedNumberOfPlayers)
	}
	g.Players = append(g.Players, *player)
	return g, nil
}

// IsFull checks if the game has reached the expected number of players
func (g *GameLogic) IsFull() bool {
	return uint32(len(g.Players)) >= g.ExpectedNumberOfPlayers
}

// AddScore adds or updates a score for a player
func (g *GameLogic) AddScore(playerId string, score float32) (*GameLogic, error) {
	for i, s := range g.Scores {
		if s.PlayerId == playerId {
			g.Scores[i].Score = score
			return g, nil
		}
	}
	g.Scores = append(g.Scores, generated_go.GameScore{
		PlayerId: playerId,
		Score:    score,
	})
	return g, nil
}

// GetScore retrieves the score for a specific player
func (g *GameLogic) GetScore(playerId string) (float32, bool) {
	for _, s := range g.Scores {
		if s.PlayerId == playerId {
			return s.Score, true
		}
	}
	return 0, false
}

// GetWinner returns the player with the highest score
func (g *GameLogic) GetWinner() (string, float32, bool) {
	if len(g.Scores) == 0 {
		return "", 0, false
	}

	winner := g.Scores[0]
	for _, s := range g.Scores[1:] {
		if s.Score > winner.Score {
			winner = s
		}
	}
	return winner.PlayerId, winner.Score, true
}

// GetPlayerAtSeat returns the player at the given seat index (1-indexed).
// The seat index corresponds to the player's position in the game's players array,
// independent of their score. Returns false if the index is out of range.
func (g *GameLogic) GetPlayerAtSeat(index int) (*generated_go.Player, bool) {
	if index < 1 || index > len(g.Players) {
		return nil, false
	}
	return &g.Players[index-1], true
}

// IsCompleted checks if the game has all expected players and scores
func (g *GameLogic) IsCompleted() bool {
	if uint32(len(g.Players)) < g.ExpectedNumberOfPlayers {
		return false
	}
	if uint32(len(g.Scores)) < g.ExpectedNumberOfPlayers {
		return false
	}

	if !g.Settled {
		return false
	}

	return true
}
