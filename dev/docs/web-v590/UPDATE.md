# Web 5.9 · Bộ nhân vật khởi đầu và trình bày chiến đấu

Nhánh `feat/web-v590-starter-polish`, phát triển từ master `0075577` (đã merge PR #51). Giữ workspace 5.7 chưa commit nguyên vẹn. Chỉ web; không merge hoặc thay native project.

## Đã triển khai

- Thay ảnh Ready/Start/Next Wave/Win/Fail bằng typography, đường trang trí và animation gọn; giữ nhịp mở trận/chuyển wave hiện có. Bỏ atlas trạng thái cũ khỏi bản web.
- Xác định starter bằng dữ liệu thực trong engine: Cơm tấm/Kim sư, Bánh mì/Hỏa vũ, Phở bò/Long lưu, Bánh cuốn/Vân cuộn, Gỏi cuốn tôm thịt/Ngọc lâm. Tạo 5 atlas riêng, 160 pose, 8 trạng thái mỗi người; bản chi tiết dùng Auto Chess/TCG, bản pixel dùng Adventure.
- Tạo atlas pixel làng cho 7 danh tính, 84 frame có bốn hướng. Người chơi/NPC/hai Vị Linh cùng phong cách, giữ tỷ lệ ô vuông, thu nhỏ theo đường đi và sắp theo chân. Giữ chạm di chuyển, hội thoại và mở chức năng theo địa điểm.
- Sửa fallback của 139 thẻ TCG: thẻ chưa có model dùng artwork riêng có sẵn, không mượn danh tính starter theo hệ. Giữ model chuyên biệt đạt chất lượng; phân biệt artwork tĩnh với atlas có animation.
- Nối model resolver và TCG, Auto Chess solo/PvP, Adventure vào cùng ID. Sửa alias Gỏi cuốn để thẻ TCG dài tên và quân Auto Chess ngắn tên vẫn cùng một nhân vật. Artwork/portrait gốc được giữ.
- Thêm VFX geometry riêng: trận địa đồng, giao đao, thủy long, lụa, lá. Dùng chung nơi phù hợp; không chỉ đổi màu một hiệu ứng. Loại bỏ double impact cho starter ở Auto Chess; bỏ clone bay của starter trong TCG.
- 5 tuyệt kỹ starter chạy trực tiếp từ atlas với 5 pha/2,4 giây. Nhân vật, hiệu ứng và tiến trình cùng clock; âm thanh riêng được căn impact 0,96 s. Không ghép thêm ảnh nhân vật lên một video đã có nhân vật. Nhân vật ngoài starter dùng video hoặc fallback, không dùng đồng thời.
- Dọn VFX theo serial/wave/trận; tối đa 12 cue, giới hạn số mục tiêu, ngừng khi ẩn tab. Không replay hiệu ứng sân sau cinematic. Căn contact pose với `action.hit` Auto Chess/560 ms TCG; HP/khiên/nhãn số Adventure cập nhật ở mốc hiển thị, không tính damage lần hai.
- Chuẩn hóa atlas, biến thể, layer, timeline, tối ưu và QA trong [CHARACTER_STANDARD.md](CHARACTER_STANDARD.md). Prompt, công cụ và giới hạn cách tạo ảnh ghi ở [artwork.json](artwork.json).

## Tương thích

Giữ version save 1, storage keys, ID roster/formation, dữ liệu collection, ngưỡng mở khóa, độ khó, kỹ năng, kinh tế và reward. Không migrate/reset tiến trình. Logic chỉ thay danh sách starter cục bộ bằng cùng danh sách dùng chung, không đổi thứ tự hoặc nội dung.

5 MP4 starter cũ nghỉ dùng; 134 video ngoài starter và 139 âm thanh vẫn được hỗ trợ. Movie manifest phân biệt clip và native timeline. Service worker tạo version mới từ nội dung; media vẫn tải theo nhu cầu.

## Module chính

- `src/game/starterCharacters.ts`, `starterVfx.ts`: ID/nhận diện/nhịp pose/timeline/geometry.
- `src/infrastructure/assets/characterSprites.ts`, `src/game/autochess/spriteFrames.json`, `actorPresentation.ts`: model, pivot và contact ở các chế độ.
- `src/components/game/BattleStatus.tsx`, `StarterUltimate.tsx`, `RpgCinematic.tsx`, `RpgBattleVfx.tsx`, `useRpgImpactFrame.ts`, `RpgBattleView.tsx`: trạng thái, tuyệt kỹ, giới hạn hiệu ứng và contact.
- `CharacterSprite.tsx`, `BattleBoard.tsx`, `BattleVfxCanvas.tsx`, `CombatEffects.tsx`, `src/components/autochess/AutoBoard.tsx`, `AutoArt.tsx`: dùng atlas và VFX trong gameplay thật.
- `AdventureVillage.tsx`, `VillageWalker.tsx`, `VillageParty.tsx`, CSS làng/trình bày: pixel, tỷ lệ, hướng đi và depth.
- `dev/tools/pack-starters590.py`, `compose-spirit530.py`, `build-spirit-movies530.mjs`, `verify-media530.py`, `verify-web590.mjs`: đóng atlas, căn âm, phân loại native/clip và kiểm thử.

Xem [VERIFICATION.md](VERIFICATION.md) để biết kết quả và các phần chưa được kiểm chứng. Việc có asset/pose không đồng nghĩa đã đo chất lượng trên mọi điện thoại.
