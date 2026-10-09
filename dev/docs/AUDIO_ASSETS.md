# MealGacha 2.6 · Nhạc và âm thanh

Bốn bản nhạc được sáng tác và tổng hợp riêng bằng `scripts/compose-game-music.py`, không dùng mẫu thu âm, bài hát có sẵn hay âm thanh từ game khác. Lớp dây gảy, tiếng gió và nhịp trống là âm sắc điện tử; đây **không phải bản thu nhạc cụ truyền thống hoặc biểu diễn Quan họ, Bài Chòi, đờn ca tài tử hay Xòe Thái**.

| File trong `public/assets/tcg/audio/` | Tên trong game | Ngữ cảnh | Nhịp | Vòng nhạc |
| --- | --- | --- | --- | --- |
| `battle.mp3` | Bếp lửa lên nhịp | Trận thường | 108 BPM | 35,556 giây |
| `boss.mp3` | Năm ngọn lửa | Boss, máu người chơi ≤8, thám hiểm nguy hiểm | 126 BPM | 30,476 giây |
| `story-warm.mp3` | Lời mời bên bếp | Phố Đèn Lồng, bếp Tết, Bài Chòi, phố Trung Thu | 72 BPM | 26,667 giây |
| `story-mystery.mp3` | Điều sương chưa kể | Bến cảng, vườn, biển ký ức, bàn ăn cuối và thất bại | 60 BPM | 32 giây |

Tổng 1.000.689 byte; MP3 stereo 22.050 Hz, 64 kb/s. Vòng nhạc cuộn đuôi nốt/echo về đầu trước khi nén; metadata Xing giữ độ dài vòng khi giải mã. Peak nguồn ≈0,605; mixer mặc định nhạc 38%, hiệu ứng 70% để chừa chỗ cho kỹ năng và lời thoại đọc bằng mắt.

Tạo lại asset bằng Python 3 + numpy và ffmpeg có libmp3lame:

```sh
python3 scripts/compose-game-music.py
python3 scripts/compose-game-music.py --only story-warm
```

`public/assets/tcg/audio/**` được miễn LFS ở cuối `.gitattributes`: preview và production phải nhận MP3 thật. Asset chỉ tải khi có cảnh cần nhạc và người chơi đã tương tác, không tải cả bộ ở màn sảnh. Cache tối đa hai AudioBuffer.

## Điều khiển trong game

- Nút **♫** ở trận đấu/cutscene; cùng các tùy chọn trong Cài đặt game.
- Công tắc âm thanh chung, công tắc nhạc nền riêng, hai thanh âm lượng. Cài đặt lưu vào hồ sơ hiện có; hồ sơ cũ giữ trạng thái tắt tiếng.
- Chạm/click hoặc nhấn phím để khởi động mixer. **Phát thử** mở lại audio khi trình duyệt đang chặn hoặc tải nhạc thất bại. Game tiếp tục chơi được nếu audio không khả dụng.
- Nhạc cutscene nổi ưu tiên hơn trận đấu; nhật ký chỉ phát khi mở và hiện trên màn hình. Đóng reader trả lại nhạc trận trước đó.
- Đổi track có fade, vòng nhạc ghi nhớ vị trí khi tạm dừng. Đổi tab trình duyệt dừng nhạc/SFX; trở lại tiếp tục nhạc, không phát lại kỹ năng cũ. Rời chế độ TCG đóng AudioContext.
- Bật Giảm chuyển động giữ phản hồi âm thanh nhưng bỏ hoạt cảnh. Tắt âm thanh dừng cả những SFX đã lên lịch.

## Âm thanh chiến đấu

SFX tạo bằng Web Audio oscillator/noise, không cần tải file riêng: chọn/bỏ chọn/xác nhận bài, rút bài, triệu hồi, niệm phép, va chạm, lửa/nước/lá/đường sao, hồi máu, tăng sức mạnh, tạo/phá khiên, Cộng hưởng, đổi lượt, boss thức tỉnh và Vị Linh tan đi. Nhạc nền hạ nhẹ dưới giai điệu chiến thắng/thất bại.

`frameSounds()` đọc snapshot trước/sau reducer giống VFX. Quét sân chỉ phát một âm mỗi loại, tối đa năm loại trong một frame. Khi Giảm chuyển động bật, lượt AI giữ âm đầu/cuối thay vì dồn toàn bộ hành động cùng lúc. Kết quả phát một lần trong phiên hiển thị trận. Mixer không viết tiến trình, sát thương hay phần thưởng.

Hiệu ứng chọn bài/vòng niệm phép/tia nối/sóng quét/rút bài/thức tỉnh/kết liễu dùng CSS; lửa, nước và khiên dùng lại WebP trong `public/assets/tcg/fx/`. Các lớp đều không chặn thao tác mục tiêu và nằm trong khung đấu.
