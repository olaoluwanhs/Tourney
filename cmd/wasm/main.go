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

var tournaments = map[string]*core.TournamentLogic{}

func ok(value interface{}) js.Value {
	payload, _ := json.Marshal(wasmResult{OK: true, Value: value})
	return js.ValueOf(string(payload))
}

func fail(err error) js.Value {
	payload, _ := json.Marshal(wasmResult{OK: false, Error: err.Error()})
	return js.ValueOf(string(payload))
}

func argString(args []js.Value, index int) (string, error) {
	if len(args) <= index {
		return "", fmt.Errorf("missing arg %d", index)
	}
	return args[index].String(), nil
}

func argInt(args []js.Value, index int) (int, error) {
	if len(args) <= index {
		return 0, fmt.Errorf("missing arg %d", index)
	}
	return args[index].Int(), nil
}

func argFloat(args []js.Value, index int) (float64, error) {
	if len(args) <= index {
		return 0, fmt.Errorf("missing arg %d", index)
	}
	return args[index].Float(), nil
}

func requireTournament(id string) (*core.TournamentLogic, error) {
	t, ok := tournaments[id]
	if !ok {
		return nil, fmt.Errorf("tournament with id %s not found", id)
	}
	return t, nil
}

func findDrawByID(drawId string) (*core.TournamentLogic, *core.DrawLogic, error) {
	for _, tournament := range tournaments {
		for i := range tournament.Draws {
			if tournament.Draws[i].Id == drawId {
				return tournament, &tournament.Draws[i], nil
			}
		}
	}
	return nil, nil, fmt.Errorf("draw with id %s not found", drawId)
}

func findGameByID(gameId string) (*core.TournamentLogic, *core.GameLogic, error) {
	for _, tournament := range tournaments {
		for i := range tournament.Draws {
			for j := range tournament.Draws[i].Matches {
				match := &tournament.Draws[i].Matches[j]
				if match.Game.Id != nil && *match.Game.Id == gameId {
					return tournament, match, nil
				}
			}
		}
	}
	return nil, nil, fmt.Errorf("game with id %s not found", gameId)
}

