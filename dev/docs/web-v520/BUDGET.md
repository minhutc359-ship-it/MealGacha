# Dung lượng Web 5.2

Không thêm / thay media runtime hoặc dependency. 11 atlas Vị Linh của 5.1 giữ nguyên byte/hash. Chứng cứ JPG nằm trong dev/docs, không vào dist. Budget giữ **5.0 + 6,000,000 bytes** và trần JS gzip **650,000**, không nâng giới hạn.

Số cuối lấy từ `dev/docs/release/build-size.json`, được guard bởi `visual-budget.json`. Build / typecheck / tests / asset / registry đạt; không leak dev/archive/source map. Pixi vẫn lazy import, được gộp để giảm tổng gzip; smoke production xác nhận renderer chạy.

| Hạng mục | Byte |
|---|---:|
| Build | 78,398,477 |
| Tăng từ 5.1 | 11,691 |
| Tăng từ 5.0 | 5,832,426 / 6,000,000 |
| Còn trong 6 MB | 167,574 |
| JS gzip | 644,328 / 650,000 |
| CSS gzip | 98,026 |
| Media mới | 0 |
