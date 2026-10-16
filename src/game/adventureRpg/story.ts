import type { RpgLine } from "./types"

interface ChapterArc {
  title: string
  hook: string
  opening: RpgLine[]
  turningPoint: RpgLine[]
  finale: RpgLine[]
  aftermath: RpgLine[]
  consequences: [RpgLine[], RpgLine[]]
}
const line = (speaker: RpgLine["speaker"], text: string, expression?: RpgLine["expression"]): RpgLine => ({speaker, text, ...(expression ? {expression} : {})})

/** The mystery is revealed in order; earlier choices return as later callbacks. */
export const RPG_STORY_ARCS: Record<string, ChapterArc> = {
  lantern: {
    title: "Chiếc bát không tên",
    hook: "Một chiếc bát trống xuất hiện ở mọi mâm cơm. Dấu tro dưới đáy bát dẫn tới người bị xóa khỏi ký ức của cả khu chợ.",
    opening: [line("child", "Đêm qua em đếm đủ người, nhưng sáng nay trên mâm lại có thêm một chiếc bát. Không ai nhớ nó dành cho ai."), line("bach", "Dấu tro dưới đáy bát thuộc về Bếp Gốc. Nếu Sương Nhạt đang tìm một người bị quên, ta phải tìm ra trước nó.", "resolve")],
    turningPoint: [line("grandmother", "Giếng phản chiếu một gian bếp bị khóa. Ta đã thấy cánh cửa ấy trong đêm Bếp Gốc cháy, nhưng ta không còn nhớ ai đứng bên trong."), line("echo", "Các người gọi ta là sương, vì không ai muốn gọi cái tên đã bị gạch khỏi sổ bếp.")],
    finale: [line("bach", "Tiếng trống không gọi quái vật. Nó gọi chủ nhân chiếc bát trống trở về. Ta đã hiểu sai từ đầu."), line("grandmother", "Phá lời nguyền quanh trống, nhưng giữ lại nhịp cuối. Đó là manh mối duy nhất dẫn ra bến cảng.")],
    aftermath: [line("bach", "Trong lòng trống có mảnh bản đồ cháy dở và một cái tên: Vân. Người ấy đã lên con tàu Than Hồng."), line("grandmother", "Sương Nhạt không chỉ xóa ký ức. Nó đang gom những ký ức chúng ta tự tay vứt bỏ.")],
    consequences: [[line("bach", "Ta ghi tên từng người bên cạnh công thức. Cuốn sổ sẽ không còn món ăn nào vô chủ; bản sao đầu tiên được gửi ra bến cảng.")], [line("merchant", "Chiếc ghế trống được đặt giữa chợ. Mỗi tối một gia đình sẽ mang món của mình tới kể chuyện; thủy thủ cũng được mời ngồi cùng.")]],
  },
  harbor: {
    title: "Lá thư không được gửi",
    hook: "Con tàu Than Hồng trở về sau mười năm. Tên người gửi biến mất khỏi mọi kiện hàng, nhưng Nhiên nhận ra nét chữ trên một lá thư.",
    opening: [line("sailor", "Tàu vẫn chạy, chuông vẫn reo, chỉ có tên người nhận hàng biến mất. Cảng đang quên cùng một người."), line("nhien", "Vân từng nhóm lửa cho chuyến tàu này. Tôi có một lá thư của cô ấy, nhưng đã giữ nó suốt mười năm.", "concern")],
    turningPoint: [line("hai", "Mực hiện lại khi chạm nước biển: ‘Đừng tìm em nơi ngọn lửa đã tắt. Hãy tìm nơi người ta cất điều không muốn nhớ.’"), line("nhien", "Tôi giữ thư vì sợ người nhận sẽ ra khơi mãi mãi. Sự im lặng của tôi đã cho sương chỗ trú.")],
    finale: [line("sailor", "Khuyển Than canh hòm thư dưới lò máy. Hàng trăm lời từ biệt ở đó chưa từng được mở."), line("nhien", "Ta sẽ mở từng lá thư sau trận này. Sự thật có thể đau, nhưng không ai đáng bị xóa để người khác bớt đau.", "resolve")],
    aftermath: [line("hai", "Bản đồ trong hòm thư đánh dấu một khu vườn. Vân đã gửi hạt giống về đó trước đêm Bếp Gốc cháy."), line("nhien", "Tôi đã gửi lá thư đi. Lần này người nhận sẽ được tự chọn ở lại hay lên đường.")],
    consequences: [[line("nhien", "Lửa hải đăng được giữ suốt đêm. Tên người mất tích được đọc mỗi khi tàu cập bến; một người làm vườn đã nhận ra tên Vân.")], [line("sailor", "Mỗi căn bếp nhận một đốm lửa và một lá thư. Cả thành phố chia việc chờ đợi; người trông vườn cũng đã đọc được lời nhắn.")]],
  },
  garden: {
    title: "Hạt giống của Vân",
    hook: "Một cây chưa từng nở hoa ôm chiếc chìa khóa Bếp Gốc. Muốn nhận nó, Mộc phải nhớ lại lời hứa mình đã không giữ.",
    opening: [line("moc", "Hạt Vân gửi đã thành cây, nhưng mười năm không nở. Rễ của nó ôm chiếc chìa khóa này như đang che chở một người."), line("grandmother", "Cây chỉ nở khi lời hứa được nói đúng như ngày đầu. Ta cần tìm người đã hứa với cô ấy.")],
    turningPoint: [line("moc", "Tôi nhớ rồi. Vân không xin giữ nguyên công thức. Cô ấy xin chúng ta bảo vệ quyền được thay đổi nó."), line("echo", "Họ khóa bếp vì sợ món mới làm ký ức cũ biến mất. Rồi họ xóa luôn người dám mở cửa.")],
    finale: [line("moc", "Cổ thụ giữ chìa khóa vì nó tin ta cũng sẽ chôn sự thật. Tôi không hứa mọi người sẽ tha thứ; tôi hứa sẽ kể lại điều đã xảy ra."), line("grandmother", "Đừng chặt rễ. Hãy đánh tan lớp sương quanh chúng. Chìa khóa phải được cây tự trao.")],
    aftermath: [line("moc", "Hoa đầu tiên mang vị mặn của biển. Chiếc chìa khóa chỉ về một căn bếp chìm dưới Biển Ký Ức."), line("grandmother", "Ta bắt đầu nhớ mình đã đứng trong hội đồng khóa bếp. Phần lỗi của ta vẫn còn ở phía trước.")],
    consequences: [[line("moc", "Lời hứa được khắc lên bia cùng những lần chúng ta thất hứa. Bản dập theo đội xuống biển để sự thật không bị kể thiếu lần nữa.")], [line("child", "Hạt giống được chia khắp làng. Chúng em gửi một túi lên thuyền, để người ở ngoài biển cũng có một khu vườn chờ họ.")]],
  },
  tide: {
    title: "Cánh cửa dưới triều",
    hook: "Trong căn bếp chìm, Hải tìm thấy mật mã cha để lại. Bà phải đối diện quyết định năm xưa đã sinh ra Sương Nhạt.",
    opening: [line("hai", "Cha dẫn thuyền chở Vân rời Bếp Gốc. Ông trở về một mình và không bao giờ nấu lại món canh này."), line("grandmother", "Ta đã ra lệnh đóng cổng. Nếu muốn mở lại, ta phải nhớ trọn vẹn điều mình từng sợ.")],
    turningPoint: [line("fisherman", "Cha cậu tự nguyện ở lại canh cánh cửa để hội đồng không phá hủy nó. Món canh cuối là mật mã ông để cậu tìm đến đây."), line("hai", "Tôi cứ tưởng đó là lời từ biệt. Mười năm qua cha đã để ngỏ một lối đi, chỉ chờ tôi đủ can đảm mở.")],
    finale: [line("grandmother", "Ta sợ ký ức bị thay đổi nên biến nó thành nhà tù. Sương Nhạt sinh ra trong khoảnh khắc cửa khép lại."), line("hai", "Ta không đánh để giành chìa khóa. Ta đánh để Người Giữ Nước biết đã có người sẵn sàng thay ông gánh lời hứa.")],
    aftermath: [line("hai", "Cánh cửa mở ra cầu thang lên mây. Bốn ấn hương còn thiếu bị giấu ở những vùng thử thách bên kia biển."), line("echo", "Tìm đủ tám ấn đi. Rồi các người phải chọn: giữ Vân của ngày xưa, hay gặp con người cô ấy đã trở thành.")],
    consequences: [[line("hai", "Tôi nấu đúng món của cha, rồi ghi lý do ông đã đổi bước cuối. Hơi canh kết thành một dải mây dẫn lên miền trà.")], [line("fisherman", "Mỗi người viết một dòng vào công thức mới, không ai xóa dòng của người trước. Hơi bếp mở một con đường qua mây.")]],
  },
  mistwood: {
    title: "Chén trà cho người lạ",
    hook: "Ấm Vân Thiên giữ ấn thứ năm và ký ức Vân để lại sau khi rời bếp. Cái giá để nhận ấn là lắng nghe kẻ từng bị xem là địch.",
    opening: [line("moc", "Hơi trà viết lên mây: ‘Ký ức đứng yên sẽ hóa đắng.’ Đó là nét chữ của Vân."), line("echo", "Cô ấy lên núi để học cách giữ một mùi hương mà không nhốt nó. Các người đến muộn mười năm.")],
    turningPoint: [line("moc", "Trà Sư gọi sương là Người Giữ Phần Bị Bỏ. Nó đã che chở điều ta không dám nhận, rồi dần không biết cách buông tay."), line("grandmother", "Ta phải thừa nhận món nợ ấy. Nhưng ta cũng phải ngăn nó giữ cả thế giới lại chỉ vì sợ một lần mất mát nữa.")],
    finale: [line("moc", "Ấm chỉ trao ấn cho người rót chén đầu cho kẻ mình từng xem là địch. Tôi đặt chén này cho Sương Nhạt."), line("echo", "Hãy thắng đi. Ta muốn biết lòng tử tế ấy có còn sau khi sự thật trở nên bất tiện không.")],
    aftermath: [line("moc", "Trong ấn có lời Vân: ‘Đừng cứu tôi bằng cách xóa con người tôi đã chọn trở thành.’"), line("grandmother", "Ba ấn nữa. Mỗi ấn buộc ta nhìn Vân như một con người, thay vì một biểu tượng để chuộc lỗi.")],
    consequences: [[line("moc", "Mẻ trà đầu được giữ trên núi, nhưng cửa điện mở cho mọi người. Một chén được gửi tới thợ lò cùng lời mời ngồi xuống nói chuyện.")], [line("merchant", "Trà theo đoàn xe xuống núi, mỗi chén kèm một câu chuyện. Thợ lò đỏ nhận được chén đầu sau mười năm chỉ uống nước nguội.")]],
  },
  sugartower: {
    title: "Chữ ký trong tro",
    hook: "Muối đỏ giữ được chữ trên giấy cháy. Dưới lệnh khóa Bếp Gốc có chữ ký của Bách, và trong lõi lò là ấn hương thứ sáu.",
    opening: [line("nhien", "Muối giữ lại biên bản hội đồng. Có một chữ ký dưới lệnh đóng bếp: Bách."), line("bach", "Tôi tin đóng cửa một đêm sẽ cứu mọi người. Sáng sau tên Vân biến mất, còn tôi đã không đủ can đảm nhận lỗi.")],
    turningPoint: [line("nhien", "Cự Tượng được lệnh thiêu mọi bản sao công thức mới. Nó cứ lặp lệnh vì người ký chưa từng hủy."), line("bach", "Tôi sẽ tự hủy lệnh trước mọi người. Nếu lớp khiên danh dự của tôi vỡ, cứ để nó vỡ.")],
    finale: [line("bach", "Đừng phá lõi khi lớp muối nứt. Đó là nơi Cự Tượng giấu những cái tên nó đã lén cứu khỏi lửa."), line("nhien", "Ta kết thúc mệnh lệnh cũ mà không xóa người từng phục tùng nó. Đó là điều Vân muốn chúng ta hiểu.")],
    aftermath: [line("bach", "Ấn thứ sáu đã sáng. Tôi sẽ kể lại chữ ký của mình dù không ai tha thứ; sự thật không thể tùy vào việc tôi có được yêu quý nữa hay không."), line("grandmother", "Trong lõi có chiếc lông bạc. Cha của Hải đã gửi nó về từ Đầm Sen Nguyệt.")],
    consequences: [[line("nhien", "Nghi thức được giữ, thêm quyền cho mọi thợ dừng lò khi thấy nguy hiểm. Tấm lệnh đã hủy theo đội tới đầm như một lời làm chứng.")], [line("bach", "Thợ lò cùng viết quy tắc mới. Chữ ký tôi ở cuối trang, ngang hàng mọi người; bản sao được gửi đến người canh miếu trăng.")]],
  },
  ashalley: {
    title: "Con đường để tự trở về",
    hook: "Ấn thứ bảy hiện trên cầu trăng. Hải nhận lời nhắn cuối của cha: thắp một lối đi cho Vân, rồi để cô ấy tự quyết định có trở về.",
    opening: [line("hai", "Chiếc lông ghi: ‘Đừng kéo Vân về. Hãy thắp con đường để con bé tự chọn.’"), line("grandmother", "Ta đã tìm cách sửa quá khứ mười năm. Có lẽ Vân cần một tương lai không bị chúng ta quyết định hộ.")],
    turningPoint: [line("hai", "Nguyệt Hạc khóa cầu vì người làng từng dùng lời hứa để kéo người ra đi quay lại. Sự chờ đợi đã biến thành gông."), line("echo", "Các người muốn ta trở về để được tha thứ. Có ai từng hỏi ta muốn đi đâu chưa?")],
    finale: [line("hai", "Ta chỉ cần Nguyệt Hạc thôi khóa bầu trời. Cây cầu này phải mở cả hai hướng."), line("grandmother", "Nếu Vân không về, ta vẫn giữ đèn sáng. Một lời hẹn đúng không đòi người khác trả bằng cuộc đời họ.")],
    aftermath: [line("hai", "Ấn thứ bảy đập như tim khi hướng về Điện Vạn Hương. Vân ở đó, hoặc một phần của cô ấy."), line("echo", "Mang theo những lựa chọn đã viết. Cửa cuối sẽ cân chúng, không chỉ đếm chiến thắng.")],
    consequences: [[line("hai", "Miếu vẫn yên, nhưng người muốn rời đi luôn có thuyền chờ. Ngọn đèn trên thuyền được mang tới điện để soi chiếc ghế trống.")], [line("child", "Cầu trăng mở mỗi đêm. Đèn của làng được mang tới đại điện để mọi người nhìn rõ đường về lẫn đường đi.")]],
  },
  lasttable: {
    title: "Bữa ăn thứ chín",
    hook: "Tám ấn hội tụ trước ngai trống. Nhiếp Chính muốn dựng lại Vân bằng ký ức của mọi người, đổi lấy một thế giới không ai được phép nhớ khác đi.",
    opening: [line("bach", "Tám chỗ được dọn quanh bàn. Chỗ thứ chín không dành cho Vân ngày trước, mà cho người cô ấy muốn trở thành."), line("echo", "Nhiếp Chính hứa trả ký ức về đúng chỗ. Cái giá là từ nay không ai được phép nhớ khác nó.")],
    turningPoint: [line("grandmother", "Nhiếp Chính là nỗi sợ của hội đồng, muốn đóng đinh mọi câu chuyện để không bao giờ phải nhận lỗi nữa. Nó không phải Vân."), line("bach", "Sương Nhạt đã mang những ký ức bị bỏ chạy khỏi lửa. Ta từng săn đuổi chính chiếc thuyền cứu hộ, rồi để nó cô độc quá lâu.")],
    finale: [line("echo", "Phá ngai, ký ức sẽ về dưới nhiều phiên bản không hoàn hảo. Giữ ngai, các người có một sự thật duy nhất, đẹp và giả."), line("grandmother", "Ta chọn bữa ăn nơi mọi người được kể khác nhau. Phá lớp khiên cuối và để chỗ thứ chín tự quyết định.")],
    aftermath: [line("echo", "Tên ta là Vân. Nhưng ta cũng là Sương Nhạt, là mười năm lang thang, là ký ức vừa được trao lại. Ta chưa hứa sẽ về."), line("bach", "Chúng tôi để một chỗ trống, để bất cứ ai cũng biết họ có thể ngồi xuống khi sẵn sàng. Ngày mai, chúng tôi sẽ nấu tiếp.")],
    consequences: [[line("grandmother", "Kho hương chung có tám chìa khóa và một ghế trống. Không ai quyết định ký ức thay tất cả; Vân ghé qua vào một buổi chiều, như một vị khách.")], [line("echo", "Mỗi bếp nhận lại hương vị của mình. Sương tan dần, vẫn ở cạnh ký ức chưa có người nghe. Ta đi tiếp, biết có một mâm cơm luôn dành chỗ.")]],
  },
}
