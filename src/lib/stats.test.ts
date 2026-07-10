import { describe, it, expect } from 'vitest';
import type { DbData } from './types';
import {
  globalStats,
  playerStats,
  playerCompetitionHistory,
  sodaStats,
  competitionLeaderboard,
  competitionSodaStats,
  allPlayersSummary,
  allSodasSummary,
  allCompetitionsSummary,
} from './stats';

const fixture: DbData = {
  players: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ],
  sodas: [
    { id: 1, name: 'Cola A', color: 'brown' },
    { id: 2, name: 'Cola B', color: 'red' },
    { id: 3, name: 'Cola C', color: 'red' },
  ],
  competitions: [
    { id: 1, name: 'Event 2023', date: '2023-12-01T00:00:00Z' },
    { id: 2, name: 'Event 2024', date: '2024-12-01T00:00:00Z' },
  ],
  competitionSodas: [
    { competitionId: 1, sodaId: 1 },
    { competitionId: 1, sodaId: 2 },
    { competitionId: 1, sodaId: 3 },
    { competitionId: 2, sodaId: 1 },
    { competitionId: 2, sodaId: 2 },
  ],
  guesses: [
    // Competition 1 (N=3), Alice: 2/3 correct
    { id: 1, score: 8, playerId: 1, guessedSodaId: 1, actualSodaId: 1, competitionId: 1 },
    { id: 2, score: 6, playerId: 1, guessedSodaId: 2, actualSodaId: 2, competitionId: 1 },
    { id: 3, score: 4, playerId: 1, guessedSodaId: 1, actualSodaId: 3, competitionId: 1 }, // wrong (confused 3 for 1)
    // Competition 1 (N=3), Bob: 1/3 correct
    { id: 4, score: 7, playerId: 2, guessedSodaId: 1, actualSodaId: 1, competitionId: 1 },
    { id: 5, score: 3, playerId: 2, guessedSodaId: 1, actualSodaId: 2, competitionId: 1 }, // wrong (confused 2 for 1)
    { id: 6, score: 5, playerId: 2, guessedSodaId: 1, actualSodaId: 3, competitionId: 1 }, // wrong (confused 3 for 1)
    // Competition 2 (N=2), Alice only: 1/2 correct
    { id: 7, score: 9, playerId: 1, guessedSodaId: 1, actualSodaId: 1, competitionId: 2 },
    { id: 8, score: 5, playerId: 1, guessedSodaId: 1, actualSodaId: 2, competitionId: 2 }, // wrong
  ],
};

describe('globalStats', () => {
  it('returns correct totals', () => {
    const stats = globalStats(fixture);
    expect(stats.totalCompetitions).toBe(2);
    expect(stats.totalPlayers).toBe(2);
    expect(stats.totalSodas).toBe(3);
    expect(stats.totalGuesses).toBe(8);
  });

  it('calculates overall accuracy', () => {
    // 4 correct out of 8
    const stats = globalStats(fixture);
    expect(stats.overallAccuracy).toBe(0.5);
  });

  it('returns the latest competition', () => {
    const stats = globalStats(fixture);
    expect(stats.latestCompetition.id).toBe(2);
  });

  it('bestTastingSodas are sorted by avg taste desc', () => {
    const stats = globalStats(fixture);
    const ratings = stats.bestTastingSodas.map((s) => s.avgTaste);
    for (let i = 1; i < ratings.length; i++) {
      expect(ratings[i]).toBeLessThanOrEqual(ratings[i - 1]);
    }
  });
});

describe('playerStats', () => {
  it('returns null for unknown player', () => {
    expect(playerStats(99, fixture)).toBeNull();
  });

  it('calculates Alice accuracy correctly', () => {
    const stats = playerStats(1, fixture)!;
    // guesses 1,2,3,7,8 → correct: 1,2,7 → 3/5
    expect(stats.totalGuesses).toBe(5);
    expect(stats.correctGuesses).toBe(3);
    expect(stats.accuracy).toBe(0.6);
    expect(stats.competitionsPlayed).toBe(2);
  });

  it('calculates Bob accuracy correctly', () => {
    const stats = playerStats(2, fixture)!;
    // 1 correct out of 3
    expect(stats.totalGuesses).toBe(3);
    expect(stats.correctGuesses).toBe(1);
    expect(stats.accuracy).toBeCloseTo(0.33, 1);
  });

  it('calculates avg taste given', () => {
    // Alice scores: 8, 6, 4, 9, 5 → avg = 32/5 = 6.4
    const stats = playerStats(1, fixture)!;
    expect(stats.avgTasteGiven).toBeCloseTo(6.4);
  });

  it('calculates Alice adjustedAccuracy correctly', () => {
    const stats = playerStats(1, fixture)!;
    // Comp1 (N=3): 2/3 correct, chance=1/3, adj=(2/3-1/3)/(2/3)=0.5
    // Comp2 (N=2): 1/2 correct, chance=1/2, adj=(1/2-1/2)/(1/2)=0
    // avg = 0.25
    expect(stats.adjustedAccuracy).toBe(0.25);
  });

  it('calculates Bob adjustedAccuracy correctly', () => {
    const stats = playerStats(2, fixture)!;
    // Comp1 (N=3): 1/3 correct, chance=1/3, adj=0 (exactly at chance)
    expect(stats.adjustedAccuracy).toBe(0);
  });
});

