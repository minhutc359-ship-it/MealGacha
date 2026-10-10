import { LIVING_CHAPTERS } from "./livingStory"
import type { Chapter } from "./types"
import { SCENES, CHAPTER_COPY } from "./narrative"
import { STORY_ART, stageArtId } from "./storyArt"

const CHAPTER_LAYOUT = [
  {
    id: "lantern",
    title: "Phố Đèn Lồng",
    school: "hearth",
    art: "/assets/events/hanoi-autumn/banner.webp",
    character: "Bách",
    stages: [
      {
        id: "lantern-1",
        title: "Bữa sáng bị lãng quên",
        opponent: "Người bán hàng mất trí nhớ",
        boss: false,
        rewardCard: "tea-break",
      },
      {
        id: "lantern-2",
        title: "Chợ không tiếng cười",
        opponent: "Bóng Sương ở chợ Đèn Lồng",
        boss: false,
        rewardCard: "sugar-veil",
      },
      {
        id: "lantern-3",
        title: "Ngọn lửa đầu tiên",
        opponent: "Kẻ Canh Bếp Cổ",
        boss: true,
        rewardCard: "chef-bach",
      },
    ],
  },
  {
    id: "harbor",
    title: "Bến Cảng Than Hồng",
    school: "ember",
    art: "/assets/events/bangkok-street-heat/banner.webp",
    character: "Nhiên",
    stages: [
      {
        id: "harbor-1",
        title: "Lửa trong hẻm nhỏ",
        opponent: "Thủy thủ Cáu Kỉnh",
        boss: false,
        rewardCard: "wok-storm",
      },
      {
        id: "harbor-2",
        title: "Con tàu không tên",
        opponent: "Bóng Sương trên boong",
        boss: false,
        rewardCard: "dragon-breath",
      },
      {
        id: "harbor-3",
        title: "Trái tim của lò",
        opponent: "Hỏa Linh bị tha hóa",
        boss: true,
        rewardCard: "chef-nhien",
      },
    ],
  },
  {
    id: "garden",
    title: "Vườn Xanh Tĩnh Lặng",
    school: "grove",
    art: "/assets/events/cooling-summer/banner-vietnam.webp",
    character: "Mộc",
    stages: [
      {
        id: "garden-1",
        title: "Lá thư dưới gốc cây",
        opponent: "Vệ binh Rễ Khô",
        boss: false,
        rewardCard: "spring-feast",
      },
      {
        id: "garden-2",
        title: "Đường về mùa xuân",
        opponent: "Bầy Sương Rừng",
        boss: false,
        rewardCard: "forest-oath",
      },
      {
        id: "garden-3",
        title: "Lời hứa của Cổ Thụ",
        opponent: "Cổ Thụ Quên Lãng",
        boss: true,
        rewardCard: "chef-moc",
      },
    ],
  },
  {
    id: "tide",
    title: "Biển Ký Ức",
    school: "tide",
    art: "/assets/events/tokyo-matsuri/banner.webp",
    character: "Hải",
    stages: [
      {
        id: "tide-1",
        title: "Con sóng mang lời nhắn",
        opponent: "Ngư dân Lạc Hướng",
        boss: false,
        rewardCard: "recipe-scroll",
      },
      {
        id: "tide-2",
        title: "Nhà bếp dưới đáy biển",
        opponent: "Bếp trưởng Ảo Ảnh",
        boss: false,
        rewardCard: "tidal-cut",
      },
      {
        id: "tide-3",
        title: "Công thức của cha",
        opponent: "Hải Vương Lãng Quên",
        boss: true,
        rewardCard: "chef-hai",
      },
    ],
  },
  {
    id: "moon",
    title: "Thành Phố Đường Sao",
    school: "sugar",
    art: "/assets/events/seoul-midnight/banner.webp",
    character: "Liên",
    stages: [
      {
        id: "moon-1",
        title: "Tiệm bánh đóng cửa",
        opponent: "Khách Lạ Không Mơ",
        boss: false,
        rewardCard: "sweet-dream",
      },
      {
        id: "moon-2",
        title: "Chuyến tàu tới các vì sao",
        opponent: "Người Soát Vé Sương",
        boss: false,
        rewardCard: "starlight",
      },
      {
        id: "moon-3",
        title: "Điều ước của Liên",
        opponent: "Thiên Nga Đêm Trắng",
        boss: true,
        rewardCard: "chef-lien",
      },
    ],
  },
  {
    id: "last-table",
    title: "Bữa Tiệc Bình Minh",
    school: "hearth",
    art: "/assets/events/new-year-feast/banner-tet.webp",
    character: "Cả nhóm",
    stages: [
      {
        id: "last-table-1",
        title: "Những ghế trống",
        opponent: "Người Khách Bị Lãng Quên",
        boss: false,
        rewardCard: "family-table",
      },
      {
        id: "last-table-2",
        title: "Tên thật của Sương",
        opponent: "Ký Ức Không Tên",
        boss: false,
        rewardCard: "hearth-legacy",
      },
      {
        id: "last-table-3",
        title: "Mời mọi người ăn cơm",
        opponent: "Sương Nhạt · Dạng cuối",
        boss: true,
        rewardCard: "last-flame",
      },
    ],
  },
]

// IDs, unlock order and card rewards are unchanged for existing players.
export const LEGACY_CHAPTERS: Chapter[] = CHAPTER_LAYOUT.map((chapter, index) => ({
  ...chapter,
  school: chapter.school as Chapter["school"],
  art: STORY_ART[stageArtId(chapter.stages[0].id)].src,
  subtitle: CHAPTER_COPY[index][0],
  intro: CHAPTER_COPY[index][1],
  stages: chapter.stages.map((stage) => ({
    ...stage,
    dialogue: SCENES[stage.id].before
      .map((line) => `${line.speaker}: ${line.text}`)
      .join("\n\n"),
    ending: SCENES[stage.id].after
      .map((line) => `${line.speaker}: ${line.text}`)
      .join("\n\n"),
  })),
}))
export const CHAPTERS = [...LEGACY_CHAPTERS, ...LIVING_CHAPTERS]
export const STAGES = CHAPTERS.flatMap((chapter, chapterIndex) =>
  chapter.stages.map((stage, stageIndex) => ({
    ...stage,
    chapter,
    index: chapterIndex * 3 + stageIndex,
  })),
)
export const STAGE_MAP = Object.fromEntries(
  STAGES.map((stage) => [stage.id, stage]),
)
export function isStageUnlocked(id: string, cleared: string[], ending?: "remember" | "release" | null) {
  const stage = STAGE_MAP[id]
  return (
    !!stage &&
    (stage.index < 18 || !!ending) &&
    STAGES.slice(0, stage.index).every((previous) =>
      cleared.includes(previous.id),
    )
  )
}
