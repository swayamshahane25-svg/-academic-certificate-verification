import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="logo-wrap">
          <div className="brand-mark">C</div>
          <div className="logo-text">CertiChain</div>
        </div>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/verify">Verify</Link>
          <Link to="/student">Student Portal</Link>
          <Link to="/login">Login</Link>
          <Link to="/signup">Sign Up</Link>
        </div>
      </nav>

      <main className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">BLOCKCHAIN + AI</p>
          <h1>Academic credentials you can trust.</h1>
          <p className="lead">
            CertiChain helps institutions issue, verify, and protect academic certificates with secure blockchain-backed proofs and AI-assisted fraud detection.
          </p>
          <div className="hero-actions">
            <Link to="/verify" className="primary-btn">Verify Certificate</Link>
            <Link to="/login" className="secondary-btn">Login</Link>
          </div>
        </div>

        <div className="hero-card">
          <div className="shield">✓</div>
          <h2>Certificate Verified</h2>
          <p>Blockchain-secured credential</p>
          <div className="status-pill"><span />Authentic & Secure</div>
        </div>
      </main>
    </div>
  );
}

export default Home;
