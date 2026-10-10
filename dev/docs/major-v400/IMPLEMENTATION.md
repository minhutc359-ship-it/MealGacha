# Soul of Meal 4.0 — trạng thái triển khai để review

Nhánh web `feat/v4-complete-release`; nhánh Android `feat/android-v4-beta` phụ thuộc nhánh web. Không tự merge hoặc thay production. Các tài liệu nghiên cứu còn giữ số đo lịch sử; báo cáo này và các JSON QA là trạng thái mới nhất.

## Đã triển khai

- Giữ 163 thẻ cũ, thêm 8 thẻ Nêm vị/Ủ vị/đối sách, quà khởi hành tự nguyện với receipt. Không đổi deck hoặc ending gốc. Pending effects có owner/sequence/lượt đích; cancel không tiêu bài/mana; preview, AI và coach dùng luật thật.
- 3 chương/9 màn và 6 lựa chọn lưu trong `story400`. Nhớ/tiễn tiếp tục thành lời thoại riêng; lựa chọn mới đổi lời dẫn, gợi ý chuyến và lời kết. Sổ lưu các lựa chọn; replay không trả thưởng lần nữa. Hai boss TCG mới có Ủ vị và gỡ pending; checkpoint trước thay đổi giữ luật nhờ marker tùy chọn.
- Deck roles gồm mở bài/động cơ/nối phép/kết thúc/đối sách; thêm bộ gợi ý Nêm hai đường và Ủ dưới mưa, thử tay đầu có seed. Thám hiểm thêm 4 sự kiện/4 di vật và lời hứa an toàn hoặc mạo hiểm. Chuyến cũ thiếu lời hứa giữ hành vi cũ.
- Auto mới chạy rules7: 18 đợt, 12 augment trước và 6 augment chiến thuật (tiếp mana, hồi→đánh, chắn khi mất đồng minh, bỏ lãi lấy reroll, mỗi lần cast thứ ba, hồi đa hệ). Có cooldown/cap/trạng thái lưu. Rules1–6 đang chơi giữ catalog, RNG và luật của mình; chiến dịch cũ đã thắng có thể tiếp tục đợt13 với đội hình và receipt cũ. Recap lấy damage/heal/shield/blocked thực; boss báo chiêu và gợi ý vị trí.
- 3 sân nhiều lớp: nền/depth/light/atmosphere/foreground. Pixi WebGL lazy-load, Canvas fallback khi init fail/context loss, chế độ nhẹ và reduced motion. Actor/input canvas vẫn giữ tọa độ của engine. DPR2/1; dọn observer/ticker/resource khi unmount.
- 12 model ưu tiên và 2 boss có 24 pose mỗi model: 336 raster pose thật; atlas WebP alpha đăng ký theo khoảng trống thực. Idle2/walk6/attack4/cast4/hurt2/death4/victory2, được dùng ở TCG/Auto; không gọi chuyển động thủ tục là clip mới. Cache ảnh dùng lease và đo decoded RGBA, mục tiêu64MiB.
- 6 họ cue vùng × original/8-bit; một họ nhạc căng ba stem đồng bộ 96BPM/8bars, tăng lớp theo HP/boss/áp lực ở ranh giới bar. ×3 không đổi BPM. Một AudioContext, ambience slider riêng, biến thiên SFX nhẹ, mute/ẩn tab/native pause dừng voices. Ngân sách decoded gồm buffer cache và nguồn đang giữ:48MiB steady/64MiB transient; đây không phải tổng RAM ứng dụng.
- Font Latin/Vietnamese OFL tự host WOFF2; mở game offline không gọi Google Fonts. Register quyền/nguồn và policy được tái sinh từ nội dung thực.

## Đối chiếu ticket

| Ticket | Trạng thái | Bằng chứng chính |
| --- | --- | --- |
| S01–S03 | Runtime + regression đạt | `protectedStorage.test.ts`, schema, journal/recovery; rules cũ và MGC1 |
| R01–R04 | Runtime + Chromium đạt | `ArenaScene`, lease cache, `livingClips`, manifest; browser context-loss/low/reduced |
| T01–T04 | Runtime + regression đạt | Nêm/Ủ/AI/coach/deck roles/seeded opening/expedition promises |
| A01–A02 | Runtime + regression đạt | Rules7 catalog/combat/reducer; cooldown, shield-once, third cast, recap/telegraph |
| U01–U02 | Mixer/asset + kiểm thử đạt; nghe thật còn chờ | `adaptiveScore`, `compose-v4-stems.py`, `audio-stems.json`, audio tests |
| C01, N01–N03 | Nội dung/asset nối vào game | 9 màn/6 đợt, story400 choices, 14 model×24, 3 sân, cue/stems provenance |
| Q01 | Tự động đạt; nghiệm thu thiết bị/người chơi còn chờ | Browser10 checks; Auto1200 fixed-board samples +18 economy runs; TCG sampling; size/rights gates |
| H01–H02 | Nhánh Android riêng; code/build và kiểm thử native | Xem `ANDROID_BETA.md` trong nhánh Android; APK không dùng remote server |
| H03 | Chưa phát hành Play | Chủ thể/email/appId dài hạn/upload key/Play Console và QA máy thật cần chủ dự án chốt |

## Kiểm chứng và giới hạn

Web: app/dev TypeScript, catalog validation, 345 kiểm thử/30 files; production build và rights verification. Browser production Chromium: giữ hai ending/quà/deck, Nêm chọn rồi mới trả mana, viewport320×568/390×844/844×390/1366×768, corrupt raw giữ nguyên, atlas mới tải, WebGL→Canvas khi mất context, low/reduced dùng Canvas, font không gọi bên ngoài. Kết quả `browser-v4-results.json`; ảnh `v4-layered-arena-phone.jpg`.

Dung lượng đo mới nhất trong `../release/build-size.json`; giữ nguyên gate45.000.000B static/650.000B JS gzip. Clip provenance: `clip-prompts.json`, `clip-assets.json`; âm thanh: `audio-v4.json`, `audio-stems.json`; font: `font-sources.json`; quyền: `rights/ASSET_REGISTER.json`.

Các phép lấy mẫu cân bằng dùng heuristic, không chứng minh độ khó cho người. `build-sampling.json` là12 đội×100 seed ở wave6, sao2/3quân, không phải toàn bộ pairwise PvP; `auto-v4-benchmark.json` là18 phiên kinh tế. `deck-sampling.json` nêu rõ agent và guard. Không ép win rate thành50% hoặc chỉnh thẻ cũ để làm đẹp số.

Chưa có máy Android RAM4GB, iPhone/Safari, nghe loa/tai nghe/Bluetooth, cuộc gọi, nhiệt/pin hoặc Play tester trong phiên này. Cần profile15phút/OS kill/update cùng khóa, chạm kéo ngang/dọc và playtest5–8 người. Một vài FX sát mép ô atlas cần duyệt thẩm mỹ trên máy thật. Không gọi headless frame time là FPS Android. Không có cloud save/backend/IAP; chưa công bố store hoặc production.
