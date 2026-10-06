import type { Chapter } from "./types"

export const CHAPTERS: Chapter[] = [
  {
    id: "lantern",
    title: "Phố Đèn Lồng",
    subtitle: "Nơi mọi hành trình bắt đầu",
    school: "hearth",
    art: "/assets/events/hanoi-autumn/banner.webp",
    character: "Bách",
    intro:
      "Sương Nhạt đang xóa ký ức về những bữa ăn. Bạn nhận được chiếc muôi cổ của bà và tấm bản đồ năm Ngọn Lửa. Bách tin rằng những thẻ vị giác có thể đánh thức thành phố.",
    stages: [
      {
        id: "lantern-1",
        title: "Bữa sáng bị lãng quên",
        opponent: "Người bán hàng mất trí nhớ",
        dialogue:
          "Bách: “Hãy đặt một món lên bàn. Một hương vị quen sẽ khiến ông ấy nhớ lại. Đừng sợ — căn bếp luôn đón người mới.”",
        ending:
          "Mùi bánh mì làm người bán hàng nhớ tên con gái. Ông đưa bạn một thẻ trà và chỉ đường tới chợ.",
        boss: false,
        rewardCard: "tea-break",
      },
      {
        id: "lantern-2",
        title: "Chợ không tiếng cười",
        opponent: "Bóng Sương ở chợ Đồng Xuân",
        dialogue:
          "Bạn nghe những tiếng rao xa dần. Bách đặt tay lên chiếc muôi: “Chúng ta phải giữ cho bàn ăn còn người ngồi.”",
        ending:
          "Tiếng rao trở lại. Một bà cụ tặng bạn công thức Màn đường tinh thể để bảo vệ đồng đội.",
        boss: false,
        rewardCard: "sugar-veil",
      },
      {
        id: "lantern-3",
        title: "Ngọn lửa đầu tiên",
        opponent: "Kẻ Canh Bếp Cổ",
        dialogue:
          "Kẻ canh bếp hỏi: “Bạn giữ công thức cho riêng mình hay chia nó với mọi người?” Bách mỉm cười. Câu trả lời của bạn nằm trong trận đấu.",
        ending:
          "Ngọn Lửa Gia Vị thức dậy. Bách gia nhập hành trình. Trên bản đồ, bến cảng rực lên màu đỏ.",
        boss: true,
        rewardCard: "chef-bach",
      },
    ],
  },
  {
    id: "harbor",
    title: "Bến Cảng Than Hồng",
    subtitle: "Lửa mạnh khi được chia sẻ",
    school: "ember",
    art: "/assets/events/bangkok-street-heat/banner.webp",
    character: "Nhiên",
    intro:
      "Nhiên vẫn nấu cho những thủy thủ dù không ai còn nhớ món mình thích. Chiếc lò trung tâm bị Sương Nhạt khóa lại. Muốn ra biển, bạn phải thắp lửa cho cả bến cảng.",
    stages: [
      {
        id: "harbor-1",
        title: "Lửa trong hẻm nhỏ",
        opponent: "Thủy thủ Cáu Kỉnh",
        dialogue:
          "Nhiên: “Lửa không chờ ai cả. Đánh nhanh, nhưng đừng quên nhìn xem đồng đội cần gì.”",
        ending:
          "Thủy thủ nhớ con tàu của mình. Nhiên đưa bạn chiếc chảo đầu tiên cô từng dùng.",
        boss: false,
        rewardCard: "wok-storm",
      },
      {
        id: "harbor-2",
        title: "Con tàu không tên",
        opponent: "Bóng Sương trên boong",
        dialogue:
          "Tên tàu đang mờ dần trên mạn gỗ. Một công thức viết bằng than vẫn còn: Hơi thở Hỏa Long.",
        ending:
          "Thủy thủ đoàn cùng gọi tên con tàu. Hơi thở Hỏa Long cháy sáng trên thẻ của bạn.",
        boss: false,
        rewardCard: "dragon-breath",
      },
      {
        id: "harbor-3",
        title: "Trái tim của lò",
        opponent: "Hỏa Linh bị tha hóa",
        dialogue:
          "Nhiên bước vào lò trước bạn: “Tôi từng nghĩ phải tự giữ ngọn lửa. Hôm nay, tôi sẽ tin một người khác.”",
        ending:
          "Ngọn Lửa Hỏa Vị được giải phóng. Nhiên trao bạn ngọn lửa nhỏ để mang tới khu rừng tàn úa.",
        boss: true,
        rewardCard: "chef-nhien",
      },
    ],
  },
  {
    id: "garden",
    title: "Vườn Xanh Tĩnh Lặng",
    subtitle: "Một hạt giống, ngàn hy vọng",
    school: "grove",
    art: "/assets/events/cooling-summer/banner-vietnam.webp",
    character: "Mộc",
    intro:
      "Mộc chăm khu vườn không còn nảy mầm. Cây Cổ Thụ sống nhờ ký ức của cả lục địa, nhưng những ký ức đang cạn. Cậu cần bạn bảo vệ những hạt giống cuối cùng.",
    stages: [
      {
        id: "garden-1",
        title: "Lá thư dưới gốc cây",
        opponent: "Vệ binh Rễ Khô",
        dialogue:
          "Mộc: “Đôi khi thắng không phải bằng đánh thật mạnh. Hãy ở lại đủ lâu để sự sống trở về.”",
        ending:
          "Một mầm xanh đâm xuyên đất. Dòng chữ trong lá thư hiện lại: “Đợi tôi về ăn cơm.”",
        boss: false,
        rewardCard: "spring-feast",
      },
      {
        id: "garden-2",
        title: "Đường về mùa xuân",
        opponent: "Bầy Sương Rừng",
        dialogue:
          "Những hạt giống bay khỏi tay Mộc. Bạn phải mở đường, để gió đem chúng tới vùng đất còn ánh sáng.",
        ending:
          "Hạt giống phủ kín thung lũng. Mộc chia sẻ lời thề bảo vệ mọi người cùng bàn.",
        boss: false,
        rewardCard: "forest-oath",
      },
      {
        id: "garden-3",
        title: "Lời hứa của Cổ Thụ",
        opponent: "Cổ Thụ Quên Lãng",
        dialogue:
          "Cổ Thụ hỏi bằng giọng của bà: “Con còn nhớ bữa cơm đầu tiên không?” Chiếc muôi trong tay bạn nóng lên.",
        ending:
          "Ngọn Lửa Thanh Vị thức dậy giữa rễ cây. Mộc đi cùng bạn, mang theo một túi hạt giống.",
        boss: true,
        rewardCard: "chef-moc",
      },
    ],
  },
  {
    id: "tide",
    title: "Biển Ký Ức",
    subtitle: "Lắng nghe điều chưa được kể",
    school: "tide",
    art: "/assets/events/tokyo-matsuri/banner.webp",
    character: "Hải",
    intro:
      "Hải đi tìm công thức cuối của cha trong những con sóng. Tại đây, Sương Nhạt không phá hủy mà đánh tráo ký ức. Bạn phải học phân biệt thật và giả.",
    stages: [
      {
        id: "tide-1",
        title: "Con sóng mang lời nhắn",
        opponent: "Ngư dân Lạc Hướng",
        dialogue:
          "Hải: “Có nhiều lựa chọn hơn là có nhiều sức mạnh hơn. Rút bài trước khi quyết định.”",
        ending:
          "Ngư dân tìm lại bến. Trong lưới của ông là một cuộn công thức không bị ướt.",
        boss: false,
        rewardCard: "recipe-scroll",
      },
      {
        id: "tide-2",
        title: "Nhà bếp dưới đáy biển",
        opponent: "Bếp trưởng Ảo Ảnh",
        dialogue:
          "Mọi món ăn ở đây trông hoàn hảo nhưng không có mùi. Chiếc muôi giúp bạn nhận ra bếp trưởng trước mặt là một ảo ảnh.",
        ending:
          "Ảo ảnh tan biến. Lưỡi dao thủy triều cắt đứt sợi xích giữ ký ức của Hải.",
        boss: false,
        rewardCard: "tidal-cut",
      },
      {
        id: "tide-3",
        title: "Công thức của cha",
        opponent: "Hải Vương Lãng Quên",
        dialogue:
          "Hải đọc được lời cha: “Món ngon nhất không nằm trong sách. Nó nằm ở người con nấu cho.”",
        ending:
          "Ngọn Lửa Hải Vị bừng lên. Hải tìm được công thức, nhưng chọn cùng bạn đi tiếp.",
        boss: true,
        rewardCard: "chef-hai",
      },
    ],
  },
  {
    id: "moon",
    title: "Thành Phố Đường Sao",
    subtitle: "Một điều ước chưa thành",
    school: "sugar",
    art: "/assets/events/seoul-midnight/banner.webp",
    character: "Liên",
    intro:
      "Liên làm những chiếc bánh hình sao để gửi điều ước tới người đã mất. Sương Nhạt khiến thành phố quên cả cách mơ. Ngọn lửa cuối cùng đang ở trên đài quan sát.",
    stages: [
      {
        id: "moon-1",
        title: "Tiệm bánh đóng cửa",
        opponent: "Khách Lạ Không Mơ",
        dialogue:
          "Liên: “Một lớp đường mỏng có thể bảo vệ cả chiếc bánh. Chúng ta cũng vậy.”",
        ending:
          "Vị khách kể điều ước đầu tiên của mình. Tiệm bánh sáng đèn trở lại.",
        boss: false,
        rewardCard: "sweet-dream",
      },
      {
        id: "moon-2",
        title: "Chuyến tàu tới các vì sao",
        opponent: "Người Soát Vé Sương",
        dialogue:
          "Mỗi vé tàu cần một ký ức vui. Bạn kể về tiếng cười ở phố đèn lồng. Người soát vé không tin — hãy cho ông thấy.",
        ending:
          "Con tàu chạy lên đài quan sát. Liên biến bụi sao thành một thẻ vị giác.",
        boss: false,
        rewardCard: "starlight",
      },
      {
        id: "moon-3",
        title: "Điều ước của Liên",
        opponent: "Thiên Nga Đêm Trắng",
        dialogue:
          "Liên ước không phải gặp lại người đã mất, mà để mọi người còn nhớ họ. Ngọn lửa cuối cùng đáp lại cô.",
        ending:
          "Năm Ngọn Lửa đã thức dậy. Nhưng Sương Nhạt vẫn còn — nó đang chờ ở bàn ăn trung tâm.",
        boss: true,
        rewardCard: "chef-lien",
      },
    ],
  },
  {
    id: "last-table",
    title: "Bữa Tiệc Bình Minh",
    subtitle: "Công thức thứ sáu",
    school: "hearth",
    art: "/assets/events/new-year-feast/banner-tet.webp",
    character: "Cả nhóm",
    intro:
      "Sương Nhạt sinh ra từ những bữa ăn bị bỏ quên, những người không còn được mời. Năm ngọn lửa có thể đánh bại nó, nhưng chỉ một bàn ăn đủ chỗ mới khiến nó biến mất.",
    stages: [
      {
        id: "last-table-1",
        title: "Những ghế trống",
        opponent: "Người Khách Bị Lãng Quên",
        dialogue:
          "Bách đặt thêm một chiếc ghế. Nhiên nhóm lửa. Mộc trồng hoa. Hải rót trà. Liên bày bánh. Bạn đặt chiếc muôi của bà lên bàn.",
        ending:
          "Người khách nhớ rằng mình từng được yêu thương. Chiếc ghế đầu tiên có người ngồi.",
        boss: false,
        rewardCard: "family-table",
      },
      {
        id: "last-table-2",
        title: "Tên thật của Sương",
        opponent: "Ký Ức Không Tên",
        dialogue:
          "Sương nói: “Ta chỉ muốn có một chỗ.” Bạn hiểu rằng trận chiến cuối cùng không chỉ cần sức mạnh.",
        ending:
          "Sương Nhạt nhận được tên mới: Sương Mai. Căn bếp cổ hiện ra phía sau màn sương.",
        boss: false,
        rewardCard: "hearth-legacy",
      },
      {
        id: "last-table-3",
        title: "Mời mọi người ăn cơm",
        opponent: "Sương Nhạt · Dạng cuối",
        dialogue:
          "Bà xuất hiện trong một ký ức: “Công thức thứ sáu là sẻ chia, con ạ.” Hãy đưa mọi hương vị tới bàn ăn cuối cùng.",
        ending:
          "Bình minh lên. Bạn không còn là người giữ chiếc muôi — bạn là người giữ những cuộc đoàn tụ. Câu chuyện kết thúc, nhưng căn bếp của bạn vẫn mở cửa.",
        boss: true,
        rewardCard: "last-flame",
      },
    ],
  },
]
export const STAGES = CHAPTERS.flatMap((chapter, chapterIndex) =>
  chapter.stages.map((stage, stageIndex) => ({
    ...stage,
    chapter,
    index: chapterIndex * 3 + stageIndex,
  })),
)
export const STAGE_MAP = Object.fromEntries(
  STAGES.map((stage) => [stage.id, stage]),
)
export function isStageUnlocked(id: string, cleared: string[]) {
  const stage = STAGE_MAP[id]
  return (
    !!stage &&
    (stage.index === 0 || cleared.includes(STAGES[stage.index - 1].id))
  )
}
