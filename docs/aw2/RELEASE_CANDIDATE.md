# AW2 web1.0 technical release candidate

`aw2-web1-rc-v1` có 12 technical gate và 7 external gate. `pnpm release:aw2-candidate` đọc build-size cùng output local sau `pnpm build`; lệnh không gọi mạng, deploy, promote hoặc release.

Technical gates kiểm artifact/offline/JS hard limits, leak scan, production entry, service worker, web manifest, AW2/public inventories, legal artifacts, rollback runbook và build routing. CLI mặc định exit 0 nếu technical PASS dù overall còn `BLOCKED_EXTERNAL`, giúp CI phân biệt artifact hỏng với external work chưa xong. `--require-ready` trả nonzero khi overall chưa `READY`.

## Trạng thái hiện hành

- technical: 12/12 PASS;
- external: 0/7 PASS;
- overall: `BLOCKED_EXTERNAL`;
- `deployAuthorized=false`, `releaseAuthorized=false`.

External gates còn mở: full character DoD; character rights; independent art/audio review; human content acceptance; human/device UAT; device performance; owner release approval. Automated gates không thể tự đóng các mục này.

Khi và chỉ khi mọi technical/external gate có evidence PASS, decision contract mới trả `READY` và `releaseAuthorized=true`. Sau đó operator vẫn phải theo [runbook stage/promote/rollback](ROLLBACK.md); report không tự thực thi thao tác.

[Task](tasks/AW2-018L.md) · [Evidence](evidence/AW2-018L.md) · [Roadmap](PRODUCTION_10_COMMIT.md).
