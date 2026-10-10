import type { StoryLine } from "./narrative"
import type { GameSave } from "./types"

export const LIVING_CHOICES = [
  { id: "living-market", title: "Ai kể trước?", stage: "living-market-1", options: [
    { id: "listen", name: "Hỏi người đang nấu", text: "Nghe Bà Sen trước, rồi đối chiếu trang sổ. Chuẩn bị hồi phục để giữ người đang kể.", lines: [{speaker:"Bà Sen",text:"Chị bà nấu cháo không có gừng vì hôm ấy nhà hết gừng. Cháo vẫn giúp người bệnh qua đêm."},{speaker:"Tịnh",text:"Ta sẽ ghi tên chị và hoàn cảnh hôm đó, thay vì gạch công thức của chị."}] },
    { id: "read", name: "Đọc dòng bị gạch", text: "Đọc lời Tịnh trước, rồi hỏi Bà Sen. Chuẩn bị phép rút và phản chế để tìm phần sổ còn thiếu.", lines: [{speaker:"Tịnh",text:"Ta từng gạch món cháo này vì thiếu gừng. Ta chưa hỏi người nấu vì sao."},{speaker:"Bà Sen",text:"Hôm ấy nhà hết gừng. Cháu hãy nghe người nấu trước khi gọi món của họ là sai."}] },
  ] },
  { id: "rain-harbor", title: "Đi qua bến bằng đường nào?", stage: "rain-harbor-1", options: [
    { id: "short", name: "Đường ngắn qua mưa", text: "Lời kể nhấn vào việc giữ lời hẹn. Chuyến thám hiểm mới có thể chọn đường thử thách: địch mạnh hơn, nhận thêm tiếp tế khi thắng.", lines: [{speaker:"Hải",text:"Ta đi đường ngắn để giao thư hôm nay. Mưa nặng hơn, nên phải giữ đồng đội đủ sức qua bến."}] },
    { id: "long", name: "Đường dài qua mái hiên", text: "Lời kể nhấn vào lắng nghe. Chuyến mới có thể chọn đường an toàn: hồi nhẹ giữa trận, giữ thưởng cơ bản.", lines: [{speaker:"Mộc",text:"Chúng mình đi qua mái hiên, dừng lại nghe người nhận thư. Giao thư chậm một chút còn hơn không nghe họ trả lời."}] },
  ] },
  { id: "tomorrow-table", title: "Trang sổ dành cho ngày mai", stage: "tomorrow-table-1", options: [
    { id: "variants", name: "Ghi cả những cách nấu", text: "Kết cảnh giữ tên người nấu và các biến thể bên nhau. Phần thưởng chơi không đổi.", lines: [{speaker:"Tịnh",text:"Ta ghi từng cách nấu cùng tên người kể. Người đọc sẽ biết vì sao chúng khác nhau."}] },
    { id: "open", name: "Để người sau viết tiếp", text: "Kết cảnh để một trang trống cho người tới sau. Phần thưởng chơi không đổi.", lines: [{speaker:"An",text:"Mình để lại một trang trống. Người tới sau sẽ tự viết tên và công thức của họ."}] },
  ] },
] as const
export type LivingChapter = typeof LIVING_CHOICES[number]["id"]
export type LivingDecision = typeof LIVING_CHOICES[number]["options"][number]["id"]
export function validLivingDecision(chapter: string, decision: string) {
  return LIVING_CHOICES.some(c => c.id === chapter && c.options.some(o => o.id === decision))
}
export function livingChoiceLines(stage: string, save: GameSave, after = false): StoryLine[] {
  const chapter=LIVING_CHOICES.find(c=>stage.startsWith(`${c.id}-`))
  if(!chapter) return []
  const decision=save.story400?.decisions?.[chapter.id]
  const option=chapter.options.find(o=>o.id===decision)
  if(!option) return []
  if(after && stage === "tomorrow-table-3") return [{speaker:"Người kể",text:decision === "open" ? "Bữa cơm khép lại bên một trang giấy còn trống. Người tới sau được mời viết tiếp." : "Cuốn sổ giữ những cách nấu khác nhau, mỗi cách có tên người đã kể. Không tên nào bị gạch đi."}, ...option.lines]
  return !after && stage === chapter.stage ? [...option.lines] : []
}
