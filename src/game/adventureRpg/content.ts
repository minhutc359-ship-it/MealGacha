import type { RpgMap, DungeonKind } from "./types"

export const RPG_MAPS: RpgMap[] = [
  {
    id: "lantern",
    name: "Phố Đèn Lồng",
    subtitle: "Tìm lại tiếng gọi bên mâm cơm",
    school: "hearth",
    guide: "bach",
    art: "/assets/events/hanoi-autumn/banner.webp",
    music: "v4-market-warm",
    boss: "boss-drum",
    bossName: "Trống Rỗng Giữa Chợ",
    stages: [
      {
        name: "Sạp sáng im lìm",
        before: {
          speaker: "bach",
          text: "Sương Nhạt đã lấy đi tiếng rao. Ta đi cùng nhau, giúp từng sạp nhớ lại món ăn của mình.",
        },
        after: {
          speaker: "merchant",
          text: "Tôi nhớ rồi: bếp này từng có người chờ bát phở đầu tiên. Cảm ơn các bạn.",
        },
      },
      {
        name: "Dấu chân dưới đèn",
        before: {
          speaker: "child",
          text: "Đèn của em vẫn sáng, nhưng đường về nhà cứ biến mất. Các Vị Linh có thể dẫn em qua chợ không?",
        },
        after: {
          speaker: "bach",
          text: "Mỗi ngọn đèn là một lời hẹn. Ta đã nối lại con đường về nhà cho em ấy.",
        },
      },
      {
        name: "Giếng ký ức",
        before: {
          speaker: "grandmother",
          text: "Nước giếng giữ mùi của những bữa cơm cũ. Đừng để đám sương phủ kín miệng giếng.",
        },
        after: {
          speaker: "grandmother",
          text: "Ta nghe thấy tiếng trẻ con gọi nhau ăn cơm. Ký ức vẫn còn, chỉ cần người chịu lắng nghe.",
        },
      },
      {
        name: "Bếp của người lạ",
        before: {
          speaker: "bach",
          text: "Có một Vị Linh đang che chở người bán hàng. Giữ tuyến trước cho bạn ấy, rồi cùng dọn sạch sương.",
        },
        after: {
          speaker: "merchant",
          text: "Bếp không cần lớn mới có thể đón thêm người. Tối nay tôi sẽ kê thêm một chiếc ghế.",
        },
      },
      {
        name: "Mâm cơm bị bỏ quên",
        before: {
          speaker: "grandmother",
          text: "Tiếng trống kia gom mọi nỗi cô đơn trong chợ. Chuẩn bị đội hình trước khi bước vào sân đình.",
        },
        after: {
          speaker: "bach",
          text: "Kẻ giữ sương ở ngay phía trước. Hãy giữ tuyệt kỹ hồi phục cho lúc tiếng trống nổi lên.",
        },
      },
      {
        name: "Sân đình · Trống Rỗng",
        before: {
          speaker: "bach",
          text: "Trống Rỗng đánh vào tuyến được đánh dấu. Che chắn đúng lúc, rồi nối tuyệt kỹ để phá lớp sương quanh nó.",
        },
        after: {
          speaker: "grandmother",
          text: "Chợ lại có tiếng cười. Nhưng chiếc thuyền ở bến cảng vẫn chưa tìm được đường về.",
        },
      },
    ],
    ending: [
      {
        speaker: "bach",
        text: "Ta có thể giữ những công thức cũ trong sổ, hoặc mở bếp để mọi người cùng kể tiếp.",
      },
      {
        speaker: "grandmother",
        text: "Dù chọn cách nào, hãy để người từng ngồi bên mâm cơm được nhớ bằng tên của họ.",
      },
    ],
    choices: ["Ghi công thức vào sổ ký ức", "Mở bếp mời cả phố cùng nấu"],
  },
  {
    id: "harbor",
    name: "Bến Cảng Than Hồng",
    subtitle: "Thắp lửa cho con tàu trở về",
    school: "ember",
    guide: "nhien",
    art: "/assets/events/bangkok-street-heat/banner.webp",
    music: "v4-harbor-warm",
    boss: "char-hound",
    bossName: "Khuyển Than Quên Lãng",
    stages: [
      {
        name: "Hẻm bếp tắt lửa",
        before: {
          speaker: "nhien",
          text: "Mưa không dập được bếp này. Sương Nhạt mới là thứ đang lấy đi lý do để người ta nhóm lửa.",
        },
        after: {
          speaker: "sailor",
          text: "Mùi bánh nóng làm tôi nhớ buổi rời bến. Có người đã gói phần ăn cho tôi trước lúc lên tàu.",
        },
      },
      {
        name: "Kho hàng mất tên",
        before: {
          speaker: "nhien",
          text: "Những thùng gia vị không còn nhãn. Hãy tìm mảnh sổ giao hàng trong kho, đừng để sương kéo chúng đi.",
        },
        after: {
          speaker: "merchant",
          text: "Tên người gửi vẫn còn ở đây. Ta có thể đưa từng thùng về đúng căn bếp.",
        },
      },
      {
        name: "Cầu tàu trong mưa",
        before: {
          speaker: "hai",
          text: "Dòng nước đang đổi hướng. Mang theo người hồi phục, vì đám sương sẽ tìm cách đánh vào tuyến sau.",
        },
        after: {
          speaker: "hai",
          text: "Nước đã yên hơn. Con tàu ở cuối bến cần ngọn đèn dẫn đường của Nhiên.",
        },
      },
      {
        name: "Ngọn hải đăng lạnh",
        before: {
          speaker: "nhien",
          text: "Lửa ở đây từng là lời hẹn với những người đi biển. Ta sẽ nhóm lại nó, từng tầng một.",
        },
        after: {
          speaker: "sailor",
          text: "Tôi thấy ánh đèn rồi. Lần này, người trên tàu biết mình vẫn có nơi để trở về.",
        },
      },
      {
        name: "Boong tàu không tên",
        before: {
          speaker: "nhien",
          text: "Khuyển Than giữ mảnh ký ức cuối cùng. Chuẩn bị khiên trước đợt lửa, dùng nước để làm yếu nó.",
        },
        after: {
          speaker: "hai",
          text: "Tên con tàu hiện ra dưới lớp muối. Chúng ta chỉ còn phải đánh thức người giữ lò.",
        },
      },
      {
        name: "Lò tàu · Khuyển Than",
        before: {
          speaker: "nhien",
          text: "Đừng tung hết tuyệt kỹ cùng lúc. Chờ nó gầm, che tuyến bị nhắm rồi phản công khi lớp giáp than vỡ.",
        },
        after: {
          speaker: "nhien",
          text: "Con tàu đã nhớ tên mình. Từ khoang hàng, ta tìm thấy một lá thư gửi tới Vườn Xanh.",
        },
      },
    ],
    ending: [
      {
        speaker: "nhien",
        text: "Lửa này có thể giữ trong hải đăng, hoặc chia cho từng căn bếp ở bến.",
      },
      {
        speaker: "hai",
        text: "Một ngọn đèn đưa tàu về. Nhiều căn bếp giúp người trở về có nơi ngồi lại.",
      },
    ],
    choices: ["Giữ lửa trong hải đăng", "Chia lửa cho những căn bếp"],
  },
  {
    id: "garden",
    name: "Vườn Xanh Tĩnh Lặng",
    subtitle: "Một lời hứa chờ dưới tán cây",
    school: "grove",
    guide: "moc",
    art: "/assets/events/cooling-summer/banner-vietnam.webp",
    music: "story-mystery",
    boss: "bamboo-wraith",
    bossName: "Cổ Thụ Quên Lãng",
    stages: [
      {
        name: "Lá thư dưới rễ",
        before: {
          speaker: "moc",
          text: "Lá thư từ bến cảng nhắc tới một khu vườn chung. Ta tìm người nhận trước khi nét mực phai hết.",
        },
        after: {
          speaker: "moc",
          text: "Đây là lời hẹn trồng cây của hai người bạn. Một người đã đi xa, người còn lại vẫn đợi.",
        },
      },
      {
        name: "Luống rau phủ sương",
        before: {
          speaker: "grandmother",
          text: "Rau không chết vì thiếu nước. Nó đang quên bàn tay từng chăm mình. Hãy mở đường tới giếng vườn.",
        },
        after: {
          speaker: "moc",
          text: "Lá đã ngẩng lên. Ta chỉ cần nhắc khu vườn rằng vẫn có người quay lại mỗi sáng.",
        },
      },
      {
        name: "Nhà kính rạn nứt",
        before: {
          speaker: "moc",
          text: "Đám sương mọc rễ trong nhà kính. Dùng lửa để phá rễ, giữ người hồi phục ở tuyến sau.",
        },
        after: {
          speaker: "child",
          text: "Em tìm thấy hạt giống trong chiếc hộp này. Người viết thư muốn vườn có thêm một mùa xuân.",
        },
      },
      {
        name: "Lối đi của người chờ",
        before: {
          speaker: "moc",
          text: "Có những lời hứa không cần một người phải chờ mãi. Ta sẽ mang lá thư tới gốc cây, để họ được nói lời còn thiếu.",
        },
        after: {
          speaker: "grandmother",
          text: "Chờ đợi đã thành một câu chuyện có thể kể lại. Giờ khu vườn có chỗ cho những người mới.",
        },
      },
      {
        name: "Bầy rễ mất ngủ",
        before: {
          speaker: "moc",
          text: "Cổ Thụ níu mọi ký ức bằng rễ. Giữ kỹ năng thanh tẩy và hồi phục cho trận cuối.",
        },
        after: {
          speaker: "moc",
          text: "Ta đã tới gốc cây. Đừng chặt nó; chỉ cần đánh tan lớp sương đang khiến nó sợ mất người bạn.",
        },
      },
      {
        name: "Gốc cổ thụ · Lời hứa",
        before: {
          speaker: "moc",
          text: "Rễ sẽ bám vào tuyến được đánh dấu. Che chắn giúp đội đứng vững trong lúc Vị Linh hồi phục giải vây.",
        },
        after: {
          speaker: "moc",
          text: "Cổ Thụ đã buông rễ. Một vỏ sò dưới gốc cây mang tiếng gọi từ Biển Ký Ức.",
        },
      },
    ],
    ending: [
      {
        speaker: "moc",
        text: "Ta có thể trồng cây ở đúng chỗ cũ, hoặc mang hạt giống ra những khoảng đất còn trống.",
      },
      {
        speaker: "grandmother",
        text: "Lời hứa được giữ khi khu vườn tiếp tục sống, dù mùa xuân có mang hình dáng khác.",
      },
    ],
    choices: [
      "Trồng lại khu vườn trong lá thư",
      "Gieo hạt cho một mùa xuân mới",
    ],
  },
  {
    id: "tide",
    name: "Biển Ký Ức",
    subtitle: "Đem công thức cuối cùng về mâm cơm",
    school: "tide",
    guide: "hai",
    art: "/assets/events/tokyo-matsuri/banner.webp",
    music: "story-mystery",
    boss: "v4-tide-lock",
    bossName: "Người Giữ Con Nước",
    stages: [
      {
        name: "Bờ cát mang lời nhắn",
        before: {
          speaker: "hai",
          text: "Vỏ sò nhắc tới công thức của cha tôi. Ông đã gửi nó theo con nước, để ai đó còn nhớ bữa cơm trên thuyền.",
        },
        after: {
          speaker: "fisherman",
          text: "Tôi từng ăn bát canh ấy. Ta cần tìm ba mảnh công thức trước khi thủy triều lên.",
        },
      },
      {
        name: "Chợ cá trong sương",
        before: {
          speaker: "hai",
          text: "Sương đang giấu tiếng người gọi nhau ở chợ cá. Giữ đội sát nhau để không ai bị bỏ lại.",
        },
        after: {
          speaker: "merchant",
          text: "Mảnh đầu nằm trong sổ mua hàng. Người nấu canh luôn chọn phần cá nhỏ cho trẻ con.",
        },
      },
      {
        name: "Bếp dưới đáy biển",
        before: {
          speaker: "hai",
          text: "Ký ức dựng nên căn bếp này. Đừng để những chiếc bóng kéo chúng ta ở lại với một ngày đã qua.",
        },
        after: {
          speaker: "hai",
          text: "Mảnh thứ hai không ghi lượng muối. Cha viết: hãy nếm cùng người ngồi bên cạnh.",
        },
      },
      {
        name: "Con thuyền của cha",
        before: {
          speaker: "grandmother",
          text: "Một công thức không thể giữ người đã đi xa, nhưng có thể giúp ta chăm những người còn ở đây.",
        },
        after: {
          speaker: "hai",
          text: "Tôi đã hiểu lời cuối: thêm một bát, nếu ngoài cửa còn người chờ.",
        },
      },
      {
        name: "Triều khóa ký ức",
        before: {
          speaker: "hai",
          text: "Người Giữ Con Nước muốn khóa mọi bữa cơm trong một ký ức hoàn hảo. Ta cần chứng minh rằng chúng còn có thể thay đổi.",
        },
        after: {
          speaker: "bach",
          text: "Mâm cơm đang chờ ở bờ bên kia. Cả đội sẽ mở đường, để Hải mang công thức về.",
        },
      },
      {
        name: "Tâm triều · Người Giữ Nước",
        before: {
          speaker: "hai",
          text: "Con nước sẽ đổi mục tiêu khi boss mất nửa máu. Theo dấu cảnh báo, giữ khiên và hồi phục cho đợt sóng lớn.",
        },
        after: {
          speaker: "hai",
          text: "Biển đã trả lại công thức. Ta mang nó về bếp, thêm một chiếc ghế và nấu một bữa cơm của hôm nay.",
        },
      },
    ],
    ending: [
      {
        speaker: "hai",
        text: "Tôi có thể nấu đúng bát canh của cha, hoặc thêm món mà những người bạn mới yêu thích.",
      },
      {
        speaker: "grandmother",
        text: "Con đã nhớ cha bằng cách tiếp tục chăm người khác. Bữa cơm này còn nhiều câu chuyện để kể.",
      },
    ],
    choices: ["Nấu lại công thức của cha", "Mời bạn bè cùng viết món mới"],
  },
]

