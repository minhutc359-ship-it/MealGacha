import { UserState, KeyTransaction } from './models';
import { getDateKey } from './dateKey';

const DAILY_KEYS = parseInt(import.meta.env.VITE_DAILY_KEYS || '10', 10);

export function canCheckIn(state: UserState): boolean {
  return state.lastCheckInDate !== getDateKey();
}

function getPreviousDateKey(): string {
  const middayYesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return getDateKey(middayYesterday)
}

export function applyCheckIn(state: UserState): UserState {
  if (!canCheckIn(state)) return state;
  const now = new Date().toISOString();
  const streak = state.lastCheckInDate === getPreviousDateKey()
    ? (state.checkInStreak ?? 0) + 1
    : 1
  const milestone = streak === 3 ? 2 : streak === 7 ? 5 : streak === 14 ? 10 : 0
  const totalKeys = DAILY_KEYS + milestone
  const tx: KeyTransaction = {
    id: crypto.randomUUID(),
    amount: totalKeys,
    balanceAfter: state.keys + totalKeys,
    reason: 'daily_checkin',
    createdAt: now,
  };
  return {
    ...state,
    keys: state.keys + totalKeys,
    checkInStreak: streak,
    bestCheckInStreak: Math.max(state.bestCheckInStreak ?? 0, streak),
    lastCheckInDate: getDateKey(),
    keyTransactions: [...state.keyTransactions, tx],
    updatedAt: now,
  };
}
