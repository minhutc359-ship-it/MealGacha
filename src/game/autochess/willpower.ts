import type { AutoMode, AutoRun } from "./types"

export const startingWillpower = (mode: AutoMode) => mode === "survival" ? 3 : 100
export const maxWillpower = (run: Pick<AutoRun, "mode" | "finished" | "willpowerVersion">) =>
  run.mode === "survival" && !(run.finished && !run.willpowerVersion) ? 3 : 100
export const willpowerRatio = (run: AutoRun) => run.health / maxWillpower(run)
export const lossDamage = (mode: AutoMode, enemies: number) =>
  mode === "survival" ? 1 : Math.min(25, 5 + 2 * enemies)
export const canRetry = (run: AutoRun) => run.mode !== "daily" && run.health > 0
export const willpowerHelp = (mode: AutoMode) => mode === "survival"
  ? "3 ý chí = 3 lần thua. Mỗi lần thua mất 1, chơi lại đúng đợt đó; thắng không hồi ý chí. Hết ý chí kết thúc và lưu điểm."
  : mode === "campaign"
    ? "Ý chí là sức bền của An qua chiến dịch, khác với máu từng quân. Thua mất 5 + 2 × số địch còn sống (tối đa 25); còn ý chí thì chơi lại cùng đợt. Hết ý chí kết thúc và lưu điểm."
    : "Thử thách ngày có một lượt: đội hình bị hạ sẽ kết thúc và ghi kỷ lục của ngày."
