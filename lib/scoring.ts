import { concatText, similarity } from './text';
import type { Holding, Recommendation, Work } from './types';

const availabilityWeights: Record<Holding['status'], number> = {
  貸出可: 0.15,
  館内: 0.1,
  貸出中: 0.05,
  不明: 0,
  更新中: 0,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const recencyScore = (publishYear?: number): number => {
  if (!publishYear) {
    return 0;
  }
  const normalised = (publishYear - 1990) / (2025 - 1990);
  return clamp(normalised, 0, 1);
};

const similarityScore = (goal: string, work: Work): number => {
  const combined = concatText(work.title, work.summary);
  const scores = [similarity(goal, combined), similarity(goal, work.title)];
  if (work.summary) {
    scores.push(similarity(goal, work.summary));
  }
  return Math.max(...scores);
};

export const scoreWork = (goal: string, work: Work): number => {
  const sim = similarityScore(goal, work);
  const recency = recencyScore(work.publishYear);
  const summaryBonus = work.summary ? 1 : 0;

  const baseScore = 0.5 * sim + 0.2 * recency + 0.1 * summaryBonus;
  return clamp(baseScore, 0, 1);
};

export const availabilityBonus = (holdings: Holding[]): number => {
  if (!holdings.length) {
    return 0;
  }

  const maxBonus = holdings.reduce((acc, holding) => {
    const weight = availabilityWeights[holding.status] ?? 0;
    return weight > acc ? weight : acc;
  }, 0);

  return maxBonus;
};

export const sortReco = (goal: string, items: Recommendation[]): Recommendation[] => {
  return items
    .map((item) => {
      const base = scoreWork(goal, item.work);
      const bonus = availabilityBonus(item.holdings);
      return {
        ...item,
        score: parseFloat((base + bonus).toFixed(4)),
      } satisfies Recommendation;
    })
    .sort((a, b) => b.score - a.score);
};
