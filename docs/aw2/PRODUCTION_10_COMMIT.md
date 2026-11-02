# Roadmap 10 commit lớn tới production-ready web1.0

Baseline ngày 2026-10-28. Mục tiêu này gom các lát nhỏ thành 10 batch lớn, mỗi batch có ít nhất15 tiêu chí nghiệm thu và một commit đã kiểm chứng. Đây là target có điều kiện, không phải lời hứa bỏ qua gate: scope web1.0 phải được đóng băng; owner phải cung cấp/duyệt art, rights, thiết bị và người chơi độc lập đúng lúc. Nếu nghiệm thu ngoài phát hiện blocker, số commit có thể tăng.

| Batch | Trạng thái | Phạm vi đóng |
|---:|---|---|
|1 |DONE — AW2-018C |Scene chunk/media theo nhu cầu, offline core, cold-shell/package gates và Rương original lazy |
|2 |DONE — AW2-018D |PWA install/update/recovery, offline đã-ghé, quota và cross-version cache |
|3 |DONE — AW2-018E |Save journal/backup/quarantine, explicit recovery, stale-tab/concurrency và lỗi ghi |
|4 |DONE — AW2-018F |Onboarding, accessibility, touch/mobile layout và keyboard/focus toàn tuyến |
|5 |DONE — AW2-018G |Combat/economy/gacha/balance scope freeze, disclosure và regression định lượng |
|6 |TECHNICAL DONE — AW2-018H; external BLOCKED |12/12 reference/kit/identity/provenance inventory; 0/12 full DoD/rights/release giữ mở |
|7 |TECHNICAL DONE — AW2-018I; human BLOCKED |6 zone/6 room/8 NPC/4 quest/12 spirit, reciprocal routes và placeholder guard |
|8 |NEXT |Performance CPU/GPU/memory/loading, telemetry, error boundaries và device budgets |
|9 |PLANNED |Browser/device matrix + independent human UAT; sửa toàn bộ blocker phát hiện |
|10 |PLANNED |Release candidate: security/privacy/legal/observability/runbook/rollback và final acceptance |

Sau018I còn **khoảng3commit kỹ thuật** trong roadmap; production-ready vẫn bị chặn nếu 12/12 character DoD, rights, duyệt nội dung, thiết bị thật, playtest độc lập và release acceptance chưa có bằng chứng. Test tự động không thay thế các gate đó.
