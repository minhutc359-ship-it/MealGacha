# Soul of Meal 3.3.1 — Phiên chợ thức tỉnh

TCG giữ lá bị hạ ở đúng vị trí trong lúc hoạt ảnh diễn ra, sau đó mới thu gọn hàng. Các thông số của quân sống dùng snapshot sau đòn đánh; ghost dùng snapshot trước. Tên và công/máu nằm trong hai dải riêng, không xuống dòng đè lên nhau.

## PC, ghép sao và hình ảnh

| Phím | Thao tác |
|---|---|
| W | Quân dưới con trỏ: dự bị → ô trống phù hợp tầm đánh; bàn → ghế trống. Bàn/dự bị đầy sẽ báo lỗi, không tự đổi quân. |
| E | Bán quân dưới con trỏ; nhận vàng theo toàn bộ số bản sao, trả di vật và bản vào pool. |
| F | 4 vàng mua 4 XP. Cấp 7 là tối đa. |
| D | Làm mới 5 ô shop: 2 vàng, hoặc miễn phí khi có Lời hẹn tương ứng. |

Chỉ nhận phím khi chuẩn bị và không mở hộp thoại, đọc truyện, kéo quân, nhập chữ hay giữ Ctrl/Alt/Meta. Phím lặp do giữ nút cũng bị bỏ qua. Hit-test bằng vị trí chuột tại thời điểm nhấn nên không bán nhầm UID vừa chuyển hoặc biến mất.

Shop viền xanh/badge ✓ khi có bản trên bàn hoặc dự bị. Viền vàng “Ghép sao” khi đang có ít nhất hai bản ★; mua bản thứ ba vẫn phải đủ vàng. Quân ★★/★★★ dùng kích thước 1.07/1.1449 lần ★. Lên sao có luồng hợp nhất, vòng sáng, hạt sao, nhịp phồng ngoại hình và tên thức tỉnh; ghế dự bị có vòng sáng riêng. Hoạt ảnh không ghi vào save, không chạy lại khi tải quân đã lên sao. Reduced motion dùng dấu hiệu tĩnh; đồ họa thấp giảm hạt.

Thêm 5 atlas RGBA→WebP, 20 nhân vật × 7 pose = 140 pose. 12 linh vị có ngoại hình riêng gắn với Xôi xéo, Dưa hành, Bún bò Huế, Chè bưởi, Bún cá, Chả rươi, Chả cá Lã Vọng, Thịt kho trứng, Bún thang, Cốm Làng Vòng, Bánh cốm Hàng Than và Cà phê trứng. TCG dùng đúng model đó cho lá tương ứng. Đây là sprite anime 2.5D; không phải animation skeletal 3D.

Di chuyển dùng smoothstep; đòn đánh có lấy đà, nhô người tại mốc tiếp xúc và thu thế; trúng đòn có phản lực. Canvas hiển thị tối đa 30fps, mô phỏng giữ 20Hz độc lập, DPR tối đa 2. Nhân vật 2–3 sao có vòng chân bạc/vàng. Tọa độ chân và khung bao tất cả pose được đo riêng, bao gồm khi lật ngang.

## Pool và tỉ lệ

Trước đây 32 quân phân bổ 6/9/8/6/3, đặc biệt bậc 5 vàng chỉ có 3 quân. Nay 44 quân phân bổ **8/11/10/8/7**. Bản có sẵn cho mỗi quân theo bậc là **18/16/12/10/9**; tổng 583 bản. Cùng một ID ghép 3 bản ★ → ★★, 3 bản ★★ → ★★★. Hệ/nghề chỉ tính một lần mỗi ID.

| Cấp | 1 vàng | 2 vàng | 3 vàng | 4 vàng | 5 vàng |
|---|---:|---:|---:|---:|---:|
| 3 | 75% | 25% | 0% | 0% | 0% |
| 4 | 55% | 30% | 15% | 0% | 0% |
| 5 | 40% | 35% | 23% | 2% | 0% |
| 6 | 25% | 35% | 30% | 10% | 0% |
| 7 | 15% | 25% | 30% | 25% | 5% |

