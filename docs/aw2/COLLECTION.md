# Bộ sưu tập và đội hình — AW2-007L

Development source `730bd97b81875489e87f5c0c96665157fb3b6bb4` · schema5 · `aw2-collection-development-v1`. Final recruitment policy remains **PROPOSED**; these rules enable testing existing kits, do not adopt D11 rates/pity/spending or character-join story canon.

Trong `/dev/aw2/world.html`, mở **Đội và túi đồ**. Nhập môn vẫn nhận trực tiếp Than/Lửa Nhỏ/Lam Lam/Mộc Non/Sương Lành. Các lời mời sau là tùy chọn, miễn phí, chỉ nhận một lần:

| Hoàn tất | Có thể mời thêm |
|---|---|
| Một chỗ bên bàn (quest1) | Muối Đen |
| Ba mẩu ký ức (quest2) | Nhiên, Hải, Liên |
| Mở lại bếp (quest3) | Mộc, Bách, Vân |

Tải trang, migration, xem hình hoặc hoàn thành nhiệm vụ không tự mời nonstarter, không cấp XP/items. Đội starter vẫn hoàn thành cốt truyện; UR không bắt buộc, Vân không được xác nhận là người mất tích. Canon IDs/tier/role/skill/lore giữ nguyên.

Chọn đúng5 người đã sở hữu. Chọn người đang ở vị trí khác đổi chỗ hai slot, không tạo bản sao. **Lưu đội hình** ghi đội, thứ tự và nhấn Vân; **Hủy chọn đội** trả về đội đã lưu. Draft không đổi companions hoặc storage. Lỗi ghi giữ đội cũ/draft để thử lại; tab cũ cần đọc lại. Tất cả dùng chung EXP đã kiếm được, không nhận thưởng khi mời/đổi đội. Nhấn Bảo hộ/Tấn công áp dụng khi tạo trận mới, không sửa Vân đang chiến đấu.

Followers dùng world atlas riêng theo đội lưu. Boss trước kết thúc dùng đúng5 IDs/EXP/Van choice ở checkpoint và ultimate targeting thật. Đổi đội tại tab khác không làm đổi trận cũ; kết quả cũ không được ghi đè revision mới. Đọc lại bỏ lượt chưa lưu ở checkpoint, không tự tính thắng. Quest/economy/boss/mode actions giữ collection/đội; TCG/Chess vẫn là practice không cấp thưởng/ownership.

Sau ending vẫn mời/lưu đội đi cùng được, **chưa có đấu lại boss**;007M sẽ bổ sung rematch không thưởng.104simulations cho thấy nhiều composition/cấp thấp thua; đây là quan sát prototype, không phải balance acceptance. Có thể chọn lại toàn bộ starter miễn phí. Không reset quest/ending để thử đội.

Schema5 lưu `collection.recruitedIds`0–7 unique canonical nonstarter IDs và `vanEmphasis`; năm starter được suy từ intro. Party phải rỗng trước intro, đúng5 unique owned IDs sau intro. Strict schemas1–4 được giữ; decoder nâng trong bộ nhớ, giữ raw bytes/identity/revision/timestamps/progress/economy/receipts, thêm collection rỗng/protection. Chỉ hành động rõ ràng mới ghi version5, không cần reset. Invalid/future>5 data được giữ nguyên, không ghi đè bình thường. Mọi write ở một key `aw2.development.save` qua Web Locks/raw compare. Position-save không có quyền đổi party; chỉ collection action được phép, không chấp nhận reward/HP/unknown fields từ renderer.

Đổi gate/progression trong tương lai cần versioned migration/grandfather ownership, không tự tước nhân vật hoặc làm invalid save cũ. Stable saves/master/released gacha/deployment không bị tác động. Manifests/skill.scope là ghi chép bộ reference/kit ở source lịch sử, không phải registry ownership/completion; implementation hiện tại do collection/save/world module sở hữu. Original image/audio/cells/playback không thay đổi;0/12fullDoD. [Task](tasks/AW2-007L.md), [evidence](evidence/AW2-007L.md), [next](tasks/AW2-007M.md).
