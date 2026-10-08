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
        text: "Những sạp không còn tên trong Sổ Công Thức đang chìm vào sương. Cháu hãy thắp lại một lời mời.",
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
        text: "Một món, một công thức. Khi mọi thứ rõ ràng, sẽ không còn ai bị quên.",
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
        text: "Trang này là chữ của gia đình cháu, An. Họ từng góp một công thức rồi tự gạch tên để được chấp nhận.",
      },
      {
        speaker: "an",
        text: "Vậy mình không đi tìm một cuốn sách thất lạc. Mình đi tìm quyền kể lại câu chuyện của nhà mình.",
      },
      {
        speaker: "sen",
        text: "Một món có thể khác mà vẫn là một lời thương. Bàn này còn chỗ cho người đến sau.",
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
        text: "Tôi chép lại từng động tác. Nếu giống người được nhớ… có ai nhận ra tôi không?",
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
        text: "Ta khóa một hệ… nhưng các vị khác vẫn nâng nhau đứng dậy.",
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
        text: "Tôi là những lời mời chưa từng được nói. Những bữa cơm chưa có người ngồi.",
      },
      {
        speaker: "an",
        text: "Ta không cần tìm công thức đầu tiên. Ta cần để người sống viết trang tiếp theo. Cả đội, giữ bàn đến bình minh!",
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
        text: "Chúng ta giữ những chú giải bên công thức, hay dựng hội quán để truyền nghề?",
      },
      {
        speaker: "an",
        text: "Dù chọn cách nào, chiếc ghế cuối cùng vẫn để cho người đến sau.",
      },
    ],
  },
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
    vi: "Cách nấu có thể thay đổi giữa nhà này với nhà khác. Lore Vị Linh, phép và quái là sáng tạo của MealGacha; không phải mô tả thần linh hay thực hành truyền thống.",
    en: "Recipes vary between families. Flavor spirits, magic and monsters are MealGacha fiction, not traditional deities or practices.",
    url: "https://vietnam.travel/things-to-do",
  },
]
export function actIndex(wave: number) {
  return Math.min(3, Math.floor((wave - 1) / 3))
}
