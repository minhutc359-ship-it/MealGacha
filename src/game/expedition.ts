import { CARD_MAP, CARDS, cardsForRules } from "./catalog"
import { startBattle } from "./battle"
import { challengeStat } from "./difficulty"
import { CHAPTERS } from "./story"
import type {
  Battle,
  ExpeditionNode,
  ExpeditionRun,
  GameSave,
  School,
} from "./types"

export const LEGACY_RELICS = [
  {
    id: "ember-pin",
    name: "Trâm than hồng",
    symbol: "✹",
    text: "Đồng minh Hỏa vị nhận +1 công khi vào sân.",
  },
  {
    id: "tide-compass",
    name: "La bàn ký ức",
    symbol: "◈",
    text: "Rút thêm 1 lá khi bắt đầu mỗi trận.",
  },
  {
    id: "grove-seed",
    name: "Hạt mầm bình minh",
    symbol: "❧",
    text: "Hồi 1 máu chủ tướng ở đầu mỗi lượt của bạn.",
  },
  {
    id: "hearth-apron",
    name: "Tạp dề bà ngoại",
    symbol: "⬡",
    text: "Mọi đồng minh nhận +1 máu khi vào sân.",
  },
  {
    id: "sugar-crystal",
    name: "Đường pha lê",
    symbol: "✧",
    text: "Mọi đồng minh nhận thêm 1 lá chắn khi vào sân.",
  },
  {
    id: "iron-kettle",
    name: "Ấm trà bền bỉ",
    symbol: "♧",
    text: "Nhận ngay +4 máu tối đa và hồi 4 máu cho hành trình.",
  },
  {
    id: "traveler-boots",
    name: "Hài lữ khách",
    symbol: "↟",
    text: "Đồng minh đầu tiên mỗi trận có Xung phong.",
  },
  {
    id: "old-recipe",
    name: "Trang sách cháy",
    symbol: "▱",
    text: "Bí thuật sát thương và Quét sân gây thêm 1 sát thương.",
  },
  {
    id: "tea-cup",
    name: "Chén trà đoàn viên",
    symbol: "♨",
    text: "Các hiệu ứng hồi máu của thẻ hồi thêm 2 máu.",
  },
  {
    id: "lantern",
    name: "Đèn dầu không tắt",
    symbol: "✦",
    text: "Bắt đầu mỗi trận với 2 năng lượng thay vì 1.",
  },
]
export const RELICS = [...LEGACY_RELICS,
 {id:"v4-pot-lid", name:"Nắp nồi vừa vặn", symbol:"♨", text:"Ủ vị hồi phục của bạn hồi thêm 1 ý chí khi nở."},
 {id:"v4-menu", name:"Thực đơn hai giọng", symbol:"✧", text:"Mỗi Nêm vị đã dùng trao 1 chắn cho đồng minh ít máu nhất."},
 {id:"v4-dry-towel", name:"Khăn khô dự phòng", symbol:"◈", text:"Dùng Khăn ấm sau mưa rút thêm 1 lá."},
 {id:"v4-rain-lamp", name:"Đèn qua mưa", symbol:"✦", text:"Bắt đầu mỗi trận hồi 3 ý chí, không vượt ý chí tối đa."},
]
const relicsForRules = (run: ExpeditionRun) => (run.rulesVersion ?? 350) >= 400 ? RELICS : LEGACY_RELICS
export const RELIC_MAP = Object.fromEntries(RELICS.map((r) => [r.id, r]))
export interface EventOption {
  id: string
  label: string
  detail: string
  heal?: number
  damage?: number
  supplies?: number
  cost?: number
  relic?: boolean
  cards?: boolean
}
export interface ExpeditionEvent {
  id: string
  title: string
  speaker: string
  story: string
  choices: EventOption[]
}
export const LEGACY_EXPEDITION_EVENTS: ExpeditionEvent[] = [
  {
    id: "empty-bowl",
    title: "Chiếc bát còn ấm",
    speaker: "Một đứa trẻ dưới hiên",
    story:
      "“Mẹ nói nếu để thêm một chiếc bát, cha sẽ tìm được đường về.” Bạn nghe mùi canh thoảng qua lớp sương, dù chiếc nồi trước mặt hoàn toàn trống rỗng.",
    choices: [
      {
        id: "share",
        label: "Chia một phần hành trang",
        detail: "Tốn 15 lương thực · Hồi 10 máu",
        cost: 15,
        heal: 10,
      },
      {
        id: "listen",
        label: "Ngồi lại nghe câu chuyện",
        detail: "Nhận một bí vật · Mất 5 máu vì sương",
        damage: 5,
        relic: true,
      },
    ],
  },
  {
    id: "ferry",
    title: "Chuyến đò không tên",
    speaker: "Người lái đò",
    story:
      "Người lái đò chỉ nhận những công thức chưa từng được viết xuống. Dưới đáy thuyền, những chiếc chai giữ nguyên tiếng cười của người đã rời bến.",
    choices: [
      {
        id: "pay",
        label: "Đổi lương thực lấy ký ức",
        detail: "Tốn 20 lương thực · Chọn thẻ cho bộ bài",
        cost: 20,
        cards: true,
      },
      {
        id: "row",
        label: "Chèo đò giúp ông",
        detail: "Mất 4 máu · Nhận 25 lương thực",
        damage: 4,
        supplies: 25,
      },
    ],
  },
  {
    id: "market",
    title: "Chợ lúc nửa đêm",
    speaker: "Lữ khách mang mặt nạ",
    story:
      "“Tôi không bán điều ước. Tôi bán thứ giúp người ta tiếp tục.” Một chiếc đèn dầu trên sạp vẫn cháy dưới mưa.",
    choices: [
      {
        id: "buy",
        label: "Mua di vật trong hộp gỗ",
        detail: "Tốn 30 lương thực · Nhận một bí vật",
        cost: 30,
        relic: true,
      },
      {
        id: "trade",
        label: "Kể về bữa cơm đầu tiên",
        detail: "Nhận 15 lương thực · Hồi 3 máu",
        supplies: 15,
        heal: 3,
      },
    ],
  },
  {
    id: "orchard",
    title: "Cây không mùa",
    speaker: "Mộc, qua một lá thư",
    story:
      "Cây mọc trên nền bếp cũ, mỗi quả mang một mùa khác nhau. Lá thư buộc ở cành thấp: “Đừng hái hết. Hãy để lại một mùa cho người đến sau.”",
    choices: [
      {
        id: "fruit",
        label: "Hái một quả mùa hạ",
        detail: "Hồi 8 máu",
        heal: 8,
      },
      {
        id: "seed",
        label: "Mang một hạt giống đi",
        detail: "Mất 3 máu · Nhận một bí vật",
        damage: 3,
        relic: true,
      },
    ],
  },
  {
    id: "recipe",
    title: "Thư viện công thức thất lạc",
    speaker: "Người thủ thư",
    story:
      "Những cuốn sách chỉ mở khi có người nhớ đến tác giả. Bạn nhận ra chữ viết của bà ngoại trên mép một trang sách cháy.",
    choices: [
      {
        id: "read",
        label: "Đọc trang sách bị cháy",
        detail: "Mất 4 máu · Chọn thẻ cho bộ bài",
        damage: 4,
        cards: true,
      },
      {
        id: "restore",
        label: "Giúp sửa lại giá sách",
        detail: "Nhận 20 lương thực",
        supplies: 20,
      },
    ],
  },
  {
    id: "stars",
    title: "Đêm bánh sao",
    speaker: "Liên, bên bếp lửa",
    story:
      "Liên nướng những chiếc bánh cho người không thể ngủ. Cô đặt trước bạn chiếc bánh méo nhất: “Nó chưa hoàn hảo, nhưng là chiếc tôi thích nhất.”",
    choices: [
      {
        id: "rest",
        label: "Ở lại dùng trà",
        detail: "Tốn 10 lương thực · Hồi 12 máu",
        cost: 10,
        heal: 12,
      },
      {
        id: "wish",
        label: "Gửi một điều ước vào bánh",
        detail: "Nhận một bí vật · Mất 5 máu",
        damage: 5,
        relic: true,
      },
    ],
  },
]
export const NODE_KIND = {
  battle: {
    name: "Giao đấu",
    symbol: "⚔",
    detail: "Thắng: +25 lương thực và chọn 1 thẻ.",
  },
  elite: {
    name: "Tinh anh",
    symbol: "✹",
    detail: "Địch mạnh hơn. Thắng: +40 lương thực, thẻ và di vật.",
  },
  boss: {
    name: "Trùm cuối",
    symbol: "☽",
    detail: "Đánh bại Kẻ Nuốt Ký Ức để hoàn thành hành trình.",
  },
  event: {
    name: "Gặp gỡ",
    symbol: "✧",
    detail: "Một câu chuyện, hai lựa chọn. Đọc trước khi quyết định.",
  },
  camp: {
    name: "Bếp nghỉ",
    symbol: "♨",
    detail: "Hồi 12 máu hoặc đổi 25 lương thực lấy di vật.",
  },
}
export const activeRun = (run: ExpeditionRun | null) =>
  !!run && !["won", "lost", "abandoned"].includes(run.status)
