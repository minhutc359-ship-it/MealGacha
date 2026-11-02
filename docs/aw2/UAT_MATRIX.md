# UAT matrix và session evidence

`aw2-uat-v1` định nghĩa 7 lane độc lập:

- desktop Chromium, Firefox, Safari;
- Android Chromium và iOS Safari trên thiết bị thật;
- NVDA + Firefox và VoiceOver + Safari.

8 scenario canon bao phủ onboarding/new save; full journey/boss/ending/reload; save/recovery/stale tab; PWA/offline/update; keyboard/focus; touch/layout/safe area; accessible presentation; Rương original/route isolation. Mỗi lane yêu cầu tập scenario phù hợp.

Session final phải có SHA-256 artifact, run number, independent-human/actual-device flags, automation=false, đủ outcome đúng thứ tự và blocker code/severity/status hữu hạn. Object và mọi record con dùng exact allowlist; raw save, URL/query, tester identity, notes hay field thêm đều bị từ chối. Run mới nhất hợp lệ của lane là authority; blocker mở hoặc outcome fail làm lane `FAIL`.

Hiện chưa có session ngoài: 0 PASS, 0 FAIL, 7 NOT_RUN; human acceptance `NOT_RUN`, release-ready false. Unit/browser automation không được nhập như human evidence. [Task](tasks/AW2-018K.md) · [Evidence](evidence/AW2-018K.md).
