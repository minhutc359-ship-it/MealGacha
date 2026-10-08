import { Link } from "react-router-dom"

export function ModeSwitch({ mode }: { mode: "tcg" | "chest" }) {
  const next = mode === "tcg" ? "Rương vị giác" : "TCG"
  return (
    <Link
      className={`meal-mode-switch mode-${mode}`}
      to={mode === "tcg" ? "/chest" : "/?tab=home"}
      aria-label={`Chuyển sang ${next}`}
      title={`Chuyển sang ${next} · Tiến trình được giữ lại`}
    >
      <span aria-hidden="true">⇄</span> {next}
    </Link>
  )
}
