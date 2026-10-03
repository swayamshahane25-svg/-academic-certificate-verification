import { Link } from "react-router-dom";

function AccessDenied() {
  return (
    <div className="auth-shell">
      <div className="auth-card narrow-card">
        <div className="auth-brand">
          <div className="brand-mark">C</div>
          <span>CertiChain</span>
        </div>

        <h1>Access denied</h1>
        <p className="auth-subtitle">You do not have permission to view this page.</p>

        <Link to="/" className="primary-btn auth-submit" style={{ display: "inline-block", textAlign: "center" }}>
          Return home
        </Link>
      </div>
    </div>
  );
}

export default AccessDenied;
