# AW2 web1.0 technical release candidate

`aw2-web1-rc-v1` hiện có 15 technical gate và 7 external gate. Sau019C, `pnpm release:aw2-candidate` đo trực tiếp file/gzip/offline/inventory hash của `dist`, xác minh source portability/release identity/delivery security và xuất fingerprint artifact; không tin build-size JSON lịch sử. Lệnh cũng chạy bắt buộc trong `pnpm build`, không gọi mạng, deploy, promote hoặc release.

Technical gates kiểm artifact/offline/JS hard limits, leak scan, source portability, production entry, service worker, web manifest, AW2/public inventories, legal artifacts, release identity, rollback runbook, build routing và delivery security. CLI mặc định exit0 nếu technical PASS dù overall còn`BLOCKED_EXTERNAL`, giúp CI phân biệt artifact hỏng với external work chưa xong. `--require-ready` trả2 khi overall chưa`READY`.

## Trạng thái hiện hành

- technical: 15/15 PASS;
- external: 0/7 PASS;
- overall: `BLOCKED_EXTERNAL`;
- `deployAuthorized=false`, `releaseAuthorized=false`.

External gates còn mở: full character DoD; character rights; independent art/audio review; human content acceptance; human/device UAT; device performance; owner release approval. Automated gates không thể tự đóng các mục này.

Khi và chỉ khi mọi technical/external gate có evidence PASS, decision contract mới trả `READY` và `releaseAuthorized=true`. Sau đó operator vẫn phải theo [runbook stage/promote/rollback](ROLLBACK.md); report không tự thực thi thao tác.

[Task](tasks/AW2-019C.md) · [Evidence](evidence/AW2-019C.md) · [Roadmap](PRODUCTION_10_COMMIT.md).
