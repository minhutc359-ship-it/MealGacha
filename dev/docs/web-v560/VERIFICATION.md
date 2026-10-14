# Xác minh Web 5.6

Ngày kiểm tra: 14/10/2026 (UTC).

| Kiểm tra | Kết quả |
|---|---|
| `pnpm typecheck` | Đạt |
| `pnpm typecheck:dev` | Đạt |
| `pnpm test -- dev/tests/game/adventureV560.test.ts` | Đạt; runner chạy đủ 50 file / 543 test |
| `pnpm validate:assets` | Đạt; 149 mục kiểm tra, 0 thiếu |
| `pnpm validate:catalog` | Đạt; 123 món, 35 tag, 9 event |
| `pnpm release:records` + `pnpm release:verify` | Đạt; 32 runtime dependency, 641 asset, 3 policy |
| `pnpm build` | Đạt |
| `pnpm release:size` | Đạt; 88,153,474 bytes, JS gzip 648,283 bytes, 0 leak |

Test 5.6 kiểm tra đủ năm ảnh chuyển cảnh, bốn điểm đến, thứ tự nghi thức đầu trận/đổi đợt, chế độ giảm chuyển động, save schema hiện tại và việc advance nhiều tick dừng chính xác tại biên đợt.

GitHub Actions `Web quality` run 38 và Vercel deployment đều thành công. Preview trực tiếp chuyển tới màn Deployment Protection “You Need Access”; phiên này không có quyền team nên không gửi Request Access và không thay đổi protection. Vì vậy UI đã triển khai chưa được xác minh trực quan; trạng thái và giới hạn được ghi trong [browser-qa.json](browser-qa.json).

Build còn cảnh báo thông tin cho chunk `rpg-presentation` lớn hơn 500 KB sau minify; tổng JavaScript gzip vẫn dưới guard 650 KB.