function random(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}
function choose<T>(items: T[], rng: () => number, count: number): T[] {
  const pool = [...items],
    result: T[] = []
  while (pool.length && result.length < count)
    result.push(pool.splice(Math.floor(rng() * pool.length), 1)[0])
  return result
}
export const EXPEDITION_EVENTS: ExpeditionEvent[] = [...LEGACY_EXPEDITION_EVENTS,
 {id:"v4-two-voices", title:"Quầy có hai giọng", speaker:"Bà Sen", story:"Một người cần lời xin lỗi, người kia cần một bữa cơm. Không ai muốn được viết hộ câu trả lời.", choices:[{id:"meal", label:"Mời cả hai ngồi lại", detail:"15 lương thực · hồi 9 ý chí", cost:15, heal:9}, {id:"listen", label:"Giữ hai công thức", detail:"Mất 3 ý chí · chọn thẻ", damage:3, cards:true}]},
 {id:"v4-rain-letter", title:"Thư qua cơn mưa", speaker:"Hải", story:"Thư đã nhòe. Người nhận vẫn đang đợi ở bến.", choices:[{id:"carry", label:"Đưa thư qua bến", detail:"Mất 4 ý chí · thêm 22 lương thực", damage:4, supplies:22}, {id:"shelter", label:"Đợi dưới hiên", detail:"10 lương thực · hồi 6 ý chí", cost:10, heal:6}]},
 {id:"v4-seed", title:"Mầm cây không mang tên cũ", speaker:"Mộc", story:"Cây này sẽ lớn theo cách của nó. Mộc cần thêm một chậu đất.", choices:[{id:"pot", label:"Góp chậu đất", detail:"18 lương thực · chọn di vật", cost:18, relic:true}, {id:"water", label:"Cùng tưới mầm", detail:"Hồi 4 ý chí", heal:4}]},
 {id:"v4-wash", title:"Người rửa bát", speaker:"Tịnh", story:"Tịnh không xin xóa những gì mình đã làm. Ông nhận phần việc còn lại sau bữa cơm.", choices:[{id:"help", label:"Rửa cùng ông", detail:"Mất 2 ý chí · thêm 18 lương thực", damage:2, supplies:18}, {id:"share", label:"Để ông kể trước", detail:"12 lương thực · hồi 7 ý chí", cost:12, heal:7}]},
]
const schools: School[] = ["ember", "tide", "grove", "hearth", "sugar"]
export function createExpedition(
  deck: string[],
  seed = Math.floor(Math.random() * 4294967296),
): ExpeditionRun {
  const rng = random(seed)
  const kinds: ExpeditionNode["kind"][][] = [
    ["battle", "battle"],
    ["event", "camp"],
    ["battle", "elite"],
    ["camp", "event"],
    ["elite", "battle"],
    ["event", "camp"],
    ["boss"],
  ]
  const nodes = kinds.map((row, floor) =>
    row.map((kind, index) => {
      const school = schools[Math.floor(rng() * schools.length)]
      const event =
        EXPEDITION_EVENTS[Math.floor(rng() * EXPEDITION_EVENTS.length)]
      const titles = [
        "Người giữ cổng sương",
        "Bếp lửa ven đường",
        "Kỵ sĩ muối bạc",
        "Người canh kho ký ức",
        "Đoàn lữ hành lạc lối",
      ]
      return {
        id: `${floor}-${index}`,
        kind,
        school,
        title:
          kind === "boss"
            ? "Kẻ Nuốt Ký Ức"
            : kind === "event"
              ? event.title
              : kind === "camp"
                ? "Bếp nghỉ dưới tán cây"
                : titles[Math.floor(rng() * titles.length)],
        ...(kind === "event" ? { eventId: event.id } : {}),
      }
    }),
  )
  return {
    rulesVersion: 400,
    id: crypto.randomUUID(),
    seed,
    status: "path",
    floor: 0,
    health: 34,
    maxHealth: 34,
    supplies: 40,
    deck: [...deck],
    relics: [],
    nodes,
    route: [],
    currentNode: null,
    reward: null,
    log: ["Rời Phố Đèn Lồng với một bộ bài và chiếc muôi của bà."],
    wins: 0,
    paid: false,
  }
}
export function runNode(run: ExpeditionRun): ExpeditionNode | undefined {
  return run.nodes.flat().find((n) => n.id === run.currentNode)
}
function addLog(run: ExpeditionRun, line: string): ExpeditionRun {
  return { ...run, log: [...run.log, line].slice(-30) }
}
function offers(
  run: ExpeditionRun,
  cards: boolean,
  relics: boolean,
): ExpeditionRun {
  const rng = random(
    (run.seed + run.floor * 7919 + run.route.length * 97) >>> 0,
  )
  const pool = cardsForRules(run.rulesVersion ?? 350).filter(
    (c) => c.cost <= 5 && (c.rarity !== "common" || c.set === "Đoàn lữ hành"),
  )
  if (!cards && (!relics || run.relics.length === relicsForRules(run).length))
    return nextRunFloor(run)
  return {
    ...run,
    status: "reward",
    reward: {
      cards: cards ? choose(pool, rng, 3).map((c) => c.id) : [],
      relics: relics
        ? choose(
            relicsForRules(run).filter((r) => !run.relics.includes(r.id)),
            rng,
            3,
          ).map((r) => r.id)
        : [],
      cardPicked: !cards,
      relicPicked: !relics || run.relics.length === relicsForRules(run).length,
    },
  }
}
export function nextRunFloor(run: ExpeditionRun): ExpeditionRun {
  return {
    ...run,
    floor: Math.min(6, run.floor + 1),
    status: "path",
    currentNode: null,
    reward: null,
  }
}
export function enterRunNode(run: ExpeditionRun, id: string): ExpeditionRun {
  if (run.status !== "path") return run
  const node = run.nodes[run.floor].find((n) => n.id === id)
  if (!node) return run
  return addLog(
    {
      ...run,
      currentNode: id,
      route: [...run.route, id],
      status:
        node.kind === "event" || node.kind === "camp" ? "event" : "battle",
    },
    `Chặng ${run.floor + 1} · ${node.title}.`,
  )
}
export function startRunBattle(run: ExpeditionRun, rng = Math.random): Battle {
  const node = runNode(run)!
  const chapter = CHAPTERS.find((c) => c.school === node.school)!
  const b = startBattle(
    run.deck,
    chapter.stages[Math.min(2, Math.floor(run.floor / 3))].id,
    "courage",
    rng,
    false,
    run.rulesVersion ?? 350,
  )
  b.stageId = null
  b.opponent = node.title
  b.player.health = run.health
  b.player.maxHealth = run.maxHealth
  b.enemy.health = b.enemy.maxHealth =
    challengeStat(24 + run.floor + (node.kind === "elite" ? 4 : node.kind === "boss" ? 6 : 0), b.enemyChallenge)
  b.expedition = {
    runId: run.id,
    nodeId: node.id,
    relics: [...run.relics],
    enemyBoost: node.kind === "elite" || node.kind === "boss" ? 1 : 0,
    summoned: 0,
  }
  if (run.relics.includes("lantern")) b.player.mana = b.player.maxMana = 2
  if (run.relics.includes("tide-compass"))
    b.player.hand.push(b.player.deck.shift()!)
  if (run.relics.includes("v4-rain-lamp")) b.player.health = Math.min(b.player.maxHealth, b.player.health + 3)
  b.log = [
    `Thám hiểm · Chặng ${run.floor + 1}. Máu được giữ giữa các trận.`,
    ...run.relics.map((id) => `${RELIC_MAP[id].name}: ${RELIC_MAP[id].text}`),
  ]
  return b
}
export function settleRunCombat(
  run: ExpeditionRun,
  battle: Battle,
): ExpeditionRun {
  if (
    run.status !== "battle" ||
    battle.expedition?.runId !== run.id ||
    battle.expedition.nodeId !== run.currentNode ||
    !battle.result
  )
    return run
  if (battle.result === "loss")
    return addLog(
      { ...run, health: 0, status: "lost", paid: true },
      "Sương đã khép lại. Những câu chuyện vẫn chờ bạn trở lại.",
    )
  const node = runNode(run)!
  const next = addLog(
    {
      ...run,
      health: Math.min(run.maxHealth, Math.max(1, battle.player.health)),
      wins: run.wins + 1,
      supplies: run.supplies + (node.kind === "elite" ? 40 : 25),
    },
    `Chiến thắng · Giữ lại ${battle.player.health} máu.`,
  )
  return node.kind === "boss"
    ? { ...next, status: "won" }
    : offers(next, true, node.kind === "elite")
}
export function eventChoices(run: ExpeditionRun): EventOption[] {
  const node = runNode(run)
  return node?.kind === "camp"
    ? [
        {
          id: "rest",
          label: "Nấu một bữa cơm ấm",
          detail: "Hồi 12 máu",
          heal: 12,
        },
        {
          id: "relic",
          label: "Sửa lại đồ nghề",
          detail: "Tốn 25 lương thực · Chọn một di vật",
          cost: 25,
          relic: true,
        },
      ]
    : (EXPEDITION_EVENTS.find((e) => e.id === node?.eventId)?.choices ?? [])
}
export function resolveRunEvent(run: ExpeditionRun, id: string): ExpeditionRun {
  if (run.status !== "event") return run
  if (id === "continue")
    return nextRunFloor(addLog(run, "Giữ hành trang và tiếp tục đường xa."))
  const option = eventChoices(run).find((c) => c.id === id)
  if (
    !option ||
    run.supplies < (option.cost ?? 0) ||
    run.health <= (option.damage ?? 0)
  )
    return run
  const next = addLog(
    {
      ...run,
      supplies: run.supplies - (option.cost ?? 0) + (option.supplies ?? 0),
      health: Math.min(
        run.maxHealth,
        run.health - (option.damage ?? 0) + (option.heal ?? 0),
      ),
    },
    option.label,
  )
  return option.relic || option.cards
    ? offers(next, !!option.cards, !!option.relic)
    : nextRunFloor(next)
}
export function pickRunRelic(
  run: ExpeditionRun,
  id: string | null,
): ExpeditionRun {
  if (
    run.status !== "reward" ||
    !run.reward ||
    run.reward.relicPicked ||
    (id !== null &&
      (!run.reward.relics.includes(id) || run.relics.includes(id)))
  )
    return run
  const next = addLog(
    {
      ...run,
      relics: id ? [...run.relics, id] : run.relics,
      health: id === "iron-kettle" ? run.health + 4 : run.health,
      maxHealth: id === "iron-kettle" ? run.maxHealth + 4 : run.maxHealth,
      reward: { ...run.reward, relicPicked: true },
    },
    id ? `Nhận di vật · ${RELIC_MAP[id].name}.` : "Bỏ qua di vật.",
  )
  return next.reward!.cardPicked ? nextRunFloor(next) : next
}
export function pickRunCard(
  run: ExpeditionRun,
  id: string | null,
  removeIndex?: number,
): ExpeditionRun {
  if (run.status !== "reward" || !run.reward || run.reward.cardPicked)
    return run
  if (
    id !== null &&
    (!run.reward.cards.includes(id) ||
      !Number.isInteger(removeIndex) ||
      removeIndex! < 0 ||
      removeIndex! >= run.deck.length ||
      run.deck.filter((c, i) => c === id && i !== removeIndex).length >= 2)
  )
    return run
  const deck = [...run.deck]
  if (id) deck[removeIndex!] = id
  const next = addLog(
    { ...run, deck, reward: { ...run.reward, cardPicked: true } },
    id
      ? `Thêm vào bộ bài hành trình · ${CARD_MAP[id].name}.`
      : "Giữ bộ bài hiện tại.",
  )
  return next.reward!.relicPicked ? nextRunFloor(next) : next
}
export function expeditionRewardAvailable(save: GameSave): boolean {
  return (
    save.claimedDailyQuests.filter((id) => id.startsWith("expedition:reward:"))
      .length < 3
  )
}
