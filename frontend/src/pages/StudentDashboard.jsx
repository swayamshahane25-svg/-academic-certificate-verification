import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function StudentDashboard() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    async function loadCertificates() {
      try {
        const response = await fetch("http://localhost:5050/api/certificate/lookup/CERT-001?hash=demo", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setCertificates(data ? [data] : []);
        } else {
          setCertificates([]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadCertificates();
  }, [token, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">C</div>
          <div>
            <p className="brand-name">CertiChain</p>
            <span className="brand-subtitle">Student Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Student navigation">
          <Link className="sidebar-nav-item active" to="/student-dashboard">Dashboard</Link>
          <Link className="sidebar-nav-item" to="/student">Verify</Link>
          <Link className="sidebar-nav-item" to="/fraud-detection">Fraud Detection</Link>
          <button type="button" className="nav-placeholder" onClick={handleLogout}>Logout</button>
        </nav>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Student Dashboard</p>
            <h1>Welcome, {user.name}</h1>
          </div>

          <div className="header-actions">
            <div className="issuer-pill">University: {user.university || "—"}</div>
            <button type="button" className="primary-btn dashboard-primary-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card"><div className="stat-label">My Certificates</div><div className="stat-value">{certificates.length}</div></div>
          <div className="stat-card success-card"><div className="stat-label">Verification</div><div className="stat-value">Available</div></div>
          <div className="stat-card warn-card"><div className="stat-label">QR Links</div><div className="stat-value">Ready</div></div>
        </section>

        <section className="table-panel">
          <div className="table-toolbar">
            <div>
              <h2>My Certificates</h2>
              <p>Certificates associated with your account.</p>
            </div>
          </div>

          {!loading && (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Certificate ID</th>
                    <th>University</th>
                    <th>Status</th>
                    <th>Issuer</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.length === 0 ? (
                    <tr><td colSpan="4">No certificates associated with this account yet.</td></tr>
                  ) : certificates.map((certificate) => (
                    <tr key={certificate.certificateId || certificate.id}>
                      <td>{certificate.certificateId || "—"}</td>
                      <td>{certificate.university || "—"}</td>
                      <td>{certificate.revoked ? "Revoked" : "Active"}</td>
                      <td>{certificate.issuer || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;
