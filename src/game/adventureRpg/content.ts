import type { RpgMap, DungeonKind } from "./types"

export const RPG_MAPS: RpgMap[] = [
  {
    id: "lantern",
    name: "Phố Đèn Lồng",
    subtitle: "Tìm lại tiếng gọi bên mâm cơm",
    school: "hearth",
    guide: "bach",
    art: "/assets/events/hanoi-autumn/banner.webp",
    music: "map-lantern",
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
    music: "map-harbor",
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
    music: "map-garden",
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
    music: "map-tide",
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

/** Bốn vùng thử thách tiếp nối. ID map cũ được giữ để bảo toàn sổ sao 5.7. */
const ADVANCED_CHAPTERS: {
  id: string; name: string; subtitle: string; art: string; battleArt: string
  music: RpgMap["music"]; school: RpgMap["school"]; guide: RpgMap["guide"]
  boss: string; bossName: string; stages: [string, string, string][]
  ending: [string, string]; choices: [string, string]
}[] = [
  {
    id: "mistwood", name: "Đỉnh Trà Mây", subtitle: "Theo hơi trà qua ruộng bậc thang giữa biển mây",
    art: "/assets/rpg/campaign580/tea-cloud-peak.webp", battleArt: "/assets/rpg/campaign580/tea-cloud-peak.webp",
    music: "map-tea", school: "grove", guide: "moc",
    boss: "cloud-teapot", bossName: "Ấm Trà Vân Thiên",
    stages: [
      ["Bậc đá hương trà", "Bướm Trà đang cuốn lá non khỏi lối lên núi. Đi sát nhau để không lạc trong mây.", "Lá trà đã trở về giỏ. Hơi ấm đầu tiên đang dẫn chúng ta lên cao."],
      ["Ruộng bậc thang sương", "Vệ Binh Ngọc đứng chắn mạch nước. Phép xuyên giáp sẽ mở đường nhanh hơn.", "Nước đã chảy lại qua từng bậc ruộng, mang theo mùi trà mới hái."],
      ["Vườn trà treo", "Gió đổi hướng liên tục. Giữ người hồi phục ở giữa đội hình và đừng vội dùng hết tuyệt kỹ.", "Những dây trà đã bám lại vào vách núi. Phía trên có tiếng chuông của Trà Sư."],
      ["Điện ngọc canh mây", "Tinh anh Trà Sư Vân dùng hơi nóng để hồi phục và che chở hộ vệ. Hãy ngắt lúc tụ lực.", "Vòng hơi đã tan. Trà Sư để lại chìa khóa mở cầu gió lên đỉnh."],
      ["Cầu gió lên đỉnh", "Ấm Trà Vân Thiên đang hút toàn bộ mây vào thân. Giữ năng lượng để phá lớp khiên cuối.", "Mây đã thôi xoáy. Chỉ còn chiếc ấm khổng lồ chờ giữa sân trà."],
      ["Đỉnh trà · Ấm Vân Thiên", "Boss hồi phục, dựng khiên và rút năng lượng ở độ khó cao. Chia nhịp tuyệt kỹ để ngắt từng lần rót.", "Ấm trà đã rót xuống thung lũng thay vì giữ hương cho riêng mình."],
    ],
    ending: ["Ta có thể cất mẻ trà đầu mùa trong điện ngọc, hoặc mang xuống chia cho làng dưới núi.", "Hương trà sống lâu nhất khi còn có người ngồi cùng nhau."],
    choices: ["Giữ trà đầu mùa trên đỉnh", "Chia trà cho những căn bếp dưới núi"],
  },
  {
    id: "sugartower", name: "Lò Muối Đỏ", subtitle: "Đi qua lửa đỏ để trả vị mặn về đúng bữa ăn",
    art: "/assets/rpg/campaign580/red-salt-kiln.webp", battleArt: "/assets/rpg/campaign580/red-salt-kiln.webp",
    music: "map-salt", school: "ember", guide: "nhien",
    boss: "salt-colossus", bossName: "Cự Tượng Muối Lò",
    stages: [
      ["Mỏ tinh thể đỏ", "Bọ Muối Đỏ đang kéo tinh thể vào khe lò. Đừng để chúng bao vây tuyến sau.", "Tinh thể đã được gom đúng kho, không còn rơi xuống dòng dung nham."],
      ["Sân gạch nung", "Kỵ Sĩ Lò có giáp gốm dày nhưng chậm. Phá giáp trước rồi dồn sát thương.", "Lớp gốm đã nứt; con đường tới buồng luyện muối hiện ra."],
      ["Kênh dung nham", "Lửa chỉ nên giữ nhiệt cho lò. Hãy khóa những van đang dẫn nó vào sân chiến.", "Dòng lửa đã trở về lòng núi. Không ai còn phải đứng giữa hai bờ nóng đỏ."],
      ["Phòng luyện đồng", "Tinh anh Luyện Sư Muối gọi tinh thể quanh đồng đội. Ngắt phép trước khi vòng muối khép kín.", "Những vòng tinh thể đã vỡ. Luyện Sư chỉ cho ta lõi lò ở tầng sâu nhất."],
      ["Cửa lò đỏ", "Cự Tượng đang nuốt muối và than để thức dậy. Giữ khiên cho tuyến trước trong cú nện đầu.", "Cánh cửa đã mở, nhưng mỗi bước của Cự Tượng làm cả sân rung chuyển."],
      ["Tâm lò · Cự Tượng Muối", "Boss phá khiên, gây Bỏng và làm nứt giáp; Extreme có thêm cú nện sau mỗi lần tụ lực.", "Lõi lò đã dịu. Muối đỏ giờ chỉ còn đủ nóng để giữ vị, không thiêu rụi bữa ăn."],
    ],
    ending: ["Ta có thể khóa lò theo công thức cũ, hoặc để người thợ cùng đặt giới hạn nhiệt mới.", "Một nhúm muối đúng lúc quý hơn cả kho tinh thể bị giữ kín."],
    choices: ["Giữ nghi thức lò cổ", "Cùng thợ lò viết quy tắc mới"],
  },
  {
    id: "ashalley", name: "Đầm Sen Nguyệt", subtitle: "Đánh thức lời hẹn dưới ánh trăng xanh",
    art: "/assets/rpg/campaign580/moon-lotus-marsh.webp", battleArt: "/assets/rpg/campaign580/moon-lotus-marsh.webp",
    music: "map-lotus", school: "tide", guide: "hai",
    boss: "moon-heron", bossName: "Nguyệt Hạc Trấn Đầm",
    stages: [
      ["Cầu đá ánh trăng", "Sứa Nguyệt đang phủ ánh sáng giả lên lối đi. Theo bóng sen thật dưới mặt nước.", "Ánh giả đã tan. Cầu đá dẫn tới khu đầm nơi bọ ngựa giữ nụ sen."],
      ["Bãi sen khép cánh", "Bọ Ngựa Sen đánh nhanh sau khi né. Giữ đội hình và phản công khi cánh nó hạ xuống.", "Những nụ sen đã mở lại, soi rõ đường tới miếu giữa đầm."],
      ["Miếu nước bạc", "Mặt nước giữ tiếng gọi cũ. Đừng để đội tách nhau khi thủy triều ánh trăng dâng.", "Tiếng gọi đã thành lời, nhắc tới vị tư tế canh cổng trăng."],
      ["Vườn sen tĩnh", "Tinh anh Tư Tế Nguyệt hút năng lượng và khóa hồi phục. Dùng thanh tẩy sau nhịp trăng thứ hai.", "Vầng trăng giả đã vỡ. Một chiếc lông bạc chỉ về sân của Nguyệt Hạc."],
      ["Lối hạc bay", "Nguyệt Hạc sẽ lao vào tuyến yếu nhất. Giữ Che chắn cho người hồi phục.", "Gió trên đầm đã yên. Boss đang đợi ở nơi trăng chạm mặt nước."],
      ["Tâm nguyệt · Nguyệt Hạc", "Boss đổi tuyến, rút năng lượng và gây choáng; Extreme lặp cú quét khi bước sang pha hai.", "Nguyệt Hạc đã gập cánh. Ánh trăng trở lại dẫn đường thay vì giữ mọi người ở lại."],
    ],
    ending: ["Ta có thể giữ miếu đóng cửa để bảo vệ đầm, hoặc mở cầu cho người trong làng tới ngắm sen.", "Một lời hẹn được giữ khi con đường trở về vẫn còn sáng."],
    choices: ["Giữ đầm sen tĩnh lặng", "Mở cầu trăng cho mọi người"],
  },
  {
    id: "lasttable", name: "Điện Vạn Hương", subtitle: "Gọi lại ký ức từ ngàn lớp gia vị",
    art: "/assets/rpg/campaign580/aroma-palace.webp", battleArt: "/assets/rpg/campaign580/aroma-palace.webp",
    music: "map-aroma", school: "hearth", guide: "bach",
    boss: "aroma-regent", bossName: "Nhiếp Chính Vạn Hương",
    stages: [
      ["Bậc thềm nghệ vàng", "Diều Gia Vị đang cuốn mất mùi hương khỏi các khay phơi. Hạ chúng trước khi gió đổi chiều.", "Những dải nghệ đã trở về sân điện. Mùi hương dẫn tới hàng hộ vệ đồng."],
      ["Hành lang lư đồng", "Hộ Vệ Hương có lớp giáp dày và khiên phản sáng. Phối hệ để phá từng lớp.", "Lư đồng đã nguội bớt. Phía sau là gian nhạc nơi mọi mùi hương bị điều khiển."],
      ["Bếp ký ức", "Mỗi bếp đang nấu một ký ức khác nhau. Giữ nhịp để chúng không trộn thành sương độc.", "Các bếp đã tách vị. Ta nghe thấy tiếng baton gõ từ sân nghi lễ."],
      ["Sân nghi lễ", "Tinh anh Nhạc Trưởng Hương tăng lực cả đội và hút năng lượng. Ngắt lần gõ thứ ba.", "Bản nhạc đã dừng. Cánh cửa vàng mở tới ngai của Nhiếp Chính."],
      ["Bậc ngai vạn vị", "Nhiếp Chính dựng khiên từ những ký ức bị giữ lại. Hãy giải phóng hộ vệ trước.", "Không còn ký ức nào bị dùng làm khóa. Chúng ta đã tới trước ngai hương."],
      ["Đại điện · Nhiếp Chính", "Boss dựng khiên, làm yếu toàn đội và phản kích ở pha hai; giữ tuyệt kỹ thanh tẩy cho Extreme.", "Ngai hương đã trống. Mỗi căn bếp có thể tự chọn mùi vị để kể câu chuyện của mình."],
    ],
    ending: ["Ta có thể lập một kho hương chung, nhưng không để một người quyết định món nào đáng nhớ.", "Mâm cơm ngày mai bắt đầu khi mỗi người được mang theo hương vị của mình."],
    choices: ["Lập kho hương chung", "Trao lại hương vị cho từng căn bếp"],
  },
]
RPG_MAPS.push(...ADVANCED_CHAPTERS.map((chapter): RpgMap => ({
  id: chapter.id, name: chapter.name, subtitle: chapter.subtitle, art: chapter.art, battleArt: chapter.battleArt,
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
