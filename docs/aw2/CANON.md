# Canon — Initial 12 and Lantern direction approved 2026-10-20
Owner approved both AW2-002 and AW2-003 proposals in-session; see D10/D13/D14/D15. Original proposal labels are historical, superseded by this explicit approval. Rates/pity, numerical balance, final title, production platform and finished art remain unapproved/unimplemented.

Thế giới: Hương vị lưu ký ức của những bữa ăn, Sương Nhạt làm ký ức biến mất. Arc “Một chỗ bên bếp”: Làng Giao Ước → Phố Đèn Lồng → Sân Bếp Bỏ Quên → Phòng Kho → Phòng Lửa → Phòng Bàn, nối lại lời mời dành cho người vắng mặt. Không xác nhận người vắng mặt là Vân; Sương Lành không đồng nhất với Sương Nhạt. Bách, Hải, Liên, Mộc, Nhiên và Vân dùng lore AW2 đã duyệt, không tự kế thừa lore cũ. Mộc Non và Mộc là hai identity riêng.

Approved story IDs and quest/choice direction are in `proposals/AW2-002-LANTERN.md`: six `aw2-zone-*`, eight `aw2-npc-*`, four quests `aw2-quest-kept-seat`, `aw2-quest-three-memories`, `aw2-quest-open-hearth`, `aw2-quest-one-more-bowl`; safe return routes, replayable dialogue/puzzle, no paid/UR story gate. Reward amounts and battle timing/stats are still mechanic work.

## 12 danh tính / tier / role đã owner duyệt
| ID immutable | Display name | Cảm hứng món ăn | Độ hiếm đã duyệt | Role |
|---|---|---|---|---|
| aw2-than | Than | Cơm tấm | N | Tank |
| aw2-lua | Lửa Nhỏ | Bánh mì | N | Striker |
| aw2-lam | Lam Lam | Phở | N | Healer |
| aw2-moc-non | Mộc Non | Gỏi cuốn | R | Support |
| aw2-suong | Sương Lành | Bánh cuốn | R | Mage |
| aw2-muoi | Muối Đen | Muối rang | R | Debuffer |
| aw2-nhien | Nhiên | Bún bò | SR | Striker |
| aw2-hai | Hải | Canh chua | SR | Tank |
| aw2-lien | Liên | Chè sen | SR | Healer |
| aw2-moc | Mộc | Cốm | SSR | Mage |
| aw2-bach | Bách | Bánh chưng | SSR | Tank |
| aw2-van | Vân | Bữa ăn thất lạc | UR | Hybrid |
Mỗi ID immutable sau khi duyệt. Display name/recipe/animation được đổi riêng. **Ảnh chân dung không tính là model hoàn thành.** Definition of Done mỗi nhân vật: lore, role/kit, leveling, 4-way pixel movement, 8 trạng thái HD battle, portrait, projectile/impact/ultimate asset, QA và provenance. UR không được bắt buộc để kết thúc main story.

Approved kit/identity/visual direction: `proposals/AW2-003-ROSTER.md`. Starter team: `aw2-than`, `aw2-lua`, `aw2-lam`, `aw2-moc-non`, `aw2-suong`; direct intro unlock before mandatory combat, no draw needed. Four slots: basic/auto/passive/manual ultimate; level curves, final combat skill data, full12 art/animation/audio and actual-combat QA remain pending. No character meets full Definition of Done from document approval alone.

Asset implementation update 2026-10-20: AW2-004A source `5d1df97` provides Than `base-v1`; AW2-004B source `f6a3b6655988d262a974f6f5034845740fd94766` adds Lửa Nhỏ, Lam Lam, Mộc Non and Sương Lành reference sets (four-way chibi, eight HD key poses/interpolated tracks, portrait, four skill FX/audio tracks and three ranged basic projectiles). All five resolve canonical manifests; remaining seven sets NOT_CREATED. This records implementation only, not new identity/kit canon, numerical combat timing approval or owner finished-art/license approval. All five fullCharacterComplete=false. Leveling/real combat/device/full-art/rights gates remain open. Historical proposal NOT_IMPLEMENTED asset labels are superseded only for these five reference sets.
