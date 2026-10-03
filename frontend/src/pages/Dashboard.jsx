import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", to: "/dashboard", active: true },
  { label: "Issue Certificate", to: "/issue" },
  { label: "Certificates", to: "/dashboard" },
  { label: "Verify Certificate", to: "/verify" },
  { label: "Revoke Certificate", to: "/revoke" },
  { label: "Profile", to: "/profile" },
  { label: "Logout", to: "/login", placeholder: true },
];

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [stats, setStats] = useState({
    totalCertificates: 0,
    verifiedCertificates: 0,
    revokedCertificates: 0,
  });
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [revokeLoadingId, setRevokeLoadingId] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsResponse, certificatesResponse] = await Promise.all([
        fetch("http://localhost:5050/api/dashboard/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5050/api/certificates", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!statsResponse.ok || !certificatesResponse.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const statsData = await statsResponse.json();
      const certificatesData = await certificatesResponse.json();

      setStats(statsData);
      setCertificates(certificatesData.certificates || []);
    } catch (loadError) {
      console.error(loadError);
      setError("Unable to connect to the CertiChain backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    loadDashboard();
  }, [token, navigate]);

  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === "0") {
      return "Unknown";
    }

    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const filteredCertificates = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();

    return certificates.filter((certificate) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? !certificate.revoked
            : certificate.revoked;

      if (!matchesStatus) {
        return false;
      }

      if (!lowerSearch) {
        return true;
      }

      const searchableText = [
        certificate.certificateId,
        certificate.studentName,
        certificate.degree,
        certificate.university,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(lowerSearch);
    });
  }, [certificates, search, statusFilter]);

  const activeCertificates = Math.max(
    (stats.totalCertificates || 0) - (stats.revokedCertificates || 0),
    0
  );

  const handleIssue = () => navigate("/issue");
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleVerify = (certificateId) => {
    navigate(`/verify?id=${encodeURIComponent(certificateId)}`);
  };

  const handleRevoke = async (certificateId) => {
    try {
      setRevokeLoadingId(certificateId);

      const response = await fetch("http://localhost:5050/api/certificate/revoke", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ certificateId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Revocation failed");
      }

      await loadDashboard();
      setSelectedCertificate(null);
    } catch (revokeError) {
      console.error(revokeError);
      setError(revokeError.message || "Certificate revoke failed.");
    } finally {
      setRevokeLoadingId(null);
    }
  };

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">C</div>
          <div>
            <p className="brand-name">CertiChain</p>
            <span className="brand-subtitle">Issuer Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Sidebar navigation">
          {navItems.map((item) => (
            item.placeholder ? (
              <button key={item.label} type="button" className="nav-placeholder" onClick={handleLogout}>
                {item.label}
              </button>
            ) : (
              <Link
                key={item.label}
                to={item.to}
                className={`sidebar-nav-item ${item.active ? "active" : ""}`}
              >
                {item.label}
              </Link>
            )
          ))}
        </nav>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Issuer Dashboard</p>
            <h1>Welcome, {user?.name || "Issuer"}</h1>
          </div>

          <div className="header-actions">
            <div className="issuer-pill">University: {user?.university || "Unknown"}</div>
            <button type="button" className="primary-btn dashboard-primary-btn" onClick={handleIssue}>
              Issue Certificate
            </button>
          </div>
        </header>

        {error && (
          <div className="dashboard-alert error-alert">
            <span>{error}</span>
            <button type="button" className="secondary-btn small-btn" onClick={loadDashboard}>
              Retry
            </button>
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Certificates</div>
            <div className="stat-value">{loading ? "..." : stats.totalCertificates}</div>
            <div className="stat-meta">All issued records</div>
          </div>

          <div className="stat-card success-card">
            <div className="stat-label">Active Certificates</div>
            <div className="stat-value">{loading ? "..." : activeCertificates}</div>
            <div className="stat-meta">Currently valid</div>
          </div>

          <div className="stat-card warn-card">
            <div className="stat-label">Revoked Certificates</div>
            <div className="stat-value">{loading ? "..." : stats.revokedCertificates}</div>
            <div className="stat-meta">Marked invalid</div>
          </div>

          <div className="stat-card accent-card">
            <div className="stat-label">Verified Records</div>
            <div className="stat-value">{loading ? "..." : stats.verifiedCertificates}</div>
            <div className="stat-meta">Matches certificate hash</div>
          </div>
        </section>

        <section className="table-panel">
          <div className="table-toolbar">
            <div>
              <h2>Recent Certificates</h2>
              <p>Latest registrations on the blockchain</p>
            </div>

            <div className="toolbar-actions">
              <button type="button" className="secondary-btn small-btn" onClick={loadDashboard}>
                Refresh
              </button>
            </div>
          </div>

          <div className="toolbar-filters">
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by ID, student, degree, or university"
              />
            </div>

            <div className="filter-group" role="tablist" aria-label="Certificate status filter">
              {[
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "revoked", label: "Revoked" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className={`filter-pill ${statusFilter === filter.key ? "active" : ""}`}
                  onClick={() => setStatusFilter(filter.key)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="spinner" aria-label="Loading certificates" />
              <p>Loading certificates...</p>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="empty-state">
              <p>No certificates match your current search or filter.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Certificate ID</th>
                    <th>Student Name</th>
                    <th>Degree</th>
                    <th>University</th>
                    <th>Issue Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificates.map((certificate) => (
                    <tr key={certificate.certificateId}>
                      <td>{certificate.certificateId}</td>
                      <td>{certificate.studentName || "—"}</td>
                      <td>{certificate.degree || "—"}</td>
                      <td>{certificate.university || "—"}</td>
                      <td>{formatDate(certificate.issueDate)}</td>
                      <td>
                        <span className={`status-badge ${certificate.revoked ? "revoked" : "active"}`}>
                          {certificate.revoked ? "Revoked" : "Active"}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button type="button" className="table-action secondary" onClick={() => setSelectedCertificate(certificate)}>
                            View
                          </button>
                          <button type="button" className="table-action primary" onClick={() => handleVerify(certificate.certificateId)}>
                            Verify
                          </button>
                          {!certificate.revoked && (
                            <button
                              type="button"
                              className="table-action danger"
                              onClick={() => handleRevoke(certificate.certificateId)}
                              disabled={revokeLoadingId === certificate.certificateId}
                            >
                              {revokeLoadingId === certificate.certificateId ? "Revoking..." : "Revoke"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {selectedCertificate && (
        <div className="modal-backdrop" onClick={() => setSelectedCertificate(null)}>
          <div className="details-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">Certificate Details</p>
                <h3>{selectedCertificate.certificateId}</h3>
              </div>
              <button type="button" className="close-button" onClick={() => setSelectedCertificate(null)}>
                ×
              </button>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span>Student Name</span>
                <strong>{selectedCertificate.studentName || "—"}</strong>
              </div>
              <div className="detail-item">
                <span>Degree</span>
                <strong>{selectedCertificate.degree || "—"}</strong>
              </div>
              <div className="detail-item">
                <span>Department</span>
                <strong>{selectedCertificate.department || "—"}</strong>
              </div>
              <div className="detail-item">
                <span>University</span>
                <strong>{selectedCertificate.university || "—"}</strong>
              </div>
              <div className="detail-item">
                <span>Issuer</span>
                <strong>{selectedCertificate.issuer || "—"}</strong>
              </div>
              <div className="detail-item">
                <span>Issue Date</span>
                <strong>{formatDate(selectedCertificate.issueDate)}</strong>
              </div>
              <div className="detail-item full-width">
                <span>Status</span>
                <strong>
                  <span className={`status-badge ${selectedCertificate.revoked ? "revoked" : "active"}`}>
                    {selectedCertificate.revoked ? "Revoked" : "Active"}
                  </span>
                </strong>
              </div>
              <div className="detail-item full-width">
                <span>Certificate Hash</span>
                <strong className="hash-value">{selectedCertificate.certificateHash || "Not available"}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;