package core

import (
	"fmt"

	"github.com/google/uuid"
	generated_go "github.com/olaoluwanhs/Tourney/types/generated_go"
)

type DrawLogic struct {
	generated_go.Draws
	Matches []GameLogic
}

func NewDraw(
	round uint8,
	expectedNumberOfMatches uint32,
) *DrawLogic {
	d := generated_go.Draws{
		Round:                   round,
		Id:                      uuid.New().String(),
		ExpectedNumberOfMatches: expectedNumberOfMatches,
	}
	return &DrawLogic{
		Draws:   d,
		Matches: []GameLogic{},
	}
}

func (d *DrawLogic) AddMatchToDraw(
	expectedNumberOfPlayers uint32,
	expectedNumberOfMatches uint32,
) (*DrawLogic, error) {
	game := NewGame(expectedNumberOfPlayers)
	d.Matches = append(d.Matches, GameLogic{
		Game: game.Game,
	})
	return d, nil
}

func (d *DrawLogic) RemoveMatchFromDraw(matchId string) (*DrawLogic, error) {
	for i, match := range d.Matches {
		if match.Game.Id != nil && *match.Game.Id == matchId {
			d.Matches = append(d.Matches[:i], d.Matches[i+1:]...)
			return d, nil
		}
	}
	return nil, fmt.Errorf("match with id %s not found", matchId)
}
