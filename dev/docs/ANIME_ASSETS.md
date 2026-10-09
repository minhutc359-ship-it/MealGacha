# Asset nhân vật và nhạc 2.8

16 ảnh gốc được tạo bằng **built-in imagegen**, mode `stylized-concept`, dùng một ảnh heroine anime đã chọn làm tham chiếu phong cách. Bộ ảnh trước được giữ để tham khảo. Prompt đầy đủ: [anime-asset-prompts.json](anime-asset-prompts.json).

Ảnh cuối đặt tại **`public/assets/tcg/characters/anime/`**, WebP RGBA 640×960, chất lượng 78, giữ alpha của công cụ. Tổng 1,349,630 byte (~1.29 MiB). ffmpeg chỉ thu nhỏ/chuyển định dạng, không tự vẽ hoặc chỉnh nhân vật bằng Python.

| File | Nhân vật / vai trò |
| --- | --- |
| `hero.webp` | Người giữ vị; cũng dùng cho Sương Nhạt với sắc tiếng vọng |
| `bach.webp` | Bách, thầy nấu và cha Liên |
| `nhien.webp` | Nhiên, người cứu hộ ở cảng |
| `moc.webp` | Mộc với chén trà |
| `hai.webp` | Hải với bát sứ |
| `lien.webp` | Liên với đèn ông sao |
| `grandmother.webp` | Bà bên bếp |
| `mist.webp` | Người giữ sương / linh ảnh boss |
| `merchant.webp` | Người bán bánh mì |
| `sailor.webp` | Thủy thủ |
| `fisherman.webp` | Ngư dân |
| `hieu.webp` | Nghệ nhân Hiệu |
| `child.webp` | Em bé cầm đèn |
| `guest.webp` | Người khách Nam Bộ với đàn kìm |
| `la.webp` | Lả, người Thái từ Tây Bắc |
| `conductor.webp` | Người soát vé |

Đây là nhân vật hư cấu có trang phục được cách điệu; ảnh không dùng để khẳng định mẫu trang phục lịch sử hay nghi lễ. [Nguồn và giới thiệu văn hóa](VIETNAMESE_CULTURE.md) tiếp tục nằm trong sổ hành trình. Cảnh nền trước vẫn là tranh minh họa, được làm dịu khi nhân vật lên sân khấu.

## Bốn bản phối 8-bit

File cuối trong **`public/assets/tcg/audio/`**, MP3 stereo 22.05 kHz / 64 kbps, tổng 939,691 byte. Tạo bằng [compose-retro-music.py](../tools/compose-retro-music.py), Python/numpy/ffmpeg, seed noise cố định. Chủ đề từ nhạc gốc MealGacha, không sử dụng giai điệu, sample hoặc bản thu Pokémon/Nintendo.

| File | Nhịp | Loop |
| --- | --- | --- |
| `8bit-battle.mp3` | 116 BPM | 33.103 giây |
| `8bit-boss.mp3` | 134 BPM | 28.657 giây |
| `8bit-story-warm.mp3` | 76 BPM | 25.263 giây |
| `8bit-story-mystery.mp3` | 64 BPM | 30 giây |

Bốn kênh chính: pulse lead có lọc hài, pulse arpeggio, triangle bass và noise percussion. Note tails wrap về đầu loop; peak có headroom cho SFX. Bốn bản phối cũ giữ nguyên file. Nhạc tải theo mood/phong cách khi cần, cache tối đa hai AudioBuffer. VFX mới cho ứng biến được dựng bằng CSS từ ba vòng, bảng màu và chân dung, khớp các thay đổi công/chắn/rút thật trên frame.

Asset được lưu trực tiếp trong Git với ngoại lệ LFS đã có cho TCG. Kiểm tra RIFF/alpha của ảnh, ID3/giải mã WebAudio của nhạc, đường dẫn thực và dung lượng; không giao pointer thiếu nội dung.
