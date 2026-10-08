import { Link } from "react-router-dom"

export function ModeSwitch({ mode }: { mode: "tcg" | "chest" | "auto" }) {
  return (
    <nav className="meal-mode-selector" aria-label="Chuyển chế độ game">
      {([
        { id: "tcg", label: "TCG", name: "TCG", url: "/?tab=home" },
        { id: "chest", label: "Rương", name: "Rương vị giác", url: "/chest" },
        {
          id: "auto",
          label: "Auto chess",
          name: "Auto chess",
          url: "/autochess",
        },
      ] as const)
        .filter((m) => m.id !== mode)
        .map((m) => (
          <Link
            key={m.id}
            className={`meal-mode-switch mode-${mode}`}
            to={m.url}
            aria-label={`Chuyển sang ${m.name}`}
            title={`Chuyển sang ${m.name} · Tiến trình được giữ lại`}
          >
            <span aria-hidden="true">⇄</span> {m.label}
          </Link>
        ))}
    </nav>
  )
}
