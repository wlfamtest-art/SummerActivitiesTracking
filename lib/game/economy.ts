export function calculateXp(durationMinutes: number): number {
  const safeDurationMinutes = Number.isFinite(durationMinutes) && durationMinutes > 0 ? durationMinutes : 0;

  return Math.round((safeDurationMinutes * 1.5) / 5) * 5;
}

export function calculateCoins(xp: number): number {
  const safeXp = Number.isFinite(xp) && xp > 0 ? xp : 0;

  return Math.round(safeXp / 5);
}
