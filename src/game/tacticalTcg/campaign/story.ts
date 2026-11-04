export interface CampaignScene {
  region: string
  speaker: string
  portrait: string
  art: string
  objective: string
  before: string[]
  after: string[]
  rewardCardId: string
}
const portrait = (id: string) =>
  `/assets/characters/chefs593/chef-${id}-neutral.webp`
export const TACTICAL_ACTS = [
  {
    title: "Làng Giao Ước",
    subtitle: "Khi món ăn còn nhớ tên người nấu",
    art: "lantern",
  },
  {
    title: "Phố Đèn Giữ Vị",
    subtitle: "Không có một công thức đúng cho tất cả",
    art: "harbor",
  },
  {
    title: "Sân Bếp Trăm Nhà",
    subtitle: "Những ký ức khác nhau cùng ngồi một mâm",
    art: "garden",
  },
  {
    title: "Bếp Vô Danh",
    subtitle: "Mời người bị lãng quên trở lại bàn ăn",
    art: "last-table",
  },
]
export const TACTICAL_SCENES: Record<string, CampaignScene> = {
  "act-1-hearth": {
    region: "Làng Giao Ước",
    speaker: "Nhiên",
    portrait: portrait("nhien"),
    art: "lantern",
    objective:
      "Triệu hồi Vị Linh từ tay bài, bảo vệ 30 Ý chí và hạ Ý chí địch về 0.",
    before: [
      "Sáng nay, bà vẫn nấu phở nhưng không còn nhớ đã học công thức từ ai. Sương Nhạt đã lấy đi tên người trong ký ức ấy.",
      "Bạn là Người Giữ Vị. Cầm bộ bài đầu tiên này: mỗi lá không chỉ là một món ăn, mà là lời kể của người từng nấu nó. Ta sẽ tìm lại những cái tên.",
    ],
    after: [
      "Hương phở trở lại, và bà nhớ bàn tay mẹ mình đã nêm nồi nước dùng đầu tiên.",
      "Nhưng ngoài Cổng Muối, một người đang tuyên bố rằng chỉ nên giữ một công thức duy nhất. Ta cần nghe xem vì sao.",
    ],
    rewardCardId: "trap-ward",
  },
  "act-1-salt-gate": {
    region: "Cổng Muối Trắng",
    speaker: "Hải",
    portrait: portrait("hai"),
    art: "tide",
    objective:
      "Giữ tiền tuyến trước Hương Vương. Boss tăng khiên ở 2/3 và 1/3 sinh lực.",
    before: [
      "Kẻ giữ cổng đã bọc mọi ký ức trong muối để chúng không đổi thay. Càng đánh mất sinh lực, hắn càng dựng thêm khiên.",
      "Đặt Hộ vệ ở hàng trước. Đừng dồn hết Bí thuật vào lớp khiên; chờ nhịp phản ứng và Tuyệt kỹ để phá thế thủ.",
    ],
    after: [
      "Dưới lớp muối không phải công thức sai, mà là những lời kể chưa từng được lắng nghe.",
      "Dấu ấn trên cổng chỉ về Phố Đèn. Bách đang giữ nơi đó khỏi những kỵ sĩ của Bếp Vô Danh.",
    ],
    rewardCardId: "chef-hai",
  },
  "act-2-kiln": {
    region: "Phố Đèn Giữ Vị",
    speaker: "Bách",
    portrait: portrait("bach"),
    art: "harbor",
    objective:
      "Dùng Bí thuật để đổi nhịp. Rút bài và quản lý Lửa Bếp trước khi khóa đội hình.",
    before: [
      "Mỗi nhà ở phố này từng có một cách nấu cơm. Giờ những tấm bảng đều ghi cùng một công thức, không còn tên người chủ bếp.",
      "Ta không chiến đấu để chứng minh món nào ngon nhất. Ta chiến đấu để mỗi gia đình còn quyền nhớ bữa cơm của mình.",
    ],
    after: [
      "Những người bán hàng bắt đầu sửa lại bảng tên. Đèn lồng sáng theo những màu khác nhau.",
      "Kỵ Sĩ Lò vẫn canh ngõ cuối. Hắn đốt mọi trang ghi chép không giống cuốn sách của chủ nhân.",
    ],
    rewardCardId: "recipe-scroll",
  },
  "act-2-knight": {
    region: "Ngõ Lò Ký Ức",
    speaker: "Bách",
    portrait: portrait("bach"),
    art: "harbor",
    objective:
      "Đặt bẫy theo cột tiền tuyến. Giữ Lửa Bếp cho phép bảo vệ và phản kích.",
    before: [
      "Kỵ sĩ không ghét con người. Hắn sợ thay đổi: hắn tin ký ức khác nhau sẽ khiến người ta quên mất bản gốc.",
      "Hãy cho hắn thấy một mâm cơm vẫn đứng vững khi có nhiều hương vị. Đọc cột tấn công và đặt Bẫy Hương đúng chỗ.",
    ],
    after: [
      "Trong tro có một dòng chữ: 'Người đầu bếp cuối cùng không còn nhớ tên mình.'",
      "Chủ nhân Bếp Vô Danh từng là Người Giữ Vị giống bạn. Mộc và Liên có thể biết chuyện đã xảy ra.",
    ],
    rewardCardId: "chef-bach",
  },
  "act-3-cloud": {
    region: "Sân Bếp Trăm Nhà",
    speaker: "Mộc",
    portrait: portrait("moc"),
    art: "garden",
    objective:
      "Ghép bản sao trên cùng một ô để lên 2 sao; lượng máu đã mất vẫn được giữ.",
    before: [
      "Ngày xưa Vô Danh gom mọi lời kể vào một cuốn sách. Khi không còn chỗ, ông gạch đi những điều khác biệt — rồi gạch mất cả tên mình.",
      "Bản sao không xóa nhau. Khi bạn chồng hai lá cùng Vị Linh, sức mạnh được nối dài, còn vết thương vẫn là một phần ký ức.",
    ],
    after: [
      "Những lá bài chồng lên nhau vẫn giữ từng dấu mực riêng. Mộc mỉm cười: 'Nhớ không có nghĩa là giữ mọi thứ đứng yên.'",
      "Hương Vương mời cả nhóm dự yến tiệc cuối. Trên thiệp không có chỗ dành cho người nấu.",
    ],
    rewardCardId: "family-table",
  },
  "act-3-regent": {
    region: "Yến Tiệc Hương Vương",
    speaker: "Liên",
    portrait: portrait("lien"),
    art: "moon",
    objective: "Phối hợp hồi phục, Hộ vệ và Tuyệt kỹ qua cả ba pha boss.",
    before: [
      "Bữa tiệc này có mọi món ăn nhưng không ai mời nhau. Hương Vương đã giữ hương vị, còn tình cảm giữa người với người thì mất.",
      "Hãy gọi tên đồng minh khi dùng thẻ hồi phục. Ta sẽ giữ nhau đủ lâu để nghe được giọng của người phía sau chiếc mặt nạ.",
    ],
    after: [
      "'Nếu chấp nhận nhiều lời kể, ai sẽ nhớ bản gốc?' — lần đầu Hương Vương cất tiếng như một con người.",
      "Liên đặt thêm một chiếc bát: 'Chúng tôi sẽ nhớ. Và còn chỗ cho ông, nếu ông muốn ngồi cùng.'",
    ],
    rewardCardId: "chef-lien",
  },
  "act-4-vow": {
    region: "Ngưỡng Bếp Vô Danh",
    speaker: "Nhiên",
    portrait: portrait("nhien"),
    art: "last-table",
    objective:
      "Chọn lời hẹn của Người Giữ Vị trước trận cuối. Cả hai lựa chọn đều đi tới kết thúc.",
    before: [
      "Cuốn sách nằm trước cửa bếp. Bạn có thể giữ bản gốc như một ngọn lửa dẫn đường, hoặc để mỗi gia đình viết thêm trang của mình.",
      "Không có đáp án được chấm điểm. Điều quan trọng là đừng để những người viết nên công thức bị quên lần nữa.",
    ],
    after: [
      "Lời hẹn đã được ghi. Năm người cùng bước qua cửa; phía cuối bàn vẫn còn một chiếc ghế trống.",
    ],
    rewardCardId: "hearth-legacy",
  },
  "act-4-last-table": {
    region: "Mâm Chung Cuối Cùng",
    speaker: "Nhiên",
    portrait: portrait("nhien"),
    art: "last-table",
    objective:
      "Vượt ba pha Hương Vương, hạ Ý chí địch và mời Vô Danh trở lại bàn ăn.",
    before: [
      "'Ta đã giữ mọi công thức. Vì sao không còn ai gọi ta về ăn cơm?' Vô Danh đứng giữa bếp lạnh, ôm cuốn sách đã không còn tên tác giả.",
      "Đừng đánh để xóa ông khỏi câu chuyện. Hãy phá lớp khiên Sương Nhạt, rồi để mùi cơm mới dẫn ông trở về.",
    ],
    after: [
      "Ngọn lửa hạ xuống. Bạn kéo chiếc ghế còn trống, và một người đầu bếp cuối cùng được ngồi ăn bữa cơm do người khác nấu.",
      "Nhiên không hỏi tên ông ngay. Cô chỉ nói: 'Mời mọi người ăn cơm.' Lần này, có tiếng trả lời.",
    ],
    rewardCardId: "last-flame",
  },
}
export const CAMPAIGN_ENDINGS = {
  remember: {
    title: "Ngọn lửa có người giữ",
    text: "Bạn lưu bản công thức đầu tiên cùng tên những người đã truyền nó. Bên cạnh là những trang trống để con cháu kể tiếp. Vô Danh viết tên mình trên trang cuối, rồi trở về làng nấu bữa cơm mới.",
  },
  share: {
    title: "Bàn tiệc có nhiều lời kể",
    text: "Bạn trao mỗi gia đình một trang sách. Những cách nấu khác nhau được đặt cạnh nhau, không lời kể nào bị gạch bỏ. Vô Danh mang một chiếc bát đi qua từng nhà, học lại tên mình qua những người ông từng nấu cho.",
  },
}
