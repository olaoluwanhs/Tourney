
export type Composed = Tournament;


export type Player = PlayerId | PlayerUser;


export interface Draws {

  expectedNumberOfMatches: number;

  id: string;

  matches: DrawsMatch[];

  round: number;
}


export interface DrawsMatch {

  game: Game;
}


export interface Game {

  expectedNumberOfPlayers: number;

  id: (string | undefined);

  players: Player[];

  scores: GameScore[];

  settled: boolean;
}


export interface GameScore {

  playerId: string;

  score: number;
}


export interface PlayerId {

  error: (string | undefined);

  kind: "id";

  value: string;
}


export interface PlayerUser {

  associatedImage: (string | undefined);

  id: string;

  kind: "user";

  name: string;
}


export interface Tournament {

  draws: Draws[];

  id: string;

  leaderboard: Player[];

  name: string;

  status: ("completed" | "ongoing" | "scheduled");
}

