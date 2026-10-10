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
      "An mang sổ công thức về chợ. Mực tự đổi những câu người ta đã nói. Bà Sen muốn giữ cả lời nhận lỗi, còn Nhiên sợ lời ấy làm người bán hàng tổn thương.",
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
      "Hải trở lại bến để giao một lời xin lỗi chưa từng gửi. Mộc đặt mầm cây cạnh bếp: một món nấu chậm cũng có thể cứu người khỏi vội vàng.",
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
      "Tịnh quay lại sửa hậu quả mình gây ra. Không chiếc muôi nào đưa Mai sống lại. Bữa cơm này dành cho những người còn có thể chọn cách đối xử với nhau.",
    titles: [
      "Khăn ấm sau mưa",
      "Đèn cho người đi tiếp",
      "Không viết hộ ngày mai",
    ],
    opponents: ["Linh ảnh lạnh lẽo", "Lời Hứa Bất Khả", "Trang Giấy Cuối"],
    rewards: ["v4-warm-towel", "v4-moon-token", "v4-market-host"],
  },
] as const
const conversations = [
  [
    [
      "An",
      "Có người viết lại lời bố thành một câu đẹp hơn. Nhưng lời xin lỗi của bố biến mất.",
    ],
    ["Bà Sen", "Giữ sự thật không có nghĩa là kể nó để làm đau người khác."],
  ],
  [
    [
      "Nhiên",
      "Ta có thể giữ lửa mà không dùng hết ớt. Con chọn cách mở câu chuyện đi.",
    ],
    [
      "An",
      "Con sẽ chọn trước khi đặt lá bài xuống, và chịu trách nhiệm cho lựa chọn ấy.",
    ],
  ],
  [
    ["Sổ Tự Sửa", "Ta chỉ làm mọi câu chuyện dễ chịu hơn."],
    [
      "Bà Sen",
      "Một câu chuyện không cho ai nhận lỗi cũng không cho ai lớn lên.",
    ],
  ],
  [
    [
      "Hải",
      "Cha không còn ở đây để đọc thư. Nhưng người nhận phần cháo của ông vẫn còn.",
    ],
    ["Mộc", "Đừng gọi người mới là bản sao của người đã mất."],
  ],
  [
    [
      "Mộc",
      "Ủ vị không phải quên chiếc nồi. Con phải giữ nó qua lượt của người khác.",
    ],
    ["Hải", "Và nếu cần mở nắp, hãy chọn đúng nồi."],
  ],
  [
    ["Người Giữ Con Nước", "Chờ đợi là chịu thua."],
    ["Hải", "Không. Chờ đủ lâu để nghe rồi mới trả lời cũng là một hành động."],
  ],
  [
    [
      "Liên",
      "Chị Mai đã cứu em. Em không muốn ai sửa điều ấy thành một câu chuyện không có mất mát.",
    ],
    ["An", "Chiếc khăn này dành cho bàn tay em hôm nay."],
  ],
  [
    ["Bách", "Ta đã giấu sự thật vì sợ mất con thêm lần nữa."],
    [
      "Liên",
      "Vậy lần này xin đừng hứa rằng một món ăn có thể làm người đã mất sống lại.",
    ],
  ],
  [
    [
      "Tịnh",
      "Ta không xin viết lại chuyện đã xảy ra. Cho ta rửa bát sau bữa cơm này.",
    ],
    ["An", "Được. Ngày mai ai nấu, người đó sẽ tự viết vào sổ."],
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
    const before = [
      {
        speaker: "Người kể",
        text: `${title}. Hơi ấm từ bàn ăn mở lối qua những dòng chữ tự đổi; quyết định của người đang sống sẽ giữ lại trang này.`,
      },
      ...conversations[ci * 3 + i].map(([speaker, text]) => ({
        speaker,
        text,
      })),
    ]
    const after = [
      {
        speaker: "Người kể",
        text: "Mực ngừng chuyển động. Người ngồi bên bàn tự ghi một dòng về điều mình vừa làm, giữ nguyên những vết cũ.",
      },
      {
        speaker: c.character.split(" · ")[0],
        text:
          i === 2
            ? "Trang giấy vẫn còn vết mực cũ. Chúng mình sẽ viết tiếp vào khoảng trống, không xóa người đã đi qua."
            : "Một lời được trả về đúng người. Bữa cơm tiếp theo còn cần chúng mình.",
      },
    ]
    LIVING_SCENES[id] = {
      before,
      after,
      tactic:
        ci === 0
          ? "Nêm vị: chọn một nhánh trước khi thi triển. Mỗi lá chỉ tính một phép."
          : ci === 1
            ? "Ủ vị giải quyết ở đầu lượt sau. Mỗi phe giữ tối đa hai hiệu ứng chờ; mở nắp có thể gỡ một hiệu ứng."
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
        ? "Tôi vẫn là một ký ức, không phải một người được hồi sinh. Lần này, hãy nghe An viết câu chuyện của em."
        : "Mai đã được tiễn đi. Con mang chiếc sổ đến đây bằng đôi chân của mình; không ai cần trở thành chị ấy.",
  }
}
