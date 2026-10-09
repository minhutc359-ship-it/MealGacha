# MealGacha 2.9.2: tiến trình và kinh tế sưu tập

Ngày kiểm tra: 08/10/2026. Bản này triển khai sửa cơ chế chốt trận/mở màn và tăng chi phí nhận thẻ. Auto chess và survival nằm trong [bản thiết kế riêng](AUTOCHESS_SURVIVAL_DESIGN.md), chưa được triển khai trong app.

## 1. Kết quả kiểm tra trận thua

Không tái hiện được việc **trận thua thông thường** tự ghi hoàn thành trên mã mới nhất: `firstClear` đã yêu cầu thắng. Tuy nhiên, có hai khoảng trống trong kiểm tra dữ liệu và một điểm giao diện gây nhầm:

- Chốt thưởng tin vào cờ `battle.result`. Nếu cờ thắng cũ còn tồn tại trong một battle có máu người chơi bằng 0, mã trước đây vẫn có thể trả thưởng/mở màn. Bản mới xác định lại kết quả trước khi chốt thưởng, ưu tiên thua khi người chơi hết máu. Điều kiện thắng nhiệm vụ không được vượt qua điều kiện này.
- Mở màn chỉ kiểm tra màn ngay trước. Một save có cờ boss nhưng thiếu các màn đầu vẫn có thể mở chương sau. Bản mới yêu cầu **tất cả màn trước đó** đã thắng.
- Thanh chọn chương vẫn cho chọn chương khóa để xem trước. Bản mới vô hiệu hóa nút chương khóa; màn vừa thua và chưa từng thắng hiển thị “CHƯA VƯỢT MÀN”. Hộp kết quả giải thích trận thua không mở màn và không nhận thưởng vượt màn.

Engine và chốt thưởng dùng cùng quy tắc kết quả. Chốt lại một battle đã nhận thưởng không trả thưởng lần hai. Thắng bằng mục tiêu bảo vệ vẫn hợp lệ nếu người chơi còn máu, kể cả khi chủ tướng địch còn sống.

**Thua khi chơi lại một màn đã thắng không xóa thành tích trước đó.** Chương từng mở nhờ chiến thắng hợp lệ vẫn được giữ. Đây không phải trường hợp thua lần đầu được tính hoàn thành. Không tự xóa hàng loạt tiến trình/thẻ cũ: lịch sử chỉ lưu một số trận gần nhất nên không đủ bằng chứng để phân biệt mọi chiến thắng hợp lệ với dữ liệu sai trong quá khứ.

## 2. Giá mới

| Hành động | Trước | Bản 2.9.2 |
| --- | ---: | ---: |
| Gói Khởi nguyên | 100 xu | 250 xu |
| Gói theo hệ, mỗi loại | 100 xu | 350 xu |
| Chế tạo Thường | 25 bụi | 50 bụi |
| Chế tạo Hiếm | 70 bụi | 140 bụi |
| Chế tạo Sử thi | 180 bụi | 360 bụi |
| Chế tạo Huyền thoại | 400 bụi | 800 bụi |
| Đổi bản dư Thường → Hiếm | 20 xu | 60 xu |
| Đổi bản dư Hiếm → Sử thi | 50 xu | 150 xu |
| Đổi bản dư Sử thi → Huyền thoại | 150 bụi | 450 bụi |

Mỗi trao đổi vẫn cần bản dư phù hợp và giữ giới hạn trong ngày. Gói theo hệ đắt hơn vì thu hẹp pool để nhắm đội hình. Giá trong mô tả, nút mua, kiểm tra số dư và phép trừ tài nguyên lấy cùng `coinCost` của gói.

Giữ nguyên 1 vé/gói, 5 lá/gói, xác suất độ hiếm, bảo đảm lá hiếm và cơ chế pity. Bụi nhận từ bản dư/phân rã không tăng theo giá chế tạo. Bộ khởi đầu vẫn có 300 xu, 50 bụi và 2 vé; không thu thêm phí với thẻ đã sở hữu, không thay đổi việc nhập món từ Rương vị giác.

