export const STORY_ART = {
  "memory-flare": {
    src: "/assets/tcg/story/memory-flare.webp",
    title: "Bàn tay đang giữ chiếc muôi là của bạn",
    alt: "Người giữ vị cầm muôi bạc giữa vòng hơi sáng; ký ức người bà gói bánh chưng hiện lên bên bàn đấu.",
  },
  lantern: {
    src: "/assets/tcg/story/lantern.webp",
    title: "Mùi bánh đánh thức một cái tên",
    alt: "Phố đèn lồng trong sương, hai bát cơm và chiếc muôi bạc bên một Vị Linh bánh mì phát sáng.",
  },
  harbor: {
    src: "/assets/tcg/story/harbor.webp",
    title: "Bữa cháo chưa từng nguội",
    alt: "Con tàu cũ ở bến cảng, nồi cháo trong ký ức còn ấm, vé tàu cháy và hai người nhìn ra màn sương trên biển.",
  },
  "tet-kitchen": {
    src: "/assets/tcg/story/tet-kitchen.webp",
    title: "Buộc vừa thôi, bánh còn cần chỗ nở",
    alt: "Minh họa kỳ ảo: bà và đứa trẻ gói bánh chưng, người lữ khách nối lạt bên bánh tét, gia đình trông nồi và một ghế trống.",
  },
  "bai-choi": {
    src: "/assets/tcg/story/bai-choi.webp",
    title: "Tiếng hô tìm lại một người được mời",
    alt: "Minh họa kỳ ảo lấy cảm hứng Bài Chòi miền Trung: nghệ nhân Hiệu cất tiếng hô giữa các chòi tre, Nhiên và người lữ khách nghe bên nồi cháo.",
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
    title: "Chia bánh, nối lại một đêm trăng",
    alt: "Minh họa kỳ ảo: Liên sửa đèn ông sao bên bánh nướng, bánh dẻo và Vị Linh tím; trẻ em rước đèn ở phố ven sông dưới trăng tròn.",
  },
  "last-table": {
    src: "/assets/tcg/story/last-table.webp",
    title: "Sáu chiếc ghế, một lời mời",
    alt: "Bà bên bàn ăn sáu ghế trong màn sương, chiếc muôi nứt và ánh sáng năm hương vị hội tụ.",
  },
} as const

export type StoryArtId = keyof typeof STORY_ART

export function stageArtId(stageId: string): StoryArtId {
  if (stageId === "lantern-2") return "tet-kitchen"
  if (stageId === "harbor-1") return "bai-choi"
  if (stageId.startsWith("last-table-")) return "last-table"
  const prefix = stageId.split("-")[0]
  return prefix in STORY_ART ? prefix as StoryArtId : "lantern"
}
