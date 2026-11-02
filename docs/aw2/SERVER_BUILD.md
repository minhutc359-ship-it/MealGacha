# Build Soul of Meal mới trên server

Source hiện tại: repo MealGacha, nhánh **`master`**, root directory là gốc repo. AW2 đã đi qua PR84 (`game/adventure-world-2`→`rpg`) và PR85 (`rpg`→`master`). Hotfix019D sửa `.vercelignore` từng loại nhầm toàn bộ `dev/`/`rights/`; không được thêm lại hai rule đó vì `pnpm build` cần runtime, tool và hồ sơ quyền trong các thư mục này.

```sh
pnpm install --frozen-lockfile
pnpm build
```

Output `dist/`: `/` là Soul of Meal mới; `/chest` và `/chest/` là Rương Vị Giác original. Các URL UI cũ và `/dev/aw2/*` trên production fallback về game mới. Giữ tài nguyên ở `/assets/*`, chính sách ở `/legal/*`, service worker và web manifest dưới dạng file tĩnh. Server tự quản lý cần SPA fallback tương đương `vercel.json`.

Mỗi `pnpm build` trước hết kiểm toàn bộ tracked file theo checkout hiện hành: production-critical source/evidence phải tồn tại, là file thường và không phải Git LFS pointer. Sau đó build kiểm module graph không có App/main/pages cũ ngoài ChestPage hoặc UI QA, byte/hash inventory, package/secret guard và candidate audit từ output thật. `assets/production-contract.json` khóa surface; `assets/release-identity.json` ghi product/version/candidate, full Git SHA do GitHub/Vercel cung cấp, source portability và security profile. Candidate đo lại byte/gzip/core/asset hashes và fingerprint, không tin báo cáo build-size cũ.

Vercel phải trả security profile`aw2-static-v1`: same-origin CSP; cấm frame/object; khóa base/form/connect/font/image/media/script/style/worker; thêm COOP/CORP, Permissions-Policy, HSTS, nosniff, DENY frame và noindex/nofollow. Asset named cache một giờ+revalidate; HTML/legal/service worker luôn revalidate. Sau deploy, operator kiểm tối thiểu:

```sh
curl -fsSI https://<host>/ | sed -n '/content-security-policy:/Ip;/x-frame-options:/Ip;/x-content-type-options:/Ip;/permissions-policy:/Ip;/strict-transport-security:/Ip'
curl -fsS https://<host>/assets/release-identity.json
curl -fsSI https://<host>/sw.js | sed -n '/cache-control:/Ip;/service-worker-allowed:/Ip'
```

Release identity phải có `product=soul-of-meal`, `candidate=aw2-web1-rc-v1`, `source.provider=vercel`, full40-hex revision đúng commit AW2, `sourcePortable=true`, `deliverySecurityProfile=aw2-static-v1`, default surface`soul-of-meal-aw2` và retained legacy đúng một`chest`. Response thiếu/sai là blocker, không promote.

Vercel: framework Vite, build command `pnpm build`, output `dist`, source branch production hiện phải là `master`. Sau hotfix019D, đọc lại build log/commit SHA thay vì suy ra PASS từ local. Connection trong phiên018M không nhìn thấy project/team MealGacha; server setting chưa được xác minh hoặc sửa. Không dùng thao tác promote/release thay cho kiểm đúng project/branch và response HTTPS.

Chơi và ghi save cần HTTPS hoặc localhost cùng Web Locks. Preview HTTP báo điều kiện trước khi bắt đầu; không nới bảo vệ trình duyệt để vượt gate. Giao diện review riêng: `pnpm dev:aw2` và `pnpm build:aw2` (`dist-aw2/`).

`pnpm release:aw2-candidate` PASS technical không tự cấp quyền phát hành. `--require-ready` tiếp tục trả2 khi chưa có evidence ngoài. [Runbook](ROLLBACK.md) · [Backup](SAVE_RECOVERY.md) · [Evidence019C](evidence/AW2-019C.md).
