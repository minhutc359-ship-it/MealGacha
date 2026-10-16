import { Link, useLocation } from "react-router-dom"
import { useEffect } from "react"
import { POLICIES, POLICY_DATE, POLICY_VERSION, SUPPORT_NOTICE, type PolicyId } from "../legal/policies"
import { LegalLinks } from "../legal/LegalLinks"

export function LegalPage() {
  const location = useLocation()
  const name = location.pathname.split("/").pop()
  const id: PolicyId = name === "privacy" || name === "rights" ? name : "terms"
  const policy = POLICIES[id]
  useEffect(() => {
    if (location.hash === "#support") document.getElementById("support")?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [id, location.hash])
  return <main className="legal-page">
    <header><Link className="legal-home" to="/">← Soul of Meal</Link><LegalLinks /></header>
    <article>
      <p className="legal-date">Chính sách {POLICY_VERSION} · Cập nhật {POLICY_DATE}</p>
      <h1>{policy.title}</h1><p className="legal-intro">{policy.intro}</p>
      {policy.sections.map(section => <section key={section.title}>
        <h2>{section.title}</h2>
        {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      </section>)}
    </article>
    <footer><p id="support">{SUPPORT_NOTICE}</p>
      <a href="/legal/THIRD_PARTY_LICENSES.txt" target="_blank" rel="noopener noreferrer">Giấy phép thư viện</a>
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors · ODbL</a>
    </footer>
  </main>
}
