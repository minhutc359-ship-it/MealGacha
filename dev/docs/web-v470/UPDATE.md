# Soul of Meal Web 4.7 · TCG: bốn đồng minh, bộ 24 lá

Trận mới có bốn ô đồng minh và một ô bẫy riêng. Người chơi và AI dùng bộ 24 lá, tối đa hai bản mỗi thẻ; tay vẫn tối đa tám lá, năng lượng tối đa bảy. Kiệt sức xảy ra mỗi lần rút hụt: 1 → 2 → 3, sau đó giữ ở ba sát thương. Hết bài không tự xử thua; vẫn có thể thắng bằng bàn và tay đang giữ.

## Cách dùng sau cập nhật

Vào **Bộ bài → Bổ sung đủ 24 lá → Lưu & trang bị**. Nút bổ sung giữ nguyên từng lá và thứ tự của bộ hiện tại, chỉ nối thêm bản hợp lệ từ bộ sưu tập. Người chơi cũ có thể nhận miễn phí ba thẻ khởi đầu bổ sung × 2: Trinh sát than hồng, Cô hái lá thuốc và Màn đường tinh thể. Gói đưa mỗi thẻ lên ít nhất hai bản, không cấp bản thứ ba hoặc chuyển thành tiền/bụi; nhận một lần. Nút bổ sung cũng nhận gói nếu chưa nhận, nhưng chỉ sửa bản nháp đến khi người chơi lưu. Nếu bộ sưu tập chưa đủ số bản hợp lệ, bản nháp vẫn báo thiếu và có thể thêm thẻ thủ công. Tài khoản mới có sẵn bộ 24 lá.

Bộ cũ không tự bị viết lại. Trận và hành trình đã lưu với luật 350/400/450 vẫn có ba ô, bộ 18 lá và kiệt sức tăng không giới hạn; các trận tiếp theo trong cùng hành trình cũng giữ đúng phiên bản đó. Luật 470 áp dụng cho trận/hành trình mới, luyện tập, bộ thử thách tuần và phần giới thiệu dùng engine thật. Không đổi key/schema version gốc, không reset tiến trình, tiền, XP, bụi, vé, lịch sử, Auto chess hoặc Adventure. Trận/run được kiểm tra giới hạn theo phiên bản; từ chối trạng thái trộn luật giữa trận thám hiểm và hành trình.

## Giao diện và luật liên quan

Thanh tài nguyên luôn hiện số lá còn lại của cả hai bên, kể cả màn hình thấp/ngang. Khi còn tối đa ba lá, đổi màu/cảnh báo; khi trống, hiện sát thương của lần rút hụt kế tiếp. Chọn lá bài có khả năng rút hụt sẽ thấy số lần hụt, tổng sát thương và cảnh báo nếu có thể thua. Dự báo mô phỏng hành động công khai, gồm rút từ nội tại, combo hoặc hiệu ứng phụ; không đọc danh tính bẫy úp địch. Bẫy phản phép có thể thay đổi kết quả thật. Không thêm một cửa sổ xác nhận riêng cho mỗi lần ra bài.

Hồi sinh bằng phép và bẫy gọi lại đồng minh dùng ô thứ tư. Dạ tiệc ánh trăng rút bài khi lấp đầy sân theo luật của trận: ba quân ở luật cũ, bốn quân ở luật mới; mô tả chuyển thành “Nếu lấp đầy sân”. Hộ vệ, tương khắc, cộng hưởng, công thức, phản đòn, trần năng lượng và hai bản mỗi thẻ giữ nguyên. Bẫy vẫn báo rằng ô đã có bài nhưng giấu danh tính khi úp; AI chọn nước đi theo thông tin công khai.

Bộ gợi ý có 24 lá, ưu tiên 14 đồng minh; bộ bẫy là 14 đồng minh/6 phép/4 bẫy. AI dùng 24 lá cho mọi màn và luyện đấu, có đường cong và bẫy theo vùng. Kiểm tra 270 bộ địch (27 màn × 10 seed) đảm bảo tối đa hai bản; phần thêm thẻ thưởng boss không tạo bản thứ ba. Phép diện rộng giữ chỉ số và chi phí, có thêm giá trị từ ô thứ tư; không tăng đồng loạt máu chủ tướng để kéo dài trận. Đây là thay đổi về sức mạnh tương đối: mô phỏng chứng minh trận có thể hoàn thành, không thay thế theo dõi tỷ lệ thắng từ người chơi thật.

## Kiểm chứng

- **450 kiểm thử / 43 file** đạt, thêm 20 trường hợp về giới hạn theo luật, đối xứng kiệt sức, bộ 24 lá, quà và bản nháp giữ lựa chọn cũ, hồi sinh, full-board, AI quân thứ tư, phản ứng bẫy trước quân thứ tư qua save/reload, dự báo kín và 60 trận hoàn chỉnh với coach/phản ứng thật. Các kiểm tra hồi quy luật cũ vẫn dùng bộ 18 lá rõ ràng. Bộ trưởng thành trong mô phỏng chiến dịch/thám hiểm được bổ sung thành 24 lá hợp lệ; không hạ ngưỡng thắng hoặc giảm số seed. Sau sửa hướng dẫn/CSS, 16 kiểm tra phần giới thiệu liên quan chạy lại đạt.
- Typecheck app/dev, catalog 123 món, 146 asset refs/0 thiếu, release registry 350 asset, release verify, build sạch, guard dung lượng và cú pháp service worker đạt.
- [Browser QA](browser-qa.json), [script](../../tools/verify-web470.mjs): Chromium 1440×900, 390×844, 844×390, 320×568. Bộ cũ → nhận/bổ sung/lưu/tải lại; giữ nguyên 18 lá ban đầu và tiền/XP; triệu hồi quân thứ tư qua tải lại; giữ bẫy ba đòn đầu, tải lại trước đòn thứ tư, kích hoạt một lần; cảnh báo rút hụt và sát thương thật; hiển thị mức kiệt sức trần; tải lại luật 450 vẫn ba ô; các vùng/nút trong viewport, không cuộn trang, không JS error hoặc asset thiếu trong mẫu. Dùng reduced motion để kiểm tra thao tác và trạng thái; không đo FPS, chưa kiểm tra Safari hoặc thiết bị thật.

Luồng kiểm chứng: UI → reducer TCG → protected localStorage → tải lại → UI. Không thêm API hoặc backend. Chỉ web, không sync/build Android/iOS.

## Dung lượng

Build cuối **74.274.916 byte**, tăng **9.026 byte** so với 4.6 (74.265.890). 449 file; JS gzip **624.783 / 650.000 byte**, CSS gzip **95.835 byte**, không leak dev/archive/source map. Không thêm media sản phẩm hoặc thư viện. Giữ trần **79.956.770 byte** từ ngân sách 10 MB trên 4.4.1, còn **5.681.854 byte**. Guard 4.7 dùng cùng trần; công cụ size nhận tùy chọn thư mục build để đo bản sạch độc lập khi thư mục dist local còn hash cũ. CI tiếp tục đo dist mặc định từ checkout sạch.

Nhánh riêng dựa trên [PR #36](https://github.com/minhutc359-ship-it/MealGacha/pull/36), kế thừa [PR #35](https://github.com/minhutc359-ship-it/MealGacha/pull/35). Không tự merge.

Ảnh chụp QA cho đội hình, cảnh báo và bàn ngang có thể tái tạo từ harness nên không được lưu trong cây mã nguồn.