/** Bốn hồi hậu truyện. Giữ nguyên ID và thứ tự bốn map gốc để không đổi save. */
const ADVANCED_CHAPTERS: {
  id: string; name: string; subtitle: string; art: string
  music: RpgMap["music"]; school: RpgMap["school"]; guide: RpgMap["guide"]
  boss: string; bossName: string; stages: [string, string, string][]
  ending: [string, string]; choices: [string, string]
}[] = [
  {
    id: "mistwood", name: "Rừng Bếp Sương Lam", subtitle: "Lắng nghe những mầm cây từng bị lãng quên",
    art: "/assets/events/hanoi-autumn/banner.webp", music: "v4-market-warm", school: "grove", guide: "moc",
    boss: "boss-blue-root", bossName: "Rễ Vương Không Ngủ",
    stages: [
      ["Bàn mầm đầu tiên", "Những hạt giống này không nảy mầm vì chẳng ai nhớ người từng gieo chúng.", "Một hạt đã thức. Hóa ra nó chỉ chờ tiếng gọi tên."],
      ["Lối mòn lá bạc", "Thợ săn sương đặt bẫy phía sau đội hình. Đừng để người hồi phục bị cô lập.", "Lá bạc hướng về bếp cũ. Đường đã mở."],
      ["Giếng nước cạn", "Đào sâu chưa chắc tìm được nước. Hãy tìm người còn nhớ mạch ngầm.", "Người giữ giếng đã kể lại đường nước chảy."],
      ["Nhà hạt giống", "Tinh anh Dây Trói Đêm đang chiếm kho. Chuẩn bị thanh tẩy và giữ năng lượng.", "Những chiếc lọ chứa tên từng mùa vụ, không chỉ hạt giống."],
      ["Hương từ gốc cổ", "Rễ Vương lấy ký ức làm lớp giáp. Phá hộ vệ để đối đầu nó.", "Dưới gốc cây còn một lời hẹn với người trồng đầu tiên."],
      ["Gốc cổ · Rễ Vương", "Boss rút sinh lực và dựng khiên cho đồng minh. Ngắt tụ lực trước khi nó phục hồi.", "Rễ đã buông những ký ức không thuộc về mình. Cây sẽ lớn theo mùa mới."],
    ],
    ending: ["Ta có thể trồng khu vườn như cũ, hoặc để trẻ nhỏ thử giống cây mới.", "Ký ức được chăm sóc khi người sau được góp tay."],
    choices: ["Gieo lại khu vườn cũ", "Mở vườn chung cho mọi người"],
  },
  {
    id: "sugartower", name: "Tháp Đường Phân Kỳ", subtitle: "Tìm vị ngọt thật giữa hàng nghìn chiếc gương",
    art: "/assets/events/seoul-midnight/banner.webp", music: "story-mystery", school: "sugar", guide: "lien",
    boss: "boss-mirror-sugar", bossName: "Nữ Chúa Gương Đường",
    stages: [
      ["Cầu thang phản chiếu", "Một bước sai sẽ dẫn về đúng căn phòng ta vừa rời. Nhìn đèn, đừng nhìn gương.", "Ánh đèn chỉ về chiếc cầu thang thật."],
      ["Quán bánh không vị", "Những chiếc bánh này đẹp hoàn hảo nhưng không có ai muốn ăn.", "Một miếng bánh được làm lại cho đúng sở thích của người nhận."],
      ["Vũ hội hương", "Tiếng hát làm đội ta quên cách phối hợp. Giữ Vị Linh thanh tẩy ở tuyến an toàn.", "Khi tiếng hát dừng, mỗi người đã nhớ lại nhịp riêng."],
      ["Gian gương khóa", "Tinh anh Kính Vỡ hút năng lượng để nhân bản phép. Hạ nó trước.", "Không còn phép nào phản chiếu được mùi hương thật."],
      ["Tầng cao nhất", "Nữ Chúa sẽ đổi mục tiêu sau khi mất nửa máu. Chú ý cảnh báo trên sân.", "Sau cánh cửa là chiếc bàn chưa từng có khách."],
      ["Điện gương · Nữ Chúa", "Boss sao chép khiên và dồn phép vào tuyến yếu. Đừng dùng hết tuyệt kỹ cùng lúc.", "Đường ngọt ngào nhất không giống nhau với tất cả mọi người."],
    ],
    ending: ["Bản công thức chuẩn có thể giúp người mới học, nhưng không nên trói mọi người.", "Một món ngon bắt đầu bằng người ta muốn mời ăn."],
    choices: ["Lưu công thức gốc của tháp", "Cho mỗi người sáng tạo biến thể"],
  },
  {
    id: "ashalley", name: "Hẻm Than Thiên Tinh", subtitle: "Giành lại ngọn lửa không thiêu rụi lời hứa",
    art: "/assets/events/bangkok-street-heat/banner.webp", music: "v4-harbor-warm", school: "ember", guide: "nhien",
    boss: "boss-char-clock", bossName: "Thợ Rèn Đồng Hồ Tro",
    stages: [
      ["Ngõ bếp đỏ", "Lửa trong hẻm bùng lên mỗi khi người ta giận nhau. Đi sát nhau.", "Mọi người cùng tắt một bếp than trước khi cứu bếp tiếp theo."],
      ["Chuông bảy nhịp", "Chuông báo bẫy chỉ vang một lần. Giữ nhịp và che chắn đúng tuyến.", "Nhịp chuông thứ bảy dẫn tới một xưởng bỏ hoang."],
      ["Than hồng ký ức", "Có lửa dùng để đốt; có lửa giữ ấm. Đừng đánh nhầm người giữ bếp.", "Lửa đã được chia ra đủ cho cả ngõ."],
      ["Cổng lò sét", "Tinh anh Tro Kẹp đang chặn lối. Nhiều khiên nhưng dễ vỡ trước phép phối hệ.", "Cửa lò mở ra, đồng hồ vẫn chạy ngược."],
      ["Xưởng phút cuối", "Thợ Rèn muốn giữ mãi khoảnh khắc món ăn vừa chín. Điều đó sẽ khiến mọi bữa tiếp theo cháy.", "Không ai có thể dừng lửa bằng cách ngừng cả thời gian."],
      ["Lò tro · Thợ Rèn", "Boss nung cháy cả tuyến, đốt năng lượng và giáng đòn thứ hai ở Extreme.", "Một ngọn lửa vừa đủ sẽ chờ bữa ăn ngày mai."],
    ],
    ending: ["Ta có thể giữ chiếc chuông cũ làm mốc, nhưng hãy cho bếp được thay đổi.", "Người mới đến sẽ mang theo ngọn lửa của mình."],
    choices: ["Giữ nhịp bếp truyền thống", "Đón một nhịp bếp mới"],
  },
  {
    id: "lasttable", name: "Mâm Cơm Hồi Quy", subtitle: "Đối diện câu hỏi ai được ngồi bên mâm",
    art: "/assets/events/tokyo-matsuri/banner.webp", music: "story-mystery", school: "hearth", guide: "bach",
    boss: "boss-last-banquet", bossName: "Chủ Tiệc Không Bóng",
    stages: [
      ["Ghế trống đầu bàn", "Căn phòng đủ món nhưng thiếu một chiếc ghế. Có người vẫn đứng ngoài cửa.", "Chúng ta kê thêm ghế trước khi dọn món."],
      ["Người không tên", "Không ai được nhớ vì đã thắng một trận. Hãy nghe lời những người bị bỏ quên.", "Người khách đã nói tên mình. Đó là bước đầu của bữa cơm."],
      ["Nồi canh chia đôi", "Hai nồi cùng ngon, nhưng cả hai bếp đều sợ phải thừa nhận điều đó.", "Mọi người thử nếm canh của nhau và cùng sửa lại công thức."],
      ["Sân tiệc sương", "Tinh anh Bóng Cạn bảo vệ Chủ Tiệc. Phá hộ vệ trước, giữ phép thanh tẩy.", "Chiếc bàn bớt lạnh khi không còn ai gác cửa."],
      ["Bài học sau cùng", "Chủ Tiệc chỉ giữ lại những người không bao giờ thất bại. Ta phải chứng minh điều ngược lại.", "Ai cũng từng sai; nhờ vậy bữa ăn mới có câu chuyện."],
      ["Mâm cuối · Chủ Tiệc", "Boss khóa hồi phục, đổi tuyến và dựng khiên cho bóng hầu. Extreme sẽ phản đòn khi mất nửa máu.", "Cánh cửa đã mở. Bữa cơm này không còn cần một người quyết định ai xứng đáng."],
    ],
    ending: ["Ký ức chỉ sống khi có người kể tiếp, kể cả với một kết thúc khác.", "Bữa cơm của ngày mai bắt đầu bằng việc mời thêm một người."],
    choices: ["Ghi lại toàn bộ hành trình", "Mở bàn tiệc không giới hạn ghế"],
  },
]
RPG_MAPS.push(...ADVANCED_CHAPTERS.map((chapter): RpgMap => ({
  id: chapter.id, name: chapter.name, subtitle: chapter.subtitle, art: chapter.art,
  music: chapter.music, school: chapter.school, guide: chapter.guide,
  boss: chapter.boss, bossName: chapter.bossName,
  stages: chapter.stages.map(([name, before, after]) => ({
    name, before: { speaker: chapter.guide, text: before },
    after: { speaker: "grandmother", text: after },
  })),
  ending: [
    { speaker: chapter.guide, text: chapter.ending[0] },
    { speaker: "grandmother", text: chapter.ending[1] },
  ],
  choices: chapter.choices,
})))

