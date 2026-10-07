import type { StoryArtId } from "./storyArt"

export interface CulturalPage {
  id: string
  unlockStageId: string
  title: string
  englishTitle: string
  region: string
  englishRegion: string
  art: StoryArtId
  memory: string
  fact: string
  englishFact: string
  sources: {
    label: string
    url: string
  }[]
}

// Facts and fictional memories are separate. Discovery is derived from existing
// stage completion, so older saves need neither migration nor new rewards.
export const CULTURAL_PAGES: CulturalPage[] = [
  {
    id: "tet",
    unlockStageId: "lantern-2",
    title: "Tết · Mỗi nhà một vị",
    englishTitle: "Tết · A recipe in every home",
    region: "Nếp sum họp · nhiều vùng miền",
    englishRegion: "Family reunions across regions",
    art: "tet-kitchen",
    memory:
      "Bà chỉ bạn cách buộc lạt; chiếc ghế trống giữ phần bánh của người chưa về. Sau trận đấu, cả chợ lại chia nhau việc trông nồi.",
    fact: "Tết Nguyên Đán là dịp nhiều gia đình sum họp, tưởng nhớ tổ tiên và chúc nhau năm mới. Bánh chưng hình vuông, bánh tét hình trụ thường có nếp, đậu xanh và thịt, với nhiều biến thể theo gia đình và vùng miền. Mâm cỗ cũng khác nhau: miền Bắc thường có bánh chưng, nem; miền Nam có thịt kho hột vịt, canh khổ qua.",
    englishFact:
      "Tết, Vietnamese Lunar New Year, brings many families together to remember ancestors and exchange wishes. Square bánh chưng and cylindrical bánh tét commonly contain sticky rice, mung beans and pork, with family and regional variations. Festive meals vary too: bánh chưng and fried spring rolls are common in the north; braised pork with eggs and bitter melon soup in the south.",
    sources: [
      {
        label: "Vietnam Tourism · Tết và ẩm thực",
        url: "https://vietnam.travel/things-to-do/tet-tradition-reunion-taste",
      },
      {
        label: "Vietnam Tourism · Mâm cỗ vùng miền",
        url: "https://vietnam.travel/vi/things-to-do/travellers-guide-tet-holiday",
      },
    ],
  },
  {
    id: "bai-choi",
    unlockStageId: "harbor-1",
    title: "Bài Chòi · Một tiếng hô, nhiều người đáp",
    englishTitle: "Bài Chòi · Voices across a courtyard",
    region: "Cộng đồng thực hành ở miền Trung",
    englishRegion: "Practising communities in Central Vietnam",
    art: "bai-choi",
    memory:
      "Nhiên nhận ra tiếng hô cha từng dạy. Người nghệ nhân còn nhớ điệu, nhưng sương đã lấy mất tên người nhận bát cháo trên chuyến cứu hộ.",
    fact: "Nghệ thuật Bài Chòi ở miền Trung kết hợp âm nhạc, thơ, diễn xuất và nhiều hình thức sáng tạo. Có trò chơi Bài Chòi và trình diễn Bài Chòi; nghệ nhân Hiệu giữ vai trò dẫn dắt. Làm thẻ, dựng chòi và truyền dạy cũng là phần công việc của cộng đồng. UNESCO ghi danh năm 2017. Bàn đấu Vị Linh trong game có luật riêng, không mô phỏng luật Bài Chòi.",
    englishFact:
      "Bài Chòi in Central Vietnam combines music, poetry, acting and other arts. It includes both games and performances, led by Hiệu artists. Communities also make cards, build huts and pass on the practice. UNESCO inscribed it in 2017. This game's Flavor Spirit duels use their own rules; they do not reproduce Bài Chòi gameplay.",
    sources: [
      {
        label: "UNESCO · Nghệ thuật Bài Chòi",
        url: "https://ich.unesco.org/en/RL/the-art-of-bai-choi-in-central-viet-nam-01222",
      },
    ],
  },
  {
    id: "quan-ho",
    unlockStageId: "garden-1",
    title: "Quan họ · Đừng để lời mời mất câu đáp",
    englishTitle: "Quan họ · An invitation deserves a reply",
    region: "Bắc Ninh · Bắc Giang",
    englishRegion: "Bắc Ninh · Bắc Giang",
    art: "garden",
    memory:
      "Mộc tìm lại giọng mẹ trong câu hát đối đáp đã bỏ dở. Cô rót trà, mời bạn ngồi và dám hát cả lời giã bạn vốn khiến mình buồn.",
    fact: "Dân ca Quan họ gắn với các cộng đồng ở Bắc Ninh và Bắc Giang. Những nhóm người hát trao các câu đối đáp; lời ca có niềm vui gặp gỡ, tình cảm và nỗi buồn chia tay. Quan họ hiện diện trong lễ hội và cả những cuộc gặp thân tình, với cách đón khách, hát và giã bạn. UNESCO ghi danh năm 2009.",
    englishFact:
      "Quan họ folk songs belong to communities in Bắc Ninh and Bắc Giang. Groups of singers exchange verses about meeting, affection and parting. The practice appears at festivals and informal gatherings, with traditions of welcoming guests, singing and saying farewell. UNESCO inscribed it in 2009.",
    sources: [
      {
        label: "UNESCO · Dân ca Quan họ",
        url: "https://ich.unesco.org/en/RL/quan-h-bc-ninh-folk-songs-00183",
      },
    ],
  },
  {
    id: "don-ca-tai-tu",
    unlockStageId: "tide-1",
    title: "Đờn ca tài tử · Có chỗ cho một câu mới",
    englishTitle: "Đờn ca tài tử · Room for a new phrase",
    region: "Nam Bộ · miền sông nước",
    englishRegion: "Southern Vietnam · river country",
    art: "tide",
    memory:
      "Người khách Nam Bộ từng đờn trên thuyền mở lại câu nhạc cũ. Hải thôi đòi ký ức phải lặp đúng một đêm; ông viết tiếp sổ người trở về.",
    fact: "Đờn ca tài tử là nghệ thuật âm nhạc và ca hát ở Nam Bộ, gắn với đời sống và miền sông nước. Người thực hành biến tấu, điểm xuyết trên khung giai điệu; kỹ năng được truyền qua việc nghe, học và tập cùng người có kinh nghiệm. Những nhạc cụ được sử dụng gồm đàn kìm, đàn cò, đàn tranh… UNESCO ghi danh năm 2013.",
    englishFact:
      "Đờn ca tài tử is a Southern Vietnamese music and song tradition connected to everyday life and river landscapes. Performers improvise and ornament established melodic frameworks, learning by listening and practising with experienced musicians. Instruments include the moon lute, two-string fiddle and zither. UNESCO inscribed it in 2013.",
    sources: [
      {
        label: "UNESCO · Đờn ca tài tử Nam Bộ",
        url: "https://ich.unesco.org/en/RL/art-of-n-ca-tai-t-music-and-song-in-southern-viet-nam-00733",
      },
    ],
  },
  {
    id: "trung-thu",
    unlockStageId: "moon-1",
    title: "Trung Thu · Chia bánh, nối lại đèn",
    englishTitle: "Trung Thu · Shared cakes, glowing lanterns",
    region: "Đêm hội của trẻ em và gia đình",
    englishRegion: "A festival for children and families",
    art: "moon",
    memory:
      "Liên sửa chiếc đèn ông sao méo cho lũ trẻ rồi cắt bánh thành nhiều phần. Câu chuyện về người em trở thành lời mời sống tiếp cùng những người đang ở đây.",
    fact: "Tết Trung Thu diễn ra vào rằm tháng Tám âm lịch. Rước đèn, múa lân và bánh Trung Thu là những nét quen thuộc của dịp này. Đèn ông sao được trẻ em yêu thích; bánh nướng và bánh dẻo có nhiều loại nhân. Chuyện chú Cuội, cây đa trên cung trăng là một truyền thuyết được kể trong không khí hội trăng.",
    englishFact:
      "Trung Thu, the Mid-Autumn Festival, falls on the full moon of the eighth lunar month. Lantern processions, lion dances and mooncakes are familiar features. Children enjoy star lanterns; baked bánh nướng and sticky bánh dẻo come with varied fillings. Cuội and the banyan tree on the moon belong to a folk legend told around the festival.",
    sources: [
      {
        label: "Vietnam Tourism · Đêm hội Trung Thu",
        url: "https://www.vietnam.travel/things-to-do/vietnams-magical-mid-autumn-festival",
      },
      {
        label: "Vietnam Tourism · Rằm tháng Tám",
        url: "https://vietnam.travel/things-to-do/festival-event/mid-autumn-festival-0",
      },
    ],
  },
  {
    id: "xoe-thai",
    unlockStageId: "last-table-3",
    title: "Xòe Thái · Vòng tay còn chỗ cho bạn",
    englishTitle: "Xòe Thái · A circle with room for you",
    region: "Cộng đồng người Thái · Tây Bắc",
    englishRegion: "Thái communities · Northwestern Vietnam",
    art: "last-table",
    memory:
      "Lả, người khách Thái từ Tây Bắc, mời mọi người ra sân sau bữa cơm. Cô dạy lại điệu xòe mẹ truyền cho mình: ai đến muộn vẫn có chỗ trong vòng tay.",
    fact: "Nghệ thuật Xòe là một dấu ấn văn hóa của cộng đồng người Thái ở Tây Bắc Việt Nam. Xòe có nhiều hình thức; xòe vòng là hình thức phổ biến, với người múa cùng tạo vòng và bước theo nhịp. Nghệ thuật này được trao truyền trong gia đình, đội múa và trường học, thể hiện sự đón khách và mong ước cộng đồng hòa thuận. UNESCO ghi danh năm 2021.",
    englishFact:
      "Xòe is an important cultural practice of Thái communities in Northwestern Vietnam. There are several forms; circle xòe is especially popular, with dancers forming a circle and stepping in harmony. Families, dance groups and schools pass it on. It expresses hospitality and wishes for communal harmony. UNESCO inscribed it in 2021.",
    sources: [
      {
        label: "UNESCO · Nghệ thuật Xòe Thái",
        url: "https://www.unesco.org/archives/multimedia/document-5622",
      },
    ],
  },
]

export function discoveredCulture(clearedStages: readonly string[]) {
  const cleared = new Set(clearedStages)
  return CULTURAL_PAGES.filter((page) => cleared.has(page.unlockStageId))
}

export function cultureForStage(stageId: string) {
  return CULTURAL_PAGES.find((page) => page.unlockStageId === stageId)
}