describe('playerCompetitionHistory', () => {
  it('returns one entry per competition the player participated in', () => {
    const history = playerCompetitionHistory(1, fixture);
    expect(history).toHaveLength(2);
    expect(history[0].competition.id).toBe(1);
    expect(history[1].competition.id).toBe(2);
  });

  it('calculates per-competition accuracy', () => {
    const history = playerCompetitionHistory(1, fixture);
    expect(history[0].accuracy).toBeCloseTo(0.67, 1); // 2/3
    expect(history[1].accuracy).toBe(0.5); // 1/2
  });

  it('calculates per-competition adjustedAccuracy', () => {
    const history = playerCompetitionHistory(1, fixture);
    // Comp1 (N=3): 2/3 correct → adj=0.5
    expect(history[0].adjustedAccuracy).toBe(0.5);
    // Comp2 (N=2): 1/2 correct → adj=0
    expect(history[1].adjustedAccuracy).toBe(0);
  });

  it('returns empty array for player with no guesses', () => {
    const noGuessData: DbData = { ...fixture, guesses: [] };
    expect(playerCompetitionHistory(1, noGuessData)).toHaveLength(0);
  });
});

describe('sodaStats', () => {
  it('returns null for unknown soda', () => {
    expect(sodaStats(99, fixture)).toBeNull();
  });

  it('calculates Cola A stats', () => {
    const stats = sodaStats(1, fixture)!;
    // actual=1 in guesses 1,4,7 — all guessed correctly
    expect(stats.totalGuesses).toBe(3);
    expect(stats.correctGuesses).toBe(3);
    expect(stats.correctRate).toBe(1);
    expect(stats.appearances).toBe(2);
  });

  it('calculates Cola A adjustedCorrectRate', () => {
    const stats = sodaStats(1, fixture)!;
    // Comp1 (N=3): 2/2 tasters correct → adj=1; Comp2 (N=2): 1/1 correct → adj=1
    expect(stats.adjustedCorrectRate).toBe(1);
  });

  it('calculates Cola C adjustedCorrectRate', () => {
    const stats = sodaStats(3, fixture)!;
    // Cola C only in Comp1 (N=3): 0/2 correct, chance=1/3, adj=(0-1/3)/(2/3)=-0.5
    expect(stats.adjustedCorrectRate).toBe(-0.5);
  });

  it('calculates avgTasteWhenGuessed for Cola A', () => {
    const stats = sodaStats(1, fixture)!;
    // Guesses where guessedSodaId=1: ids 1,3,4,5,6,7,8 → scores 8,4,7,3,5,9,5 → avg=41/7≈5.86
    expect(stats.avgTasteWhenGuessed).toBeCloseTo(5.86, 1);
  });

  it('calculates confusedWith for Cola C (id=3)', () => {
    const stats = sodaStats(3, fixture)!;
    // Soda 3 was guessed as soda 1 by both Alice (id 3) and Bob (id 6)
    expect(stats.confusedWith).toHaveLength(1);
    expect(stats.confusedWith[0].soda.id).toBe(1);
    expect(stats.confusedWith[0].count).toBe(2);
  });

  it('calculates guessedAs for Cola A (id=1)', () => {
    const stats = sodaStats(1, fixture)!;
    // guessedSodaId=1 but actualSodaId !== 1: ids 3(actual=3), 5(actual=2), 6(actual=3), 8(actual=2)
    // actual=3: count 2, actual=2: count 2
    expect(stats.guessedAs).toHaveLength(2);
    const counts = new Map(stats.guessedAs.map((g) => [g.soda.id, g.count]));
    expect(counts.get(2)).toBe(2);
    expect(counts.get(3)).toBe(2);
  });

  it('returns empty confusedWith when never guessed wrong', () => {
    const stats = sodaStats(1, fixture)!;
    expect(stats.confusedWith).toHaveLength(0);
  });
});

describe('competitionLeaderboard', () => {
  it('ranks Alice above Bob in competition 1', () => {
    const board = competitionLeaderboard(1, fixture);
    expect(board[0].player.name).toBe('Alice');
    expect(board[1].player.name).toBe('Bob');
    expect(board[0].rank).toBe(1);
    expect(board[1].rank).toBe(2);
  });

  it('returns empty for competition with no guesses', () => {
    const emptyData: DbData = { ...fixture, guesses: [] };
    expect(competitionLeaderboard(1, emptyData)).toHaveLength(0);
  });
});

describe('competitionSodaStats', () => {
  it('returns one entry per soda in the competition', () => {
    const stats = competitionSodaStats(1, fixture);
    expect(stats).toHaveLength(3);
  });

  it('is sorted by correctRate descending', () => {
    const stats = competitionSodaStats(1, fixture);
    for (let i = 1; i < stats.length; i++) {
      expect(stats[i].correctRate).toBeLessThanOrEqual(stats[i - 1].correctRate);
    }
  });
});

describe('allPlayersSummary', () => {
  it('returns a stat entry for every player', () => {
    expect(allPlayersSummary(fixture)).toHaveLength(2);
  });

  it('is sorted by accuracy descending', () => {
    const summary = allPlayersSummary(fixture);
    expect(summary[0].accuracy).toBeGreaterThanOrEqual(summary[1].accuracy);
  });
});

describe('allSodasSummary', () => {
  it('returns a stat entry for every soda', () => {
    expect(allSodasSummary(fixture)).toHaveLength(3);
  });
});

describe('allCompetitionsSummary', () => {
  it('returns a summary for every competition', () => {
    expect(allCompetitionsSummary(fixture)).toHaveLength(2);
  });

  it('sets winner to the player with highest accuracy', () => {
    const summaries = allCompetitionsSummary(fixture);
    const comp1 = summaries.find((s) => s.competition.id === 1)!;
    expect(comp1.winner?.name).toBe('Alice');
  });
});
