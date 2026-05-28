export type DifficultySplit = {
  easy: number;
  medium: number;
  hard: number;
};

type DifficultyKey = keyof DifficultySplit;

export function adjustDifficulty(
  current: DifficultySplit,
  changed: DifficultyKey,
  newValue: number
): DifficultySplit {
  const clamped = Math.max(0, Math.min(100, Math.round(newValue)));
  const others = (["easy", "medium", "hard"] as DifficultyKey[]).filter(
    (k) => k !== changed
  );

  const remaining = 100 - clamped;
  const otherSum = others.reduce((sum, k) => sum + current[k], 0);

  if (otherSum === 0) {
    const half = Math.floor(remaining / 2);
    return {
      ...current,
      [changed]: clamped,
      [others[0]]: half,
      [others[1]]: remaining - half,
    };
  }

  const next = { ...current, [changed]: clamped };
  let allocated = 0;
  others.forEach((k, i) => {
    if (i === others.length - 1) {
      next[k] = remaining - allocated;
    } else {
      const share = Math.round((current[k] / otherSum) * remaining);
      next[k] = share;
      allocated += share;
    }
  });

  const total = next.easy + next.medium + next.hard;
  if (total !== 100) {
    next[others[others.length - 1]] += 100 - total;
  }

  return next;
}
