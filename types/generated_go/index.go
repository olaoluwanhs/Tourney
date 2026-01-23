package generated_go


import "encoding/json"



type Composed Tournament


type PlayerKind string


type TournamentStatus string


const PlayerKindId PlayerKind = "id"


const PlayerKindUser PlayerKind = "user"


const TournamentStatusTournamentStatusCompleted TournamentStatus = "completed"


const TournamentStatusTournamentStatusOngoing TournamentStatus = "ongoing"


const TournamentStatusTournamentStatusScheduled TournamentStatus = "scheduled"



type Draws struct {

  ExpectedNumberOfMatches uint32 `json:"expectedNumberOfMatches"`

  Id string `json:"id"`

  Matches []DrawsMatch `json:"matches"`

  Round uint8 `json:"round"`
}



type DrawsMatch struct {

  Game Game `json:"game"`
}



type Game struct {

  ExpectedNumberOfPlayers uint32 `json:"expectedNumberOfPlayers"`

  Id *string `json:"id"`

  Players []Player `json:"players"`

  Scores []GameScore `json:"scores"`
}



type GameScore struct {

  PlayerId string `json:"playerId"`

  Score float32 `json:"score"`
}



type PlayerId struct {

  Value string `json:"value"`
}



type PlayerUser struct {

  AssociatedImage string `json:"associatedImage"`

  Id string `json:"id"`

  Name string `json:"name"`
}



type Tournament struct {

  Draws []Draws `json:"draws"`

  Id string `json:"id"`

  Leaderboard []Player `json:"leaderboard"`

  Name string `json:"name"`

  Status TournamentStatus `json:"status"`
}



type Player struct {
  Kind PlayerKind `json:"kind"`

  PlayerId `json:"-"`

  PlayerUser `json:"-"`

}

func (d Player) MarshalJSON() ([]byte, error) {
  switch d.Kind {

  case "id":
    return json.Marshal(struct { Tag string `json:"kind"`; PlayerId }{ Tag: "id", PlayerId: d.PlayerId })

  case "user":
    return json.Marshal(struct { Tag string `json:"kind"`; PlayerUser }{ Tag: "user", PlayerUser: d.PlayerUser })

  default:
    panic("unknown discriminator variant")
  }
}

func (d *Player) UnmarshalJSON(b []byte) error {
  var base struct { Tag string `json:"kind"` }
  if err := json.Unmarshal(b, &base); err != nil {
    return err
  }

  switch base.Tag {

  case "id":
    d.Kind = "id"
    return json.Unmarshal(b, &d.PlayerId)

  case "user":
    d.Kind = "user"
    return json.Unmarshal(b, &d.PlayerUser)

  default:
    panic("unknown discriminator variant")
  }
}
