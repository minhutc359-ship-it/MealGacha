export interface StoryLine {
  speaker: string
  text: string
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
const line = (speaker: string, text: string): StoryLine => ({ speaker, text })
export const SCENES: Record<string, StoryScene> = {
  "lantern-1": {
    before: [
      line(
        "Người kể",
        "Đêm trước ngày mở hội, bà biến mất. Trên bàn chỉ còn chiếc muôi bạc, hai bát cơm và một lời dặn: ‘Nếu nghe sương gọi tên, đừng trả lời.’",
      ),
      line(
        "Bách",
        "Ta từng học nấu với bà con. Bà muốn con đánh thức năm Ngọn Lửa. Bắt đầu từ quầy bánh mì này; ông ấy đã quên cả tên mình.",
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
    ],
    tactic:
      "Giữ ít nhất một đồng minh giá 1–2. Triệu hồi xong phải đợi lượt sau mới đánh, trừ Xung phong.",
  },
  "lantern-2": {
    before: [
      line(
        "Người kể",
        "Giữa chợ, tiếng rao bị cắt ngang như ai vừa khép một cuốn sách. Một bóng người ngồi ở chiếc ghế không ai nhận là của mình.",
      ),
      line(
        "Bóng Sương",
        "Đừng thắp lửa. Người đang ngủ sẽ thức dậy cùng điều họ không chịu nổi.",
      ),
      line("Bách", "Sương học giọng người để lừa con. Phá nó đi. Đừng nghe."),
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
        "Thủy thủ",
        "Mười mười bảy năm rồi tôi chưa cập bến. Hay tôi đã cập bến mười bảy năm trước?",
      ),
      line(
        "Bạn",
        "Tôi nhớ mùi muối trên tay bà. Nhưng chưa từng nhớ mình đi biển.",
      ),
    ],
    after: [
      line(
        "Nhiên",
        "Ông ấy nhớ ra chuyến tàu cứu hộ. Lạ thật: trong danh sách hành khách có chữ của bà con.",
      ),
      line(
        "Người kể",
        "Bên cạnh một cái tên bị bôi đen là số ghế 06. Nhiên xé trang giấy, giữ lại cho bạn.",
      ),
    ],
    tactic:
      "Xung phong được đánh ngay. Dùng lá rẻ cùng hệ trước lá đắt để kích hoạt Cộng hưởng giảm 1 năng lượng.",
  },
  "harbor-2": {
    before: [
      line(
        "Người kể",
        "Con tàu không tên có một nồi súp vẫn còn ấm. Mười mười bảy năm trôi qua, nó chưa cạn.",
      ),
      line(
        "Bóng Sương",
        "Người cuối cùng rời tàu quay lại lấy chiếc muôi. Không ai thấy cô bé lần nữa.",
      ),
      line(
        "Nhiên",
        "Tôi tin dấu cháy trên gỗ hơn những lời kể. Hãy giữ trang giấy ấy; đừng đưa Bách.",
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
        "Ta giữ nhiệt của bữa ăn cuối trên tàu. Muốn lấy nó, hãy chịu ngọn lửa của những điều bị chôn.",
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
    ],
    tactic:
      "Hồi máu hoặc Hút vị bù sát thương mỗi lượt của boss. Khi boss thức tỉnh, chuẩn bị một lượt kết liễu.",
    clue: {
      title: "Vé tàu số 06",
      text: "Tên Mai dưới lớp than, chữ viết của bà và một bữa súp không bao giờ nguội. Sương đậm lên ngay sau khi Ngọn Lửa thứ hai thức dậy.",
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
        "Tôi làm bánh cho người đã mất. Bách bảo đó là níu giữ. Nhưng nhớ một người không đồng nghĩa với nhốt họ lại.",
      ),
      line("Bạn", "Nếu chiếc muôi vỡ, tôi có biến mất không?"),
      line(
        "Liên",
        "Có thể. Nhưng còn một câu hỏi khác: nếu giữ nó nguyên, bao nhiêu người phải quên mãi?",
      ),
    ],
    after: [
      line(
        "Người kể",
        "Vị khách cắn bánh, bật khóc rồi bật cười. Nỗi buồn và niềm vui có thể ngồi cùng một bàn.",
      ),
      line(
        "Liên",
        "Ta không chữa một vết thương bằng cách lấy đi quyền biết nó đã từng ở đó.",
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
        "Đứa bé ấy… là tôi. Tôi đã sống nhờ Mai, rồi dành mười bảy năm cố trả món nợ bằng cách giữ cô ấy không được yên.",
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
    ],
    after: [
      line(
        "Người kể",
        "Ngọn Lửa cuối cùng không tắt. Nó thôi giữ ký ức làm tù nhân. Trên bàn, chiếc muôi nứt làm hai.",
      ),
      line(
        "Bà",
        "Ta xin lỗi vì đã gọi con bằng tên người ta mất. Bữa ăn này dành cho con, người đang ở đây.",
      ),
      line(
        "Người kể",
        "Bạn có thể trả mọi ký ức về, hoặc dùng chiếc muôi để viết một công thức chưa từng tồn tại. Không lựa chọn nào đổi phần thưởng của trận này.",
      ),
    ],
    tactic:
      "Boss luân phiên Đốt → Hồi → Rút mỗi lượt; hiệu ứng gấp đôi dưới nửa máu. Cân nhắc hồi máu và tích một lượt kết liễu.",
    clue: {
      title: "Người được cứu trên tàu",
      text: "Bách là đứa trẻ Mai cứu. Sương giữ lại bữa ăn chờ một người không thể trở về. Chấm dứt nó cần cả sức mạnh lẫn quyền tự chọn của tiếng vọng.",
    },
  },
}
export const CHAPTER_COPY = [
  [
    "Hai bát cơm, một người vắng",
    "Bà biến mất vào đêm trước hội. Chiếc muôi bạc dẫn bạn tới Bách và bản đồ năm Ngọn Lửa. Nhưng những người chưa từng gặp bạn lại gọi một cái tên bạn không nhớ.",
  ],
  [
    "Một chuyến tàu không trở về",
    "Một tờ vé cháy, một nồi súp còn ấm sau mười bảy năm. Nhiên phát hiện mỗi chiến thắng của bạn đều khiến màn sương ngoài cảng dày thêm.",
  ],
  [
    "Khi người dẫn đường nói dối",
    "Khu vườn từ chối những ký ức chỉ có niềm vui. Một lá thư của bà buộc bạn nghi ngờ hành trình và người đã dẫn mình đi từ đầu.",
  ],
  [
    "Bạn nhớ, hay bạn là ký ức?",
    "Biển giữ sự thật mà thành phố đã đánh mất. Hải cùng bạn tìm tên trên danh sách hành khách, và một căn bếp không có mùi thức ăn.",
  ],
  [
    "Quyền được buồn, quyền được sống",
    "Liên biết cách mời người đã mất tới bàn mà không giam giữ họ. Ngọn Lửa cuối sẽ mở căn bếp của bà; nó cũng sẽ buộc bạn biết mình là ai.",
  ],
  [
    "Không ai chọn thay một tiếng vọng",
    "Năm ổ khóa đã mở. Căn bếp thật ở trước mặt. Để kết thúc màn sương, cả Bách lẫn bà phải thôi sửa quá khứ — còn bạn phải tự viết câu cuối.",
  ],
]
export interface BossRule {
  name: string
  text: string
  effect: "shield" | "burn" | "heal" | "draw" | "cycle"
}
export const BOSS_RULES: Record<string, BossRule> = {
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
      "Nhiều năm sau, một người khách hỏi vì sao bàn ăn luôn thừa một ghế. Bách mỉm cười: ‘Để câu chuyện nào cũng có chỗ được kể.’",
  },
  release: {
    title: "Công thức chưa có tên",
    text: "Bạn bẻ chiếc muôi, từ bỏ sức mạnh giữ bữa tiệc vĩnh hằng. Ký ức thành phố trở về; ký ức trong chiếc muôi trở thành một đời sống mới. Bà quên tiếng vọng đã đồng hành, nhưng bạn có bóng dưới ánh lửa. Bạn không còn là Mai, không phải món nợ của Bách, và không thể khiến ai sống mãi. Bạn có thể học nấu bữa ăn ngày mai.",
    epilogue:
      "Bà mở cửa cho người khách lạ: ‘Con tên gì?’ Bạn chưa trả lời. Mùi cơm vừa chín. Lần này, bạn có cả một đời để chọn tên mình.",
  },
}
