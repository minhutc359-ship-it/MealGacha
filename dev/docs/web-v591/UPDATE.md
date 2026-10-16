# Soul of Meal · Web 5.9.1 · Nhóm mẫu theo plan

Đợt tiếp theo của Web 5.9, dựa trên file plan người dùng cung cấp trong `PLAN_SOURCE.md`. PR 5.9 chưa merge tại lúc bắt đầu; nhánh này kế thừa 5.9 và được review riêng, không tự merge master.

## Phạm vi đã triển khai

- Giữ nguyên đúng 5 starter Adventure: Cơm tấm, Bánh mì, Phở bò, Bánh cuốn và Gỏi cuốn tôm thịt. Không đổi roster, sở hữu, UID hoặc tiến trình để khớp danh sách HD cũ trong plan.
- Chốt Xôi / Kim noãn theo **Gấu Nếp Mới** đang có trong catalog Auto Chess và định hướng plan: gấu nâu mật, mõm kem, giáp vải hạt nếp, vai lá chuối xanh, dây ngọc, giỏ xôi. Thay portrait hạc trong các giao diện Xôi bằng portrait gấu riêng. Các portrait khác được giữ nguyên.
- Xôi có atlas HD và pixel riêng, 32 pose trong 8 hàng `idle/walk/attack/cast/ultimate/hit/fall/victory`, tích hợp trực tiếp Adventure, Auto Chess và TCG. Thêm 3 trạng thái trình bày dùng lại pose: summon, guard và stun. Đây là 8 hàng artwork, không phải 11 bộ hình mới hay rig 3D.
- Xôi chuyển từ MP4 sang cinematic native 5 pha / 2,4 giây: lấy đà, giơ tay, giáng hai tay, chấn động đất và hồi về. Nhạc hiệu được dựng lại với impact 960 ms. Bỏ MP4 Xôi và atlas HD bốn pose cũ đã hết người dùng; giữ texture combat các hệ.
- Manifest dùng chung cho 6 Vị Linh mẫu: ID, nhận diện, atlas HD/pixel, portrait, điểm neo chân/phát phép, nhịp riêng, contact Adventure/TCG, SFX, timeline, chỉ mục VFX và pose giảm chuyển động. Renderer lấy layout 4×8 từ manifest, không duy trì 12 bản tọa độ lặp theo chế độ.
- Thêm atlas VFX 18 frame: 6 hình thái riêng × 3 mốc charge/impact/finisher. Cinematic chọn một frame phù hợp pha, thay thế geometry khi ảnh đã sẵn sàng; không chồng cả hai. Texture giới hạn ở phía mục tiêu, tránh mặt/model nhân vật.
- Đòn thường, kỹ năng và nhận hồi máu/khiên chọn hình VFX khác nhau. Gấu có vết nứt và vòng chấn động thấp; sư tử có trận địa/khiên đồng; hồ ly có vết chém; long có nét thủy lưu; thỏ có quạt/hoa/lụa; hươu có nhánh lá. Tuyệt kỹ bảo vệ đồng minh dùng tín hiệu nhận khiên/hồi máu tại chân, không vẽ đòn đánh lên đồng minh.
- Pose, HP/khiên hiển thị và VFX đọc cùng contact: Adventure 300/380/960 ms, TCG 560 ms, Auto Chess vẫn lấy `action.hit` thực. Chỉ sửa lớp trình bày; engine không tính lại sát thương từ callback animation.
- Cinematic tạm dừng/giảm chuyển động không vẽ lại cùng một thời điểm bất biến. Cache ảnh 64 MB, clock thích ứng 30/60, giới hạn 12 cue, cleanup khi chuyển cảnh và skip giữ từ Web 5.9.

## Asset mới

