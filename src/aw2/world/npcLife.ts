export const NPC_LIFE_MINUTE_MS = 500
export const NPC_LIFE_START_MINUTE = 6 * 60
export const NPC_LIFE_DAY_MINUTES = 24 * 60

export type NpcLifePhase = "morning" | "day" | "evening" | "night"
export type NpcLifeFrame = "neutral" | "breath" | "blink" | "gesture"

export interface NpcLifeClock {
  minuteOfDay: number
  hour: number
  minute: number
  phase: NpcLifePhase
  phaseLabel: string
  label: string
}

interface NpcLifeActivitySpec {
  label: string
  frame: NpcLifeFrame
}

interface NpcLifeSchedule {
  entityId: string
  name: string
  activities: Record<NpcLifePhase, NpcLifeActivitySpec>
}

const activity = (
  morning: string,
  day: string,
  evening: string,
  night: string,
): Record<NpcLifePhase, NpcLifeActivitySpec> => ({
  morning: { label: morning, frame: "breath" },
  day: { label: day, frame: "gesture" },
  evening: { label: evening, frame: "breath" },
  night: { label: night, frame: "neutral" },
})

export const NPC_LIFE_SCHEDULES = [
  {
    entityId: "aw2-npc-giu-cho",
    name: "Bà Giữ Chỗ",
    activities: activity(
      "Sắp khăn bên bàn chung",
      "Trông sân và giữ lời mời",
      "Đợi mọi người bên bàn",
      "Giữ đèn hiên cho người về muộn",
    ),
  },
  {
    entityId: "aw2-npc-va-den",
    name: "An Vá Đèn",
    activities: activity(
      "Kiểm giấy và tim đèn",
      "Vá những chiếc đèn cũ",
      "Thắp đèn dọc con phố",
      "Xếp dụng cụ sửa đèn",
    ),
  },
  {
    entityId: "aw2-npc-nguoi-ban",
    name: "Người Bán Bữa Sáng",
    activities: activity(
      "Bày giỏ bữa sáng",
      "Gói phần ngon mang về",
      "Đếm lại giỏ và khăn gói",
      "Ủ khăn sạch cho sáng mai",
    ),
  },
  {
    entityId: "aw2-npc-sua-ghe",
    name: "Thợ Sửa Ghế",
    activities: activity(
      "Chọn đệm cho ghế thấp",
      "Nắn chân và sửa mặt ghế",
      "Cất đục, dây và miếng đệm",
      "Kiểm lại những chiếc ghế chờ",
    ),
  },
  {
    entityId: "aw2-npc-dem-nuoc",
    name: "Em Đem Nước",
    activities: activity(
      "Múc đầy bình nước nhỏ",
      "Đem nước dọc Phố Đèn Lồng",
      "Rửa bình bên hiên",
      "Nghỉ cạnh bình đã úp khô",
    ),
  },
  {
    entityId: "aw2-npc-ban-bai",
    name: "Chủ Bàn Bài",
    activities: activity(
      "Xếp bộ bài mượn",
      "Hướng dẫn bàn TCG",
      "Thu lại bài sau lượt chơi",
      "Che khăn cho bàn bài",
    ),
  },
  {
    entityId: "aw2-npc-ban-co",
    name: "Chủ Bàn Cờ",
    activities: activity(
      "Lau bàn và đếm quân cờ",
      "Hướng dẫn bàn Auto Chess",
      "Xếp quân về khay gỗ",
      "Ngẫm lại thế cờ cuối ngày",
    ),
  },
  {
    entityId: "aw2-npc-gac-bep",
    name: "Dì Gác Bếp",
    activities: activity(
      "Chuẩn bị sân và dụng cụ bếp",
      "Giữ cửa bếp và chỉ lối",
      "Rửa muôi bên bồn nước",
      "Canh bếp sáng cho người về",
    ),
  },
] as const satisfies readonly NpcLifeSchedule[]

const scheduleByEntity: ReadonlyMap<string, NpcLifeSchedule> = new Map(
  NPC_LIFE_SCHEDULES.map((schedule) => [schedule.entityId, schedule]),
)

function validTime(elapsedMs: number) {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0)
    throw Error("Invalid NPC life time")
}

export function npcLifeClock(elapsedMs: number): NpcLifeClock {
  validTime(elapsedMs)
  const minuteOfDay =
    (NPC_LIFE_START_MINUTE + Math.floor(elapsedMs / NPC_LIFE_MINUTE_MS)) %
    NPC_LIFE_DAY_MINUTES
  const hour = Math.floor(minuteOfDay / 60)
  const minute = minuteOfDay % 60
  const phase: NpcLifePhase =
    minuteOfDay >= 6 * 60 && minuteOfDay < 10 * 60
      ? "morning"
      : minuteOfDay >= 10 * 60 && minuteOfDay < 17 * 60
        ? "day"
        : minuteOfDay >= 17 * 60 && minuteOfDay < 20 * 60
          ? "evening"
          : "night"
  const phaseLabel = {
    morning: "Buổi sáng",
    day: "Ban ngày",
    evening: "Chiều tối",
    night: "Ban đêm",
  }[phase]
  return {
    minuteOfDay,
    hour,
    minute,
    phase,
    phaseLabel,
    label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} · ${phaseLabel}`,
  }
}

export function npcLifeActivity(entityId: string, elapsedMs: number) {
  const schedule = scheduleByEntity.get(entityId)
  if (!schedule) return undefined
  const clock = npcLifeClock(elapsedMs)
  return {
    entityId: schedule.entityId,
    name: schedule.name,
    ...schedule.activities[clock.phase],
    clock,
  }
}

export function isNpcLifeEntity(entityId: string) {
  return scheduleByEntity.has(entityId)
}
