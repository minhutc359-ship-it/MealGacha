import {
  MEMORY_IDS,
  QUEST_GRANTS,
  QUEST_IDS,
  STARTER_TEAM,
  ZONE_IDS,
} from "./ids"
import { canStand, zoneById, type WorldObject } from "./maps"
import { worldObjects, type NpcPatrolState } from "./npcPatrol"
import { worldProgressSchema, type WorldProgress } from "./model"

export const INTERACT_RANGE = 48
export const questLabel = (state: WorldProgress) =>
  [
    "Một chỗ bên bàn",
    "Ba mẩu ký ức",
    "Mở lại bếp",
    "Thêm một chén",
    "Một chỗ bên bếp · đã hoàn tất",
  ][state.questIndex]
export const completedReceipts = (state: WorldProgress) =>
  QUEST_GRANTS.slice(0, state.questIndex)
export const currentQuestId = (state: WorldProgress) =>
  QUEST_IDS[state.questIndex]
export function currentObjective(state: WorldProgress): string {
  if (state.questIndex === 0)
    return !state.accepted
      ? "Đến Bà Giữ Chỗ ở làng để nhận lời nhờ."
      : !state.tableRead
        ? "Đọc mảnh khăn trên Bàn chung rồi trở lại Bà."
        : "Trở lại Bà Giữ Chỗ để đón năm người bạn."
  if (state.questIndex === 1)
    return !state.accepted
      ? "Đến An Vá Đèn tại Phố Đèn Lồng."
      : state.memories.length < 3
        ? `Nghe ba câu chuyện ở Phố: còn ${3 - state.memories.length} mẩu ký ức.`
        : "Trở lại An Vá Đèn, chọn nét chỉ để nối mảnh khăn."
  if (state.questIndex === 2)
    return !state.accepted
      ? "Gặp Dì Gác Bếp ở Sân Bếp Bỏ Quên."
      : !state.hintRead
        ? "Vào Phòng Kho, đọc Bảng dấu hơi."
        : state.puzzleStep < 3
          ? "Trong Phòng Lửa: mở lối thoát → đặt nồi → nhóm lửa."
          : "Trở về Sân, báo Dì rằng bếp đã sáng."
  if (state.questIndex === 3)
    return !state.accepted
      ? "Nhận nhiệm vụ Thêm một chén tại Dì Gác Bếp."
      : !state.bossDefeated
        ? "Đến Phòng Bàn và vượt thử thách Người Giữ Bàn Quên."
        : !state.tableNoteRead
          ? "Đọc Ghi chép bên chén trong Phòng Bàn."
          : "Trở về Bà Giữ Chỗ, chọn cách giữ lời mời."
  return "Bếp đã sáng. Bạn có thể khám phá, mở rương và chia một bữa ấm."
}
export function nearestObject(
  state: WorldProgress,
  patrol?: Readonly<NpcPatrolState>,
): WorldObject | undefined {
  return worldObjects(state, patrol)
    .filter(
      (object) =>
        Math.hypot(state.x - object.x, state.y - object.y) <= INTERACT_RANGE,
    )
    .sort(
      (a, b) =>
        Math.hypot(state.x - a.x, state.y - a.y) -
        Math.hypot(state.x - b.x, state.y - b.y),
    )[0]
}
export function moveWorld(
  state: WorldProgress,
  dx: number,
  dy: number,
  seconds: number,
): WorldProgress {
  if (![dx, dy, seconds].every(Number.isFinite) || seconds <= 0 || (!dx && !dy))
    return state
  const length = Math.hypot(dx, dy)
  const distance = 140 * Math.min(seconds, 0.05)
  const vx = (dx / length) * distance,
    vy = (dy / length) * distance
  let x = state.x,
    y = state.y
  if (canStand(state.zoneId, x + vx, y)) x += vx
  if (canStand(state.zoneId, x, y + vy)) y += vy
  return {
    ...state,
    x,
    y,
    facing:
      Math.abs(dx) > Math.abs(dy)
        ? dx < 0
          ? "left"
          : "right"
        : dy < 0
          ? "up"
          : "down",
  }
}

