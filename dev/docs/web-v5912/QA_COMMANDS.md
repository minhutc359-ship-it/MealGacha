# Chạy lại QA 5.9.12

Từ root repository, dùng dependency theo lockfile. Browser scripts cần Playwright và Chromium/WebKit đã cài; đặt `PLAYWRIGHT_MODULE`, `CHROMIUM_BIN`, `WEBKIT_BIN` theo máy chạy. Chromium Linux có thể cần `CHROMIUM_LIB_DIR`; WebKit cần dependency hệ thống tương ứng. Chạy các lượt mode nối tiếp vì script mode dùng cổng 4198.

```sh
pnpm typecheck
pnpm typecheck:dev
pnpm test
pnpm test:web-budget
pnpm validate:catalog
pnpm validate:assets
pnpm release:verify
python3 dev/tools/inspect-character-atlas.py vietnam5912 5912
node dev/tools/audit-spirit-production.mjs
node node_modules/vite/bin/vite.js build --emptyOutDir
pnpm release:guard
pnpm release:size
```

Hai nhóm dùng trong bằng chứng:

- A: `["pho-ga","chao-suon","mien-ga","bun-moc"]`
- B: `["banh-da-cua","bun-dau","com-rang-dua-bo","com-nieu"]`

Với từng `QA_ENGINE=chromium` hoặc `webkit`, chạy A rồi B; thay `QA_IDS` và hậu tố output cho nhóm B:

```sh
QA_COHORT=5912 QA_ENGINE=chromium QA_IDS='["pho-ga","chao-suon","mien-ga","bun-moc"]' QA_OUT=dev/docs/web-v5912/adventure-a node dev/tools/verify-spirits5910.mjs
QA_ENGINE=chromium QA_IDS='["pho-ga","chao-suon","mien-ga","bun-moc","com-tam"]' QA_AUTO_IDS='["xoi-xeo","dua-hanh","com-tam","banh-mi","pho-bo"]' QA_ASSET_ROOT=vietnam5912 QA_OUT=dev/docs/web-v5912/modes-chromium-a node dev/tools/verify-showcase-modes597.mjs
QA_ENGINE=chromium QA_IDS='["pho-ga","chao-suon","mien-ga","bun-moc","banh-da-cua","bun-dau","com-rang-dua-bo","com-nieu"]' QA_VIEWPORTS='[{"width":390,"height":844},{"width":844,"height":390}]' QA_OUT=dev/docs/web-v5912/preview node dev/tools/verify-banner5911.mjs
```

Preview chỉ cần một lượt tám ID/engine. Báo cáo JSON sẽ được ghi lại trong đường dẫn output. Asset inspector dựng lại contact sheet, kiểm tra hash file đã giao; không cần tải tranh nguồn. Prompt/hash nguồn và repair ở `asset-provenance.json`, crop canon tái tạo theo `production-inputs.json`. Kiểm tra tải đầu/offline bằng `dev/tools/measure-web-load.mjs` với cấu hình browser tương tự; tham khảo môi trường ở đầu script. Không dùng kết quả headless thay nghiệm thu vật lý trong `HUMAN_QA.md`.
