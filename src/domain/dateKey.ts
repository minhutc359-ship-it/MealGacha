const TZ = import.meta.env.VITE_APP_TIME_ZONE || 'Asia/Ho_Chi_Minh';

export function getDateKey(date: Date = new Date()): string {
  return date.toLocaleDateString('sv-SE', { timeZone: TZ });
}

export function getCurrentHour(): number {
  return parseInt(
    new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: TZ }),
    10,
  );
}
