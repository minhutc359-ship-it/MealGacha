import { Dish, LimitedEvent } from "./models"

export function isLimitedEventActive(
  event: LimitedEvent | undefined,
  now = new Date(),
): boolean {
  if (!event) return false
  const timestamp = now.getTime()
  return timestamp >= new Date(event.startsAt).getTime() &&
    timestamp < new Date(event.endsAt).getTime()
}

export function getDishLimitedEvent(
  dish: Dish,
  events: LimitedEvent[],
): LimitedEvent | undefined {
  return dish.limitedEventId
    ? events.find((event) => event.id === dish.limitedEventId)
    : undefined
}

export function isDishAvailable(
  dish: Dish,
  events: LimitedEvent[],
  now = new Date(),
): boolean {
  if (!dish.active) return false
  if (dish.type !== "limited") return true
  return isLimitedEventActive(getDishLimitedEvent(dish, events), now)
}

export function getActiveLimitedEvents(
  events: LimitedEvent[],
  now = new Date(),
): LimitedEvent[] {
  return events.filter((event) => isLimitedEventActive(event, now))
}

export function formatRemainingTime(endsAt: string, now = new Date()): string {
  const remaining = Math.max(0, new Date(endsAt).getTime() - now.getTime())
  const totalMinutes = Math.floor(remaining / 60_000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  return days > 0 ? `${days} ngày ${hours} giờ` : `${hours} giờ ${minutes} phút`
}