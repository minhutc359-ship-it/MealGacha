# Build Soul of Meal mới trên server

Source: repo MealGacha, nhánh **`game/adventure-world-2`**, root directory là gốc repo. Build `master` sẽ không nhận thay đổi trên nhánh AW2. Task018M chỉ commit/push AW2; chưa thay production branch hoặc deploy Vercel.

```sh
pnpm install --frozen-lockfile
pnpm build
```

Output `dist/`: `/` là Soul of Meal mới; `/chest` và `/chest/` là Rương Vị Giác original. Các URL UI cũ và `/dev/aw2/*` trên production fallback về game mới. Giữ tài nguyên ở `/assets/*`, chính sách ở `/legal/*`, service worker và web manifest dưới dạng file tĩnh. Server tự quản lý cần SPA fallback tương đương `vercel.json`.

Mỗi `pnpm build` thực hiện Vite, kiểm module graph không có App/main/pages cũ ngoài ChestPage hoặc UI QA, byte/hash inventory, package/secret guard và candidate audit từ output thật. Có `assets/production-contract.json` để kiểm surface; không chứa đường dẫn source. Candidate đo lại byte/gzip/core/asset hashes và fingerprint, không tin báo cáo build-size cũ.

Vercel: framework Vite, build command `pnpm build`, output `dist`, source branch phải là AW2. Connection trong phiên018M không nhìn thấy project/team MealGacha; server setting chưa được xác minh hoặc sửa. Không dùng thao tác merge/master/promote thay cho kiểm đúng project/branch.

Chơi và ghi save cần HTTPS hoặc localhost cùng Web Locks. Preview HTTP báo điều kiện trước khi bắt đầu; không nới bảo vệ trình duyệt để vượt gate. Giao diện review riêng: `pnpm dev:aw2` và `pnpm build:aw2` (`dist-aw2/`).

`pnpm release:aw2-candidate` PASS technical không tự cấp quyền phát hành. `--require-ready` tiếp tục block khi chưa có evidence ngoài. [Runbook](ROLLBACK.md) · [Backup](SAVE_RECOVERY.md) · [Evidence018M](evidence/AW2-018M.md).
