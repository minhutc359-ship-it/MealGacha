// Challenge applies to new battles. Saved combats retain their original stats.
export const ENEMY_CHALLENGE = 1.3
// Durability × damage output is the combat-power budget: sqrt(1.3)^2 = 1.3.
export const challengeForRules = (version: number) => version >= 2 ? Math.sqrt(ENEMY_CHALLENGE) : 1
export const challengeStat = (value: number, factor = ENEMY_CHALLENGE) => Math.round(value * factor)