export interface WorldDialogAction {
  id: string
  label: string
}
export interface WorldDialog {
  title: string
  text: string
  actions: WorldDialogAction[]
}
const action = (id: string, label: string) => ({ id, label })
export function describeObject(
  state: WorldProgress,
  object: WorldObject,
): WorldDialog {
  const result = (text: string, actions: WorldDialog["actions"] = []) => ({
    title: object.name,
    text,
    actions,
  })
  if (object.kind === "exit") {
    const locked =
      (object.to === ZONE_IDS[3] &&
        object.id.endsWith(":east") &&
        !(
          state.questIndex > 2 ||
          (state.questIndex === 2 && state.accepted)
        )) ||
      (object.to === ZONE_IDS[5] && state.puzzleStep !== 3) ||
      (object.requiresCompleted && state.questIndex !== 4)
    return locked
      ? result("Cửa chưa mở. Tiếp tục nhiệm vụ và đọc gợi ý tại Dì Gác Bếp.")
      : result("Đi qua sẽ lưu vị trí an toàn tại vùng đích.", [
          action("travel", "Đi qua"),
        ])
  }
  if (object.kind === "mode")
    return result(
      object.id === "aw2-npc-ban-bai"
        ? "Ghé bàn TCG luyện tập với bộ bài mượn, rồi quay về điểm khám phá đã lưu. Không tốn vật phẩm, không nhận thưởng."
        : "Ghé bàn Auto Chess luyện tập: tuyển Vị Linh mượn, xếp đội và đấu 5 vòng, rồi quay về điểm khám phá đã lưu. Không tốn vật phẩm, không nhận thưởng hành trình.",
      [action("visit-mode", "Ghé bàn")],
    )
  if (object.kind === "chest")
    return result(
      "Rương nguyên liệu: 4 Gạo thơm, 3 Rau vườn, 2 Nước dùng. Mỗi hành trình chỉ nhận một lần.",
    )
  if (object.kind === "boss") {
    if (state.questIndex === 4)
      return result(
        "Đấu lại để luyện đội hình đã lưu. Không nhận EXP, vật phẩm hoặc phần thưởng; thắng, thua và rút lui đều trở về Phòng Bàn, giữ nguyên kết thúc đã chọn.",
        [action("rematch", "Đấu lại boss · không nhận thưởng")],
      )
    if (state.bossDefeated)
      return result(
        "Ký ức đã lắng xuống. Đọc ghi chép bên chén rồi trở về Bà Giữ Chỗ.",
      )
    return state.questIndex === 3 && state.accepted
      ? result(
          "Thử thách đội năm Vị Linh. Thua hoặc rút lui trở về Sân, không mất tiến trình. Tải lại giữa trận giữ điểm kiểm tra và không tính thắng. Chỉ số và hình địch đang dùng bản thử nghiệm.",
          [action("challenge", "Bắt đầu thử thách")],
        )
      : result(
          "Trở lại Dì Gác Bếp để nhận nhiệm vụ Thêm một chén trước khi vào trận.",
        )
  }
  if (object.kind === "note")
    return result(
      "Trên bàn còn một lời mời chưa ghi tên. Một chén được để dành cho người chưa trở lại.",
      state.questIndex === 3 &&
        state.accepted &&
        state.bossDefeated &&
        !state.tableNoteRead
        ? [action("read-note", "Đọc ghi chép")]
        : [],
    )
  if (object.kind === "table")
    return result(
      "Một mảnh khăn còn để dành trên bàn.",
      state.questIndex === 0 && state.accepted && !state.tableRead
        ? [action("inspect", "Đọc mảnh khăn")]
        : [],
    )
  if (object.kind === "memory")
    return result(
      [
        "Tôi nhớ một người luôn xin gói phần ngon nhất mang về. Không nhớ gói cho ai.",
        "Chiếc ghế thấp này từng được kê thêm đệm. Tôi vẫn giữ phần đệm ấy.",
        "Em chỉ nhớ phải đặt thêm một chén. Đặt thêm vẫn tốt hơn để ai đó thiếu.",
      ][object.memory!],
      state.questIndex === 1 &&
        state.accepted &&
        !state.memories.includes(MEMORY_IDS[object.memory!])
        ? [action("remember", "Ghi nhớ câu chuyện")]
        : [],
    )
  if (object.kind === "hint")
    return result(
      "Mở lối thoát → đặt nồi → nhóm lửa. Làm sai có thể thử lại, không mất tài nguyên.",
      state.questIndex === 2 && state.accepted && !state.hintRead
        ? [action("inspect", "Ghi lại gợi ý")]
        : [],
    )
  if (object.kind === "puzzle")
    return result(
      state.puzzleStep === 3
        ? "Bếp đã sáng. Cửa trong được mở."
        : `Đã đúng ${state.puzzleStep}/3 bước.`,
      state.questIndex === 2 &&
        state.accepted &&
        state.hintRead &&
        state.puzzleStep < 3
        ? [action("puzzle", object.name)]
        : [],
    )
  if (state.questIndex === 4 && object.id === "aw2-npc-giu-cho")
    return result(
      state.endingChoice === "wait"
        ? "Chiếc ghế vẫn được để dành. Bếp sáng để người trở lại còn tìm thấy lối về."
        : "Bà mời cả làng cùng ngồi. Bên bàn vẫn còn chỗ cho người đến sau.",
    )
  const owner = [
    "aw2-npc-giu-cho",
    "aw2-npc-va-den",
    "aw2-npc-gac-bep",
    state.bossDefeated && state.tableNoteRead
      ? "aw2-npc-giu-cho"
      : "aw2-npc-gac-bep",
  ][state.questIndex]
  if (object.id !== owner)
    return result(
      object.id === "aw2-npc-giu-cho"
        ? "Chưa nhớ được tên cũng không sao. Con đã giúp bà giữ lời mời."
        : "Đường về luôn còn ở phía sau. Cứ quay lại khi con sẵn sàng.",
    )
  if (!state.accepted)
    return result(
      [
        "Bà nhớ đã để dành chiếc ghế này. Chỉ không nhớ đã hẹn ai. Con đọc giúp bà mảnh khăn nhé?",
        "Đèn tắt thì thay tim. Còn người quên nhau, phải tìm xem ai đang chờ. Hỏi ba người ở phố rồi quay lại nhé.",
        "Đường về ở ngay sau lưng con. Đọc bảng dấu hơi trong Kho rồi giải puzzle để mở bếp.",
        "Bếp đã sáng. Phía trong còn một chỗ đang đợi. Đến Phòng Bàn, vượt thử thách rồi đọc ghi chép và trở về Bà nhé.",
      ][state.questIndex],
      [action("accept", "Nhận nhiệm vụ")],
    )
  if (state.questIndex === 0 && state.tableRead)
    return result("Cảm ơn con. Năm người bạn sẽ cùng con lên đường.", [
      action("turn-in", "Hoàn tất nhập môn"),
    ])
  if (state.questIndex === 1 && state.memories.length === 3)
    return result(
      "Ba nét chỉ khác nhau vẫn giữ cùng một mép khăn. Con chọn nét chỉ nào?",
      [
        action("thread-wait", "Người chờ"),
        action("thread-return", "Người trở lại"),
      ],
    )
  if (state.questIndex === 2 && state.puzzleStep === 3)
    return result("Bếp sáng rồi. Chừa cửa cho người đến sau nhé.", [
      action("turn-in", "Báo đã mở bếp"),
    ])
  if (state.questIndex === 3 && state.tableNoteRead)
    return result(
      "Chưa nhớ được tên cũng không sao. Con đã giúp bà giữ lời mời. Con muốn giữ chỗ thế nào?",
      [
        action("seat-wait", "Để ghế trống chờ"),
        action("seat-share", "Mời cả làng dùng bữa"),
      ],
    )
  return result(
    "Câu chuyện vẫn đợi con. Hoàn thành mục tiêu rồi quay lại; có thể rời đi và đọc lại gợi ý.",
  )
}