func buildTournamentPayload(t *core.TournamentLogic) generated_go.Tournament {
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
	js.Global().Set("tourneyNewTournament", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		name, err := argString(args, 0)
		if err != nil {
			return fail(err)
		}
		statusString, err := argString(args, 1)
		if err != nil {
			return fail(err)
		}

		tournament := core.NewTournament(name, generated_go.TournamentStatus(statusString))
		tournaments[tournament.Id] = tournament
		return ok(tournament.Id)
	}))

	js.Global().Set("tourneyTournamentFromJSON", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		payload, err := argString(args, 0)
		if err != nil {
			return fail(err)
		}

		var tournamentPayload generated_go.Tournament
		if err := json.Unmarshal([]byte(payload), &tournamentPayload); err != nil {
			return fail(err)
		}

		tournament := core.NewTournament(tournamentPayload.Name, tournamentPayload.Status)
		tournament.Id = tournamentPayload.Id
		tournament.Leaderboard = tournamentPayload.Leaderboard

		tournament.Draws = make([]core.DrawLogic, 0, len(tournamentPayload.Draws))
		for _, draw := range tournamentPayload.Draws {
			drawLogic := core.DrawLogic{Draws: draw, Matches: []core.GameLogic{}}
			for _, match := range draw.Matches {
				drawLogic.Matches = append(drawLogic.Matches, core.GameLogic{Game: match.Game})
			}
			tournament.Draws = append(tournament.Draws, drawLogic)
		}

		tournaments[tournament.Id] = tournament
		return ok(tournament.Id)
	}))

	js.Global().Set("tourneyTournamentAddDraw", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		tournamentId, err := argString(args, 0)
		if err != nil {
			return fail(err)
		}
		round, err := argInt(args, 1)
		if err != nil {
			return fail(err)
		}
		expectedMatches, err := argInt(args, 2)
		if err != nil {
			return fail(err)
		}

		tournament, err := requireTournament(tournamentId)
		if err != nil {
			return fail(err)
		}

		draw := core.NewDraw(uint8(round), uint32(expectedMatches))
		_, err = tournament.AddDraw(draw)
		if err != nil {
			return fail(err)
		}
		return ok(draw.Id)
	}))

	js.Global().Set("tourneyTournamentRemoveDraw", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		tournamentId, err := argString(args, 0)
		if err != nil {
			return fail(err)
		}
		drawId, err := argString(args, 1)
		if err != nil {
			return fail(err)
		}

		tournament, err := requireTournament(tournamentId)
		if err != nil {
			return fail(err)
		}

		_, err = tournament.RemoveDraw(drawId)
		if err != nil {
			return fail(err)
		}
		return ok(nil)
	}))

	js.Global().Set("tourneyTournamentUpdateStatus", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		tournamentId, err := argString(args, 0)
		if err != nil {
			return fail(err)
		}
		statusString, err := argString(args, 1)
		if err != nil {
			return fail(err)
		}

		tournament, err := requireTournament(tournamentId)
		if err != nil {
			return fail(err)
		}

		_, err = tournament.UpdateStatus(generated_go.TournamentStatus(statusString))
		if err != nil {
			return fail(err)
		}
		return ok(nil)
	}))

	js.Global().Set("tourneyTournamentProgress", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		tournamentId, err := argString(args, 0)
		if err != nil {
			return fail(err)
		}

		tournament, err := requireTournament(tournamentId)
		if err != nil {
			return fail(err)
		}

		if err := tournament.ProgressTournamentLogic(); err != nil {
			return fail(err)
		}
		return ok(nil)
	}))

	js.Global().Set("tourneyTournamentMarshal", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		tournamentId, err := argString(args, 0)
		if err != nil {
			return fail(err)
		}

		tournament, err := requireTournament(tournamentId)
		if err != nil {
			return fail(err)
		}

		payload, err := marshalPayload(buildTournamentPayload(tournament))
		if err != nil {
			return fail(err)
		}
		return ok(payload)
	}))

	js.Global().Set("tourneyTournamentFindMatch", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		tournamentId, err := argString(args, 0)
		if err != nil {
			return fail(err)
		}
		matchId, err := argString(args, 1)
		if err != nil {
			return fail(err)
		}

		tournament, err := requireTournament(tournamentId)
		if err != nil {
			return fail(err)
		}

		var match *core.GameLogic
		for i := range tournament.Draws {
			for j := range tournament.Draws[i].Matches {
				candidate := &tournament.Draws[i].Matches[j]
				if candidate.Game.Id != nil && *candidate.Game.Id == matchId {
					match = candidate
					break
				}
			}
			if match != nil {
				break
			}
		}
		if match == nil {
			return fail(fmt.Errorf("match with id %s not found in tournament", matchId))
		}

		payload, err := marshalPayload(match.Game)
		if err != nil {
			return fail(err)
		}
		return ok(payload)
	}))

	js.Global().Set("tourneyTournamentFindDraw", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		tournamentId, err := argString(args, 0)
		if err != nil {
			return fail(err)
		}
		drawId, err := argString(args, 1)
		if err != nil {
			return fail(err)
		}

		tournament, err := requireTournament(tournamentId)
		if err != nil {
			return fail(err)
		}

		var draw *core.DrawLogic
		for i := range tournament.Draws {
			if tournament.Draws[i].Id == drawId {
				draw = &tournament.Draws[i]
				break
			}
		}
		if draw == nil {
			return fail(fmt.Errorf("draw with id %s not found in tournament", drawId))
		}

		matches := make([]generated_go.DrawsMatch, 0, len(draw.Matches))
		for _, match := range draw.Matches {
			matches = append(matches, generated_go.DrawsMatch{Game: match.Game})
		}

		payload, err := marshalPayload(generated_go.Draws{
			ExpectedNumberOfMatches: draw.ExpectedNumberOfMatches,
			Id:                      draw.Id,
			Matches:                 matches,
			Round:                   draw.Round,
		})
		if err != nil {
			return fail(err)
		}
		return ok(payload)
	}))

	js.Global().Set("tourneyDrawAddMatch", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		drawId, err := argString(args, 0)
		if err != nil {
			return fail(err)
		}
		expectedPlayers, err := argInt(args, 1)
		if err != nil {
			return fail(err)
		}

		_, draw, err := findDrawByID(drawId)
		if err != nil {
			return fail(err)
		}

		_, err = draw.AddMatchToDraw(uint32(expectedPlayers), draw.ExpectedNumberOfMatches)
		if err != nil {
			return fail(err)
		}
		if len(draw.Matches) == 0 || draw.Matches[len(draw.Matches)-1].Game.Id == nil {
			return fail(fmt.Errorf("match id missing after add"))
		}
		return ok(*draw.Matches[len(draw.Matches)-1].Game.Id)
	}))

	js.Global().Set("tourneyDrawRemoveMatch", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		drawId, err := argString(args, 0)
		if err != nil {
			return fail(err)
		}
		matchId, err := argString(args, 1)
		if err != nil {
			return fail(err)
		}

		_, draw, err := findDrawByID(drawId)
		if err != nil {
			return fail(err)
		}

		_, err = draw.RemoveMatchFromDraw(matchId)
		if err != nil {
			return fail(err)
		}
		return ok(nil)
	}))

	js.Global().Set("tourneyGameAddPlayer", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		gameId, err := argString(args, 0)
		if err != nil {
			return fail(err)
		}
		playerJSON, err := argString(args, 1)
		if err != nil {
			return fail(err)
		}

		_, game, err := findGameByID(gameId)
		if err != nil {
			return fail(err)
		}

		var player generated_go.Player
		if err := json.Unmarshal([]byte(playerJSON), &player); err != nil {
			return fail(err)
		}

		_, err = game.AddPlayer(&player)
		if err != nil {
			return fail(err)
		}
		return ok(nil)
	}))

	js.Global().Set("tourneyGameAddScore", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		gameId, err := argString(args, 0)
		if err != nil {
			return fail(err)
		}
		playerId, err := argString(args, 1)
		if err != nil {
			return fail(err)
		}
		score, err := argFloat(args, 2)
		if err != nil {
			return fail(err)
		}

		_, game, err := findGameByID(gameId)
		if err != nil {
			return fail(err)
		}

		_, err = game.AddScore(playerId, float32(score))
		if err != nil {
			return fail(err)
		}
		return ok(nil)
	}))

	js.Global().Set("tourneyGameGetScore", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		gameId, err := argString(args, 0)
		if err != nil {
			return fail(err)
		}
		playerId, err := argString(args, 1)
		if err != nil {
			return fail(err)
		}

		_, game, err := findGameByID(gameId)
		if err != nil {
			return fail(err)
		}

		score, found := game.GetScore(playerId)
		if !found {
			return ok(nil)
		}
		return ok(score)
	}))

	js.Global().Set("tourneyGameGetWinner", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		gameId, err := argString(args, 0)
		if err != nil {
			return fail(err)
		}

		_, game, err := findGameByID(gameId)
		if err != nil {
			return fail(err)
		}

		playerId, score, found := game.GetWinner()
		if !found {
			return ok(nil)
		}
		return ok(map[string]interface{}{
			"playerId": playerId,
			"score":    score,
		})
	}))

	js.Global().Set("tourneyGameIsCompleted", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		gameId, err := argString(args, 0)
		if err != nil {
			return fail(err)
		}

		_, game, err := findGameByID(gameId)
		if err != nil {
			return fail(err)
		}

		return ok(game.IsCompleted())
	}))

	js.Global().Set("tourneyGameIsFull", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		gameId, err := argString(args, 0)
		if err != nil {
			return fail(err)
		}

		_, game, err := findGameByID(gameId)
		if err != nil {
			return fail(err)
		}

		return ok(game.IsFull())
	}))
}

func main() {
	register()
	select {}
}
