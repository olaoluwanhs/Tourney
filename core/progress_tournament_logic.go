package core

import (
	"fmt"
	"log"
	"slices"
	"strconv"
	"strings"

	"github.com/bube054/go-js-array-methods/array"
	generated_go "github.com/olaoluwanhs/Tourney/types/generated_go"
)

func (t *TournamentLogic) ProgressTournamentLogic() error {
	stageProgressionInteger := 0
	// Get the current draws
	draws := &t.Draws

	// Loop through each draw and find the one that hasn't been completed
	for drawIdx := range *draws {
		draw := &(*draws)[drawIdx]

		if stageProgressionInteger < 2 {
			stageProgressionInteger++
		} else {
			continue
		}

		var completedMatches []GameLogic
		for _, match := range draw.Matches {
			if match.IsCompleted() {
				completedMatches = append(completedMatches, match)
			}
		}
		log.Printf("Draw %s has %d completed matches out of %d expected matches", draw.Id, len(completedMatches), draw.ExpectedNumberOfMatches)
		if len(completedMatches) >= int(draw.ExpectedNumberOfMatches) {
			// Draw is complete, skip to the next one
			log.Printf("Draw %s is complete with %d completed matches, skipping to the next draw", draw.Id, len(completedMatches))
			stageProgressionInteger = 1
			continue
		}

		// Found the draw that needs to be progressed into i.e create the matches for this draw

		// I am going to make ensutre that all draws have matches filled with the players from the previous draw, so that when we progress the tournament, we can easily identify the matches that need to be created for the current draw and add them to the current draw
		// If no matches let's return an error, because we can't progress the tournament without matches in the current draw
		if len(draw.Matches) == 0 {
			return ReturnError(ErrNoMatchesInDraw, string("Draw ID: "+draw.Id))
		}

		// Check for matches that already had predefined players from the previous draw winners or loosers, if so, create the match with those players and add it to the draw

		// e.g match player 1 is the winner of match 1 from the previous draw, match player 2 is the loser of match 2 from the previous draw, then create a match with those players and add it to the current draw (e.g player[1] = 1-<matchId>, player[2] = 2-<matchId>, player[n] = n-<matchId>)

		// Above example just means that the player in the current match is the player with score position of n in the match of specified match id from any draw, where n is the position of the player in the match (e.g player 1 is the winner, player 2 is the loser, player 3 is the third place, etc) and match id is the id of the match in the previous draw that this player is coming from

		for matchIdx := range draw.Matches {
			match := &draw.Matches[matchIdx]
			// Check if the match has predefined players from the previous draw
			if array.Some(match.Players, func(p generated_go.Player, ind int, list []generated_go.Player) bool {
				return p.Kind == "id" && p.Value == "" // This means no player has been assigned and the value of the player definition is not available, so we need to return an error because we can't progress the tournament without knowing the players in the matches
			}) {
				return ReturnError(ErrPlayerDefinitionMissing, string("Match ID: "+*match.Game.Id))
			}

			// If the match has predefined players, we can create the match with those players and add it to the current draws
			for playerIdx := range match.Players {
				p := &match.Players[playerIdx]
				if p.Kind == "id" {
					previousMatchDetails := strings.Split(p.Value, "-") // (e.g "1-<matchId>", ["1", "<matchId>"])

					if len(previousMatchDetails) != 2 {
						errorMsg := fmt.Sprintf("Invalid player definition %s, expected format is <position>-<matchId>", p.Value)
						p.Error = &errorMsg
						continue
					}

					previousMatchId := previousMatchDetails[1]
					previousMatchPlayerPosition, err := strconv.Atoi(previousMatchDetails[0])
					// Confirm that it is a valid player position (e.g "1", "2", "3", etc)
					if err != nil || previousMatchPlayerPosition < 1 {
						errorMsg := fmt.Sprintf("Invalid player position %s for match id %s", previousMatchDetails[0], previousMatchId)
						p.Error = &errorMsg
						continue
					}

					// Find the match in the previous draw with the specified match id
					previousMatch, err := t.FindInMatchInTournament(previousMatchId)
					if err != nil {
						errorMsg := fmt.Sprintf("Cannot find the match with the specified id %s in the previous draw", previousMatchId)
						p.Error = &errorMsg
						continue
					}

					// Sort the players in the match by their score (descending: highest first)
					sortedScores := make([]generated_go.GameScore, len(previousMatch.Scores))
					copy(sortedScores, previousMatch.Scores)
					slices.SortFunc(sortedScores, func(a generated_go.GameScore, b generated_go.GameScore) int {
						return int(b.Score - a.Score)
					})

					if previousMatchPlayerPosition > len(sortedScores) {
						errorMsg := fmt.Sprintf("Invalid player position %d, match only has %d players", previousMatchPlayerPosition, len(sortedScores))
						p.Error = &errorMsg
						continue
					}

					targetPlayerId := sortedScores[previousMatchPlayerPosition-1].PlayerId

					playerFound := array.Find(t.Leaderboard, func(player generated_go.Player, ind int, list []generated_go.Player) bool {
						return player.Kind == "user" && player.PlayerUser.Id == targetPlayerId
					})

					if playerFound == nil {
						errorMsg := fmt.Sprintf("Cannot find the player with id %s in the leaderboard", targetPlayerId)
						p.Error = &errorMsg
						continue
					}

					// Mutate the original player in place
					p.Kind = "user"
					p.PlayerUser = playerFound.PlayerUser

					log.Printf("%s has been added to the match with id %s in draw %s", p.PlayerUser.Name, *match.Game.Id, draw.Id)
				}
			}
		}

	}

	// Display all error that were found while trying to progress the tournament
	for _, draw := range *draws {
		for _, match := range draw.Matches {
			for _, player := range match.Players {
				if player.Error != nil {
					return ReturnError(ErrProgressTournament, fmt.Sprintf("Error in match id %s: %s", *match.Id, *player.Error))
				}
			}
		}
	}

	return nil
}
