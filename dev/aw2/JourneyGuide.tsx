interface Props {
  objective: string
}

export function JourneyGuide({ objective }: Props) {
  return (
    <section className="aw2-journey-guide" aria-label="Mục tiêu hành trình">
      <h2>Mục tiêu trước mắt</h2>
      <p className="aw2-objective" data-testid="quest-objective">
        {objective}
      </p>
      <details>
        <summary>Hướng dẫn di chuyển, lưu và ghé bàn</summary>
        <ul>
          <li>
            Chạm lối đi để đến nơi, hoặc dùng WASD/mũi tên khi đang chọn bản đồ.
            Đến gần người, đồ vật hoặc cửa rồi nhấn E / Tương tác. Tab chọn nút;
            Enter hoặc Space kích hoạt nút. Escape đóng hội thoại.
          </li>
          <li>
            Hành trình nối Làng → Phố → Sân → Kho → Lửa → Bàn. Đến gần cửa rồi
            tương tác để đi qua; đi ngược lại để trở về.
          </li>
          <li>
            Đi bộ chưa lưu vị trí. Chọn Lưu vị trí trước khi rời trang; nhận
            nhiệm vụ, mở rương hoặc ghé bàn cũng lưu tiến trình. Đọc lại đưa bạn
            về lần lưu gần nhất.
          </li>
          <li>
            Mở Đội và túi đồ để xem nguyên liệu. Khi bếp đã sáng, đến gần Dì Gác
            Bếp hoặc ngọn lửa để nấu rồi chia một bữa ấm.
          </li>
          <li>
            Ghé nhanh TCG / Auto Chess hoặc hai bàn ở Phố để luyện tập bằng tài
            nguyên mượn. Các ván không tiêu túi đồ hoặc nhận quà hành trình; rời
            bàn hay tải lại sẽ bỏ ván.
          </li>
          <li>
            Sau thử thách ở Phòng Bàn, chọn Lưu kết quả và trở về. Khi thắng,
            đọc ghi chép bên chén rồi về Bà Giữ Chỗ để hoàn tất lời mời.
          </li>
        </ul>
      </details>
    </section>
  )
}
