package core

import (
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	generated_go "github.com/olaoluwanhs/Tourney/types/generated_go"
)

type TournamentLogic struct {
	generated_go.Tournament
	Draws []DrawLogic
}

func NewTournament(name string, status generated_go.TournamentStatus) *TournamentLogic {
	t := generated_go.Tournament{
		Name:        name,
		Status:      status,
		Id:          uuid.New().String(),
		Leaderboard: []generated_go.Player{},
	}

	return &TournamentLogic{
		Tournament: t,
		Draws:      []DrawLogic{},
	}
}

func (t *TournamentLogic) AddDraw(draw *DrawLogic) (*TournamentLogic, error) {
	t.Draws = append(t.Draws, *draw)
	return t, nil
}

func (t *TournamentLogic) RemoveDraw(drawId string) (*TournamentLogic, error) {
	for i, draw := range t.Draws {
		if draw.Id == drawId {
			t.Draws = append(t.Draws[:i], t.Draws[i+1:]...)
			return t, nil
		}
	}
	return nil, fmt.Errorf("draw with id %s not found", drawId)
}

func (t *TournamentLogic) UpdateStatus(status generated_go.TournamentStatus) (*TournamentLogic, error) {
	t.Status = status
	return t, nil
}

// Write function for marshalling json into a full TournamentLogic struct instance
func MarshalTournamentJson(tournamentJson []byte) (*TournamentLogic, error) {
	var tournament generated_go.Tournament
	err := json.Unmarshal(tournamentJson, &tournament)
	if err != nil {
		return nil, err
	}
	newTournament := NewTournament(tournament.Name, tournament.Status)
	return newTournament, nil
}