export const RPG_STAGE_IDS = RPG_MAPS.flatMap((map) =>
  map.stages.map((_, i) => `${map.id}-${i + 1}`),
)
export function rpgStage(id: string) {
  for (let mapIndex = 0; mapIndex < RPG_MAPS.length; mapIndex++) {
    const map = RPG_MAPS[mapIndex]
    const index = map.stages.findIndex((_, i) => id === `${map.id}-${i + 1}`)
    if (index >= 0)
      return {
        map,
        mapIndex,
        index,
        stage: map.stages[index],
        boss: index === 5,
        level: Math.min(50, 1 + mapIndex * 10 + index * 2),
      }
  }
  return null
}
export const RPG_DUNGEONS: {
  id: DungeonKind
  name: string
  text: string
  resource: string
  art: string
}[] = [
  {
    id: "experience",
    name: "Kho Bếp Ấm",
    text: "5 tầng · Giữ HP và năng lượng qua từng trận",
    resource: "Sổ kinh nghiệm",
    art: "/assets/events/hanoi-autumn/banner.webp",
  },
  {
    id: "skills",
    name: "Thư Viện Hương",
    text: "5 tầng · Canh hồi phục, tích tuyệt kỹ cho boss",
    resource: "Sách kỹ năng",
    art: "/assets/events/seoul-midnight/banner.webp",
  },
  {
    id: "forge",
    name: "Lò Rèn Ký Ức",
    text: "5 tầng · Nguyên liệu trang bị và thăng bậc",
    resource: "Quặng + Tinh hương",
    art: "/assets/events/bangkok-street-heat/banner.webp",
  },
]