Mức này tăng thời gian sưu tập nhưng vẫn cho người mới xây deck ngay bằng thẻ khởi đầu/vé. Các thưởng màn, nhiệm vụ và hành trình hiện tại được giữ. Ví dụ: check-in 100 xu + 5 trận luyện tập được trả thưởng 125 xu + ba nhiệm vụ ngày 70/60/35 xu cho tổng 390 xu, nếu đủ điều kiện và nhận hết. Đó là khoảng 1,56 gói Khởi nguyên theo ngân sách trung bình, chưa tính nguồn thưởng khác; không suy ra số ngày hoàn thành bộ sưu tập từ con số này.

## 3. Mô phỏng tác động

Chạy 200 seed cố định cho mỗi kịch bản/cấu hình bằng [script tái lập](../tools/benchmark-collection.mjs). Mỗi lượt chỉ mua gói Khởi nguyên bằng xu, chế tạo lá chưa có rẻ nhất khi đủ bụi, dừng khi đủ số **ID khác nhau**; không yêu cầu hai bản mỗi lá. Không tính thưởng màn/ngày/nhiệm vụ, trao đổi, vé hay thay đổi hành vi người chơi. Chính sách này là thí nghiệm so sánh giá, không phải mô hình dự báo thời gian hoặc retention.

| Khởi đầu 9 ID | Trung vị gói cũ → mới | Trung vị xu cũ → mới |
| --- | ---: | ---: |
| Đạt 80% catalog | 58 → 64 | 5.800 → 16.000 |
| Đạt 90% catalog | 95 → 110 | 9.500 → 27.500 |
| Đủ 152/152 ID | 184 → 248 | 18.400 → 62.000 |

Trường hợp hoàn thành toàn bộ: chi phí xu trung vị khoảng **3,37 lần**; khoảng phân vị 10–90 của số gói mới là 215–282. Giá chế tạo tăng làm cần nhiều gói hơn, giá gói tăng làm mỗi gói tốn nhiều xu hơn.

Rương là nguồn sở hữu món quan trọng. Thử thêm kịch bản nhập mỗi món hiện có một lần bằng đúng `grantCard` của luồng nhập: khởi đầu 115 ID, bản đã đủ chuyển thành bụi theo luật hiện tại.

| Đã nhập toàn bộ món | Trung vị gói cũ → mới | Trung vị xu cũ → mới |
| --- | ---: | ---: |
| Đạt 80% catalog | 4 → 6 | 400 → 1.500 |
| Đạt 90% catalog | 26 → 31 | 2.600 → 7.750 |
| Đủ 152/152 ID | 105 → 153 | 10.500 → 38.250 |

Vì vậy không thể nói mọi người chơi sẽ tốn 62.000 xu: Rương, vé, thưởng và cách chọn gói tạo khác biệt lớn. [Dữ liệu JSON](economy-benchmark-v292.json) chứa số liệu đầy đủ. Cần theo dõi tốc độ sưu tập thực tế rồi điều chỉnh; không giảm tỷ lệ rơi ngầm và không thay đổi giá giữa một giao dịch đang chạy.

Chạy lại:

```sh
node scripts/benchmark-collection.mjs docs/economy-benchmark-v292.json
```

## 4. Xác minh

- `pnpm typecheck`, `pnpm test`: 145 test / 16 file, `pnpm build`, `pnpm validate:catalog` đều qua.
- Regression dùng đòn kết liễu thực tế ở cả 18 màn; đầu hàng boss; chết do rút bài cạn đúng lúc mục tiêu bảo vệ sắp hoàn tất; cờ thắng sai khi người chơi hết máu; ưu tiên thua cho nhiệm vụ phụ/tuần; thắng mục tiêu hợp lệ; thưởng chỉ nhận một lần; thua khi chơi lại; save có cờ boss nhưng thiếu màn đầu.
- Chromium trên production build: thua ở 18 màn, quay về bản đồ và tải lại vẫn giữ màn/chương tiếp theo khóa; thắng boss mở chương và trả thưởng một lần. Kiểm tra cả bỏ qua hiệu ứng/giảm chuyển động và animation thường.
- Giá mua/không đủ xu/vé trên 6 gói khớp tài nguyên thực trừ; 799 bụi không mua được Huyền thoại, 800 bụi chế tạo đúng một lá. Kiểm tra giao diện tại 320×568, 390×844, 844×390, 667×375, 1440×900; nút mua vẫn tiếp cận được và trang chính không tràn.

Đây là các kết quả kiểm tra hiện tại, không phải cam kết loại bỏ mọi lỗi của save đã từng sửa bên ngoài app.
