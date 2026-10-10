export type PolicyId = "terms" | "privacy" | "rights"
export const POLICY_DATE = "10/10/2026"
export const POLICY_VERSION = "2026-10-10"
export const SUPPORT_URL = "https://github.com/minhutc359-ship-it/MealGacha/issues"
export interface Policy { title: string; intro: string; sections: { title: string; paragraphs: string[] }[] }

// Shared with generated JavaScript-free public/legal pages. Describe shipped behavior.
export const POLICIES: Record<PolicyId, Policy> = {
  "terms": {
    "title": "Điều khoản sử dụng",
    "intro": "Áp dụng cho bản web Soul of Meal 4.0, gồm TCG, Chợ Đêm Auto chess và Rương vị giác, khi chính sách này được công bố cùng trò chơi. Đọc điều khoản và chính sách quyền riêng tư trước khi sử dụng. Đồng ý điều khoản không thay thế sự đồng ý riêng cho vị trí hoặc xử lý dữ liệu mới; quyền bắt buộc theo pháp luật luôn được giữ.",
    "sections": [
      {
        "title": "1. Sản phẩm và liên hệ",
        "paragraphs": [
          "Soul of Meal là sản phẩm của dự án tại https://github.com/minhutc359-ship-it/MealGacha. Nhóm duy trì tiếp nhận hỗ trợ qua https://github.com/minhutc359-ship-it/MealGacha/issues. Tên tài khoản GitHub không xác nhận tên pháp lý của một cá nhân hoặc doanh nghiệp. Tên pháp lý, địa chỉ và kênh liên hệ riêng của chủ thể phát hành cần được xác nhận trước bản thương mại/cửa hàng.",
          "Bản web hiện tại chơi miễn phí, không có tài khoản máy chủ, chat công khai, quảng cáo hoặc thanh toán trong app. Bản Android và chức năng trả phí chưa được cung cấp theo điều khoản này; nếu phát hành cần công bố thông tin và điều kiện của bản tương ứng."
        ]
      },
      {
        "title": "2. Người chưa thành niên",
        "paragraphs": [
          "Bạn chỉ sử dụng trò chơi khi có năng lực đồng ý theo pháp luật áp dụng hoặc có sự cho phép của cha mẹ/người giám hộ khi cần. Người giám hộ nên hướng dẫn thời gian chơi, việc nhập ảnh, lấy vị trí, xuất dữ liệu và mở liên kết ngoài. Trò chơi không tự xác minh tuổi; điều này không thay yêu cầu độ tuổi hoặc phân loại nội dung tại nơi phát hành."
        ]
      },
      {
        "title": "3. Quyền chơi và nội dung",
        "paragraphs": [
          "Soul of Meal cấp cho bạn quyền cá nhân, không độc quyền để chơi phiên bản được cung cấp hợp pháp. Trừ khi có giấy phép riêng, quyền chơi không bao gồm quyền sao chép để bán, phát hành lại, phân phối mã nguồn, nhạc hoặc hình ảnh của trò chơi.",
          "Trò chơi lấy cảm hứng từ ẩm thực, đời sống và văn hóa Việt Nam. Nhân vật, Vị Linh, hội thoại và các sự kiện kỳ ảo là hư cấu; không đại diện cho một cá nhân, doanh nghiệp hay tín ngưỡng cụ thể."
        ]
      },
      {
        "title": "4. Tiến trình và vật phẩm ảo",
        "paragraphs": [
          "Bản hiện tại chạy trên thiết bị, không có tài khoản, giao dịch giữa người chơi hoặc thanh toán trong ứng dụng. Xu, vàng, chìa khóa, thẻ và điểm số là tài nguyên giải trí, không phải tiền, tài sản đầu tư hay quyền nhận tiền thưởng và không đổi thành tiền mặt.",
          "Tiến trình được lưu cục bộ. Xóa dữ liệu trình duyệt, đổi thiết bị hoặc gỡ ứng dụng có thể làm mất tiến trình. Bạn nên xuất bản lưu trước khi chuyển thiết bị; người giữ nguyên mã tiến trình có thể nhập và sử dụng dữ liệu đó. Cập nhật cân bằng có thể thay đổi chỉ số và cách chơi, nhưng không làm mất các quyền bắt buộc theo pháp luật.",
          "Nếu bổ sung giao dịch trả phí, ứng dụng phải công bố giá, xác suất phần thưởng ngẫu nhiên nếu có, chính sách hoàn tiền và điều khoản thanh toán tương ứng trước khi giao dịch được thực hiện.",
          "Rương, gói thẻ và một số lựa chọn có kết quả ngẫu nhiên theo quy tắc của từng chế độ. Chơi nhiều không bảo đảm nhận đúng món/thẻ mong muốn, trừ cơ chế bảo đảm được mô tả cụ thể trong trò chơi. Không có phần thưởng tiền hoặc hiện vật bên ngoài; trò chơi không hỗ trợ mua bán tài nguyên ảo giữa người chơi.",
          "Bản hiện tại không thu tiền nên không có giao dịch trong app để hoàn tiền. Không gửi tiền cho người tự nhận bán vật phẩm hoặc khôi phục tài khoản Soul of Meal.",
          "Bản lưu gắn với trình duyệt và địa chỉ trang. Dùng chế độ riêng tư, trình duyệt thu hồi dung lượng, đổi địa chỉ hoặc đổi thiết bị có thể tách/mất dữ liệu. Không có cloud save để khôi phục bản chưa xuất. Nhập bản lưu có thể thay hồ sơ hiện tại theo bước xác nhận; chỉ nhập từ nguồn tin tưởng và giữ bản trước nếu cần. Mục tiêu cập nhật là giữ bộ sưu tập và tiến trình hợp lệ; không hứa mọi binary cũ đều đọc được save mới."
        ]
      },
      {
        "title": "5. Nội dung do bạn đưa vào",
        "paragraphs": [
          "Bạn giữ quyền đối với ảnh, thông tin hoặc danh mục tự nhập mà bạn có quyền sử dụng. Chỉ đưa vào nội dung hợp pháp, có sự đồng ý cần thiết và không xâm phạm quyền của người khác. Không đăng mã tiến trình hoặc ảnh riêng tư lên nơi công cộng nếu bạn không muốn người khác tiếp cận.",
          "Ứng dụng chỉ xử lý nội dung này để cung cấp chức năng trên thiết bị; việc bạn chủ động xuất hoặc chia sẻ không trao quyền sở hữu nội dung đó cho Soul of Meal.",
          "Timeline hiện là sổ trên thiết bị, không tự xuất bản ra mạng xã hội. Khi chủ động chia sẻ postcard, ảnh hoặc bản lưu, bạn quyết định người nhận; điều kiện của dịch vụ nhận vẫn áp dụng."
        ]
      },
      {
        "title": "6. Tìm quán và dịch vụ bên ngoài",
        "paragraphs": [
          "Kết quả tìm quán dựa trên dữ liệu bên ngoài, có thể thiếu hoặc sai giờ mở cửa, giá, địa chỉ và thông tin liên hệ. Hãy kiểm tra trực tiếp với quán trước khi đi hoặc đặt dịch vụ. Soul of Meal không thu tiền đặt bàn hay đại diện cho các quán.",
          "Khi mở bản đồ, đường dẫn hỗ trợ hoặc dữ liệu từ địa chỉ bạn tự cấu hình, bạn sử dụng dịch vụ của bên đó theo điều khoản và chính sách riêng của họ.",
          "Hình và gợi ý món không phải tư vấn dinh dưỡng, y tế hoặc bảo đảm an toàn thực phẩm. Nếu có dị ứng hoặc chế độ ăn đặc biệt, kiểm tra nguyên liệu trực tiếp với nơi chế biến trước khi dùng món thật. Nhãn liên quan đến món không xác nhận quán chắc chắn phục vụ món đó."
        ]
      },
      {
        "title": "7. Sử dụng hợp lý",
        "paragraphs": [
          "Không dùng ứng dụng để phát tán nội dung trái pháp luật, giả mạo người phát hành, khai thác lỗ hổng gây hại cho người khác hoặc phân phối tài nguyên mà bạn không có quyền. Những giới hạn này không hạn chế các quyền được pháp luật cho phép, kể cả quyền nghiên cứu tương thích khi áp dụng."
        ]
      },
      {
        "title": "8. Hỗ trợ, thay đổi và quyền người tiêu dùng",
        "paragraphs": [
          "Ứng dụng được cung cấp theo chức năng được mô tả; không cam kết hoạt động không gián đoạn hoặc dữ liệu bên ngoài luôn chính xác. Nhà phát hành có thể sửa lỗi, thay đổi nội dung và cân bằng, kèm ngày cập nhật điều khoản. Thay đổi quan trọng đối với dữ liệu hoặc thanh toán phải được thông báo trước khi áp dụng khi pháp luật yêu cầu.",
          "Không điều khoản nào loại bỏ quyền bảo vệ dữ liệu, bảo hành, hoàn tiền hoặc trách nhiệm bắt buộc theo pháp luật áp dụng. Yêu cầu hỗ trợ hoặc khiếu nại được tiếp nhận qua đường dẫn liên hệ ở cuối trang. Việc chuyển nhượng hoặc bán ứng dụng cần một thỏa thuận riêng và không làm mất các quyền này."
        ]
      },
      {
        "title": "9. Dừng sử dụng và thay đổi điều khoản",
        "paragraphs": [
          "Bạn có thể dừng chơi bất cứ lúc nào, xuất và xóa dữ liệu theo chính sách quyền riêng tư. Dừng chơi không tự xóa file đã xuất hoặc dữ liệu đã gửi cho dịch vụ ngoài. Nếu ngừng cung cấp web hoặc đổi địa chỉ, thông báo và cơ hội xuất tiến trình sẽ được cung cấp khi khả thi và theo yêu cầu pháp luật.",
          "Mã và ngày cập nhật chính sách hiển thị ở đầu trang. Thay đổi quan trọng về dữ liệu, quyền sử dụng hoặc thanh toán phải được thông báo phù hợp trước khi áp dụng; lấy sự đồng ý riêng khi luật yêu cầu. Điều khoản mới không tự áp dụng hồi tố để tước quyền đã phát sinh."
        ]
      },
      {
        "title": "10. Khiếu nại, báo lỗi và trách nhiệm",
        "paragraphs": [
          "Khi báo lỗi hoặc khiếu nại, nêu tình huống, phiên bản và ảnh đã che thông tin riêng nếu cần. Issue GitHub là công khai: không đăng mã MGC1, ZIP có ảnh, giấy tờ tùy thân, khóa truy cập hoặc dữ liệu người khác. Nếu báo lỗ hổng hoặc cần gửi thông tin riêng, yêu cầu kênh tiếp nhận riêng trước; không công khai dữ liệu bị ảnh hưởng.",
          "Không điều khoản nào miễn trách nhiệm cho hành vi mà pháp luật không cho phép miễn. Trách nhiệm được xác định theo sự việc và pháp luật áp dụng, không theo một giới hạn mặc định bằng không. Bạn giữ quyền khiếu nại đến cơ quan bảo vệ người tiêu dùng hoặc tòa án có thẩm quyền; điều khoản không ép trọng tài riêng. Nếu một phần không có hiệu lực, phần còn lại áp dụng trong phạm vi hợp pháp."
        ]
      }
    ]
  },
  "privacy": {
    "title": "Chính sách quyền riêng tư",
    "intro": "Chính sách này mô tả bản web Soul of Meal 4.0. Trò chơi không yêu cầu tài khoản máy chủ; tiến trình và ảnh tự nhập lưu trên thiết bị. Tìm quán, hosting, phông chữ và các liên kết ngoài có thể gửi dữ liệu ra khỏi thiết bị như mô tả dưới đây.",
    "sections": [
      {
        "title": "1. Phạm vi và người tiếp nhận yêu cầu",
        "paragraphs": [
          "Ứng dụng thuộc dự án Soul of Meal tại https://github.com/minhutc359-ship-it/MealGacha. Nhóm duy trì tiếp nhận yêu cầu qua https://github.com/minhutc359-ship-it/MealGacha/issues. Đây là kênh công khai: chỉ nêu loại yêu cầu, không đăng dữ liệu nhạy cảm. Tên pháp lý, địa chỉ và kênh riêng của chủ thể phát hành cần được xác nhận trước bản thương mại/cửa hàng; không suy ra chúng từ tên tài khoản GitHub.",
          "Chính sách áp dụng cho chức năng hiện có, không mô tả một app Android đã phát hành, quảng cáo, cloud save hoặc thanh toán chưa tồn tại. Nếu bổ sung chúng phải kiểm kê dịch vụ và cập nhật thông báo trước khi xử lý dữ liệu mới."
        ]
      },
      {
        "title": "2. Dữ liệu trên thiết bị",
        "paragraphs": [
          "Trình duyệt dùng localStorage để lưu tên hiển thị, bộ sưu tập, bộ bài, tài nguyên ảo, chiến dịch, lựa chọn cốt truyện, thám hiểm, trận/kỷ lục Auto chess, lịch sử nhận thưởng, check-in, khẩu vị, món yêu thích, câu trả lời quiz, ghi chú Timeline và tùy chọn âm thanh/chuyển động. Ảnh check-in lưu trong IndexedDB. Dữ liệu dùng để tiếp tục chơi, xem lịch sử và cá nhân hóa lựa chọn món trên thiết bị; Timeline không tự đăng công khai.",
          "Nhà phát hành không tự động tải tiến trình hoặc ảnh lên tài khoản máy chủ. Bản ZIP, JSON hoặc mã MGC1 chỉ được tạo và chuyển khi bạn chủ động xuất, sao chép hoặc chia sẻ. Mã MGC1 chứa cả khóa giải mã, vì vậy đây là mã chuyển tiến trình, không phải mật khẩu riêng hay một bản lưu mà người có mã không thể đọc.",
          "Ảnh bạn chọn được thu nhỏ/nén thành WebP và thumbnail, lưu cùng mã ảnh, kích thước và thời điểm tạo. Ứng dụng không tự đọc toàn bộ thư viện ảnh, không bật camera hoặc tự tải ảnh lên máy chủ. Có thể check-in không ảnh. JSON và mã tiến trình không kèm toàn bộ ảnh check-in; ZIP đầy đủ có thể chứa ảnh. Clipboard chỉ dùng khi bạn chủ động sao chép/dán ở chức năng tương ứng."
        ]
      },
      {
        "title": "3. Vị trí và tìm quán",
        "paragraphs": [
          "Ứng dụng chỉ xin quyền vị trí khi bạn chọn lấy vị trí hiện tại. Có thể từ chối hoặc thu hồi quyền trong trình duyệt, nhập khu vực bằng chữ/chọn thành phố. Từ khóa khu vực gửi đến Photon (photon.komoot.io). Tìm quán gửi tọa độ tâm/bán kính đến Overpass (overpass.private.coffee); Photon có thể nhận thêm tọa độ và từ khóa món để bổ sung kết quả. Tọa độ truyền đi có thể chính xác dù chức năng không yêu cầu GPS độ chính xác cao. Nhà cung cấp cũng có thể nhận IP và thông tin yêu cầu mạng.",
          "Ứng dụng không theo dõi vị trí nền và không ghi tọa độ GPS vào tiến trình. Cache truy vấn nằm trong bộ nhớ phiên, có hạn sử dụng 10 phút; quá hạn nghĩa là không dùng lại kết quả cũ, không bảo đảm mọi bản sao được xóa khỏi RAM đúng giây đó. Rời/tải lại trang giải phóng bộ nhớ phiên, không xóa nhật ký ở nhà cung cấp. Bản hiện tại không có Google Places SDK hoặc provider thay thế được bật.",
          "Khi mở bản đồ nhỏ của một quán, iframe OpenStreetMap nhận vùng bản đồ và tọa độ quán. Mở Google Maps tìm kiếm có thể gửi tên món, khu vực hoặc tọa độ tâm đã chọn trong URL; chỉ đường gửi tọa độ điểm đến. Dịch vụ bản đồ có thể xử lý IP, thông tin trình duyệt, cookie hoặc vị trí riêng theo chính sách và quyền của họ."
        ]
      },
      {
        "title": "4. Lưu lượng web và liên kết",
        "paragraphs": [
          "Vercel phân phối trang, hình và nhạc nên có thể xử lý địa chỉ IP, thông tin yêu cầu và nhật ký kỹ thuật theo chính sách của dịch vụ lưu trữ. Kiểu chữ Be Vietnam Pro và Exo 2 được đóng gói cùng game theo OFL; việc hiển thị chữ không gửi yêu cầu đến Google Fonts. Bản hiện tại không cài SDK quảng cáo hoặc công cụ phân tích hành vi của nhà phát hành.",
          "Nếu bạn cấu hình danh mục CSV hoặc URL bên ngoài, trình duyệt kết nối đến địa chỉ đó và dịch vụ tương ứng có thể nhận thông tin yêu cầu. Khi bạn gửi phản hồi công khai qua GitHub, thông tin bạn đăng chịu chính sách của GitHub và có thể được người khác xem.",
          "Source hiện tại không cài Vercel Analytics/Speed Insights hoặc cookie quảng cáo của ứng dụng. localStorage/IndexedDB phục vụ lưu trò chơi. Dịch vụ ngoài/hosting vẫn có cách xử lý log/cookie riêng; không đồng nghĩa mọi lưu lượng web đều không có dữ liệu cá nhân. Các dịch vụ có thể vận hành hạ tầng ngoài Việt Nam; không cam kết dữ liệu mạng chỉ được xử lý trong một quốc gia."
        ]
      },
      {
        "title": "5. Kiểm soát, xóa và thời gian lưu",
        "paragraphs": [
          "Bạn có thể xuất dữ liệu trước khi xóa. Trong Cài đặt → Dung lượng & quyền riêng tư, “Xóa tất cả ảnh đã lưu” xóa kho ảnh, giữ ghi chú và tiến trình. Trong Cài đặt → Vùng nguy hiểm, “Xóa toàn bộ dữ liệu” yêu cầu xác nhận, xóa hồ sơ/tiến trình cả ba chế độ, cấu hình cục bộ và ảnh; sau tải lại có thể tạo hồ sơ rỗng. Nếu thao tác trong app lỗi hoặc muốn xóa cả kho trình duyệt, dùng mục dữ liệu website của trình duyệt cho đúng địa chỉ trang.",
          "Dữ liệu trên thiết bị tồn tại đến khi bị bạn xóa, trình duyệt thu hồi hoặc ứng dụng bị gỡ. Nhà phát hành không kiểm soát thời gian lưu nhật ký của các dịch vụ bên ngoài. Bạn có thể thu hồi quyền vị trí trong cài đặt trình duyệt; việc này không ngăn các chế độ chiến đấu hoạt động.",
          "Xóa dữ liệu trang không xóa file ở Downloads, bản sao đã chia sẻ, clipboard hoặc OS backup; bạn cần xóa chúng tại nơi đang lưu. Nhà phát hành không đặt một thời hạn cụ thể cho log của Vercel, Photon, Overpass, Google, OSM hoặc GitHub khi chưa được xác nhận với họ. Log/issue chịu thời gian lưu và cơ chế xóa của nhà cung cấp; bản sao có thể còn trong lịch sử/cache nền tảng."
        ]
      },
      {
        "title": "6. Trẻ em, bảo mật và thay đổi",
        "paragraphs": [
          "Bản hiện tại không yêu cầu tuổi, thông tin định danh hoặc hồ sơ trẻ em và không có trò chuyện công khai. Người giám hộ nên hướng dẫn việc sử dụng vị trí, ảnh và liên kết ngoài. Bản phát hành có quảng cáo, tài khoản hoặc thanh toán phải được cập nhật chính sách và đánh giá yêu cầu theo độ tuổi trước khi mở chức năng đó.",
          "MGC1 có mã hóa và kiểm tra toàn vẹn nhưng khóa giải mã nằm trong chính mã đầy đủ; ai có mã có thể đọc nội dung. JSON/ZIP không được bảo vệ bằng mật khẩu riêng của bạn. HTTPS và giới hạn truy cập của trình duyệt hỗ trợ bảo vệ dữ liệu, nhưng người truy cập thiết bị, extension hoặc bản xuất vẫn có thể đọc chúng. Không có hệ thống bảo đảm an toàn tuyệt đối. Không đặt dữ liệu nhạy cảm trong tên/ghi chú; báo sự cố mà không công khai dữ liệu bị ảnh hưởng."
        ]
      },
      {
        "title": "7. Mục đích và lựa chọn xử lý dữ liệu",
        "paragraphs": [
          "Dữ liệu cục bộ phục vụ chức năng bạn dùng; vị trí/truy vấn phục vụ tìm quán theo lựa chọn; dữ liệu kỹ thuật phục vụ phân phối file và bảo vệ dịch vụ; thông tin gửi hỗ trợ phục vụ xử lý yêu cầu. Quyền/sự đồng ý cần thiết được lấy theo chức năng và pháp luật áp dụng; chính sách không thay hộp xin quyền vị trí.",
          "Nhà phát hành không bán tiến trình, ảnh hoặc khẩu vị, không dùng chúng để tạo hồ sơ quảng cáo trong bản hiện tại. Bên nhận dữ liệu mạng là nhà cung cấp nêu trên hoặc người/dịch vụ bạn chọn khi chia sẻ. Thông tin cung cấp cho cơ quan có thẩm quyền phải có căn cứ pháp luật áp dụng."
        ]
      },
      {
        "title": "8. Quyền dữ liệu và yêu cầu hỗ trợ",
        "paragraphs": [
          "Theo pháp luật áp dụng, bạn có thể có quyền được thông tin, truy cập, sửa, nhận bản sao, xóa, rút sự đồng ý, hạn chế/phản đối xử lý và khiếu nại. Thực hiện phần cục bộ bằng sửa hồ sơ, xuất bản lưu, xóa ảnh/dữ liệu và thu hồi quyền trình duyệt. Không có tài khoản máy chủ để nhà phát hành tra cứu/xóa từ xa trên thiết bị của bạn.",
          "Nếu cần hỗ trợ quyền dữ liệu, chỉ nêu loại yêu cầu qua kênh cuối trang rồi yêu cầu cách trao đổi riêng trước khi gửi dữ liệu cá nhân. Nhóm duy trì chỉ có thể xử lý dữ liệu mình thực sự nắm giữ, xác minh ở mức cần thiết và phản hồi theo thời hạn luật áp dụng; không yêu cầu đăng giấy tờ/bản lưu công khai. Dữ liệu do dịch vụ ngoài kiểm soát cần yêu cầu qua cơ chế của họ; bạn vẫn có quyền đến cơ quan có thẩm quyền."
        ]
      },
      {
        "title": "9. Chính sách của nhà cung cấp",
        "paragraphs": [
          "Vercel: https://vercel.com/legal/privacy-policy. Google Maps: https://policies.google.com/privacy. OpenStreetMap: https://osmfoundation.org/wiki/Privacy_Policy. GitHub: https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement. Photon và Overpass truy cập tại các địa chỉ nêu trong mục tìm quán. Nhà phát hành chưa xác nhận một thời hạn lưu log thống nhất cho các dịch vụ này."
        ]
      },
      {
        "title": "10. Cập nhật chính sách",
        "paragraphs": [
          "Mã và ngày cập nhật chính sách hiển thị ở đầu trang. Khi thêm tài khoản, cloud save, native backup, SDK, quảng cáo, thanh toán hoặc thay nguồn tìm quán/font phải cập nhật đúng bản thực tế; thông báo thay đổi quan trọng và lấy sự đồng ý riêng khi luật yêu cầu. Không dùng việc tiếp tục chơi như sự đồng ý mặc định cho theo dõi mới."
        ]
      }
    ]
  },
  "rights": {
    "title": "Quyền sử dụng & ghi công",
    "intro": "Soul of Meal sử dụng nội dung của dự án và các thư viện theo giấy phép tương ứng. Không tuyên bố mọi tài nguyên là “không có bản quyền”, CC0 hay thuộc phạm vi công cộng.",
    "sections": [
      {
        "title": "1. Nội dung của Soul of Meal",
        "paragraphs": [
          "Quyền đối với mã, cốt truyện, thiết kế, hình và nhạc do dự án tạo được bảo lưu cho chủ thể có quyền, trong phạm vi pháp luật cho phép. Một số hình được tạo với sự hỗ trợ của AI; việc đó không bảo đảm tính độc quyền, khả năng đăng ký bản quyền ở mọi quốc gia hoặc việc không trùng với nội dung của bên khác.",
          "Các tên món, dữ kiện văn hóa và truyền thống Việt Nam không bị tuyên bố là tài sản độc quyền của ứng dụng. Nhãn hiệu bên thứ ba nếu được nhắc đến chỉ nhằm mô tả; không hàm ý tài trợ hoặc hợp tác."
        ]
      },
      {
        "title": "2. Thư viện và dữ liệu địa điểm",
        "paragraphs": [
          "React, React Router, Zustand, Zod, Papa Parse, PixiJS và các phụ thuộc được sử dụng theo giấy phép riêng. GSAP sử dụng Standard License của GSAP/Webflow, không phải MIT. Các thông báo và điều kiện bắt buộc được giữ trong hồ sơ giấy phép của bản phát hành.",
          "Dữ liệu địa điểm © OpenStreetMap contributors, được cung cấp theo Open Database License (ODbL). Việc sử dụng và phân phối dữ liệu này phải tuân thủ ghi công và nghĩa vụ của ODbL khi áp dụng. Font Be Vietnam Pro và Exo 2 dùng giấy phép SIL OFL 1.1; bản font phân phối cùng game đã được nén và giữ chữ Latin/Vietnamese. Các dịch vụ liên kết có điều khoản riêng."
        ]
      },
      {
        "title": "3. Phông chữ và phạm vi giấy phép",
        "paragraphs": [
          "Be Vietnam Pro và Exo 2 dùng SIL Open Font License; thông báo được giữ trong THIRD_PARTY_LICENSES.txt. Giấy phép thư viện/phông chữ không tự cấp quyền lấy tranh, nhạc hoặc cốt truyện của Soul of Meal. Giấy phép dữ liệu địa điểm không biến toàn bộ code/art của trò chơi thành ODbL."
        ]
      },
      {
        "title": "4. Phát hành hoặc mua bán ứng dụng",
        "paragraphs": [
          "Quyền chơi không phải quyền mua mã nguồn hoặc quyền kinh doanh lại ứng dụng. Bên bán cần chuyển giao các quyền mà mình thực sự sở hữu bằng thỏa thuận bằng văn bản, cung cấp hồ sơ tài nguyên và giữ nghĩa vụ giấy phép bên thứ ba. Tên miền, tài khoản cửa hàng, dịch vụ lưu trữ và thương hiệu cần được xử lý riêng trong giao dịch.",
          "Hồ sơ tài nguyên trong dự án ghi nguồn, dấu vân tay tệp và bằng chứng hiện có để hỗ trợ rà soát. Các tệp cũ đã xác định thiếu bằng chứng giấy phép được chuyển ra ngoài tài nguyên phát hành. Chủ sở hữu vẫn cần hoàn thiện bằng chứng còn thiếu và rà soát quyền của những tài nguyên còn lại trước khi bán hoặc phát hành thương mại. Hồ sơ này không thay thế việc xác minh quyền của tác giả, nhà cung cấp hoặc tư vấn pháp lý trước một giao dịch thương mại."
        ]
      },
      {
        "title": "5. Báo cáo quyền sở hữu",
        "paragraphs": [
          "Nếu bạn cho rằng nội dung xâm phạm quyền của mình, hãy gửi đường dẫn hoặc tên tài nguyên, mô tả quyền liên quan, bằng chứng và cách liên hệ qua kênh hỗ trợ. Tránh đăng thông tin cá nhân nhạy cảm ở phản hồi công khai. Nhà phát hành sẽ xem xét, yêu cầu thông tin cần thiết và sửa hoặc gỡ nội dung khi phù hợp.",
          "Nếu bằng chứng có dữ liệu riêng, chỉ yêu cầu kênh trao đổi riêng trước; không đăng giấy tờ, địa chỉ cá nhân hoặc file mật lên GitHub. Báo cáo không tự chứng minh quyền sở hữu và không hạn chế quyền yêu cầu cơ quan có thẩm quyền xử lý."
        ]
      }
    ]
  }
}
