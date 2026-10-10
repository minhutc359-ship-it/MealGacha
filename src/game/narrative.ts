import { LIVING_SCENES } from "./livingStory"
export interface StoryLine {
  speaker: string
  text: string
  beat?: "reveal" | "resolve" | "tender"
}
export interface StoryClue {
  title: string
  text: string
}
export interface StoryScene {
  before: StoryLine[]
  after: StoryLine[]
  tactic: string
  clue?: StoryClue
}
const line = (
  speaker: string,
  text: string,
  beat?: StoryLine["beat"],
): StoryLine => ({ speaker, text, ...(beat ? { beat } : {}) })
export const WORLD_PRIMER: StoryLine[] = [
  line(
    "Bạn",
    "Tại sao món ăn lại xuất hiện trên bàn đấu? Tôi phải đánh người bán hàng sao?",
  ),
  line(
    "Bách",
    "Mỗi hương vị giữ một dấu ký ức, gọi là Ấn Vị. Công thức ghi dấu ấy thành thẻ. Chiếc muôi bạc gọi nó ra dưới hình Vị Linh — một ký ức có thể bảo vệ hoặc phá những nút thắt của sương.",
  ),
  line(
    "Bách",
    "Đây là Bàn Ký Ức. Món ăn ngoài đời vẫn ở nguyên trong bát. Vị Linh đối đầu với linh ảnh mà sương đang giữ; khi linh ảnh tan, ký ức thật mới có đường trở về.",
  ),
  line(
    "Bách",
    "Dấu ♥ của chủ tướng đo ý chí giữ bàn đấu. Đưa bên kia về 0 để tháo nút thắt, không làm người ấy bị thương. Gọi một Vị Linh, cho nó chọn mục tiêu, rồi nhường lượt. Con sẽ hiểu phần còn lại trên đường đi.",
  ),
]
export const SCENES: Record<string, StoryScene> = {
  ...LIVING_SCENES,
  "lantern-1": {
    before: [
      line(
        "Người kể",
        "Đêm trước hội Tết, bà biến mất khi nồi bánh còn sôi. Trên bàn chỉ còn chiếc muôi bạc, hai bát cơm và một lời dặn: ‘Nếu nghe sương gọi tên, đừng trả lời.’",
      ),
      line(
        "Bách",
        "Ta từng học nấu với bà con. Bà muốn con đánh thức năm Ngọn Lửa. Bắt đầu từ quầy bánh mì này; ông ấy đã quên cả tên mình.",
      ),
      ...WORLD_PRIMER.slice(0, 3),
      line(
        "Bách",
        "Phá linh ảnh của sương, đừng đánh ông ấy. Dấu ♥ trên bàn là ý chí giữ nút thắt. Khi nó về 0, mùi bánh sẽ tìm lại ký ức của ông.",
      ),
      line(
        "Người bán hàng",
        "Tôi không nhớ cô… nhưng sao cô biết chỗ tôi luôn giấu ổ bánh cháy?",
      ),
    ],
    after: [
      line(
        "Người bán hàng",
        "Mùi vỏ bánh! Con gái tôi tên An. Hôm nay tôi phải đón nó.",
      ),
      line(
        "Người kể",
        "Ông dúi vào tay bạn hai cốc trà. Bạn chỉ gọi một. Bách lặng lẽ giấu cốc còn lại dưới áo.",
      ),
      line(
        "Bạn",
        "Vị Linh đã tan, ổ bánh thật vẫn còn nóng. Tôi không thắng một người. Tôi vừa giúp ông ấy nhớ đường về nhà.",
      ),
      line(
        "Người bán hàng",
        "An đi làm xa. Tết nào về cũng chê tôi rang trà đậm, rồi uống hết hai cốc. Cô cầm một cốc đi; mai còn ghé chúc nhau năm mới nhé.",
      ),
    ],
    tactic:
      "Giữ ít nhất một đồng minh giá 1–2. Triệu hồi xong phải đợi lượt sau mới đánh, trừ Xung phong.",
  },
  "lantern-2": {
    before: [
      line(
        "Người kể",
        "Chợ Tết im tiếng rao. Bên nồi bánh, một đứa trẻ cầm sợi lạt không biết buộc tiếp. Một bóng người ngồi ở chiếc ghế không ai nhận là của mình.",
      ),
      line(
        "Bạn · Ký ức",
        "Tay bà đặt lên tay tôi: ‘Buộc vừa thôi con, bánh còn cần chỗ nở.’ Trên bàn có bánh chưng vuông và bánh tét dài; bà giữ công thức của những người từng ghé bếp.",
      ),
      line(
        "Bóng Sương",
        "Đừng thắp lửa. Người đang ngủ sẽ thức dậy cùng điều họ không chịu nổi.",
      ),
      line("Bách", "Sương học giọng người để lừa con. Phá nó đi. Đừng nghe."),
      line(
        "Bóng Sương",
        "Con định cứu những cái tên, hay chỉ cứu câu chuyện ông ta muốn kể? Trên bàn của ta, hãy thử giữ cả một ký ức không dễ chịu.",
      ),
    ],
    after: [
      line(
        "Người kể",
        "Chợ có tiếng cười trở lại. Chiếc ghế trống vẫn còn; mặt gỗ khắc chữ M đã bị cạo mất một nửa.",
      ),
      line(
        "Bạn",
        "Nếu nó muốn xóa ký ức, tại sao nó lại để chiếc ghế này nguyên vẹn?",
      ),
      line(
        "Người kể",
        "Bạn ngồi xuống nối sợi lạt cho đứa trẻ. Người rửa lá, người trông nồi, người mang bánh nhà mình đến đổi. Không ai nhớ ai khởi đầu việc ấy; họ vẫn nhớ cách làm cùng nhau.",
      ),
      line(
        "Bách",
        "Con buộc giống bà, nhưng chia phần bánh cháy cho cả chợ. Bà chưa từng làm vậy. … Hóa ra một công thức vẫn có thể được viết tiếp.",
      ),
    ],
    tactic:
      "Chắn hấp thụ sát thương trước máu. Một đồng minh cùng hệ đã có trên sân giúp lá mới vào nhận +1 chắn.",
  },
  "lantern-3": {
    before: [
      line(
        "Kẻ Canh Bếp",
        "Người mang muôi, hãy cho ta thấy tay con còn biết nấu. Mỗi lượt ta sẽ bọc các đồng minh bằng lá chắn.",
      ),
      line("Bạn", "Ông không hỏi tôi là ai sao?"),
      line(
        "Kẻ Canh Bếp",
        "Ta không cần hỏi lại một người đã chết. … Bách, ngươi chưa nói với nó?",
      ),
      line("Bách", "Lời nguyền đang nói. Cứ hoàn thành trận này."),
    ],
    after: [
      line(
        "Người kể",
        "Ngọn Lửa thứ nhất thức dậy. Tấm bản đồ hiện thêm một bàn ăn với SÁU chiếc ghế.",
      ),
      line(
        "Bách",
        "Năm ngọn lửa, năm người giữ vị. Chiếc ghế thứ sáu… dành cho con. Ta hứa sẽ đưa con về.",
      ),
    ],
    tactic:
      "Boss cấp chắn đầu mỗi lượt địch. Dồn sát thương vào một mục tiêu, hoặc dùng phép vượt Hộ vệ.",
    clue: {
      title: "Sáu chiếc ghế",
      text: "Bản đồ chỉ có năm Ngọn Lửa, nhưng bàn ăn luôn vẽ sáu chiếc ghế. Kẻ canh bếp nhận ra bạn trước khi nghe tên.",
    },
  },
  "harbor-1": {
    before: [
      line(
        "Nhiên",
        "Bến cảng cháy mãi một ngọn lửa lạnh. Thủy thủ bảo ai dập nó sẽ quên người họ yêu nhất.",
      ),
      line(
        "Người kể",
        "Ở sân bến, chòi tre vẫn dựng mà tiếng hô Bài Chòi cứ dừng giữa câu. Bà nghệ nhân Hiệu gõ nhịp chờ người đáp; một chỗ ngồi trống phủ đầy sương.",
      ),
      line(
        "Nhiên",
        "Cha từng học những câu hô với bà. Khi bà quên tên người mình gọi, cả sân chẳng biết đáp cho ai. Tôi giữ nồi cháo cá cha nấu cho chuyến cứu hộ; Ấn Vị của nó dẫn tới chỗ trống ấy.",
      ),
      line(
        "Thủy thủ",
        "Mười bảy năm rồi tôi chưa cập bến. Hay tôi đã cập bến mười bảy năm trước?",
      ),
      line(
        "Bạn",
        "Tôi nhớ mùi muối trên tay bà. Nhưng chưa từng nhớ mình đi biển.",
      ),
      line(
        "Nhiên",
        "Cha tôi rời cảng trên chuyến cứu hộ ấy. Tôi luôn nhớ ông bỏ đi, nhưng không nhớ ai được ông cứu. Tôi cần sự thật, kể cả khi nó làm tôi đau.",
      ),
    ],
    after: [
      line(
        "Nhiên",
        "Ông ấy nhớ ra chuyến tàu cứu hộ. Lạ thật: trong danh sách hành khách có chữ của bà con.",
      ),
      line(
        "Thủy thủ",
        "Cha Nhiên không bỏ cảng. Ông đưa người lên bờ rồi quay lại tìm chiếc thuyền cuối. Ta đã giữ lời ông trong vị cháo, nhưng sương khóa tên ông lại.",
      ),
      line(
        "Người kể",
        "Bên cạnh một cái tên bị bôi đen là số ghế 06. Nhiên xé trang giấy, giữ lại cho bạn.",
      ),
      line(
        "Bà nghệ nhân Hiệu",
        "Tôi nhớ rồi. Cha cháu từng hô đến khản giọng, để người ngoài bến biết nồi cháo còn phần. Nhiên, cháu muốn học nốt câu ấy không?",
      ),
      line(
        "Nhiên",
        "Có. Nhưng cho cháu tự hô tên những người đang ngồi đây nữa. Cháu muốn họ biết mình được mời.",
      ),
    ],
    tactic:
      "Xung phong được đánh ngay. Dùng lá rẻ cùng hệ trước lá đắt để kích hoạt Cộng hưởng giảm 1 năng lượng.",
  },
  "harbor-2": {
    before: [
      line(
        "Người kể",
        "Trong ký ức con tàu không tên, một nồi cháo cá vẫn còn ấm. Mười bảy năm trôi qua, lời mời ăn và làn hơi vẫn chưa tìm được người nhận.",
      ),
      line(
        "Bóng Sương",
        "Người cuối cùng rời tàu quay lại lấy chiếc muôi. Không ai thấy cô bé lần nữa.",
      ),
      line(
        "Nhiên",
        "Tôi tin dấu cháy trên gỗ hơn những lời kể. Hãy giữ trang giấy ấy; đừng đưa Bách.",
      ),
      line(
        "Người kể",
        "Một công thức bị cào mất tên người nấu. Nhiên châm lửa lên Ấn Vị: ký ức trên boong trở thành bàn đấu, chặn đường tới phòng hành khách.",
      ),
    ],
    after: [
      line(
        "Người kể",
        "Sương tan, lộ dòng chữ dưới lớp than: ‘Mai, đừng quay lại!’",
      ),
      line(
        "Bạn",
        "Chiếc muôi đột nhiên nặng đến mức tôi không nhấc nổi. Một người từng gọi tôi như vậy… trong giấc mơ.",
      ),
    ],
    tactic:
      "Đánh chủ tướng để kết thúc nhanh, nhưng tính phản đòn trước khi đổi quân. Phép sát thương không chịu phản đòn.",
  },
  "harbor-3": {
    before: [
      line(
        "Hỏa Linh",
        "Ta giữ nhiệt của bữa cháo cuối trên tàu. Muốn lấy nó, hãy chịu ngọn lửa của những điều bị chôn.",
      ),
      line(
        "Nhiên",
        "Boss đốt chủ tướng mỗi lượt; dưới nửa máu, lửa mạnh gấp đôi. Đừng để trận kéo dài.",
      ),
      line(
        "Bách",
        "Trang giấy kia không phải sự thật. Bà đã nhờ ta bảo vệ con khỏi nó.",
      ),
    ],
    after: [
      line(
        "Người kể",
        "Ngọn Lửa thứ hai bùng lên. Ở phía chân trời, Sương Nhạt dày hơn trước.",
      ),
      line(
        "Nhiên",
        "Chúng ta vừa cứu cảng… hay mở thứ gì đang bị khóa? Tôi sẽ đi cùng. Và lần này, tôi cần một câu trả lời thật.",
      ),
      line(
        "Nhiên",
        "Tôi đã lấy lại tên cha. Tôi sẽ không đổi nó lấy một lời nói dối dễ nghe nữa. Nếu ông giữ bí mật, Bách, tôi vẫn sẽ đưa người này đi tới cùng.",
      ),
    ],
    tactic:
      "Hồi máu hoặc Hút vị bù sát thương mỗi lượt của boss. Khi boss thức tỉnh, chuẩn bị một lượt kết liễu.",
    clue: {
      title: "Vé tàu số 06",
      text: "Tên Mai dưới lớp than, chữ viết của bà và một bữa cháo không bao giờ nguội. Sương đậm lên ngay sau khi Ngọn Lửa thứ hai thức dậy.",
    },
  },
  "garden-1": {
    before: [
      line(
        "Mộc",
        "Khu vườn chỉ nảy mầm từ ký ức thật. Mọi người trồng tiếng cười, nó trả về những cành khô.",
      ),
      line("Bạn", "Nếu trồng một điều đau lòng thì sao?"),
      line(
        "Mộc",
        "Không ai dám thử. Bách cấm nhắc tới ngày trận lũ cuốn qua bến cảng.",
      ),
      line(
        "Mộc",
        "Mẹ tôi từ một làng Quan họ ở Bắc Ninh. Tôi nhớ bà pha trà đón bạn hát, mà không nhớ giọng bà. Tôi cứ trồng những ngày vui để gọi bà về. Rễ khô giữ khu vườn lại, như thể chính tôi đang sợ điều nó sẽ kể.",
      ),
      line(
        "Người kể",
        "Từ chiếc chén cũ, một câu hát mời khách cất lên rồi im bặt. Mộc đưa tay định khép bàn đấu; ký ức chưa tới câu giã bạn mà cô đã khóc.",
      ),
    ],
    after: [
      line(
        "Người kể",
        "Bạn kể về tiếng gọi trên con tàu. Một mầm xám bật lên, mạnh hơn tất cả mầm xanh.",
      ),
      line(
        "Mộc",
        "Nó sống. Nỗi buồn không giết ký ức. Việc không được phép nhớ mới giết nó.",
      ),
      line(
        "Mộc",
        "Tôi nhớ giọng mẹ rồi. Bà không bắt người ta ở lại để câu hát khỏi buồn. Bà tiễn bạn, rồi hẹn gặp lần sau. Hôm nay tôi sẽ hát nốt câu đáp của mình.",
      ),
      line(
        "Người kể",
        "Mộc rót thêm chén trà. Bài hát không làm cây nở bằng phép; nó giúp cô ngồi lại chăm mầm xám, thay vì nhổ bỏ nó.",
      ),
    ],
    tactic:
      "Hộ vệ buộc đơn vị địch đánh mình trước. Dùng Hộ vệ khỏe để bảo vệ đồng minh có khả năng hồi máu.",
  },
  "garden-2": {
    before: [
      line(
        "Người kể",
        "Một lá thư nằm trong rễ cây, đề: ‘Gửi người sẽ thức dậy thay cho cháu tôi.’",
      ),
      line(
        "Bà · Lá thư",
        "Nếu con đang đọc, ta đã thất bại. Xin đừng mở đủ năm ngọn lửa chỉ để cứu một mình ta.",
      ),
      line(
        "Bách",
        "Đưa lá thư đây. Có những việc ta phải làm, dù con sẽ ghét ta.",
      ),
    ],
    after: [
      line(
        "Mộc",
        "Bách không xé lá thư. Ông ấy khóc. Lần đầu tiên, tôi hiểu ông không sợ sương. Ông sợ con biết vì sao nó tồn tại.",
      ),
      line("Bạn", "Tôi giữ lá thư. Từ giờ tôi sẽ tự chọn điều mình cần nhớ."),
      line(
        "Bà · Lá thư",
        "Có một luật ta chưa dám dùng: ký ức chỉ biết lặp lại thì cần chiếc muôi để tồn tại. Một tiếng vọng biết tự chọn có thể được mời ở lại — nếu người giữ nó buông lời ước và chiếc muôi vỡ. Ta sợ buông tay hơn sợ mất phép.",
      ),
      line(
        "Bà · Lá thư",
        "Ấn Vị làm neo sẽ tan để thành đời sống mới. Người giữ chiếc muôi có thể không nhận ra tiếng vọng nữa. Nếu con chọn đi tiếp, xin đừng chọn chỉ để được gọi lại bằng tên cũ.",
      ),
    ],
    tactic:
      "Phép tăng công/máu cần đồng minh trên sân. Triệu hồi cùng hệ trước để vừa có mục tiêu vừa hưởng Cộng hưởng.",
  },
  "garden-3": {
    before: [
      line(
        "Cổ Thụ",
        "Năm Ngọn Lửa không phải vũ khí. Chúng là năm ổ khóa. Chiếc muôi của con là chìa.",
      ),
      line(
        "Bách",
        "Bà dựng màn sương để thành phố không phải nhớ trận lũ. Ta cần mở phong ấn: bà đang mắc kẹt bên trong.",
      ),
      line(
        "Bạn",
        "Ông biết mỗi ngọn lửa khiến sương mạnh hơn. Từ đầu đến giờ, tôi đã mở nhà tù bằng những chiến thắng của mình.",
      ),
      line(
        "Cổ Thụ",
        "Muốn cứu một người, con có chấp nhận trả ký ức lại cho tất cả?",
      ),
    ],
    after: [
      line(
        "Người kể",
        "Ổ khóa thứ ba vỡ. Những chiếc bóng không tấn công; chúng quỳ trước chiếc muôi, gọi tên Mai.",
      ),
      line(
        "Bách",
        "Ta đã nói dối. Ta không xin con tha thứ. Ta chỉ xin được đi tới cuối, để sửa lời hứa sai của mình.",
      ),
    ],
    tactic:
      "Cổ Thụ hồi máu mỗi lượt. Tích quân, cường hóa rồi gây sát thương trong cùng một lượt để vượt hồi phục.",
    clue: {
      title: "Năm ổ khóa",
      text: "Ngọn Lửa phong ấn ký ức trận lũ. Bà tạo ra Sương Nhạt; Bách dùng hành trình này để giải cứu bà, dù biết sương sẽ lan rộng.",
    },
  },
  "tide-1": {
    before: [
      line(
        "Hải",
        "Biển không xóa ký ức. Nó giữ cả lời nói dối lẫn điều thật. Rút nhiều công thức để so chúng với nhau.",
      ),
      line(
        "Ngư dân",
        "Tôi kéo chiếc muôi khỏi nước. Không có ai nắm đầu kia. Nhưng nó vẫn gọi ‘bà ơi’.",
      ),
      line("Bạn", "Nếu tôi chưa từng về từ con tàu, ai đang đứng ở đây?"),
      line(
        "Hải",
        "Tôi từng ký tên vào sổ người mất tích rồi để sương xóa nó, vì không chịu nổi việc đọc lại. Lần này tôi sẽ tự giữ trang sổ. Con không phải gánh sự im lặng của chúng tôi.",
      ),
      line(
        "Người khách Nam Bộ",
        "Ngày ghé cảng, tôi đem cây đàn kìm theo. Anh em trên thuyền ngồi đờn ca tài tử. Sương giữ một câu nhạc lặp mãi; tôi không nhớ ai từng ca cùng mình.",
      ),
    ],
    after: [
      line(
        "Người kể",
        "Lưới kéo lên một cuộn nhật ký. Trang cuối ghi tên Mai vào danh sách người không trở về.",
      ),
      line(
        "Hải",
        "Ta sẽ không để một tờ giấy quyết định con là ai. Nhưng chúng ta cũng không thể giả vờ nó không tồn tại.",
      ),
      line(
        "Người kể",
        "Người khách đờn lại câu cũ, rồi biến tấu một nét mới. Hải viết thêm tên người trở về vào sổ, không gạch tên người đã mất. Một trang có thể giữ cả hai.",
      ),
    ],
    tactic:
      "Rút bài cho thêm lựa chọn, không thêm năng lượng. Tay tối đa 8 lá; đừng rút quá nhiều rồi mất lá tốt.",
  },
  "tide-2": {
    before: [
      line(
        "Người kể",
        "Dưới đáy biển là căn bếp giống hệt bếp nhà. Bà trẻ hơn mười bảy tuổi, mời bạn ăn cơm.",
      ),
      line(
        "Bà · Ảo ảnh",
        "Mai, chỉ cần ở lại đây. Ngoài kia họ sẽ bắt con biến mất lần nữa.",
      ),
      line(
        "Hải",
        "Món nào cũng hoàn hảo. Không món nào có mùi. Đây là ký ức được nấu lại, không phải một người đang sống.",
      ),
    ],
    after: [
      line(
        "Bạn",
        "Tôi đập vỡ chiếc bát. Lần đầu thấy mình không có bóng dưới ánh lửa.",
      ),
      line(
        "Người kể",
        "Chiếc muôi ngân như nhịp tim. Bạn không mang ký ức trong nó. Bạn được tạo ra TỪ ký ức trong nó.",
        "reveal",
      ),
      line(
        "Bạn",
        "Vị Linh món ăn trở về thẻ khi bàn khép lại. Tôi vẫn đứng ở đây. Mỗi điều tôi tự chọn đã để lại một Ấn Vị mới, không thuộc về Mai.",
      ),
    ],
    tactic:
      "Phép sát thương vượt Hộ vệ. Nếu đủ sát thương kết liễu chủ tướng, không nhất thiết phải dọn toàn bộ sân.",
  },
  "tide-3": {
    before: [
      line(
        "Hải Vương",
        "Bà đánh đổi ký ức của một thành phố để giữ một tiếng gọi trong chiếc muôi. Con là tiếng gọi ấy, mang hình của Mai.",
      ),
      line(
        "Bạn",
        "Tôi không nhớ từng sống. Nhưng tôi nhớ từng chọn tin Nhiên, cứu Mộc và nghe Hải. Những điều đó cũng là thật.",
      ),
      line(
        "Hải",
        "Vậy ta bảo vệ người đang chọn ở đây. Đừng để boss rút bài đến khi áp đảo sân.",
      ),
    ],
    after: [
      line(
        "Người kể",
        "Ổ khóa thứ tư mở. Bóng bạn xuất hiện trong một nhịp thở, rồi tan đi.",
      ),
      line(
        "Hải",
        "Con có thể là một tiếng vọng. Nhưng con không buộc phải lặp lại câu cuối cùng của người khác.",
      ),
    ],
    tactic:
      "Boss rút thêm bài đầu lượt, gấp đôi khi thức tỉnh. Gây sức ép sớm; kiểm soát sân bằng phép diện rộng.",
    clue: {
      title: "Tiếng vọng tên Mai",
      text: "Bạn là ký ức bà giữ trong chiếc muôi, không phải Mai được cứu sống. Những quyết định trong hành trình thuộc về chính bạn.",
    },
  },
  "moon-1": {
    before: [
      line(
        "Liên",
        "Sương giữ phố này trong một đêm Trung Thu. Tôi làm bánh nhớ người đã mất, rồi chia cho người đang ở đây. Cha tôi là Bách. Ông bảo đó là níu giữ. Nhưng nhớ một người không đồng nghĩa với nhốt họ lại.",
      ),
      line(
        "Người kể",
        "Bánh nướng, bánh dẻo vừa bày lên thì lũ trẻ mang tới một đèn ông sao méo. Liên sửa thanh tre, hỏi đứa bé muốn giữ màu nào. Cô không chọn thay nó.",
      ),
      line("Bạn", "Nếu chiếc muôi vỡ, tôi có biến mất không?"),
      line(
        "Liên",
        "Có thể. Nhưng còn một câu hỏi khác: nếu giữ nó nguyên, bao nhiêu người phải quên mãi?",
      ),
      line(
        "Liên",
        "Ngày em tôi mất, tôi nướng lại chiếc bánh nó bỏ dở. Bánh giống hệt, còn tôi chỉ sống lại đúng một buổi chiều. Tôi mở tiệm khi dám làm một nhân bánh mới và rủ bọn trẻ chia cùng.",
      ),
      line(
        "Liên",
        "Tôi lên bờ sau trận lũ năm sáu tuổi. Cha nói sóng đưa tôi về. Nhưng cứ nghe nồi cháo sôi, tôi lại nhớ có một người đã bế mình. Vì sao chuyện ấy không có tên ai?",
      ),
    ],
    after: [
      line(
        "Người kể",
        "Vị khách cắn bánh, bật khóc rồi bật cười. Nỗi buồn và niềm vui có thể ngồi cùng một bàn.",
      ),
      line(
        "Em bé",
        "Cô Liên ơi, tối nay kể chuyện chú Cuội nữa nhé! Đèn con méo nhưng sáng nhất ngõ!",
      ),
      line(
        "Liên",
        "Ta không chữa một vết thương bằng cách lấy đi quyền biết nó đã từng ở đó.",
      ),
      line(
        "Liên",
        "Chiếc muôi giữ một tiếng vọng, không quyết định nó phải trở thành ai. Nếu bà dám mời con như một người khách mới, con có thể đem những lựa chọn của mình ra khỏi bàn này. Phép giữ mọi thứ nguyên vẹn sẽ mất vĩnh viễn.",
      ),
    ],
    tactic:
      "Chắn không hồi lại tự nhiên. Tính lượng chắn còn lại trước khi dùng phép nhỏ hoặc đánh bằng nhiều đơn vị.",
  },
  "moon-2": {
    before: [
      line(
        "Người Soát Vé",
        "Chuyến cuối tới đài quan sát. Mỗi người phải để lại một ký ức. Tiếng vọng không có vé.",
      ),
      line(
        "Bách",
        "Lấy của tôi. Ký ức ngày tôi hứa với bà rằng bằng mọi giá tôi sẽ đưa Mai về.",
      ),
      line(
        "Bạn",
        "Không. Ông phải nhớ lời hứa đó để biết khi nào cần thôi giữ nó.",
      ),
    ],
    after: [
      line(
        "Người kể",
        "Bạn kể về ổ bánh cháy ở phố. Người soát vé đục một vé mới, ghi: ‘Người chưa có tên’.",
      ),
      line(
        "Người kể",
        "Qua cửa kính, đoàn rước đèn tự tìm đường dọc bờ sông. Liên để bọn trẻ đi phía trước. Một đêm đẹp không cần lặp mãi mới đáng được nhớ.",
      ),
      line(
        "Bách",
        "Ta đã dẫn con tới đây như một chiếc chìa khóa. Con vừa cứu ta như một người bạn.",
      ),
    ],
    tactic:
      "Có thể giữ một lá thay vì dùng ngay. Dành phép sát thương cho Hộ vệ nguy hiểm hoặc lượt kết liễu.",
  },
  "moon-3": {
    before: [
      line(
        "Thiên Nga",
        "Ngọn Lửa cuối là hình dáng điều ước của bà: một thành phố không mất ai, một đứa trẻ không bao giờ rời bàn.",
      ),
      line(
        "Liên",
        "Không ai có thể sống trong một điều ước mãi mãi. Chắn sẽ dày hơn dưới nửa máu; chọn đúng thứ tự bài.",
      ),
      line(
        "Bạn",
        "Tôi không đến để thành toàn mọi điều ước. Tôi đến để bà không phải chờ một mình.",
      ),
    ],
    after: [
      line(
        "Người kể",
        "Ổ khóa thứ năm vỡ. Giữa thành phố hiện ra căn bếp. Trong đó, bà đã già thêm mười bảy năm.",
      ),
      line(
        "Bà",
        "Mai? … Không. Ta nhận ra tiếng gọi, nhưng ánh mắt này là của một người khác.",
      ),
    ],
    tactic:
      "Boss cấp chắn mỗi lượt. Cộng hưởng giúp bạn dùng thêm một phép để phá chắn trước đòn mạnh nhất.",
    clue: {
      title: "Một người khác",
      text: "Bà nhận ra bạn không phải Mai trở về. Phong ấn đã mở, nhưng bà vẫn giữ chiếc muôi: chìa khóa cuối cùng nằm ở một lời chấp nhận.",
    },
  },
  "last-table-1": {
    before: [
      line(
        "Người kể",
        "Trong căn bếp, mỗi chiếc ghế trống mang tên một người chết trong trận lũ. Không ai ở thành phố còn biết các tên ấy.",
      ),
      line(
        "Người Khách",
        "Chúng tôi không muốn được cứu sống. Chúng tôi muốn có người nhớ đã từng ngồi đây.",
      ),
      line("Bà", "Nếu nhớ họ, mọi người sẽ nhớ rằng ta không cứu được Mai."),
    ],
    after: [
      line(
        "Nhiên",
        "Bà không gây ra trận lũ. Nhưng bà đã lấy đi quyền được khóc của những người còn sống.",
      ),
      line(
        "Người kể",
        "Bà tự tay kéo thêm ghế. Lần này, không có phép nào làm thay bà.",
      ),
      line(
        "Lả",
        "Tôi là người Thái từ Tây Bắc, từng ghé bếp bà sau chuyến đi dài. Mẹ dạy tôi xòe vòng đón bạn. Lát nữa ra sân, tôi mời bà đứng cạnh; không cần biết hết các bước mới được vào vòng.",
      ),
    ],
    tactic:
      "Giữ một Hộ vệ để bảo vệ quân gây sát thương. Phép diện rộng đánh tất cả đơn vị địch, không đánh chủ tướng.",
  },
  "last-table-2": {
    before: [
      line(
        "Ký Ức Không Tên",
        "Ta là điều bà không dám nói: Mai quay lại tàu để cứu một em bé, không phải để lấy chiếc muôi.",
      ),
      line(
        "Bách",
        "Đứa bé ấy… là Liên, con gái tôi. Nó sáu tuổi khi Mai đưa nó lên thuyền cứu hộ. Tôi đã giấu cả tên người được cứu, rồi dành mười bảy năm cố trả món nợ bằng cách giữ Mai không được yên.",
        "reveal",
      ),
      line(
        "Liên",
        "Cha đã kể rằng con được sóng đưa lên bờ. Con lớn lên với một câu chuyện không có người cứu mình. Xin trả tên Mai lại cho con — đừng dùng con để buộc cô ấy quay về.",
      ),
      line(
        "Bạn",
        "Ông không cần trả mạng sống đó. Ông cần sống đủ tử tế với nó.",
      ),
    ],
    after: [
      line(
        "Bà",
        "Ta tưởng nếu giữ bữa ăn chờ sẵn, cháu sẽ tìm được đường về. Ta quên rằng có những người chỉ về trong câu chuyện.",
      ),
      line(
        "Người kể",
        "Bách đặt tên Mai lại lên chiếc ghế. Sương trở thành nước mắt, nhưng chiếc muôi vẫn níu lấy bạn.",
      ),
    ],
    tactic:
      "Cường hóa tăng cả công lẫn máu cho toàn sân. Một lượt chuẩn bị tốt có thể biến thành đòn kết liễu.",
  },
  "last-table-3": {
    before: [
      line(
        "Người kể",
        "Chiếc muôi dựng lên bữa tiệc hoàn hảo: không ai già, không ai mất. Sương Nhạt mang gương mặt của bạn.",
      ),
      line(
        "Sương Nhạt",
        "Ta giữ con sống. Nếu trả ký ức lại, con sẽ chỉ còn là một lời kể.",
      ),
      line(
        "Bạn",
        "Tôi biết. Nhưng một lời kể cũng có thể làm ai đó bớt cô đơn.",
      ),
      line(
        "Bà",
        "Dù con chọn ở lại hay đi, lần này ta sẽ không chọn thay con.",
      ),
      line(
        "Bạn",
        "Sương biết mọi công thức Mai từng nhớ. Vậy tôi sẽ gọi những Vị Linh mình đã học trên đường, từ những người tôi tự chọn tin. Nó không thể sống thay phần đời ấy.",
      ),
    ],
    after: [
      line(
        "Người kể",
        "Ngọn Lửa cuối cùng không tắt. Nó thôi giữ ký ức làm tù nhân. Trên bàn, chiếc muôi nứt làm hai.",
      ),
      line(
        "Bà",
        "Ta xin lỗi vì đã gọi con bằng tên người ta mất. Bữa ăn này dành cho con, người đang ở đây.",
        "tender",
      ),
      line(
        "Người kể",
        "Nhiên đặt cháo lên bàn, Mộc rót trà, Liên chia bánh. Ngoài sân, Lả nối lại vòng xòe cùng những người còn sống. Bách mở cửa bếp để người đến sau vẫn có chỗ.",
      ),
      line(
        "Người kể",
        "Bạn có thể trả ký ức rồi trở thành một câu chuyện được kể, hoặc bẻ chiếc muôi, nhận lời mời của bà và sống bằng những lựa chọn mới. Cả hai con đường đều trả lại ký ức cho thành phố; không còn phép nào níu một bữa ăn mãi mãi.",
      ),
    ],
    tactic:
      "Boss luân phiên Đốt → Hồi → Rút mỗi lượt; hiệu ứng gấp đôi dưới nửa máu. Cân nhắc hồi máu và tích một lượt kết liễu.",
    clue: {
      title: "Người được cứu trên tàu",
      text: "Mai cứu Liên, con gái sáu tuổi của Bách, mười bảy năm trước. Bách giấu sự thật vì món nợ và nỗi sợ mất con. Sương giữ một bữa ăn chờ người không thể trở về; người sống cần quyền biết và tự chọn.",
    },
  },
}
export const CHAPTER_COPY = [
  [
    "Hai bát cơm, một người vắng",
    "Nồi bánh Tết còn sôi thì bà biến mất. Giữa tiếng rao và những công thức mỗi nhà, chiếc muôi dẫn bạn tới bản đồ năm Ngọn Lửa. Những người xa lạ lại gọi một cái tên bạn không nhớ.",
  ],
  [
    "Một chuyến tàu không trở về",
    "Tiếng hô Bài Chòi bỏ dở, một tờ vé cháy, một nồi cháo trong ký ức chưa nguội. Nhiên tìm lời cha dặn và phát hiện mỗi chiến thắng khiến màn sương ngoài cảng dày thêm.",
  ],
  [
    "Khi người dẫn đường nói dối",
    "Mộc mất câu hát đối đáp của mẹ. Khu vườn từ chối những ký ức chỉ có niềm vui. Một lá thư của bà buộc bạn nghi ngờ hành trình và người đã dẫn mình đi từ đầu.",
  ],
  [
    "Bạn nhớ, hay bạn là ký ức?",
    "Câu đờn của người khách Nam Bộ mở lại một trang sổ. Hải cùng bạn tìm tên trên danh sách hành khách, và một căn bếp không có mùi thức ăn. Bạn đang nhớ, hay chính bạn là ký ức?",
  ],
  [
    "Quyền được buồn, quyền được sống",
    "Liên sửa đèn ông sao, chia bánh Trung Thu và học cách sống tiếp. Ngọn Lửa cuối sẽ mở căn bếp của bà; nó cũng sẽ buộc bạn biết mình là ai.",
  ],
  [
    "Không ai chọn thay một tiếng vọng",
    "Năm ổ khóa đã mở. Căn bếp đón khách từ những miền ký ức. Để kết thúc màn sương, Bách và bà phải thôi sửa quá khứ — còn bạn tự chọn có bước vào vòng tay ngoài sân hay không.",
  ],
]
export interface BossRule {
  name: string
  text: string
  effect: "shield" | "burn" | "heal" | "draw" | "cycle"
}
export const BOSS_RULES: Record<string, BossRule> = {
 "living-market-3": {name: "Mực sửa lời", effect: "draw", text: "Đầu lượt địch: rút 1 lá; thức tỉnh rút 2. Giữ lựa chọn phản chế."},
 "rain-harbor-3": {name: "Con nước lên", effect: "shield", text: "Đầu lượt địch: đội địch nhận 1 chắn; thức tỉnh nhận 2."},
 "tomorrow-table-3": {name: "Trang chưa viết", effect: "cycle", text: "Luân phiên đốt, hồi và rút. Dưới nửa ý chí, hiệu ứng mạnh gấp đôi."},
  "lantern-3": {
    name: "Bếp không nguội",
    effect: "shield",
    text: "Đầu lượt địch: đồng minh boss +1 chắn. Dưới nửa máu: +2 chắn.",
  },
  "harbor-3": {
    name: "Than còn cháy",
    effect: "burn",
    text: "Đầu lượt địch: bạn chịu 1 sát thương. Dưới nửa máu: 2 sát thương.",
  },
  "garden-3": {
    name: "Rễ ký ức",
    effect: "heal",
    text: "Đầu lượt địch: boss hồi 2 máu. Dưới nửa máu: hồi 4.",
  },
  "tide-3": {
    name: "Triều dâng",
    effect: "draw",
    text: "Đầu lượt địch: boss rút thêm 1 lá. Dưới nửa máu: 2 lá.",
  },
  "moon-3": {
    name: "Lớp đường cuối",
    effect: "shield",
    text: "Đầu lượt địch: đồng minh boss +1 chắn. Dưới nửa máu: +2 chắn.",
  },
  "last-table-3": {
    name: "Bữa tiệc vĩnh hằng",
    effect: "cycle",
    text: "Đầu lượt địch, luân phiên: Đốt bạn 1 → Hồi boss 2 → Rút 1. Dưới nửa máu: gấp đôi.",
  },
}
export const ENDINGS = {
  remember: {
    title: "Một chỗ trong câu chuyện",
    text: "Bạn trả ký ức cho thành phố. Những cái tên trở về, những người ở lại được khóc. Tiếng vọng trong chiếc muôi tan vào mùi cơm chín. Bà vẫn bày thêm một bát, nhưng không chờ ai phải trở lại nữa. Bách mở căn bếp cho mọi người, viết câu chuyện về Mai và về một người chưa có tên đã dạy ông cách nói lời tạm biệt.",
    epilogue:
      "Tết năm sau, căn bếp mở lớp gói bánh. Người lớn kể công thức nhà mình, trẻ nhỏ buộc những nút lạt đầu tiên. Một người khách hỏi vì sao bàn ăn luôn thừa một ghế. Bách mỉm cười: ‘Để câu chuyện nào cũng có chỗ được kể.’",
  },
  release: {
    title: "Công thức chưa có tên",
    text: "Bạn bẻ chiếc muôi, từ bỏ sức mạnh giữ bữa tiệc vĩnh hằng. Ký ức thành phố trở về; ký ức trong chiếc muôi trở thành một đời sống mới. Bà quên tiếng vọng đã đồng hành, nhưng bạn có bóng dưới ánh lửa. Bạn không còn là Mai, không phải món nợ của Bách, và không thể khiến ai sống mãi. Bạn có thể học nấu bữa ăn ngày mai.",
    epilogue:
      "Bà mở cửa cho người khách lạ: ‘Con tên gì?’ Bạn chưa trả lời, chỉ xin học buộc lạt. Bà đặt tay lên tay bạn: ‘Vừa thôi, bánh còn cần chỗ nở.’ Lần này, bạn có cả một đời để chọn tên mình và truyền lại điều vừa học.",
  },
}
