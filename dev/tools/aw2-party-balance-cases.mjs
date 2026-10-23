const starter = ["aw2-than", "aw2-lua", "aw2-lam", "aw2-moc-non", "aw2-suong"]
const substitutions = {
  muoi: "aw2-suong",
  nhien: "aw2-lua",
  hai: "aw2-than",
  lien: "aw2-lam",
  moc: "aw2-moc-non",
  bach: "aw2-than",
}
export const PARTY_BALANCE_CASES = [
  { name: "starter", party: starter, emphasis: "protection" },
  ...Object.entries(substitutions).map(([name, replaced]) => ({
    name,
    party: starter.map((id) => (id === replaced ? `aw2-${name}` : id)),
    emphasis: "protection",
  })),
  ...["protection", "attack"].flatMap((emphasis) => [
    {
      name: `van-${emphasis}`,
      party: starter.map((id) => (id === "aw2-moc-non" ? "aw2-van" : id)),
      emphasis,
    },
    {
      name: `mixed-${emphasis}`,
      party: ["aw2-hai", "aw2-nhien", "aw2-moc", "aw2-lien", "aw2-van"],
      emphasis,
    },
    {
      name: `shield-${emphasis}`,
      party: ["aw2-bach", "aw2-muoi", "aw2-moc", "aw2-lien", "aw2-van"],
      emphasis,
    },
  ]),
  {
    name: "no-tank",
    party: ["aw2-lua", "aw2-nhien", "aw2-lam", "aw2-moc-non", "aw2-suong"],
    emphasis: "protection",
  },
  {
    name: "no-healer",
    party: ["aw2-than", "aw2-lua", "aw2-muoi", "aw2-moc-non", "aw2-suong"],
    emphasis: "protection",
  },
  {
    name: "protection-heavy",
    party: ["aw2-than", "aw2-hai", "aw2-bach", "aw2-lien", "aw2-van"],
    emphasis: "protection",
  },
]
