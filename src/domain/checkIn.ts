import { UserState, KeyTransaction } from './models';
import { getDateKey } from './dateKey';

const DAILY_KEYS = parseInt(import.meta.env.VITE_DAILY_KEYS || '10', 10);

export function canCheckIn(state: UserState): boolean {
  return state.lastCheckInDate !== getDateKey();
}

export function applyCheckIn(state: UserState): UserState {
  if (!canCheckIn(state)) return state;
  const now = new Date().toISOString();
  const tx: KeyTransaction = {
    id: crypto.randomUUID(),
    amount: DAILY_KEYS,
    balanceAfter: state.keys + DAILY_KEYS,
    reason: 'daily_checkin',
    createdAt: now,
  };
  return {
    ...state,
    keys: state.keys + DAILY_KEYS,
    lastCheckInDate: getDateKey(),
    keyTransactions: [...state.keyTransactions, tx],
    updatedAt: now,
  };
}
