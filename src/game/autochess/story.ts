export const AUTO_ACTS = [
  {
    title: "Chợ còn sáng",
    subtitle: "Một ngọn đèn cho người chưa tới",
    scene: 0,
  },
  {
    title: "Bữa cơm không có tên",
    subtitle: "Món ăn nhớ người từng nấu",
    scene: 1,
  },
  {
    title: "Người giữ sổ",
    subtitle: "Một công thức đúng, nhiều người bị quên",
    scene: 2,
  },
  {
    title: "Ghế dành cho người đến sau",
    subtitle: "Trang cuối vẫn còn chỗ viết",
    scene: 3,
  },
]
AUTO_ACTS.push(
  {
    title: "Bến sau cơn mưa",
    subtitle: "Không viết hộ một lời xin lỗi",
    scene: 1,
  },
  {
    title: "Bữa cơm ngày mai",
    subtitle: "Trả lại tên những người bị xóa khỏi sổ",
    scene: 3,
  },
)
export type Speaker = "an" | "loc" | "sen" | "tinh" | "recorder" | "memory"
export const SPEAKERS: Record<Speaker, { name: string; portrait: number }> = {
  an: { name: "An", portrait: 0 },
  loc: { name: "Ông Lộc", portrait: 1 },
  sen: { name: "Bà Sen", portrait: 2 },
  tinh: { name: "Tịnh", portrait: 3 },
  recorder: { name: "Người chép chuyện", portrait: 4 },
  memory: { name: "Vô Danh", portrait: 5 },
}
export interface Line {
  speaker: Speaker
  text: string
}
export const SCENES: Record<string, {
  title: string
  art: number
  lines: Line[]
}> = {
  "intro-1": {
    title: "Phiên chợ không có sáng mai",
    art: 0,
    lines: [
      {
        speaker: "an",
        text: "Đèn trong chợ tắt từng ngọn. Nhưng tiếng gọi khách vẫn vang… như có người đang chờ một bữa cơm.",
      },
      {
        speaker: "loc",
        text: "Những sạp không còn tên trong Sổ Công Thức đang chìm vào sương. Cháu hãy tìm người từng bán ở đó, giúp họ nhớ tên mình và món mình nấu.",
      },
      { speaker: "an", text: "Tại sao món ăn có thể chiến đấu?" },
      {
        speaker: "loc",
        text: "Không phải đĩa thức ăn đánh nhau. Ký ức của người nấu gọi Vị Linh. Khi cháu đặt món lên bàn, linh thể bước ra để giữ lấy câu chuyện.",
      },
    ],
  },
  "intro-4": {
    title: "Phần cơm cho khách lạ",
    art: 1,
    lines: [
      {
        speaker: "sen",
        text: "Bà luôn nấu dư một phần. Có người đi ngang không đủ can đảm xin một bữa cơm.",
      },
      {
        speaker: "sen",
        text: "Ngày Tết, nhà bà gói bánh tét, nhà bên gói bánh chưng. Khác hình, khác cách nấu, vẫn cùng lời mời ngồi xuống.",
      },
      {
        speaker: "an",
        text: "Sổ ghi món này sai công thức. Nhưng quái trong sương lại dừng khi nghe bà gọi tên.",
      },
      {
        speaker: "sen",
        text: "Đây là cách chị bà từng nấu. Tịnh sửa tên món, và từ đó… chẳng ai nhớ chị ấy nữa.",
      },
    ],
  },
  "intro-7": {
    title: "Mực không xóa được lời mời",
    art: 2,
    lines: [
      {
        speaker: "tinh",
        text: "Ta chỉ giữ một công thức cho mỗi món. Ta tưởng chép thống nhất như thế thì sẽ dễ nhớ, không còn sót ai.",
      },
      {
        speaker: "an",
        text: "Nhưng ông xóa những phiên bản khác. Quái Vô Danh không ăn cắp ký ức. Chúng là những người ông đã gạch khỏi sổ!",
      },
      {
        speaker: "loc",
        text: "Hồi nhỏ, ta nghe hô Bài Chòi ở sân làng. Nhịp vui là để mọi người cùng góp tiếng. Cuốn sổ này cũng phải có chỗ cho nhiều giọng kể.",
      },
      {
        speaker: "tinh",
        text: "Ta từng quên lời mẹ dạy. Ta chỉ muốn… không ai đau như ta.",
      },
      {
        speaker: "recorder",
        text: "Không thể cứu ký ức bằng cách cấm người khác kể chuyện của mình.",
      },
    ],
  },
  "intro-10": {
    title: "Công thức đã tự gạch tên",
    art: 3,
    lines: [
      {
        speaker: "recorder",
        text: "Trang này là chữ của gia đình cháu, An. Họ đã góp công thức, nhưng phải bỏ tên mình vì cách nấu khác bản Tịnh cho phép giữ trong sổ.",
      },
      {
        speaker: "an",
        text: "Vậy mình không đi tìm một cuốn sách thất lạc. Mình đi tìm quyền kể lại câu chuyện của nhà mình.",
      },
      {
        speaker: "sen",
        text: "Mỗi nhà có thể nấu khác nhau mà vẫn muốn chăm sóc người ăn. Bà muốn sổ giữ cả cách nấu của nhà cháu.",
      },
    ],
  },
  "boss-3": {
    title: "Đèn không còn rỗng",
    art: 0,
    lines: [
      {
        speaker: "memory",
        text: "Đừng sửa tên tôi… Tôi đã nấu món ấy cho một người đang chờ.",
      },
      {
        speaker: "an",
        text: "Mọi người, giữ tuyến! Chúng ta sẽ thắng trận này, rồi nghe hết câu chuyện của bạn.",
      },
    ],
  },
  "boss-6": {
    title: "Mực Trắng trả lời",
    art: 1,
    lines: [
      {
        speaker: "memory",
        text: "Tôi bắt chước cách nấu của người khác. Nếu làm giống hệt họ, liệu có ai nhớ đến tôi không?",
      },
      {
        speaker: "sen",
        text: "Cháu không cần giống ai. Bà đã để một chiếc ghế cho cháu.",
      },
    ],
  },
  "boss-9": {
    title: "Một màu không đủ",
    art: 2,
    lines: [
      {
        speaker: "tinh",
        text: "Ta đã khóa sức mạnh một hệ của các cháu. Vậy mà những quân thuộc hệ khác vẫn giúp cả đội chiến đấu tiếp.",
      },
      {
        speaker: "an",
        text: "Câu chuyện sống nhờ nhiều giọng nói. Ông vẫn có thể mở lại cuốn sổ.",
      },
    ],
  },
  "boss-12": {
    title: "Trang cuối chưa viết",
    art: 3,
    lines: [
      {
        speaker: "memory",
        text: "Tôi giữ ký ức về những bữa cơm không ai đến. Người nấu chờ mãi, rồi cả tên họ cũng bị quên.",
      },
      {
        speaker: "an",
        text: "Mình không cần bắt mọi người nấu theo một công thức gốc. Mình cần trả cho họ quyền ghi lại cách nấu của chính họ. Cả đội, giữ bàn đến bình minh!",
      },
    ],
  },
  ending: {
    title: "Bình minh của phiên chợ",
    art: 3,
    lines: [
      {
        speaker: "tinh",
        text: "Ta sẽ không gạch thêm tên ai. Nếu không biết, ta sẽ hỏi người đã nấu.",
      },
      {
        speaker: "recorder",
        text: "Ta sẽ ghi thêm các cách nấu bên từng công thức, hay mở hội quán để mọi người dạy nhau trực tiếp?",
      },
      {
        speaker: "an",
        text: "Dù chọn cách nào, chiếc ghế cuối cùng vẫn để cho người đến sau.",
      },
    ],
  },
}
// Separate exchanges keep each chapter's conflict and battle advice concrete.
SCENES["intro-13"] = {
  title: "Bến sau cơn mưa",
  art: 1,
  lines: [
    {
      speaker: "an",
      text: "Chợ đã sáng lại, nhưng vẫn còn những trang ghi sai tên. Chúng mình mang sổ về bến để hỏi từng người nhé.",
    },
    {
      speaker: "tinh",
      text: "Ta sẽ trả lại những tên mình đã xóa. Nếu họ muốn nói về việc ấy, ta sẽ ở lại nghe.",
    },
  ],
}
SCENES["boss-15"] = {
  title: "Nắp nồi con nước",
  art: 1,
  lines: [
    {
      speaker: "sen",
      text: "Nắp Nồi Con Nước gây sát thương phép và làm choáng quân bị nhắm tới. Hãy để quân chịu đòn ở phía trước, quân gây sát thương ở phía sau.",
    },
    {
      speaker: "an",
      text: "Trước trận tiếp theo, mình sẽ xem lại vị trí và trang bị. Mình không chọn từng đòn khi trận đã bắt đầu, nhưng có thể chuẩn bị đội hình tốt hơn.",
    },
  ],
}
SCENES["intro-16"] = {
  title: "Bữa cơm ngày mai",
  art: 3,
  lines: [
    {
      speaker: "tinh",
      text: "Ta không sửa được chuyện đã xảy ra. Nhưng ta có thể ghi lại các tên đã xóa và để mỗi người tự kể cách nấu của họ.",
    },
    {
      speaker: "recorder",
      text: "Tôi sẽ chừa chỗ cho từng bản ghi. Có điều chưa rõ, chúng ta hỏi người đã nấu, thay vì tự sửa lời họ.",
    },
  ],
}
SCENES["boss-18"] = {
  title: "Trang giấy chưa viết",
  art: 3,
  lines: [
    {
      speaker: "an",
      text: "Trang Giấy Chưa Viết sao chép kỹ năng đội mình vừa dùng, với 65% sức mạnh. Cả đội vẫn cần quân chịu đòn và cách hồi phục, đừng chỉ dồn vào sát thương.",
    },
    {
      speaker: "loc",
      text: "Chuẩn bị trước trận, rồi quan sát xem quân nào cần được bảo vệ. Nếu chưa thắng, ta còn có thể xếp lại đội để thử tiếp.",
    },
  ],
}
export const CULTURE_PAGES = [
  {
    title: "Lời mời bên bếp",
    vi: "Phiên chợ trong game là hư cấu. Hình ảnh bữa cơm, lời mời khách và người truyền nghề gợi cách văn hóa được giữ trong đời sống mỗi ngày.",
    en: "The market is fictional. Shared meals, hospitality and passing on a craft keep culture alive in daily life.",
    url: "https://vietnam.travel/things-to-do/tet-tradition-reunion-taste",
  },
  {
    title: "Nhịp hô và chuyện kể",
    vi: "Bài Chòi là di sản kết hợp âm nhạc, thơ, diễn và hội họa, được truyền trong gia đình và cộng đồng. Auto chess này chỉ lấy cảm hứng từ việc cùng kể chuyện; không tái hiện luật Bài Chòi.",
    en: "Bai Choi combines music, poetry, acting and painting. This fantasy game draws on communal storytelling, rather than reproducing Bai Choi rules.",
    url: "https://ich.unesco.org/en/RL/the-art-of-bai-choi-in-central-viet-nam-01222",
  },
  {
    title: "Một món, nhiều ký ức",
    vi: "Cách nấu có thể thay đổi giữa nhà này với nhà khác. Lore Vị Linh, phép và quái là sáng tạo của Soul of Meal; không phải mô tả thần linh hay thực hành truyền thống.",
    en: "Recipes vary between families. Flavor spirits, magic and monsters are Soul of Meal fiction, not traditional deities or practices.",
    url: "https://vietnam.travel/things-to-do",
  },
]
export function actIndex(wave: number) {
  return Math.min(5, Math.floor((wave - 1) / 3))
}
