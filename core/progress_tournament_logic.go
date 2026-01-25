package core

func (t *TournamentLogic) ProgressTournamentLogic() error {
	// Get the current draws
	draws := &t.Draws

	// Loop through each draw and find the one that hasn't been completed
	for _, draw := range *draws {
		if draw.ExpectedNumberOfMatches <= uint32(len(draw.Matches)) {
			// Draw is complete, skip to the next one
			continue
		}
		// Found the draw that needs to be progressed

	}

	return nil
}