Tỉ lệ áp dụng từng ô, không đảm bảo shop có đúng số quân của mỗi giá. Với pool chưa hao, ở cấp 7 cơ hội ít nhất một quân 5 vàng trong 5 ô xấp xỉ 22.6%; tìm đúng một quân 5 vàng cụ thể khoảng 3.52% một shop (khi 7 quân bậc 5 còn số bản bằng nhau). Shop roll bậc trước, rồi chọn ID theo số bản còn. Quân giữ trong shop được dành sẵn khỏi pool; mua không trừ lần hai, làm mới/bán trả lại bản. Nếu bậc cạn, chỉ chia lại tỉ lệ cho các bậc đang được phép, không mở bậc có 0%.

Mục tiêu của bảng này: đầu trận tạo đôi/ghép sao giá rẻ; cấp 5 tìm carry 3 vàng; cấp 6 tìm quân 4 vàng; cấp 7 có quyết định giữ vàng hoặc săn huyền thoại. Đây là cân bằng cho bàn tối đa 7 quân và chiến dịch 12 màn của Soul of Meal, không sao chép bảng TFT. Chưa phải chứng minh cân bằng mọi đội hình: cần tiếp tục thu phản hồi chơi thật về tỉ lệ thắng, vàng dư, tần suất 3 sao và thời gian từng màn.

## Đối thủ và tiến trình

22 đối thủ: 16 quái/người bếp và 6 boss. Mới: Cua Mực Nhạt, Chó Than, Bướm Chỉ Lạc, Trúc Khô, Người Bếp Không Tên, Kẻ Giấu Tiếng Sáo; Survival/Daily thêm Vọng Trống Lạc Nhịp ở đợt 25 và Sen Sương Khép Cánh ở đợt 30, sau đó luân phiên 6 boss. Nhân vật trong sương là hư cấu; ký ức văn hóa Việt được giữ trong lời kể của món ăn.

Preview và trận dùng chung kế hoạch địch theo seed/đợt. Quân cận chiến ưu tiên tuyến trước, quân xa đứng phía sau; đội có cả đỡ đòn/carry/hỗ trợ. Giới hạn 1 hỗ trợ ở chiến dịch, 2 ở Survival/Daily để tránh vòng hồi/khiên vô hạn trong 55 giây. Chiến dịch giữ 4 boss/cutscene gốc. Thử thách +30%, sức ép theo thời gian và chỉ thắng mới qua màn tiếp tục giữ nguyên.

Luật 3 áp dụng phiên mới. Save luật 1–2 được thêm các khóa pool mới ở trạng thái chưa dùng; số bản cũ, roster, vật phẩm, vàng, XP, seed/RNG, điểm và combat snapshot giữ nguyên. Shop/đội địch cũ tiếp tục dùng 32 quân và bảng cũ. Như bản 3.2.2, luật 1 lên mức thử thách luật 2 khi xuất trận, không lên pool luật 3 giữa phiên. Thiếu pool ID cũ hoặc đếm sai bản vẫn bị từ chối. Import/export MGC1 được kiểm tra cùng migration.

## Kiểm chứng

- 266 kiểm thử, typecheck app/dev, catalog, build và release records.
- 250.000 ô shop (50.000 mỗi cấp): sai lệch từng bậc dưới 0.9 điểm phần trăm, không trừ pool âm, không rơi bậc bị khóa.
- 18 mô phỏng chiến dịch/Survival với 3 hướng đội, 3 seed. Chiến dịch hoàn thành 5/9 mẫu; mỗi hướng có ít nhất một lần hoàn thành; bản nền trước cập nhật đạt 4/9 cùng bot. Survival 9/9 mẫu kết thúc thua, đợt tốt nhất 7–9. Đây là bot đơn giản, không suy ra tỉ lệ thắng người chơi. Kết quả trong `balance-results.json`.
- Trình duyệt: kiểm chứng click/hover/keydown thực, chuyển W hai chiều, bán E, giá F/D, khóa phím khi đọc/nhập chữ/giao chiến; shop badge, ghép 2 sao và chuỗi lên 3 sao. Kết quả và ảnh trong thư mục này.
- Bản static: 37.97 MB tổng, JS gzip tổng 494.8 KB. Asset mới thêm khoảng 4.97 MB; không tải tất cả atlas ngay từ màn đầu. Build dọn output cũ trước khi ghi chunk mới để không cộng dồn file hash qua nhiều lần build. Không có file phát triển lọt vào dist. Ảnh kiểm chứng, prompt, builder và tài liệu ở `dev/`, không ship trong app.

Các kiểm tra trình duyệt sử dụng Chromium trong môi trường kiểm chứng. Chưa tuyên bố đã thử Safari/iPhone thật, WKWebView hoặc Android WebView.
