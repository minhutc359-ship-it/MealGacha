# Roadmap 10 commit lớn tới production-ready web1.0

Baseline ngày 2026-10-28. Mục tiêu này gom các lát nhỏ thành 10 batch lớn, mỗi batch có ít nhất15 tiêu chí nghiệm thu và một commit đã kiểm chứng. Đây là target có điều kiện, không phải lời hứa bỏ qua gate: scope web1.0 phải được đóng băng; owner phải cung cấp/duyệt art, rights, thiết bị và người chơi độc lập đúng lúc. Nếu nghiệm thu ngoài phát hiện blocker, số commit có thể tăng.

| Batch | Trạng thái | Phạm vi đóng |
|---:|---|---|
|1 |DONE — AW2-018C |Scene chunk/media theo nhu cầu, offline core, cold-shell/package gates và Rương original lazy |
|2 |DONE — AW2-018D |PWA install/update/recovery, offline đã-ghé, quota và cross-version cache |
|3 |DONE — AW2-018E |Save journal/backup/quarantine, explicit recovery, stale-tab/concurrency và lỗi ghi |
|4 |DONE — AW2-018F |Onboarding, accessibility, touch/mobile layout và keyboard/focus toàn tuyến |
|5 |DONE — AW2-018G |Combat/economy/gacha/balance scope freeze, disclosure và regression định lượng |
|6 |NEXT |12 nhân vật: DoD art/animation/kit/identity batch, provenance và rights inventory |
|7 |PLANNED |World/quest/NPC/content polish cuối, consistency canon và content acceptance |
|8 |PLANNED |Performance CPU/GPU/memory/loading, telemetry, error boundaries và device budgets |
|9 |PLANNED |Browser/device matrix + independent human UAT; sửa toàn bộ blocker phát hiện |
|10 |PLANNED |Release candidate: security/privacy/legal/observability/runbook/rollback và final acceptance |

Sau018G còn **khoảng5commit lớn** tới production-ready web1.0 theo scope trên. “Product đầy đủ” rộng hơn scope này chỉ được tuyên bố khi 12/12 character DoD, rights, thiết bị thật, playtest độc lập và release acceptance đều có bằng chứng; test tự động không tự thay thế các gate đó.
