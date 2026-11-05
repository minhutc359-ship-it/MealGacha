/** Original vector ornaments: lotus, rice and concentric bronze-drum geometry. */
export function DuelCulture({
  kind = "drum",
}: {
  kind?: "drum" | "lotus" | "rice"
}) {
  return (
    <svg
      className={`duel-culture is-${kind}`}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      {kind === "drum" ? (
        <>
          <circle cx="50" cy="50" r="45" />
          <circle cx="50" cy="50" r="37" />
          <circle cx="50" cy="50" r="22" />
          {Array.from({ length: 12 }, (_, i) => (
            <path
              key={i}
              d="M50 10L53 19L50 16L47 19Z"
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
          <path d="M50 26L55 43L72 40L59 51L68 66L52 59L40 73L43 55L26 50L43 45Z" />
        </>
      ) : kind === "lotus" ? (
        <>
          <path d="M50 81C24 68 24 40 50 16C76 40 76 68 50 81Z" />
          <path d="M50 81C15 82 4 60 10 39C34 38 48 53 50 81ZM50 81C85 82 96 60 90 39C66 38 52 53 50 81Z" />
          <path d="M50 81C27 81 18 68 19 57M50 81C73 81 82 68 81 57" />
        </>
      ) : (
        <>
          <path d="M25 90Q49 68 59 10" />
          {Array.from({ length: 6 }, (_, i) => (
            <g key={i} transform={`translate(${35 + i * 3} ${67 - i * 9})`}>
              <path d="M0 0Q-17-5-13-16Q2-16 0 0ZM3-3Q20-6 18-19Q4-19 3-3Z" />
            </g>
          ))}
        </>
      )}
    </svg>
  )
}
