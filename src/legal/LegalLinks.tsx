import { Link } from "react-router-dom"
import "./legal.css"

export function LegalLinks() {
  return <nav className="legal-links" aria-label="Chính sách ứng dụng">
    <Link to="/legal/terms">Điều khoản</Link>
    <Link to="/legal/privacy">Quyền riêng tư</Link>
    <Link to="/legal/rights">Quyền sử dụng</Link>
  </nav>
}
