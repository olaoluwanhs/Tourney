package core

import (
	"slices"

	generated_go "github.com/olaoluwanhs/Tourney/types/generated_go"
)

func (t *TournamentLogic) UpdateLeadersBoardOrder() error {
	// Create a map to track total scores for each player ID
	playerScores := make(map[string]float32)

	// Traverse all draws and matches to accumulate scores
	for _, draw := range t.Draws {
		for _, match := range draw.Matches {
			// Only consider settled matches
			if !match.Game.Settled {
				continue
			}

			for _, score := range match.Scores {
				playerScores[score.PlayerId] += score.Score
			}
		}
	}

	// Create a slice to hold players with their total scores for sorting
	type playerWithScore struct {
		player     generated_go.Player
		totalScore float32
	}

	playersWithScores := make([]playerWithScore, 0, len(t.Leaderboard))

	// Map leaderboard players to their total scores
	for _, player := range t.Leaderboard {
		if player.Kind == "user" {
			totalScore := playerScores[player.PlayerUser.Id]
			playersWithScores = append(playersWithScores, playerWithScore{
				player:     player,
				totalScore: totalScore,
			})
		}
	}

	// Sort by total score descending (highest first)
	slices.SortFunc(playersWithScores, func(a, b playerWithScore) int {
		if a.totalScore > b.totalScore {
			return -1
		} else if a.totalScore < b.totalScore {
			return 1
		}
		return 0
	})

	// Update the leaderboard with sorted players
	for i, pws := range playersWithScores {
		t.Leaderboard[i] = pws.player
	}

	return nil
}
