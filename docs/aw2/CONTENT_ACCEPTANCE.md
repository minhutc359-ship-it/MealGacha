# Content acceptance contract

`aw2-content-acceptance-v1` là projection chỉ đọc của canon hiện có. Contract khóa đúng:

- 6 vùng và 6 phòng, mỗi phòng có cửa vào, cửa ra và spawn an toàn;
- 8 NPC có life schedule và entity thật khớp tên;
- 4 nhiệm vụ có title, objective, grant và reward hợp lệ;
- 12 Vị Linh có identity và recipe affiliation;
- 12 portal có spawn và đường quay về reciprocal, đủ 6/6 vùng reachable;
- player-facing copy không có `TODO`, `TBD`, `FIXME`, `placeholder` hoặc `coming soon`.

Hợp đồng được serialize ổn định và khóa SHA-256 bằng test. Validator thu thập nhiều drift độc lập để một lỗi canon không che lỗi portal/copy/summary khác. Hướng dẫn trong game công bố count và trạng thái hiện hành.

## Biên nghiệm thu

Technical contract hiện `PASS`. Duyệt cốt truyện/nội dung bởi người thật vẫn `NOT_RUN`, vì vậy `releaseReady=false`. Automated consistency không thay thế story review, cultural review, device/browser UAT, rights hoặc release sign-off.

Contract không cấp tiến trình, không sửa save/gameplay/reward và không tự nâng trạng thái phát hành. [Task](tasks/AW2-018I.md) · [Evidence](evidence/AW2-018I.md).
