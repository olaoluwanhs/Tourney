package core

func (t *TournamentLogic) FindInMatchInTournament(id string) (*GameLogic, error) {
	// Loop through the draws and matches to find the match with the specified id
	for _, draw := range t.Draws {
		for _, match := range draw.Matches {
			if match.Game.Id != nil && *match.Game.Id == id {
				return &match, nil
			}
		}
	}
	return nil, ReturnError(ErrMatchNotFound, string("Match ID: "+id))
}

func (t *TournamentLogic) FindInDrawInTournament(id string) (*DrawLogic, error) {
	// Loop through the draws to find the draw with the specified id
	for _, draw := range t.Draws {
		if draw.Id == id {
			return &draw, nil
		}
	}
	return nil, ReturnError(ErrMatchNotFound, string("Draw ID: "+id))
}
