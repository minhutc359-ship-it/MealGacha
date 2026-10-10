import type { StoryLine } from "./narrative"
import type { StoryArtId } from "./storyArt"

interface DramaticBeat {
  title: string
  art: StoryArtId
  lines: StoryLine[]
}
// Only campaign boss scenes use these reveals. Weekly and NPC duels keep a
// generic scene so they cannot reveal a chapter the player has not opened.
export const DRAMATIC_BEATS: Record<string, DramaticBeat> = {
  "lantern-3": {
    title: "Chiếc ghế thứ sáu",
    art: "tet-kitchen",
    lines: [
      {
        speaker: "Kẻ Canh Bếp",
        text: "Ta bảo vệ căn bếp này, nhưng sẽ không giấu chuyện thay Bách. Vì sao chiếc ghế dành cho con lại không ghi tên?",
        beat: "reveal",
      },
      {
        speaker: "Bách",
        text: "Qua trận này ta sẽ trả lời. Hãy giữ ít nhất một Hộ vệ trên sân khi lượt địch kết thúc. Bảo vệ bếp thành công ba lần sẽ thắng trận.",
      },
      {
        speaker: "Bạn",
        text: "Tôi sẽ giữ bếp. Nhưng sau trận, ông phải nhìn tôi khi trả lời.",
        beat: "resolve",
      },
    ],
  },
  "harbor-3": {
    title: "Tiếng gọi không phải mệnh lệnh",
    art: "harbor",
    lines: [
      {
        speaker: "Hỏa Linh",
        text: "Nếu rời bàn, ai sẽ nghe cha cô gọi? Ta giữ tiếng ấy nóng suốt mười bảy năm.",
      },
      {
        speaker: "Nhiên",
        text: "Cha gọi để người ta lên bờ, không để họ ở lại tàu. Hạ ba quân địch để giải cứu ba Vị Linh; cháo còn phần cho người trở về.",
        beat: "resolve",
      },
      {
        speaker: "Bạn",
        text: "Lửa đã mạnh gấp đôi. Tôi phải giữ ý chí và tự chọn tiếng gọi mình đáp.",
      },
    ],
  },
  "garden-3": {
    title: "Mầm xám",
    art: "garden",
    lines: [
      {
        speaker: "Cổ Thụ",
        text: "Ta hồi phục từ những ngày không ai chịu kể đoạn buồn. Các con định trồng một câu chuyện hoàn hảo nữa sao?",
      },
      {
        speaker: "Mộc",
        text: "Không. Tôi giữ cả câu giã bạn của mẹ. Một mầm xám cũng có quyền mọc ở khu vườn này.",
        beat: "tender",
      },
      {
        speaker: "Bạn",
        text: "Boss đang hồi bốn ý chí mỗi lượt. Tôi sẽ triệu hồi thêm quân, cường hóa rồi dồn sát thương trong cùng một lượt.",
      },
    ],
  },
  "tide-3": {
    title: "Một cái tên chưa được viết",
    art: "tide",
    lines: [
      {
        speaker: "Hải Vương",
        text: "Một tiếng vọng mà đòi viết vào sổ người sống? Ta có vô số ký ức, con chỉ có một chiếc muôi.",
      },
      {
        speaker: "Hải",
        text: "Vậy tôi chừa một dòng trống. Người đang đứng đây sẽ tự chọn tên; không ai viết hộ.",
        beat: "resolve",
      },
      {
        speaker: "Bạn",
        text: "Nó đang rút thêm hai lá. Tôi phải gây sức ép trước khi những công thức cũ phủ kín bàn.",
      },
    ],
  },
  "moon-3": {
    title: "Đèn méo vẫn sáng",
    art: "moon",
    lines: [
      {
        speaker: "Thiên Nga",
        text: "Trong điều ước của bà, không có đèn méo, không có bánh cháy, không có người phải nói lời từ biệt.",
      },
      {
        speaker: "Liên",
        text: "Nhưng cũng không có đứa trẻ nào tự sửa được chiếc đèn. Tôi chọn một đêm được sống, kể cả khi sáng mai nó kết thúc.",
        beat: "resolve",
      },
      {
        speaker: "Bạn",
        text: "Lớp chắn đã dày hơn. Tôi sẽ dồn đòn vào một mục tiêu, giữ phép cho đúng khoảnh khắc.",
      },
    ],
  },
  "last-table-3": {
    title: "Một công thức sương không biết",
    art: "last-table",
    lines: [
      {
        speaker: "Sương Nhạt",
        text: "Ta biết mọi món Mai nhớ. Con định đánh thắng chính ký ức đã tạo ra con sao?",
        beat: "reveal",
      },
      {
        speaker: "Liên",
        text: "Cô ấy biết chiếc đèn tôi sửa hôm nay. Mai chưa từng thấy chiếc đèn ấy, nên ký ức của ngươi không thể biết chuyện vừa xảy ra.",
      },
      {
        speaker: "Bạn",
        text: "Tôi mang cả những điều mới ra bàn. Đốt, hồi, rút vẫn theo nhịp cũ; nước đi tiếp theo là do tôi chọn.",
        beat: "resolve",
      },
    ],
  },
}
