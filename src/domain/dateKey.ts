const TZ = import.meta.env.VITE_APP_TIME_ZONE || 'Asia/Ho_Chi_Minh';

export function getDateKey(date: Date = new Date()): string {
  return date.toLocaleDateString('sv-SE', { timeZone: TZ });
}

export function getCurrentHour(date: Date = new Date()): number {
  return parseInt(
    date.toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: TZ }),
    10,
  );
}

export function isGoldenHour(date: Date = new Date()): boolean {
  const hour = getCurrentHour(date)
  return hour >= 18 && hour < 21
}