export interface WorldActionResult {
  state: WorldProgress
  message: string
}
export function applyWorldAction(
  state: WorldProgress,
  objectId: string,
  actionId: string,
): WorldActionResult {
  const object = zoneById(state.zoneId).objects.find(
    (candidate) => candidate.id === objectId,
  )
  if (
    !object ||
    Math.hypot(state.x - object.x, state.y - object.y) > INTERACT_RANGE
  )
    throw Error("Hãy đến gần để tương tác.")
  if (
    !describeObject(state, object).actions.some(
      (action) => action.id === actionId,
    )
  )
    throw Error("Thao tác chưa hợp lệ với trạng thái hiện tại.")
  if (actionId === "challenge" || actionId === "rematch")
    throw Error(
      "Bắt đầu trận qua bộ điều khiển boss; không thể ghi kết quả bằng tương tác thường.",
    )
  if (actionId === "visit-mode")
    throw Error(
      "Ghé bàn qua bộ chuyển mode; không thay đổi quest hoặc nhận phần thưởng.",
    )
  let next = { ...state },
    message = "Đã ghi nhận tiến trình AW2."
  if (actionId === "travel")
    next = { ...next, zoneId: object.to!, x: object.spawnX!, y: 192 }
  if (actionId === "accept") next.accepted = true
  if (actionId === "inspect" && object.kind === "table") next.tableRead = true
  if (actionId === "inspect" && object.kind === "hint") next.hintRead = true
  if (actionId === "remember")
    next.memories = [...next.memories, MEMORY_IDS[object.memory!]]
  if (actionId === "read-note") next.tableNoteRead = true
  if (actionId === "seat-wait" || actionId === "seat-share") {
    next.endingChoice = actionId === "seat-wait" ? "wait" : "share"
    next.questIndex = 4
    next.accepted = false
    message =
      "Đã giữ lời mời bên bếp. Nhiệm vụ hoàn tất; quà được lưu cùng tiến trình."
  }
  if (actionId.startsWith("thread-")) {
    next.threadChoice = actionId === "thread-wait" ? "wait" : "return"
    next.questIndex = 2
    next.accepted = false
  }
  if (actionId === "turn-in") {
    if (state.questIndex === 0) next.partyIds = [...STARTER_TEAM]
    next.questIndex++
    next.accepted = false
  }
  if (actionId === "puzzle") {
    const correct = object.step === state.puzzleStep
    next.puzzleStep = correct ? state.puzzleStep + 1 : 0
    message = correct
      ? next.puzzleStep === 3
        ? "Bếp đã sáng; cửa trong mở. Trở lại Dì Gác Bếp."
        : "Đúng nhịp; tiếp tục bước kế."
      : "Chưa đúng thứ tự. Thử lại từ mở lối thoát; không mất tài nguyên."
  }
  next = worldProgressSchema.parse(next)
  if (!canStand(next.zoneId, next.x, next.y))
    throw Error("Điểm đến chưa an toàn.")
  return { state: next, message }
}
