import type { Chapter } from "./types"
import type { StoryScene } from "./narrative"
const chapters = [
  {
    id: "living-market",
    title: "Chợ có hai giọng",
    school: "sugar",
    character: "An · Bà Sen · Nhiên",
    arena: "market",
    subtitle: "Sổ Tự Sửa · trang thứ nhất",
    intro:
      "An mang sổ công thức về chợ, tìm lại trang ghi lời bố nhận lỗi. Mực trong sổ tự đổi những câu người ta đã nói. Bà Sen muốn giữ cả lời nhận lỗi, còn Nhiên sợ lời ấy làm người bán hàng tổn thương.",
    titles: ["Một câu bị sửa", "Hai nhúm gia vị", "Tiếng rao của ngày mai"],
    opponents: ["Linh ảnh lời đồn", "Người Chép Hộ", "Sổ Tự Sửa"],
    rewards: ["v4-crossroads-tea", "v4-two-spices", "v4-market-host"],
  },
  {
    id: "rain-harbor",
    title: "Bến sau cơn mưa",
    school: "tide",
    character: "Hải · Mộc",
    arena: "harbor",
    subtitle: "Điều tốt cần thời gian",
    intro:
      "Hải trở lại bến để giao một lời xin lỗi chưa từng gửi. Mộc nhắc Hải đợi người nhận kể hết chuyện, thay vì vội xin được tha thứ.",
    titles: ["Lá thư chưa gửi", "Chờ nước rút", "Nắp nồi và con sóng"],
    opponents: ["Linh ảnh nóng vội", "Bóng Mưa", "Người Giữ Con Nước"],
    rewards: ["v4-banked-coals", "v4-rain-seed", "v4-unseal-recipe"],
  },
  {
    id: "tomorrow-table",
    title: "Bữa cơm ngày mai",
    school: "hearth",
    character: "Bách · Liên · An · Tịnh",
    arena: "kitchen",
    subtitle: "Một chiếc ghế dành cho người đang sống",
    intro:
      "Tịnh quay lại giúp những người bị mình gạch tên khỏi Sổ Công Thức. Không chiếc muôi nào đưa Mai sống lại. Bữa cơm này dành cho những người còn có thể chọn cách đối xử với nhau.",
    titles: [
      "Khăn ấm sau mưa",
      "Đèn cho người đi tiếp",
      "Không viết hộ ngày mai",
    ],
    opponents: ["Linh ảnh lạnh lẽo", "Lời Hứa Bất Khả", "Trang Giấy Cuối"],
    rewards: ["v4-warm-towel", "v4-moon-token", "v4-market-host"],
  },
] as const
// Each stage has its own situation and outcome; avoid a shared metaphorical outro.
const conversations = [
  [
    [
      "An",
      "Đây là lời bố mình ghi trong sổ. Ai đó đã sửa cho dễ nghe hơn, rồi xóa luôn câu bố nhận lỗi.",
    ],
    [
      "Bà Sen",
      "Cháu cứ giữ câu ấy. Người bị tổn thương cần được nghe lời xin lỗi, rồi tự quyết định có tha thứ hay không.",
    ],
  ],
  [
    [
      "Nhiên",
      "Tôi từng nghĩ sửa cho dễ nghe sẽ đỡ làm người ta buồn. Nhưng Người Chép Hộ còn muốn chọn mọi lời thay mình; ông ta đâu biết người nghe cần gì.",
    ],
    [
      "An",
      "Mình sẽ tự chọn lời nói. Cũng như lá Nêm vị này: phải chọn tác dụng trước khi dùng, không thể giao cho người khác chọn hộ.",
    ],
  ],
  [
    [
      "Sổ Tự Sửa",
      "Ta xóa những câu khiến người ta buồn. Chẳng phải một câu chuyện vui sẽ tốt hơn sao?",
    ],
    [
      "Bà Sen",
      "Ngươi xóa cả lời nhận lỗi. Người làm sai không sửa được mình, còn người bị làm đau lại chẳng được ai xin lỗi.",
    ],
  ],
  [
    [
      "Hải",
      "Ta từng để sương xóa tên những người mất tích khỏi sổ bến. Lá thư này là lời xin lỗi của ta với những người còn nhớ họ.",
    ],
    [
      "Mộc",
      "Vậy hãy để họ đọc, rồi nghe họ trả lời. Họ có thể chưa tha thứ ngay; mình không được thúc ép.",
    ],
  ],
  [
    [
      "Mộc",
      "Gieo mầm rồi phải chăm, không phải cứ đợi là cây sẽ lớn. Với Ủ vị cũng vậy: hiệu ứng còn phải chờ đến đầu lượt sau của mình.",
    ],
    [
      "Hải",
      "Trong lúc chờ, hãy giữ quân được Ủ vị sống sót. Nếu dùng Mở nắp để phản chế, nhớ chọn đúng hiệu ứng của địch.",
    ],
  ],
  [
    [
      "Người Giữ Con Nước",
      "Chờ đến bao giờ? Không có câu trả lời ngay thì các ngươi đã thua rồi.",
    ],
    [
      "Hải",
      "Ta đã xin lỗi. Bây giờ ta sẽ nghe họ, kể cả những điều khó nghe. Tha thứ không phải thứ ta có quyền đòi ngay.",
    ],
  ],
  [
    [
      "Liên",
      "Chị Mai đã mất khi cứu tôi. Tôi muốn mọi người nhớ việc chị làm, cả cái giá chị phải trả.",
    ],
    [
      "An",
      "Mình nghe rồi. Tay bạn còn lạnh sau cơn mưa; lấy chiếc khăn này nhé.",
    ],
  ],
  [
    [
      "Bách",
      "Cha đã giấu chuyện Mai cứu con, rồi hứa sẽ đưa cô ấy trở về. Cha sợ phải thừa nhận mình không làm được.",
    ],
    [
      "Liên",
      "Con cần cha nói thật và ở bên con. Con không cần một lời hứa đưa người đã mất sống lại.",
    ],
  ],
  [
    [
      "Tịnh",
      "Ta sẽ ghi lại những tên mình đã xóa, rồi hỏi từng người muốn kể công thức ra sao. Còn tối nay, để ta rửa bát.",
    ],
    [
      "An",
      "Được. Trong sổ mới, mỗi người sẽ tự kể cách nấu của mình. Nếu chưa hiểu, chúng ta hỏi họ trước khi sửa.",
    ],
  ],
] as const
const stageNarration = [
  "An mở sổ giữa chợ. Một câu nhận lỗi vừa hiện lên đã bị mực đen phủ mất. Linh ảnh lời đồn chặn đường tới người đang sửa sổ.",
  "Người Chép Hộ giành lấy trang giấy, nhất quyết chọn lời thay An. Trên bàn đấu, hai nhúm gia vị gợi hai tác dụng khác nhau của lá Nêm vị.",
  "Sổ Tự Sửa lật trang liên tục. Mỗi lời xin lỗi đều bị đổi thành một câu vô hại. Bà Sen đặt tay lên trang giấy để giữ câu An vừa tìm lại.",
  "Hải mang lá thư đến bến. Linh ảnh nóng vội thúc ông cất tiếng trước khi những người nhận thư kịp đọc xong.",
  "Mưa chưa dứt. Mộc đặt một mầm cây dưới mái bếp, còn Hải chuẩn bị lá Ủ vị. Bóng Mưa tìm cách đánh tan hiệu ứng trước khi nó kịp có tác dụng.",
  "Người Giữ Con Nước chặn bến, đòi một câu trả lời ngay. Hải vẫn đứng đợi những người nhận thư nói hết điều họ muốn nói.",
  "Liên trở về căn bếp sau cơn mưa. Một linh ảnh lạnh lẽo phủ lên bàn ăn, khiến cô nhớ lại người đã cứu mình trong trận lũ.",
  "Lời Hứa Bất Khả dựng lại bữa ăn chờ Mai trở về. Bách và Liên ngồi đối diện nhau; lần này, ông phải nói thật với con gái.",
  "Trang Giấy Cuối chỉ chấp nhận một công thức cho tất cả mọi người. An đặt những bản ghi khác nhau lên bàn, còn Tịnh chuẩn bị trả lại những tên mình từng xóa.",
] as const
const stageOutcomes = [
  [
    "Linh ảnh tan. Câu nhận lỗi hiện lại trên trang sổ; An đọc nguyên lời bố đã viết.",
    "An",
    "Mình sẽ mang lời này đến người bố đã xin lỗi. Còn họ có tha thứ hay không, mình không thể quyết định thay.",
  ],
  [
    "Người Chép Hộ buông trang giấy. An tự ghi lại lời mình đã chọn, không nhờ ông ta sửa cho dễ nghe hơn.",
    "Nhiên",
    "Cậu đã tự chọn và tự nói. Giờ hãy nghe người nhận trả lời.",
  ],
  [
    "Sổ Tự Sửa ngừng đổi chữ. Bà Sen giữ lại cả câu nhận lỗi lẫn lời đáp của người bị tổn thương.",
    "Bà Sen",
    "Cháu thấy không, họ đã bắt đầu nói chuyện với nhau. Không cần biến mọi lời thành lời vui.",
  ],
  [
    "Linh ảnh nóng vội biến mất. Hải trao thư và ngồi xuống, để những người nhận có thời gian đọc.",
    "Hải",
    "Ta đã nói điều cần nói. Bây giờ ta sẽ nghe, không tìm cách giải thích để né lỗi của mình.",
  ],
  [
    "Bóng Mưa tan. Mộc che mầm cây khỏi nước tạt; bên bếp, Hải chờ nồi thức ăn chín.",
    "Mộc",
    "Mầm còn nhỏ, ngày mai vẫn phải chăm. Chờ đợi có ích khi mình biết cần làm gì trong lúc chờ.",
  ],
  [
    "Đường vào bến mở lại. Hải ở lại nghe từng người, ghi nhận cả những câu chưa có lời đáp.",
    "Hải",
    "Có người vẫn còn giận ta. Ta sẽ sửa sổ bến và trả lại những cái tên, dù họ chưa thể tha thứ.",
  ],
  [
    "Linh ảnh tan. Liên lau tay bằng chiếc khăn ấm, rồi cùng An dọn bữa cơm cho mọi người.",
    "Liên",
    "Tôi vẫn nhớ chị Mai. Nhưng tôi cũng muốn ăn một bữa cơm với những người đang ở đây.",
  ],
  [
    "Bữa ăn ảo chờ Mai biến mất. Bách kéo ghế ngồi cạnh Liên, không hứa thêm một phép màu nào.",
    "Bách",
    "Cha không thể đưa Mai trở về. Cha có thể kể đúng việc cô ấy đã làm, và ở đây khi con cần cha.",
  ],
  [
    "Trang giấy không còn xóa những công thức khác nhau. Tịnh bắt đầu ghi lại các tên cũ; An để mỗi người tự viết phần của mình.",
    "An",
    "Bữa cơm ngày mai sẽ do chúng mình nấu. Nhớ người đã mất, rồi chăm sóc những người còn bên cạnh.",
  ],
] as const
export const LIVING_SCENES: Record<string, StoryScene> = {}
export const LIVING_CHAPTERS: Chapter[] = chapters.map((c, ci) => ({
  id: c.id,
  title: c.title,
  school: c.school,
  character: c.character,
  art: `/assets/v4/arenas/${c.arena}.webp`,
  subtitle: c.subtitle,
  intro: c.intro,
  stages: c.titles.map((title, i) => {
    const id = `${c.id}-${i + 1}`
    const sceneIndex = ci * 3 + i
    const before = [
      { speaker: "Người kể", text: stageNarration[sceneIndex] },
      ...conversations[sceneIndex].map(([speaker, text]) => ({
        speaker,
        text,
      })),
    ]
    const [narration, speaker, text] = stageOutcomes[sceneIndex]
    const after = [
      { speaker: "Người kể", text: narration },
      { speaker, text },
    ]
    LIVING_SCENES[id] = {
      before,
      after,
      tactic:
        ci === 0
          ? "Nêm vị: chọn một nhánh trước khi thi triển. Mỗi lá chỉ tính một phép."
          : ci === 1
            ? "Ủ vị có tác dụng ở đầu lượt sau của phe đã dùng nó. Mỗi phe giữ tối đa hai hiệu ứng chờ; mở nắp có thể gỡ một hiệu ứng."
            : "Giữ hồi phục và một cách phản chế. Sự chuẩn bị giúp bạn đi qua lượt thức tỉnh của boss.",
      clue: { title, text: before.map((l) => l.text).join(" ") },
    }
    return {
      id,
      title,
      opponent: c.opponents[i],
      boss: i === 2,
      rewardCard: c.rewards[i],
      dialogue: before.map((l) => `${l.speaker}: ${l.text}`).join("\n\n"),
      ending: after.map((l) => `${l.speaker}: ${l.text}`).join("\n\n"),
    }
  }),
}))
export function livingOpening(
  ending: "remember" | "release" | null | undefined,
) {
  return {
    speaker: ending === "remember" ? "Mai · tiếng vọng" : "An",
    text:
      ending === "remember"
        ? "Tôi chỉ còn là tiếng vọng trong câu chuyện được kể lại. Tôi không sống lại. Hành trình này là của An và những người đang sống."
        : "Mai đã được tiễn đi. Mình là An, và mình mang chiếc sổ về chợ để nghe mọi người kể chuyện của họ.",
  }
}
