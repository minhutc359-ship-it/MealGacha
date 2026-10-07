export const STORY_ART = {
  lantern: {
    src: "/assets/tcg/story/lantern.webp",
    title: "Mùi bánh đánh thức một cái tên",
    alt: "Phố đèn lồng trong sương, hai bát cơm và chiếc muôi bạc bên một Vị Linh bánh mì phát sáng.",
  },
  harbor: {
    src: "/assets/tcg/story/harbor.webp",
    title: "Bữa súp chưa từng nguội",
    alt: "Con tàu cũ ở bến cảng, nồi súp còn ấm, vé tàu cháy và hai người nhìn ra màn sương trên biển.",
  },
  garden: {
    src: "/assets/tcg/story/garden.webp",
    title: "Một ký ức buồn vẫn có thể nảy mầm",
    alt: "Lá thư dưới rễ đa cổ, người lữ khách và Mộc chăm một mầm cây xám giữa khu vườn.",
  },
  tide: {
    src: "/assets/tcg/story/tide.webp",
    title: "Căn bếp không có mùi",
    alt: "Căn bếp gia đình dưới biển xanh, người cầm muôi bạc đứng trước hình bóng người bà ở bàn ăn.",
  },
  moon: {
    src: "/assets/tcg/story/moon.webp",
    title: "Dành một chỗ cho điều chưa được kể",
    alt: "Tiệm bánh và sân ga dưới trời sao, hai người bên bàn nhỏ với Vị Linh bánh ngọt trong làn hơi tím.",
  },
  "last-table": {
    src: "/assets/tcg/story/last-table.webp",
    title: "Sáu chiếc ghế, một lời mời",
    alt: "Bà bên bàn ăn sáu ghế trong màn sương, chiếc muôi nứt và ánh sáng năm hương vị hội tụ.",
  },
} as const

export type StoryArtId = keyof typeof STORY_ART

export function stageArtId(stageId: string): StoryArtId {
  if (stageId.startsWith("last-table-")) return "last-table"
  const prefix = stageId.split("-")[0]
  return prefix in STORY_ART ? prefix as StoryArtId : "lantern"
}
