package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"

	"github.com/olaoluwanhs/Tourney/core"
	generated_go "github.com/olaoluwanhs/Tourney/types/generated_go"
)

type wasmResult struct {
	OK    bool        `json:"ok"`
	Value interface{} `json:"value,omitempty"`
	Error string      `json:"error,omitempty"`
}

// var tournaments = map[string]*core.TournamentLogic{}

func ok(value interface{}) js.Value {
	payload, _ := json.Marshal(wasmResult{OK: true, Value: value})
	return js.ValueOf(string(payload))
}

func fail(err error) js.Value {
	payload, _ := json.Marshal(wasmResult{OK: false, Error: err.Error()})
	return js.ValueOf(string(payload))
}

// func argString(args []js.Value, index int) (string, error) {
// 	if len(args) <= index {
// 		return "", fmt.Errorf("missing arg %d", index)
// 	}
// 	return args[index].String(), nil
// }

// func argInt(args []js.Value, index int) (int, error) {
// 	if len(args) <= index {
// 		return 0, fmt.Errorf("missing arg %d", index)
// 	}
// 	return args[index].Int(), nil
// }

// func argFloat(args []js.Value, index int) (float64, error) {
// 	if len(args) <= index {
// 		return 0, fmt.Errorf("missing arg %d", index)
// 	}
// 	return args[index].Float(), nil
// }

// func requireTournament(id string) (*core.TournamentLogic, error) {
// 	t, ok := tournaments[id]
// 	if !ok {
// 		return nil, fmt.Errorf("tournament with id %s not found", id)
// 	}
// 	return t, nil
// }

// func findDrawByID(drawId string) (*core.TournamentLogic, *core.DrawLogic, error) {
// 	for _, tournament := range tournaments {
// 		for i := range tournament.Draws {
// 			if tournament.Draws[i].Id == drawId {
// 				return tournament, &tournament.Draws[i], nil
// 			}
// 		}
// 	}
// 	return nil, nil, fmt.Errorf("draw with id %s not found", drawId)
// }

// func findGameByID(gameId string) (*core.TournamentLogic, *core.GameLogic, error) {
// 	for _, tournament := range tournaments {
// 		for i := range tournament.Draws {
// 			for j := range tournament.Draws[i].Matches {
// 				match := &tournament.Draws[i].Matches[j]
// 				if match.Game.Id != nil && *match.Game.Id == gameId {
// 					return tournament, match, nil
// 				}
// 			}
// 		}
// 	}
// 	return nil, nil, fmt.Errorf("game with id %s not found", gameId)
// }

func buildTournamentPayload(t *core.TournamentLogic) generated_go.Tournament {
	// What this function does:
	// 1. It takes a pointer to a core.TournamentLogic struct as input.
	// 2. It constructs a new generated_go.Tournament struct by mapping the fields from the input struct to the corresponding fields in the output struct.
	// 3. It returns the constructed generated_go.Tournament struct.

	draws := make([]generated_go.Draws, 0, len(t.Draws))
	for _, draw := range t.Draws {
		matches := make([]generated_go.DrawsMatch, 0, len(draw.Matches))
		for _, match := range draw.Matches {
			matches = append(matches, generated_go.DrawsMatch{Game: match.Game})
		}
		draws = append(draws, generated_go.Draws{
			ExpectedNumberOfMatches: draw.ExpectedNumberOfMatches,
			Id:                      draw.Id,
			Matches:                 matches,
			Round:                   draw.Round,
		})
	}

	return generated_go.Tournament{
		Draws:       draws,
		Id:          t.Id,
		Leaderboard: t.Leaderboard,
		Name:        t.Name,
		Status:      t.Status,
	}
}

func marshalPayload(value interface{}) (string, error) {
	payload, err := json.Marshal(value)
	if err != nil {
		return "", err
	}
	return string(payload), nil
}

func register() {
	js.Global().Set("progressTournamentObject", js.FuncOf(func(this js.Value, args []js.Value) interface{} {

		// Accept a JSON string representing the tournament object
		if len(args) < 1 {
			return fail(fmt.Errorf("missing tournament object argument"))
		}
		tournamentJSON := args[0].String()

		// Unmarshal the JSON into a TournamentLogic struct
		var tournament core.TournamentLogic
		err := json.Unmarshal([]byte(tournamentJSON), &tournament)
		if err != nil {
			return fail(fmt.Errorf("failed to unmarshal tournament object: %w", err))
		}

		// progress the tournament to the next stage
		err = tournament.ProgressTournamentLogic()
		if err != nil {
			return fail(fmt.Errorf("Failed to progress tournament: %w", err))
		}

		// Marshal the updated tournament back to JSON
		updatedTournamentJSON, err := marshalPayload(buildTournamentPayload(&tournament))
		if err != nil {
			return fail(fmt.Errorf("failed to marshal updated tournament object: %w", err))
		}

		// Return the updated tournament JSON string
		return ok(updatedTournamentJSON)
	}))

	js.Global().Set("updateTournamentLeaderboard", js.FuncOf(func(this js.Value, args []js.Value) interface{} {

		// Accept a JSON string representing the tournament object
		if len(args) < 1 {
			return fail(fmt.Errorf("missing tournament object argument"))
		}
		tournamentJSON := args[0].String()

		// Unmarshal the JSON into a TournamentLogic struct
		var tournament core.TournamentLogic
		err := json.Unmarshal([]byte(tournamentJSON), &tournament)
		if err != nil {
			return fail(fmt.Errorf("failed to unmarshal tournament object: %w", err))
		}

		// progress the tournament to the next stage
		err = tournament.UpdateLeadersBoardOrder()
		if err != nil {
			return fail(fmt.Errorf("failed to update leaderboard order: %w", err))
		}

		// Marshal the updated tournament back to JSON
		updatedTournamentJSON, err := marshalPayload(buildTournamentPayload(&tournament))
		if err != nil {
			return fail(fmt.Errorf("failed to marshal updated tournament object: %w", err))
		}

		// Return the updated tournament JSON string
		return ok(updatedTournamentJSON)
	}))
}

func main() {
	register()
	select {}
}