| Asset | Kích thước | Nội dung |
| --- | --- | --- |
| `public/assets/characters/starters590/xoi.webp` | 1024×2048 | 32 pose gấu, 8 hàng |
| `public/assets/characters/starters590/xoi-pixel.webp` | 256×512 | Cùng pose, biến thể nearest-neighbor cho Adventure |
| `public/assets/characters/starters590/xoi-portrait.webp` | 512×512 | Chân dung gấu, đồng nhất phụ kiện |
| `public/assets/characters/starters590/ultimate591.webp` | 1536×768 | 18 VFX, 6 nhận diện × 3 mốc |
| `public/assets/rpg/awakening530/sounds/xoi.mp3` | mono 24 kHz / 2,4 s | Nhạc hiệu gốc, contact 0,96 s |

Atlas nguồn Imagegen có các hàng lệch nhau; `xoi.cells.json` lưu 32 vùng đo, packer tách thành phần nhân vật khỏi mảnh ô lân cận, giữ một tỷ lệ cho toàn nhân vật và cùng pivot chân. Không có ảnh nguồn hoặc script phát triển trong dist. Prompt và nguồn tạo ảnh bằng Imagegen tích hợp nằm ở `artwork.json`.

## Module chính

- `src/game/characterVisuals.ts`, `starterCharacters.ts`, `visualTiming.ts`: manifest, alias và timeline.
- `src/infrastructure/assets/characterSprites.ts`, `src/game/autochess/presentation.ts`, `spriteFrames.json`, `tcgCharacterMotion.ts`: đăng ký và phân giải model.
- `src/game/adventureRpg/spiritArt.ts`, `src/components/game/SpiritArt.tsx`: hỗ trợ portrait độc lập và atlas cũ cùng lúc.
- `CharacterSprite.tsx`, `RpgBattleView.tsx`, `RpgCinematic.tsx`, `StarterUltimate.tsx`, `useRpgImpactFrame.ts`: animation, pixel, cinematic và contact.
- `starterVfx.ts`, `RpgBattleVfx.tsx`, `BattleVfxCanvas.tsx`, `AutoBoard.tsx`, `actorPresentation.ts`: VFX và tín hiệu gameplay ba chế độ.
- Packer, builder/verifier media, provenance/release records và kiểm thử được cập nhật theo số cinematic native thực tế.

Danh sách đầy đủ: `CHANGED_FILES.md`. Kết quả đo và giới hạn: `VERIFICATION.md`.

## Tiến độ so với roadmap

| Mục trong plan | Trạng thái sau đợt này |
| --- | --- |
| Roster Adventure/HD khác nhau | Đã phân biệt roster gameplay 5 starter với nhóm visual 6; không đổi save |
| Xôi hạc/gấu | Đã thống nhất gấu trong portrait, model ba chế độ và cinematic |
| Manifest dùng chung, marker, anchor, reduced motion | Đã tích hợp cho 6 Vị Linh mẫu |
| Bộ 5 starter + Gỏi cuốn | Kế thừa Web 5.9, bổ sung receipt VFX và trạng thái trình bày |
| Năm đầu bếp, 5–7 biểu cảm, tương tác/nấu ăn mới | Còn ở đợt kế tiếp; giữ các model đang có |
| Bún chả, Bún riêu, Bánh xèo, Cơm gà và mở rộng roster | Chưa sản xuất atlas mới trong đợt này |
| Quái/tinh anh/boss mới | Chưa mở rộng; giữ hệ cảnh báo và bộ hiện tại |
| Safari/mobile thật, rig/mesh, 4 hướng khám phá từng Vị Linh | Chưa nghiệm thu; làng vẫn dùng bộ 4 hướng pixel đã tích hợp ở 5.9 |
| 13 hồ sơ asset cần chứng cứ quyền sử dụng | Vẫn pending; các asset Xôi mới có provenance riêng |

Đây là đợt P0 tiếp theo theo thứ tự của plan, không phải tuyên bố hoàn thành toàn bộ roadmap 8 tuần hoặc mốc 6.0. Bộ tiêu chuẩn `../web-v590/CHARACTER_STANDARD.md` tiếp tục áp dụng; bổ sung hợp đồng ở `CHARACTER_MANIFEST.md`.
