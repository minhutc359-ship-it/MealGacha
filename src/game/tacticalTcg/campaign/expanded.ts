import type { TacticalCampaignNode } from "./catalog"
import type { CampaignScene } from "./story"
import { DUEL_BOSSES } from "../engine/duelBosses"
import type { TacticalBattleState } from "../engine/types"
import { DUEL_CARD_MAP } from "../duelCards"

type Quest = "resolve" | "summon" | "spells" | "traps" | "healing" | "diverse" | "swift" | "defeat"
export const QUEST_LABELS: Record<Quest, string> = {
  resolve: "Thắng với chủ tướng còn ít nhất 10 HP",
  summon: "Thắng sau khi gọi ít nhất 3 Vị Linh",
  spells: "Thắng sau khi dùng ít nhất 2 Bí thuật",
  traps: "Thắng sau khi gài ít nhất 1 bẫy",
  healing: "Thắng sau khi hồi thật ít nhất 3 HP chủ tướng",
  diverse: "Thắng khi trên sân còn ít nhất 2 hệ",
  swift: "Thắng trước hết vòng 8",
  defeat: "Thắng sau khi hạ ít nhất 3 quân",
}
// Authored optional routes preserve all shipped story IDs, prerequisites, choices and rewards.
const routes = [
  [
    1,
    "market-names",
    "Phiên Chợ Mất Tên",
    "act-1-hearth",
    "resolve",
    null,
    "caravan-scout",
    "Bà hàng lá vẫn nhận ra mùi rau, nhưng không nhớ người đã hẹn trở lại phiên chợ. Những tấm thẻ tên trên quang gánh đều trắng xóa.",
    "Long Nhỏ tìm được một mảnh sổ chợ. Trên đó có nét chữ: đừng để một người phải giữ lửa một mình.",
  ],
  [
    1,
    "fox-lantern",
    "Lửa Mượn Đêm Hội",
    "side-market-names",
    "traps",
    0,
    "trap-embers",
    "Hồ Ly nhận giữ lửa hội làng để không ai bị lạnh. Khi Sương Nhạt kéo tới, nó giấu hết đèn vào áo đồng vì sợ đánh mất thêm một người.",
    "Bạn đặt lại đèn bên cửa từng nhà. Hồ Ly hiểu rằng giữ lửa không có nghĩa là giữ lửa cho riêng mình.",
  ],
  [
    1,
    "bamboo-wharf",
    "Bến Tre Lặng Gió",
    "act-1-salt-gate",
    "summon",
    null,
    "caravan-letter",
    "Tiếng gọi đò đã im ba buổi. Thỏ Đưa Thư mang theo một lá thư không có người nhận, còn người lái đò chỉ nhớ nửa câu hát ru.",
    "Lá thư tìm về đúng bến. Câu hát ru có đoạn cuối, và mặt nước hiện một đường sáng dẫn tới người giữ sông.",
  ],
  [
    1,
    "river-vow",
    "Lời Hẹn Của Sông",
    "side-bamboo-wharf",
    "spells",
    1,
    "chef-hai",
    "Long Quân cho rằng ký ức không đổi mới sẽ thành nước tù. Nó định cuốn trôi cả bến để người làng không còn buồn vì chờ đợi.",
    "Bạn kể lại câu hát ru bằng giọng của hôm nay. Con sông chảy tiếp, nhưng không phải mang theo mọi điều đã từng thuộc về bờ.",
  ],
  [
    2,
    "pottery-road",
    "Đường Gốm Kể Chuyện",
    "act-2-kiln",
    "spells",
    null,
    "caravan-smith",
    "Con đường vào lò gốm đầy những chiếc bát sứt. Mỗi người thợ giấu một chiếc vì ngỡ vết nứt của mình là điều đáng xấu hổ.",
    "Những mảnh bát được ghép thành một dải hoa văn. Tên của người thợ đầu tiên hiện lên giữa vết men chưa kịp lành.",
  ],
  [
    2,
    "phoenix-kiln",
    "Phượng Lửa Lò Gốm",
    "side-pottery-road",
    "healing",
    2,
    "v4-warm-towel",
    "Phượng giữ lò suốt bảy đêm. Nó tin chỉ ngọn lửa mạnh nhất mới cứu được men gốm, dù sân làng đang phủ tro nóng.",
    "Bạn hạ lửa, đưa nước và chờ đất nguội. Phượng gấp cánh; chiếc bát đẹp nhất giữ lại cả màu men không đều.",
  ],
  [
    2,
    "drum-procession",
    "Nhịp Trống Gọi Hội",
    "act-2-knight",
    "traps",
    null,
    "trap-root",
    "Chiếc trống hội chỉ vang khi mọi người cùng bước. Sương Nhạt khiến ai cũng sợ mình lạc nhịp, nên cả đoàn đứng yên.",
    "Một nhịp trống nhỏ bắt đầu từ đôi tay run. Người thứ hai bước theo, rồi cả con đường làng chuyển động.",
  ],
  [
    2,
    "bronze-lion",
    "Sơn Vương Trống Đồng",
    "side-drum-procession",
    "resolve",
    3,
    "com-tam",
    "Sơn Vương chỉ nghe tiếng trống của những người mạnh. Nó dựng khiên giữa sân, muốn chọn một người đại diện cho tất cả.",
    "Tiếng trống nhỏ nhất cũng được nghe thấy. Sơn Vương cúi đầu, nhường giữa sân cho những người chưa từng được đứng đó.",
  ],
  [
    3,
    "lost-lotus",
    "Vườn Sen Thất Lạc",
    "act-3-cloud",
    "healing",
    null,
    "caravan-herbalist",
    "Người hái thuốc buộc một sợi chỉ vào từng luống sen để nhớ lối về. Sáng nay, những sợi chỉ dẫn tới tám ngả khác nhau.",
    "Bạn buộc lại đầu chỉ bên lời hẹn của từng người. Vườn sen không còn một lối duy nhất, nhưng ai cũng tìm được đường trở lại.",
  ],
  [
    3,
    "moon-rabbit",
    "Ngọc Thố Mùa Trăng",
    "side-lost-lotus",
    "diverse",
    4,
    "banh-cuon",
    "Ngọc Thố giữ nguyên khoảnh khắc trăng đẹp nhất để một người bạn kịp ngắm. Cả khu vườn vì thế không thể đi qua đêm.",
    "Bạn hứa kể lại buổi bình minh cho người bạn đang vắng. Ngọc Thố mở tay, để vầng trăng tiếp tục hành trình của nó.",
  ],
  [
    3,
    "lantern-night",
    "Đêm Rước Đèn",
    "act-3-regent",
    "diverse",
    null,
    "caravan-pastry",
    "Mỗi chiếc đèn có một màu. Hương Vương muốn tất cả đổi về một sắc để đoàn rước trông hoàn hảo từ trên cao.",
    "Từ mặt đất, những màu khác nhau soi rõ từng gương mặt. Đoàn rước không thẳng hàng, nhưng chẳng ai bị bỏ lại.",
  ],
  [
    3,
    "night-owl",
    "Cú Giữ Lời Hẹn",
    "side-lantern-night",
    "swift",
    5,
    "trap-seal",
    "Cú Sao chép lại mọi lời hẹn vì sợ mình quên mất. Quyển sổ quá nặng, và nó không còn rảnh để đi gặp những người trong sổ.",
    "Bạn khép sổ, cùng Cú gõ cửa một người bạn. Có những lời hẹn chỉ được giữ bằng việc thật sự có mặt.",
  ],
  [
    4,
    "promise-wharf",
    "Bến Của Lời Hứa",
    "act-4-vow",
    "swift",
    null,
    "trap-recall",
    "Những người trở về đều đứng ngoài cổng. Họ không biết mình còn chỗ ở mâm cơm đã thay đổi quá nhiều hay không.",
    "Bạn kê thêm ghế. Không ai bị hỏi đã đi đâu quá lâu; câu đầu tiên là: hôm nay bạn có đói không?",
  ],
  [
    4,
    "village-turtle",
    "Huyền Quy Cổng Làng",
    "side-promise-wharf",
    "defeat",
    6,
    "banh-chung",
    "Huyền Quy khóa cổng để làng không mất thêm ai. Nhưng người đứng ngoài cổng cũng chính là những người nó từng muốn bảo vệ.",
    "Cánh cổng mở ra vừa đủ cho người đầu tiên. Huyền Quy ở lại canh làng, lần này quay mặt về phía những người đang trở về.",
  ],
  [
    4,
    "returning-table",
    "Mâm Cơm Ngày Trở Về",
    "act-4-last-table",
    "defeat",
    null,
    "family-table",
    "Mâm cơm có một chiếc ghế không tên. Mọi người nhìn nhau, chờ ai đó đủ can đảm nói rằng mình cũng có thể đã quên.",
    "Một người kể chuyện sai một chi tiết, người khác nhớ thêm một đoạn. Ký ức không còn nguyên vẹn, nhưng trở thành chuyện chung.",
  ],
  [
    4,
    "five-kirin",
    "Kỳ Lân Ngũ Sắc",
    "side-returning-table",
    "summon",
    7,
    "chef-bach",
    "Kỳ Lân hỏi điều gì làm nên một giao ước: giữ nguyên quá khứ hay đón một người khác mình vào ngày mai. Nó muốn nghe câu trả lời bằng cả bàn đấu.",
    "Bạn đặt lá cuối cùng bên chiếc ghế trống. Năm màu hòa vào nhau mà không mất màu nào. Ngày mai, ngôi làng sẽ có thêm một câu chuyện để kể.",
  ],
] as const
export const EXPANDED_NODES: TacticalCampaignNode[] = routes.map(
  ([act, key, title, prerequisite, quest, boss]) => ({
    id: `side-${key}`,
    act,
    title,
    kind: boss === null ? "battle" : "boss",
    prerequisite,
    mangaChapterId: `manga:act-${act}`,
    quest,
    optional: true,
    battle: {
      seed: 700 + routes.findIndex((r) => r[1] === key),
      botLevel: act === 1 ? "normal" : act === 4 ? "extreme" : "hard",
      ...(boss === null
        ? {}
        : {
            boss: {
              definitionId: DUEL_BOSSES[boss].id,
              title: DUEL_BOSSES[boss].name,
            },
          }),
    },
  }),
)
export const EXPANDED_SCENES: Record<string, CampaignScene> =
  Object.fromEntries(
    routes.map(([act, key, title, , quest, boss, reward, before, after]) => [
      `side-${key}`,
      {
        region: [
          "Làng Giao Ước",
          "Phố Đèn Giữ Vị",
          "Sân Bếp Trăm Nhà",
          "Bếp Vô Danh",
        ][act - 1],
        speaker: ["Nhiên", "Hải", "Mộc", "Liên"][act - 1],
        portrait: `/assets/characters/chefs593/chef-${["nhien", "hai", "moc", "lien"][act - 1]}-neutral.webp`,
        art: ["lantern", "harbor", "garden", "last-table"][act - 1],
        objective:
          QUEST_LABELS[quest] +
          (boss === null ? "." : `. ${DUEL_BOSSES[boss].tell}`),
        before: [
          before,
          "Một ván Linh Chiến sẽ quyết định cách lời hẹn này được kể tiếp. Đọc nhịp đối thủ, giữ Hộ vệ và chọn lúc dùng bẫy.",
        ],
        after: [
          after,
          "Mảnh ký ức này được giữ lại trong bản đồ hành trình. Bạn có thể trở về để chinh phục mốc thử thách còn thiếu.",
        ],
        rewardCardId: reward,
      },
    ]),
  )
export function campaignQuestResult(s: TacticalBattleState) {
  const node = EXPANDED_NODES.find((n) => n.id === s.nodeId)
  if (!node?.quest) return null
  const stats = s.cardGame?.stats?.player,
    units = s.units.filter((u) => u.side === "player" && !u.defeated)
  const met =
    node.quest === "resolve"
      ? s.commanders.player.hp >= 10
      : node.quest === "summon"
        ? (stats?.summons ?? 0) >= 3
        : node.quest === "spells"
          ? (stats?.spells ?? 0) >= 2
          : node.quest === "traps"
            ? (stats?.traps ?? 0) >= 1
            : node.quest === "healing"
              ? (stats?.healing ?? 0) >= 3
              : node.quest === "swift"
                ? s.round <= 8
                : node.quest === "defeat"
                  ? (stats?.kills ?? 0) >= 3
                  : new Set(
                      units.flatMap((u) =>
                        u.cardId ? [DUEL_CARD_MAP[u.cardId].school] : [],
                      ),
                    ).size >= 2
  return {
    id: `quest:v1:${node.id}`,
    label: QUEST_LABELS[node.quest],
    complete: s.winner === "player" && s.phase === "result" && met,
    reward: 20,
  }
}
