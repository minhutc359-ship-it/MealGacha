# Kiểm chứng Web 5.9.1

Kiểm trên checkout kế thừa commit Web 5.9 `2a69b2e`, ngày 16/10/2026. Không merge master. Không thay đổi reducer, save schema, skill recipes, collection, kinh tế, RNG hoặc phần thưởng.

## Kết quả

- App TypeScript và dev TypeScript: đạt.
- Vitest: **655/655 test, 58 file**. Có các ca mới cho manifest sáu nhân vật, alias, layout HD/pixel, bounds/pose, VFX khác nhau và cleanup, contact riêng từng source/tick, Xôi reload/double skip giữ nguyên actor/roster/resources. Các bộ save, combat, PvP và economy hiện có vẫn đạt.
- Catalog 123 món / 35 tag / 9 event; kiểm asset không có tham chiếu sản phẩm bị thiếu; release guard và kiểm cú pháp service worker: đạt.
- Release records: 605 asset / 32 dependency runtime / 3 policy; verify đạt. Không tăng budget, không thêm dependency runtime.
- Python/Pillow: 12 atlas nhân vật HD/pixel, **384 frame** không rỗng, không chạm mép ô; Xôi có 32 hash pose khác nhau cho mỗi biến thể. VFX mới có **18 frame/18 hash khác nhau**, 6 cột nhận diện × 3 mốc. Portrait mới 512×512. Xem `asset-qa.json`, `vfx-qa.json`.
- ffmpeg/ffprobe: giải mã toàn bộ **133 video H.264 còn dùng và 139 MP3 mono 24 kHz**, không lỗi/truncated. Sáu nhân vật mẫu chạy native, không còn MP4 tương ứng. `../web-v530/media-qa.json` lưu codec/hash/bytes thực tế.

## Gameplay browser

Chromium headless 143, SwiftShader; dev server và production preview chạy trong cùng môi trường. Dữ liệu fixture được đưa qua schema/store/reducer thật vào profile kiểm thử riêng; không có route debug trong sản phẩm.

- 320×568, 390×844, 844×390 và 1440×900: làng 7 nhân vật pixel, ô vuông không kéo méo, 5 starter chiến đấu dùng pixel, không tràn ngang, bảng nút nằm trong viewport.
- Ready/Start được kiểm với clock có kiểm soát vì đây là các pha ngắn 620/460 ms; các lần đầu chạy screenshot đồng thời đã lỡ Start trên headless. Harness cuối dừng clock khi chụp, xác nhận cả hai pha rồi trả về nhịp thật. Không kéo dài trạng thái trong code sản phẩm. Wave/Win/Fail cũng được kiểm qua trận thật.
- Cả 5 starter và Xôi chạy đủ preparation/casting/impact/finisher/recovery. Chỉ một canvas actor/VFX, không video/portrait chồng lên. Pause giữ tiến độ; skip đóng; reload Xôi từ cast đã ghi nhận rồi skip giữ nguyên actor/resources.
- Fixture Auto Chess sáu nhân vật mẫu ở trận thật; TCG có đủ sáu model và một thẻ khác dùng đúng artwork riêng. Không tạo clone starter bay trên đòn đánh. Board dùng chung ở Auto Chess solo/PvP; chưa chạy mới phiên hai thiết bị PvP trong đợt này.
- Reduced-motion hệ điều hành: Xôi dùng pose impact tĩnh và một VFX, không MP4; skip thành công. Xem `reduced-qa.json`.
- Năm cast liên tiếp với cinematic OFF: tối đa **5 cue**, sau 3,2 giây còn **0**, serial chiến đấu tăng. Mẫu đo **31,56 rAF FPS nền**, **51,61 rAF FPS khi cast**, p95 khoảng **50 ms**. Không suy ra cải thiện FPS thực trên điện thoại từ mẫu headless này; kết quả chỉ cho thấy mẫu thử không suy giảm so với nền trong cùng lượt. Renderer pixel/VFX vẫn giới hạn nhịp vẽ riêng khoảng 30 Hz.
- Production 390×844 hydrate từ save đã tạo: atlas, cinematic mới, pause/skip đạt. Không lỗi JavaScript và không asset 4xx trong các context. Chi tiết: `browser-qa.json`, `model-audit.json`.

## Dung lượng cuối

| Chỉ số | Kết quả | Giới hạn |
| --- | --- | --- |
| Tổng dist | 255.361.946 byte | 260.000.000 |
| Chênh so với Web 5.9 | −1.580.272 byte | Không tăng ngân sách |
| Tổng JS gzip | 674.700 byte | 675.000 |
| Tổng CSS gzip | 104.109 byte | Theo dõi |
| Gói visual chung sáu nhân vật/làng/VFX/portrait mới | 6.721.462 byte | Mục tiêu plan 5–8 MB |
| Bốn ảnh runtime mới | 912.586 byte | Bù bằng bỏ asset hết tham chiếu |

Số liệu và benchmark ở `metrics.json`. JavaScript còn ít dư địa; đợt tiếp theo phải đo và tối ưu tiếp, không nâng ngầm budget.

## Ảnh kiểm chứng

| Nội dung | Ảnh |
| --- | --- |
| Xôi trước đây là hạc | [Trước](evidence/xoi-before.webp) |
| Xôi gấu và VFX địa chấn mới trong cinematic thật | [Sau](evidence/xoi-ultimate.webp) |
| Sáu model trong Auto Chess | [Trận Auto Chess](evidence/autochess-six.webp) |
| Sáu model và artwork riêng của thẻ khác trong TCG | [Trận TCG](evidence/tcg-six.webp) |
| Typography Start trên màn nhỏ | [Start](evidence/start-typography.webp) |

## Giới hạn và công việc tiếp

- Chưa kiểm trên Safari/iPhone/Android/GPU thật hoặc nghe âm thanh trên thiết bị thật. Headless không thay thế nghiệm thu các máy đó.
- Atlas 2D có 4 key pose/hàng kèm body motion; chưa phải skeletal/mesh rig. Pixel combat là derivative nearest-neighbor; bộ làng mới có hướng đi thật, Vị Linh chiến đấu chưa có 4 hướng khám phá riêng.
- 94 thẻ ngoài nhóm mẫu vẫn là portrait fallback, không phải model/animation đầy đủ. Năm đầu bếp, bộ biểu cảm và roster/boss mới là đợt tiếp theo theo plan.
- 13 asset cũ vẫn cần chứng cứ quyền sử dụng trước phát hành thương mại. Asset Xôi/VFX mới có prompt/provenance riêng; không đánh dấu thay các hồ sơ pending cũ.
- Không coi toàn bộ roadmap 6.0 hoàn tất từ kết quả của đợt P0 này.
