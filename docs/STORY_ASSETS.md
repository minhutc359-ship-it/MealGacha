# Minh họa truyện v2.4

Sáu ảnh được tạo bằng **imagegen tích hợp**, không dùng CLI/API bên ngoài. File game nằm trong `public/assets/tcg/story/`, WebP 1280×720, chất lượng 80, tổng 6 tranh. PNG gốc không là dependency của app. Chỉ tối ưu kích thước/định dạng khi đưa vào game. Thư mục asset được lưu như Git blob thường để preview phục vụ ảnh thật.

| File | Cảnh |
| --- | --- |
| `public/assets/tcg/story/lantern.webp` | lantern |
| `public/assets/tcg/story/harbor.webp` | harbor |
| `public/assets/tcg/story/garden.webp` | garden |
| `public/assets/tcg/story/tide.webp` | tide |
| `public/assets/tcg/story/moon.webp` | moon |
| `public/assets/tcg/story/last-table.webp` | last-table |

## Prompt chung

Use case: illustration-story. Asset type: 16:9 cinematic cutscene background for an original Vietnamese fantasy card game about food, memory and grief. Style: lavish hand-painted 2D visual novel key art, tactile gouache and luminous painterly brushwork, believable Vietnamese architecture and kitchen details, rich atmospheric depth, restrained magical realism, expressive lighting, premium indie game art. Character continuity when visible: the traveler is a young Vietnamese woman viewed mostly from behind, short dark hair, cream rolled-sleeve shirt, muted turquoise scarf, worn silver cooking ladle; an elderly Vietnamese grandmother has a silver hair bun and indigo blouse. Magical food is a luminous translucent memory spirit made of steam around a recognizable dish, never a plate with cartoon arms or legs. Wide cinematic landscape, fill entire image edge to edge, important detail stays within central 70 percent for responsive cropping. No typography, lettering, dialogue boxes, logos, watermarks, borders or UI.

## Prompt từng cảnh

### lantern

An intimate old Hanoi lantern market at blue hour, red paper lanterns along narrow weathered streets, a humble bánh mì stall at left. Foreground a scarred wooden table has TWO ceramic rice bowls and a silver ladle; the young traveler stands by the table, a glowing bánh mì memory spirit gently rises from steam while pale fog coils across distant stalls. Warm amber food and lantern light against teal fog, hopeful but unsettling. Do not reveal the protagonist's identity or the ending.

### harbor

An abandoned Vietnamese harbor after rain, a weathered wooden rescue boat moored beneath a dim orange dock lantern. On the deck a small pot of soup glows warm; a charred paper ferry ticket, with NO legible text, rests beside a silver ladle. The traveler and a Vietnamese young female fire cook with tied-back dark hair and a rust-red apron look toward the dark water from behind. Cold mist, embers and distant storm clouds. The soup's steam forms a delicate luminous memory ribbon, not a monster. A melancholy visual clue scene, no bodies.

### garden

A gigantic ancient banyan tree in a walled Vietnamese kitchen garden, roots gently cradle an opened handwritten letter with only indistinct brush marks, no legible text. The traveler in cream shirt and turquoise scarf kneels beside the roots; a gentle Vietnamese young woman gardener in sage clothing shelters a tiny grey seedling in her hands. The tiny grey plant shines with new life among dry green branches. Warm shafts of sunlight cross cool drifting fog; wet leaves, earthen pots and quiet emotional tension. A subtle silver ladle near the letter, no explicit spoiler.

### tide

An impossible Vietnamese family kitchen beneath a deep jade-blue sea, suspended recipe pages and bubbles, a cooking fire glows beneath a dark pot although the whole room is underwater. The traveler stands at the doorway seen from behind, holding the silver ladle; elderly grandmother in indigo is distant at a table, soft and indistinct like an illusion. Rippled light from above, a translucent soup memory drifting near the ladle, eerie quiet, tender uncertainty. No mirrored double, no text or literal dead bodies.

### moon

A Vietnamese hilltop patisserie and little train platform under a vast violet-blue starry sky, lantern-lit crescent pastries displayed on a weathered wooden counter. The traveler and a young Vietnamese female pastry cook in dusty mauve apron stand near two chairs at a tiny table overlooking the softly glowing town. An elegant swan shape is suggested only by distant luminous cloud and constellations. Steam from a pastry curls into a delicate lavender memory spirit. Wistful, spacious and hopeful, no written shop signs.

### last-table

An old Vietnamese family kitchen at the center of softly swirling white fog, a round wooden dining table with SIX different simple wooden chairs arranged visibly around it, one chair in the foreground empty and pulled slightly back. A cracked silver ladle and ceramic rice bowl on the table. Elderly grandmother in indigo sits quietly on the far side; the young traveler stands at the doorway from behind. Five tiny colored lights, amber, coral, sage, cyan, lavender, converge above the table like recollected flavors. Tender tension, glowing hearth, deep shadow, no explicit faces in fog, no text.

## Hai chỉnh sửa sau khi kiểm tra

- lantern: thay người bán bánh mì nữ cao tuổi bằng ông bán hàng lớn tuổi, áo nâu và tạp dề; giữ nguyên người lữ khách, hai bát, chiếc muôi và Vị Linh bánh mì.
- garden: thay hình người bà bằng Mộc, nữ làm vườn khoảng 24 tuổi, tóc đen tết, áo xanh sage và tạp dề olive; giữ nguyên tư thế che chở mầm xám, bức thư, cây đa, người lữ khách và ánh sáng.

Các minh họa thể hiện không khí của chương; sáu ảnh được dùng lại cho các đoạn trước/sau trận và nhật ký. Chúng không phải sơ đồ chính xác, hoạt hình đầy đủ hay ảnh riêng cho mọi câu thoại.
