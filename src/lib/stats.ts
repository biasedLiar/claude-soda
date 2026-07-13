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

function adjustedRate(correct: number, total: number, sodaCount: number): number {
  if (total === 0 || sodaCount <= 1) return 0;
  const chance = 1 / sodaCount;
  return round2((correct / total - chance) / (1 - chance));
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
  const competitionIds = [...new Set(guesses.map((g) => g.competitionId))];

  const adjPerComp = competitionIds.map((cid) => {
    const cg = guesses.filter((g) => g.competitionId === cid);
    const cc = cg.filter((g) => g.guessedSodaId === g.actualSodaId).length;
    const N = data.competitionSodas.filter((cs) => cs.competitionId === cid).length;
    return adjustedRate(cc, cg.length, N);
  });

  return {
    player,
    totalGuesses: guesses.length,
    correctGuesses: correct,
    accuracy: guesses.length > 0 ? round2(correct / guesses.length) : 0,
    adjustedAccuracy: round2(avg(adjPerComp)),
    avgTasteGiven: round2(avg(guesses.map((g) => g.score))),
    competitionsPlayed: competitionIds.length,
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
    const N = data.competitionSodas.filter((cs) => cs.competitionId === cid).length;
    return {
      competition: comp,
      guesses: guesses.length,
      correct,
      accuracy: guesses.length > 0 ? round2(correct / guesses.length) : 0,
      adjustedAccuracy: adjustedRate(correct, guesses.length, N),
      avgTaste: round2(avg(guesses.map((g) => g.score))),
    };
  }).sort((a, b) => {
    const a2020 = /2020/.test(a.competition.name);
    const b2020 = /2020/.test(b.competition.name);
    if (a2020 !== b2020) return a2020 ? 1 : -1;
    const aYear = parseInt(/(\d{4})/.exec(a.competition.name)?.[1] ?? '0');
    const bYear = parseInt(/(\d{4})/.exec(b.competition.name)?.[1] ?? '0');
    if (aYear !== bYear) return bYear - aYear;
    return b.competition.name.localeCompare(a.competition.name);
  });
}

export function sodaStats(id: number, data: DbData): SodaStats | null {
  const soda = data.sodas.find((s) => s.id === id);
  if (!soda) return null;

  const appearances = data.competitionSodas.filter((cs) => cs.sodaId === id).length;
  const guesses = data.guesses.filter((g) => g.actualSodaId === id);
  const correct = guesses.filter((g) => g.guessedSodaId === id).length;

  // Adjusted correct rate — per competition, then averaged
  const competitionIds = data.competitionSodas
    .filter((cs) => cs.sodaId === id)
    .map((cs) => cs.competitionId);
  const adjPerComp: number[] = [];
  for (const cid of competitionIds) {
    const cg = guesses.filter((g) => g.competitionId === cid);
    if (cg.length === 0) continue;
    const cc = cg.filter((g) => g.guessedSodaId === id).length;
    const N = data.competitionSodas.filter((cs) => cs.competitionId === cid).length;
    adjPerComp.push(adjustedRate(cc, cg.length, N));
  }
  const adjustedCorrectRate = round2(avg(adjPerComp));

  // Avg taste when guessed (guessedSodaId === id)
  const guessedAsThis = data.guesses.filter((g) => g.guessedSodaId === id);
  const avgTasteWhenGuessed = round2(avg(guessedAsThis.map((g) => g.score)));

  // confusedWith: when actual = this soda, what was guessed (wrong)
  const wrongGuesses = guesses.filter((g) => g.guessedSodaId !== id);
  const confusionCount = new Map<number, number>();
  for (const g of wrongGuesses) {
    confusionCount.set(g.guessedSodaId, (confusionCount.get(g.guessedSodaId) ?? 0) + 1);
  }
  const confusedWith = [...confusionCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([sodaId, count]) => ({ soda: data.sodas.find((s) => s.id === sodaId)!, count }))
    .filter((c) => c.soda != null);

  // guessedAs: when guessed = this soda, what was it actually (wrong)
  const falsePositives = data.guesses.filter((g) => g.guessedSodaId === id && g.actualSodaId !== id);
  const guessedAsCount = new Map<number, number>();
  for (const g of falsePositives) {
    guessedAsCount.set(g.actualSodaId, (guessedAsCount.get(g.actualSodaId) ?? 0) + 1);
  }
  const guessedAs = [...guessedAsCount.entries()]
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
    adjustedCorrectRate,
    avgTaste: round2(avg(guesses.map((g) => g.score))),
    avgTasteWhenGuessed,
    confusedWith,
    guessedAs,
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
