# Chuẩn bị quyền sử dụng và chuyển nhượng

Rà soát gốc ngày 09/10/2026; bổ sung ngày 10/10/2026 theo Soul of Meal 3.5. [Policy review mới](../dev/docs/major-v400/POLICY_REVIEW.md) ghi những mục đã hoàn thiện và thông tin pháp lý/liên hệ còn thiếu. Đây là hồ sơ vận hành và dự thảo chính sách; không phải chứng nhận rằng toàn bộ ứng dụng không thể có tranh chấp quyền sở hữu.

## “No copyright” được xử lý thế nào

Giữ quyền đối với nội dung dự án để có thể bán/phát hành, thay vì vô tình công bố CC0. Các trang điều khoản, quyền riêng tư và ghi công tồn tại trong app và ở HTML độc lập. Thư viện có bản quyền vẫn được dùng thương mại theo giấy phép của chúng; không đổi tên giấy phép thành “no copyright”.

6 MP3 của Rương/vòng quay/click và 2 banner cũ chưa có tên tác giả, hóa đơn hoặc giấy phép trong repo đã chuyển sang `dev/archive/assets/`. Chưa rõ giấy phép không đồng nghĩa đã xác định có vi phạm. Không đưa chúng trở lại `public/` trước khi có chứng cứ. Hiệu ứng âm thanh Rương hiện phối từ cue tổng hợp nguyên bản của dự án; banner dùng brand đã có hồ sơ tạo.

## Các việc chủ sở hữu cần chốt trước khi bán/release thương mại

| Việc | Bằng chứng hoặc đầu ra |
| --- | --- |
| Xác nhận chủ thể có quyền | Tên cá nhân/pháp nhân thật, địa chỉ và email hỗ trợ cho cửa hàng; hợp đồng/chuyển giao quyền với cộng tác viên nếu có. Không tự nhận toàn bộ quyền chỉ vì sở hữu tài khoản GitHub. |
| Rà soát tài nguyên | Dùng `ASSET_REGISTER.json` đối chiếu đúng SHA-256. Giữ prompt, bản nguồn, quyền ảnh tham chiếu và điều khoản nhà cung cấp tại thời điểm tạo. Anime có dùng tham chiếu phong cách; chủ sở hữu phải kiểm tra quyền của đầu vào đó. |
| Hoàn thiện bằng chứng còn thiếu | Map thế giới và art sự kiện đã có trong dự án nhưng chưa có đầy đủ bản ghi phiên tạo. Không khẳng định đã được luật sư xác minh. Trước giao dịch, bổ sung hồ sơ hoặc thay bằng art tạo mới có nguồn rõ ràng. |
| Kiểm tra thương hiệu | Tra cứu “Soul of Meal”, logo và tên hiển thị ở các thị trường phát hành. Inspiration về thể loại không cấp quyền dùng logo, nhân vật, nhạc, ảnh hoặc tên thương mại của Riot/Nintendo. Không quảng cáo app là sản phẩm chính thức của TFT/Pokémon. |
| Giữ giấy phép | Ship `/legal/THIRD_PARTY_LICENSES.txt` cùng bản web/native. GSAP là Standard License, MIT/ISC/BSD/OFL giữ thông báo tương ứng; OSM giữ ghi công trên kết quả. Rà lại khi nâng dependency. |
| Chính sách và liên hệ | Hoàn thiện thông tin nhà phát hành thật; kênh GitHub hiện có phù hợp hỗ trợ kỹ thuật công khai nhưng nên thêm email riêng cho khiếu nại/quyền dữ liệu trước App Store/Play. Chính sách phải đúng các SDK/dịch vụ thực sự có trong bản release. |
| Nếu có doanh thu | Vercel Pro/Enterprise cho hosting thương mại; kiểm tra StoreKit/Play Billing khi bán vật phẩm số. Nếu thêm gacha trả phí phải công bố xác suất và kiểm tra yêu cầu tuổi/quy định nơi phát hành; bản hiện tại chưa có thanh toán. |
| Nếu bán app/mã nguồn | Lập hợp đồng ghi rõ code/art/story/music được chuyển, ngoại lệ AI và bên thứ ba, nghĩa vụ hỗ trợ, giá/thuế, tên miền, tài khoản cửa hàng, khóa ký và dịch vụ. Chuyển tài khoản/store theo thủ tục của nền tảng; không đưa token/password vào source ZIP. |

Các trang đang cung cấp:

- `/legal/terms` và `/legal/terms.html`
- `/legal/privacy` và `/legal/privacy.html` (HTML độc lập phù hợp để nhập URL chính sách cửa hàng)
- `/legal/rights` và `/legal/rights.html`

Đọc điều khoản thực tế của từng nhà cung cấp; nếu thực hiện giao dịch bán app, nên có người tư vấn pháp lý rà soát hợp đồng và quyền sở hữu cụ thể. Không có câu miễn trừ nào tự tạo quyền sử dụng một tài nguyên chưa được cấp phép.

## Nguồn chính thức đã đối chiếu

- [OpenAI Terms of Use](https://openai.com/policies/terms-of-use/): giữa người dùng và OpenAI, output thuộc người dùng trong phạm vi pháp luật cho phép; output có thể không độc nhất, đầu vào phải có quyền. Không chứng minh riêng tình trạng bảo hộ hoặc không xâm phạm tại mọi quốc gia.
- [GSAP Standard License](https://gsap.com/standard-license/), [Webflow product terms](https://webflow.com/legal/product-terms).
- [OpenStreetMap copyright/ODbL](https://www.openstreetmap.org/copyright).
- [Vercel Fair Use](https://vercel.com/docs/limits/fair-use-guidelines).
- [Apple Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).
- [Google Play policy center](https://play.google.com/about/developer-content-policy/).
