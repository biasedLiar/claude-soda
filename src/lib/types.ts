export type Player = {
  id: number;
  name: string;
};

export type Soda = {
  id: number;
  name: string;
  color: string;
};

export type Competition = {
  id: number;
  name: string;
  date: string | number;
};

export type CompetitionSoda = {
  competitionId: number;
  sodaId: number;
};

export type Guess = {
  id: number;
  score: number;
  playerId: number;
  guessedSodaId: number;
  actualSodaId: number;
  competitionId: number;
};

export type DbData = {
  players: Player[];
  sodas: Soda[];
  competitions: Competition[];
  competitionSodas: CompetitionSoda[];
  guesses: Guess[];
};

export type PlayerStats = {
  player: Player;
  totalGuesses: number;
  correctGuesses: number;
  accuracy: number;
  avgTasteGiven: number;
  competitionsPlayed: number;
};

export type SodaStats = {
  soda: Soda;
  appearances: number;
  totalGuesses: number;
  correctGuesses: number;
  correctRate: number;
  avgTaste: number;
  topConfusions: Array<{ soda: Soda; count: number }>;
};

export type CompetitionSummary = {
  competition: Competition;
  playerCount: number;
  sodaCount: number;
  avgAccuracy: number;
  winner: Player | null;
};

export type RankedPlayer = {
  rank: number;
  player: Player;
  guesses: number;
  correct: number;
  accuracy: number;
  avgTaste: number;
};

export type CompetitionSodaStat = {
  soda: Soda;
  guesses: number;
  correct: number;
  correctRate: number;
  avgTaste: number;
};

export type PlayerCompetitionResult = {
  competition: Competition;
  guesses: number;
  correct: number;
  accuracy: number;
  avgTaste: number;
};

export type GlobalStats = {
  totalCompetitions: number;
  totalPlayers: number;
  totalSodas: number;
  totalGuesses: number;
  overallAccuracy: number;
  bestTastingSodas: Array<{ soda: Soda; avgTaste: number }>;
  mostAccurateSodas: Array<{ soda: Soda; correctRate: number; guesses: number }>;
  leastAccurateSodas: Array<{ soda: Soda; correctRate: number; guesses: number }>;
  latestCompetition: Competition;
};
