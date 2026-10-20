# D11 — Phương án gacha để chủ dự án duyệt

Status: PROPOSED. Không có nút quay, tiêu tiền/vé hoặc ghi kết quả gacha vào save. Chưa thay D11 trong DECISIONS.

| Tier | Tỷ lệ cơ bản | Nhân vật trong pool đã duyệt | Mảnh khi trùng (đề xuất) |
|---|---:|---|---:|
| N | 55% | Than, Lửa Nhỏ, Lam Lam | 1 |
| R | 30% | Mộc Non, Sương Lành, Muối Đen | 3 |
| SR | 11% | Nhiên, Hải, Liên | 8 |
| SSR | 3,5% | Mộc, Bách | 20 |
| UR | 0,5% | Vân | 50 |

Trong mỗi tier, các identity có trọng số bằng nhau. Lần đầu mở khóa identity; lần trùng cấp mảnh đúng identity. Không đổi tier/ID/lore đã duyệt, không gán giá tiền hoặc bán vé. Cả năm starter vẫn nhận trực tiếp qua nhập môn; UR không là điều kiện hoàn thành cốt truyện.

Pity: tối đa10 lượt có SR+,80 lượt có SSR+,200 lượt có UR. Bộ đếm lưu số lượt liên tiếp chưa đạt ngưỡng; mỗi lượt tăng các ngưỡng chưa đạt và reset các ngưỡng đạt. UR reset cả ba, SSR reset SR/SSR, SR chỉ reset SR. Nhiều ngưỡng cùng đến hạn thì áp dụng ngưỡng cao nhất. Trong lượt bảo đảm, loại tier thấp rồi chuẩn hóa lại trọng số còn lại; đây không phải bonus draw. Không soft pity ở phương án này. Tiến độ pity giữ qua save/reload và banner cùng pool chuẩn; banner giới hạn khác chưa được đề xuất. Chưa dùng spark/đổi nhân vật: thêm sau khi có contract giá và nguồn mảnh, không âm thầm cộng một hệ chi phí nữa.

## Mô phỏng đã chạy

`node dev/tools/simulate-aw2-gacha.mjs`, Node24, seed20261021,10.000 hồ sơ×200 lượt =2.000.000 lượt. Báo cáo đầy đủ: `../evidence/AW2-013-gacha-simulation.json`.

| Kết quả | Giá trị |
|---|---:|
| Tỷ lệ thực tế N / R / SR / SSR / UR với pity | 52,62945% /28,63685% /13,57255% /4,3997% /0,76145% |
| Lượt trung bình đến SSR+ đầu tiên | 19,6077 |
| Trung vị /p90 /tối đa SSR+ đầu tiên | 15 /44 /80 |
| Lượt trung bình đến UR đầu tiên | 114,9889 |
| Trung vị /p90 /tối đa UR đầu tiên | 111 /200 /200 |
| Hồ sơ chưa có UR sau200 lượt | 0/10.000 |

Tỷ lệ thực tế là kết quả quần thể hữu hạn200 lượt, không phải tỷ lệ cơ bản của từng lượt, không phải bảo đảm giá trị thương mại. Simulator kiểm tra mức tier và pity; chọn identity/trùng/mảnh mới là đề xuất chưa được mô phỏng như hệ inventory runtime. Các số liệu không thay thế kiểm thử chi phí, nhận thưởng đồng thời hoặc migration khi triển khai gacha thật.

Quyết định cần duyệt: bộ tỷ lệ, hard pity và cách reset/carry nêu trên; hướng bản trùng thành mảnh, chưa spark. Sau duyệt mới thêm banner/pool/inventory transaction, disclosure UI và regression. Owner có thể yêu cầu đổi tỷ lệ rồi chạy lại đúng cùng seed để so sánh.
