import { BalanceDisclosure } from "./BalanceDisclosure"
import { CharacterReadinessDisclosure } from "./CharacterReadinessDisclosure"
import { ContentAcceptanceDisclosure } from "./ContentAcceptanceDisclosure"
import { PerformanceDisclosure } from "./PerformanceDisclosure"
import { UatDisclosure } from "./UatDisclosure"
import { ReleaseCandidateDisclosure } from "./ReleaseCandidateDisclosure"

export default function ReviewDisclosures() {
  return (
    <>
      <BalanceDisclosure />
      <CharacterReadinessDisclosure />
      <ContentAcceptanceDisclosure />
      <PerformanceDisclosure />
      <UatDisclosure />
      <ReleaseCandidateDisclosure />
    </>
  )
}
