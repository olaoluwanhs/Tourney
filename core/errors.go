package core

import "errors"

type ErrorMessage string

const (
	ErrMatchNotFound           ErrorMessage = "Match not found in tournament"
	ErrNoMatchesInDraw         ErrorMessage = "No matches in the current draw, cannot progress tournament"
	ErrProgressTournament      ErrorMessage = "Error progressing tournament"
	ErrPlayerDefinitionMissing ErrorMessage = "Player definition is missing for a match, cannot progress tournament"
)

func ReturnError(message ErrorMessage, details string) error {
	return errors.New(string(message) + ": " + details)
}
