import type {
  DbData,
  GlobalStats,
  PlayerStats,
  PlayerCompetitionResult,
  SodaStats,
  CompetitionSummary,
  RankedPlayer,
  CompetitionSodaStat,
} from './types';

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function globalStats(data: DbData): GlobalStats {
  const sodaGuessMap = new Map<number, { correct: number; total: number; totalTaste: number }>();
  for (const g of data.guesses) {
    const entry = sodaGuessMap.get(g.actualSodaId) ?? { correct: 0, total: 0, totalTaste: 0 };
    entry.total++;
    entry.totalTaste += g.score;
    if (g.guessedSodaId === g.actualSodaId) entry.correct++;
    sodaGuessMap.set(g.actualSodaId, entry);
  }

  const sodaRates = data.sodas
    .filter((s) => (sodaGuessMap.get(s.id)?.total ?? 0) > 0)
    .map((s) => {
      const e = sodaGuessMap.get(s.id)!;
      return { soda: s, correctRate: round2(e.correct / e.total), guesses: e.total, avgTaste: round2(e.totalTaste / e.total) };
    });

  const bestTasting = [...sodaRates]
    .sort((a, b) => b.avgTaste - a.avgTaste)
    .slice(0, 3)
    .map(({ soda, avgTaste }) => ({ soda, avgTaste }));

  const byRate = [...sodaRates].sort((a, b) => b.correctRate - a.correctRate);
  const mostAccurate = byRate.slice(0, 3).map(({ soda, correctRate, guesses }) => ({ soda, correctRate, guesses }));
  const leastAccurate = [...byRate].reverse().slice(0, 3).map(({ soda, correctRate, guesses }) => ({ soda, correctRate, guesses }));

  const correct = data.guesses.filter((g) => g.guessedSodaId === g.actualSodaId).length;

  const latestCompetition = [...data.competitions].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  })[0];

  return {
    totalCompetitions: data.competitions.length,
    totalPlayers: data.players.length,
    totalSodas: data.sodas.length,
    totalGuesses: data.guesses.length,
    overallAccuracy: round2(correct / data.guesses.length),
    bestTastingSodas: bestTasting,
    mostAccurateSodas: mostAccurate,
    leastAccurateSodas: leastAccurate,
    latestCompetition,
  };
}

export function playerStats(id: number, data: DbData): PlayerStats | null {
  const player = data.players.find((p) => p.id === id);
  if (!player) return null;

  const guesses = data.guesses.filter((g) => g.playerId === id);
  const correct = guesses.filter((g) => g.guessedSodaId === g.actualSodaId).length;
  const competitions = new Set(guesses.map((g) => g.competitionId)).size;

  return {
    player,
    totalGuesses: guesses.length,
    correctGuesses: correct,
    accuracy: guesses.length > 0 ? round2(correct / guesses.length) : 0,
    avgTasteGiven: round2(avg(guesses.map((g) => g.score))),
    competitionsPlayed: competitions,
  };
}

export function playerCompetitionHistory(playerId: number, data: DbData): PlayerCompetitionResult[] {
  const competitionIds = [...new Set(
    data.guesses.filter((g) => g.playerId === playerId).map((g) => g.competitionId)
  )];

  return competitionIds.map((cid) => {
    const comp = data.competitions.find((c) => c.id === cid)!;
    const guesses = data.guesses.filter((g) => g.playerId === playerId && g.competitionId === cid);
    const correct = guesses.filter((g) => g.guessedSodaId === g.actualSodaId).length;
    return {
      competition: comp,
      guesses: guesses.length,
      correct,
      accuracy: guesses.length > 0 ? round2(correct / guesses.length) : 0,
      avgTaste: round2(avg(guesses.map((g) => g.score))),
    };
  }).sort((a, b) => a.competition.id - b.competition.id);
}

