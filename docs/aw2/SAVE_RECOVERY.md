# Save AW2: ghi bền và phục hồi

AW2 vẫn dùng namespace phát triển `aw2.development.save` cho tới khi có quyết định phát hành đầu tiên. Schema chính hiện là8; save1–7 được migrate **trong bộ nhớ khi đọc** và chỉ nâng lên8 sau một thao tác lưu rõ ràng. Không có đường tự reset hoặc tự hạ schema.

## Bốn key trong namespace AW2

| Key | Vai trò |
|---|---|
| `aw2.development.save` | Bản chính mà game đọc |
| `.backup` | Exact bytes của bản chính hợp lệ ngay trước lần ghi gần nhất |
| `.journal` | Candidate mới đã ghi và đọc lại trước khi thay bản chính |
| `.quarantine` | Exact bytes lỗi/future được giữ trước reset hoặc phục hồi có chủ ý |

Các key cũ của Soul of Meal không được đọc hoặc sửa. Dữ liệu này chỉ nằm trên browser/profile hiện tại; chưa phải cloud sync.

## Một lần ghi

1. Lấy Web Lock độc quyền theo key AW2.
2. Đọc main và so sánh exact bytes với snapshot UI; khác bytes thì trả conflict.
3. Nếu main hợp lệ, ghi/read-back main cũ vào backup. Nếu main lỗi và thao tác là reset đã xác nhận, giữ bytes đó trong quarantine.
4. Ghi/read-back candidate mới vào journal.
5. Ghi/read-back candidate vào main.
6. Dọn journal. Nếu cleanup bị browser từ chối sau khi main đã xác minh, journal cùng bytes có thể còn lại nhưng không được áp dụng khi main hợp lệ.

Quota, security error hoặc storage no-op đều không được báo thành công giả. Nếu lỗi xảy ra sau khi browser có thể đã thay main, UI yêu cầu Đọc lại thay vì tự đoán.

## Khi nào có nút phục hồi

- Chỉ khi main `empty` hoặc `invalid` và backup/journal chứa save đọc được bằng schema hiện hành.
- Không hiện khi main hợp lệ.
- Không hiện và không rollback khi main `unsupported`; người chơi cần client mới hơn hoặc reset riêng với cụm xác nhận.
- Candidate mới nhất được chọn theo `updatedAt`, rồi revision cùng `saveId`; journal thắng khi hòa.
- Tạo save mới bị chặn nếu main trống nhưng còn candidate phục hồi, tránh ghi đè dữ liệu có thể cứu.

Nhấn **Phục hồi bản an toàn** lấy lại Web Lock, so sánh exact main/source/candidate, giữ main lỗi vào quarantine, ghi/read-back main và dọn journal. Tab cũ hoặc candidate đã đổi sẽ bị từ chối và phải Đọc lại.

## Xử lý sự cố

- “Dữ liệu đã thay đổi ở tab khác”: đóng tab thừa hoặc chọn Đọc lại; không lặp thao tác từ snapshot cũ.
- “Chưa xác minh được lần ghi”: Đọc lại trước. Nếu main hợp lệ, tiếp tục từ main; nếu lỗi/trống và có nút phục hồi, dùng nút đó.
- “Schema mới hơn”: mở bằng bản game mới hơn. Chỉ reset khi người chơi chủ động chấp nhận mất tiến trình hiện hành.
- Không xóa thủ công backup/journal/quarantine trước khi đã sao lưu browser profile nếu đang điều tra dữ liệu.

[Task AW2-018E](tasks/AW2-018E.md) · [Bằng chứng](evidence/AW2-018E.md)
