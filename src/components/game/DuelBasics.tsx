import { DUEL_BASICS } from "../../game/battleCoach"

export function DuelBasics() {
  return (
    <ol className="tcg-duel-basics">
      {DUEL_BASICS.map((item) => (
        <li key={item.title}>
          <b>{item.title}</b>
          <p>{item.text}</p>
        </li>
      ))}
    </ol>
  )
}
