# Performance, telemetry và error recovery

`aw2-performance-v1` khóa hai lớp gate:

- build: artifact target/hard limit 300/320MB, offline shell 8/12MB, JavaScript gzip target/hard limit 705/710KB;
- runtime observation: page load 3,5/8 giây, visible-page RAF 50/40Hz, optional JS heap 192/320MiB và long task 100/250ms.

Evaluator phân biệt `PASS`, `WARN`, `FAIL`, `NOT_RUN`. Giá trị thiếu giữ `NOT_RUN`; giá trị âm/NaN/Infinity là `FAIL`. Visible-page RAF không được gọi là game FPS, GPU benchmark hoặc cold-load proof.

Telemetry chỉ tạo scalar local theo allowlist: page load, RAF, JS heap, long task và render failure count; route chỉ `world`/`chest`. Event không có raw save, URL/query, identity, stack hoặc free text, không tự gửi mạng và không ghi storage.

AW2 production được bọc bằng error boundary tải động sau khi route đã loại Rương original. Fallback không chạm save, chỉ cung cấp reload, về hành trình và Rương. Rương original không bị boundary AW2 bọc hoặc kéo chunk game mới trước khi chọn route.

Build budgets hiện PASS. Cold load/FPS/GPU/memory/long-task trên browser và thiết bị thật vẫn `NOT_RUN`. [Task](tasks/AW2-018J.md) · [Evidence](evidence/AW2-018J.md).
