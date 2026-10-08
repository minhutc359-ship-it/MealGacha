import { useEffect, useState } from "react"
import { createPostcard, type PostcardInput } from "../../game/postcard"
import { Dialog } from "./Dialog"
export function ResultPostcard(props: PostcardInput) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        className="tcg-button ghost"
        disabled={!!props.deck && !props.deck.cards.length}
        onClick={() => setOpen(true)}
      >
        ✉ Tạo bưu thiếp
      </button>
      {open && <PostcardDialog {...props} onClose={() => setOpen(false)} />}
    </>
  )
}
function PostcardDialog({
  battle,
  deck,
  onClose,
}: PostcardInput & { onClose: () => void }) {
  const [result, setResult] = useState<{
    blob: Blob
    url: string
  } | null>(null),
    [status, setStatus] = useState("Đang viết bưu thiếp…")
  const invitation = `Mời bạn khám phá Soul of Meal: giữ bàn ăn, ghép công thức và tìm lại ký ức bên bếp Việt Nam. ${window.location.origin}/game`
  useEffect(() => {
    let active = true,
      url = ""
    createPostcard({ battle, deck })
      .then((blob) => {
        if (active) {
          url = URL.createObjectURL(blob)
          setResult({ blob, url })
          setStatus("")
        }
      })
      .catch((error) => {
        if (active) setStatus((error as Error).message)
      })
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [battle, deck])
  return (
    <Dialog title="Bưu thiếp từ Bàn Ký Ức" onClose={onClose}>
      <p>Ảnh chỉ chứa kết quả hoặc bộ bài, không chứa mã tiến trình.</p>
      {result && (
        <>
          <img
            className="tcg-postcard-preview"
            src={result.url}
            alt="Bưu thiếp Soul of Meal với chân dung người giữ vị và kết quả hành trình"
          />
          <div className="tcg-dialog-actions">
            <a
              className="tcg-button primary"
              href={result.url}
              download="soul-of-meal-buu-thiep.png"
            >
              Tải ảnh PNG
            </a>
            <button
              className="tcg-button ghost"
              onClick={async () => {
                const file = new File(
                  [result.blob],
                  "soul-of-meal-buu-thiep.png",
                  { type: "image/png" },
                )
                if (navigator.canShare?.({ files: [file] })) {
                  try {
                    await navigator.share({
                      files: [file],
                      title: "Soul of Meal · Bàn Ký Ức",
                      text: invitation,
                    })
                  } catch (error) {
                    if ((error as Error).name !== "AbortError")
                      setStatus("Hãy tải ảnh rồi chia sẻ từ thư viện thiết bị.")
                  }
                } else {
                  try {
                    await navigator.clipboard.writeText(invitation)
                    setStatus("Đã copy lời mời. Tải ảnh để gửi cùng bạn bè.")
                  } catch {
                    setStatus("Hãy copy lời mời bên dưới.")
                  }
                }
              }}
            >
              Chia sẻ
            </button>
          </div>
        </>
      )}
      <textarea
        className="tcg-postcard-invitation"
        aria-label="Lời mời chơi Soul of Meal"
        value={invitation}
        readOnly
        onFocus={(e) => e.target.select()}
      />
      {status && <p role="status">{status}</p>}
    </Dialog>
  )
}
