import { useState } from "react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Verify Certificate", to: "/verify", cta: true },
  { label: "Student Portal", to: "/student" },
  { label: "Fraud Analysis", to: "/fraud-detection" },
];

const featureCards = [
  {
    icon: "⛓",
    title: "Blockchain Certificate Verification",
    description:
      "Verify certificate records against registered cryptographic hashes to identify documents that do not match the original record.",
  },
  {
    icon: "🧠",
    title: "AI-Assisted Fraud Detection",
    description:
      "Analyze uploaded certificate documents for suspicious inconsistencies using AI when configured and rule-based analysis when unavailable.",
  },
  {
    icon: "🔒",
    title: "Secure Certificate Management",
    description:
      "Support authorized workflows for certificate issuance, verification, and revocation.",
  },
];

const steps = [
  {
    number: "01",
    title: "Issue",
    description:
      "An authorized issuer registers the certificate and its cryptographic hash.",
  },
  {
    number: "02",
    title: "Secure",
    description: "The certificate hash is recorded in the blockchain registry.",
  },
  {
    number: "03",
    title: "Verify",
    description:
      "The submitted certificate is checked against the registered record to identify mismatches or revoked credentials.",
  },
];

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="home-page">
      <header className="hc-navbar">
        <div className="hc-container navbar-inner">
          <Link to="/" className="brand" onClick={closeMenu}>
            <div className="brand-mark">C</div>
            <div className="brand-text">
              <div className="brand-name">CertiChain</div>
              <div className="brand-sub">Academic Credential Verification</div>
            </div>
          </Link>

          <nav className="nav" aria-label="Primary navigation">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`nav-link${link.cta ? " nav-link-cta" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="nav-actions">
            <Link to="/login" className="btn-ghost">
              Login
            </Link>
            <Link to="/signup" className="btn-cta">
              Sign Up
            </Link>
          </div>

          <button
            type="button"
            className="mobile-menu-button"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className={`mobile-nav-panel${menuOpen ? " open" : ""}`}>
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={
                link.cta
                  ? "mobile-nav-link mobile-nav-link-primary"
                  : "mobile-nav-link"
              }
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/login"
            className="mobile-nav-link mobile-nav-link-secondary"
            onClick={closeMenu}
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="mobile-nav-link mobile-nav-link-primary"
            onClick={closeMenu}
          >
            Sign Up
          </Link>
        </div>
      </header>

      <main>
        <section className="hc-hero">
          <div className="hc-container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">BLOCKCHAIN-POWERED • AI-ASSISTED</div>
              <h1 className="hero-title">
                <span className="hero-title-line">Academic Credentials.</span>
                <span className="hero-title-break" />
                <span className="gradient">Verified with Confidence.</span>
              </h1>
              <p className="hero-lead">
                Secure academic credentials with blockchain-backed verification
                and AI-assisted fraud detection. Help institutions issue
                certificates and verify their authenticity with confidence.
              </p>

              <div className="hero-ctas">
                <Link to="/verify" className="primary-btn">
                  Verify a Certificate →
                </Link>
                <Link to="/signup" className="secondary-btn">
                  Get Started
                </Link>
              </div>

              <div className="trust-row">
                <div className="trust-dot" />
                <div className="trust-text">
                  Certificate hashes are checked against the registered blockchain record.
                </div>
              </div>
            </div>

            <aside className="hero-preview">
              <div className="preview-card hero-card">
                <div className="preview-header">
                  <div className="preview-brand">
                    <div className="preview-brand-mark">C</div>
                    <div>
                      <div className="preview-title">CertiChain</div>
                      <div className="preview-sub">
                        Sample Academic Credential Preview
                      </div>
                    </div>
                  </div>
                  <div className="status-badge preview-demo">DEMO PREVIEW</div>
                </div>

                <div className="preview-document">
                  <div className="preview-document-icon">📄</div>
                  <div className="preview-document-copy">
                    <p className="preview-kicker">Sample certificate snapshot</p>
                    <h3>Academic Credential</h3>
                    <p className="preview-text">
                      This is a design preview only. No live verification is implied by this sample card.
                    </p>
                  </div>
                </div>

                <div className="preview-body">
                  <div className="detail-row">
                    <div className="k">Student</div>
                    <div className="v">DEMO — Alice Example</div>
                  </div>
                  <div className="detail-row">
                    <div className="k">Degree</div>
                    <div className="v">DEMO — B.Sc. Computer Science</div>
                  </div>
                  <div className="detail-row">
                    <div className="k">Certificate ID</div>
                    <div className="v">DEMO-001</div>
                  </div>
                </div>

                <div className="preview-footer">
                  <div className="verification-chip success">
                    Blockchain record • Demo indicator
                  </div>
                  <div className="chain-label">
                    Sample only — not a live verified credential
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="hc-features">
          <div className="hc-container section-heading">
            <div className="section-eyebrow">Platform highlights</div>
            <h2>Built for academic integrity, verification, and trust.</h2>
            <p>
              A polished presentation layer for certificate verification, fraud analysis, and secure management workflows.
            </p>
          </div>

          <div className="hc-container features-grid">
            {featureCards.map((feature) => (
              <article key={feature.title} className="feature-card">
                <div className="icon-circle">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="hc-steps">
          <div className="hc-container section-heading">
            <div className="section-eyebrow">Workflow</div>
            <h2>How it works</h2>
            <p>
              Simple, auditable steps designed for a clear academic verification story.
            </p>
          </div>

          <div className="hc-container steps-grid">
            {steps.map((step) => (
              <article key={step.number} className="step-card">
                <div className="step-number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="hc-final-cta">
          <div className="hc-container final-cta-card">
            <div>
              <div className="section-eyebrow">Final check</div>
              <h2>Make Academic Verification More Trustworthy.</h2>
              <p>
                Explore how CertiChain combines blockchain verification and AI-assisted analysis to support academic credential integrity.
              </p>
            </div>
            <Link to="/verify" className="primary-btn">
              Verify a Certificate
            </Link>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="hc-container footer-grid">
          <div>
            <div className="footer-brand">
              <div className="brand-mark">C</div>
              <div>
                <div className="brand-name">CertiChain</div>
                <div className="brand-sub">Academic Credential Verification</div>
              </div>
            </div>
            <p>
              A final-year academic project for blockchain-backed certificate verification and AI-assisted fraud detection.
            </p>
          </div>

          <div className="footer-links">
            <Link to="/" className="footer-link">Home</Link>
            <Link to="/verify" className="footer-link">Verify Certificate</Link>
            <Link to="/student" className="footer-link">Student Portal</Link>
            <span className="footer-badge">Academic Project</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