export function sodaStats(id: number, data: DbData): SodaStats | null {
  const soda = data.sodas.find((s) => s.id === id);
  if (!soda) return null;

  const appearances = data.competitionSodas.filter((cs) => cs.sodaId === id).length;
  const guesses = data.guesses.filter((g) => g.actualSodaId === id);
  const correct = guesses.filter((g) => g.guessedSodaId === id).length;

  const wrongGuesses = guesses.filter((g) => g.guessedSodaId !== id);
  const confusionCount = new Map<number, number>();
  for (const g of wrongGuesses) {
    confusionCount.set(g.guessedSodaId, (confusionCount.get(g.guessedSodaId) ?? 0) + 1);
  }
  const topConfusions = [...confusionCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([sodaId, count]) => ({ soda: data.sodas.find((s) => s.id === sodaId)!, count }))
    .filter((c) => c.soda != null);

  return {
    soda,
    appearances,
    totalGuesses: guesses.length,
    correctGuesses: correct,
    correctRate: guesses.length > 0 ? round2(correct / guesses.length) : 0,
    avgTaste: round2(avg(guesses.map((g) => g.score))),
    topConfusions,
  };
}

export function competitionLeaderboard(competitionId: number, data: DbData): RankedPlayer[] {
  const playerIds = [...new Set(
    data.guesses.filter((g) => g.competitionId === competitionId).map((g) => g.playerId)
  )];

  const ranked = playerIds.map((pid) => {
    const player = data.players.find((p) => p.id === pid)!;
    const guesses = data.guesses.filter((g) => g.playerId === pid && g.competitionId === competitionId);
    const correct = guesses.filter((g) => g.guessedSodaId === g.actualSodaId).length;
    return {
      rank: 0,
      player,
      guesses: guesses.length,
      correct,
      accuracy: guesses.length > 0 ? round2(correct / guesses.length) : 0,
      avgTaste: round2(avg(guesses.map((g) => g.score))),
    };
  }).sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct);

  return ranked.map((r, i) => ({ ...r, rank: i + 1 }));
}

export function competitionSodaStats(competitionId: number, data: DbData): CompetitionSodaStat[] {
  const sodaIds = data.competitionSodas
    .filter((cs) => cs.competitionId === competitionId)
    .map((cs) => cs.sodaId);

  return sodaIds.map((sid) => {
    const soda = data.sodas.find((s) => s.id === sid)!;
    const guesses = data.guesses.filter((g) => g.actualSodaId === sid && g.competitionId === competitionId);
    const correct = guesses.filter((g) => g.guessedSodaId === sid).length;
    return {
      soda,
      guesses: guesses.length,
      correct,
      correctRate: guesses.length > 0 ? round2(correct / guesses.length) : 0,
      avgTaste: round2(avg(guesses.map((g) => g.score))),
    };
  }).sort((a, b) => b.correctRate - a.correctRate);
}

export function allPlayersSummary(data: DbData): PlayerStats[] {
  return data.players
    .map((p) => playerStats(p.id, data))
    .filter((s): s is PlayerStats => s !== null)
    .sort((a, b) => b.accuracy - a.accuracy);
}

export function allSodasSummary(data: DbData): SodaStats[] {
  return data.sodas
    .map((s) => sodaStats(s.id, data))
    .filter((s): s is SodaStats => s !== null)
    .sort((a, b) => b.avgTaste - a.avgTaste);
}

export function allCompetitionsSummary(data: DbData): CompetitionSummary[] {
  return data.competitions.map((comp) => {
    const guesses = data.guesses.filter((g) => g.competitionId === comp.id);
    const playerIds = [...new Set(guesses.map((g) => g.playerId))];
    const sodaCount = data.competitionSodas.filter((cs) => cs.competitionId === comp.id).length;

    const leaderboard = competitionLeaderboard(comp.id, data);
    const winner = leaderboard.length > 0 ? leaderboard[0].player : null;

    const perPlayerAccuracy = playerIds.map((pid) => {
      const pg = guesses.filter((g) => g.playerId === pid);
      const correct = pg.filter((g) => g.guessedSodaId === g.actualSodaId).length;
      return pg.length > 0 ? correct / pg.length : 0;
    });

    return {
      competition: comp,
      playerCount: playerIds.length,
      sodaCount,
      avgAccuracy: round2(avg(perPlayerAccuracy)),
      winner,
    };
  });
}
