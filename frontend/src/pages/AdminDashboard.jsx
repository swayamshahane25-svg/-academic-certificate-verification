import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateIssuer, setShowCreateIssuer] = useState(false);
  const [issuerForm, setIssuerForm] = useState({ name: "", email: "", password: "", university: "" });

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsResponse, usersResponse] = await Promise.all([
        fetch("http://localhost:5050/api/auth/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5050/api/auth/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!statsResponse.ok || !usersResponse.ok) {
        throw new Error("Failed to load admin dashboard.");
      }

      const statsData = await statsResponse.json();
      const usersData = await usersResponse.json();
      setStats(statsData);
      setUsers(usersData.users || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) navigate("/login");
    else loadData();
  }, [token, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const updateUserStatus = async (id, status) => {
    const response = await fetch(`http://localhost:5050/api/auth/admin/users/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      loadData();
    }
  };

  const updateUserRole = async (id, role) => {
    const response = await fetch(`http://localhost:5050/api/auth/admin/users/${id}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });

    if (response.ok) {
      loadData();
    }
  };

  const createIssuer = async (event) => {
    event.preventDefault();
    const response = await fetch("http://localhost:5050/api/auth/admin/users/issuer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(issuerForm),
    });

    if (response.ok) {
      setIssuerForm({ name: "", email: "", password: "", university: "" });
      setShowCreateIssuer(false);
      loadData();
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">C</div>
          <div>
            <p className="brand-name">CertiChain</p>
            <span className="brand-subtitle">Admin Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Admin navigation">
          <Link className="sidebar-nav-item active" to="/admin">Dashboard</Link>
          <Link className="sidebar-nav-item" to="/dashboard">Issuer Dashboard</Link>
          <Link className="sidebar-nav-item" to="/student-dashboard">Student Dashboard</Link>
          <button type="button" className="nav-placeholder" onClick={handleLogout}>Logout</button>
        </nav>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">System Administration</p>
            <h1>Welcome, {user.name}</h1>
          </div>

          <div className="header-actions">
            <div className="issuer-pill">Role: {user.role}</div>
            <button type="button" className="primary-btn dashboard-primary-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        {!loading && (
          <section className="stats-grid">
            <div className="stat-card"><div className="stat-label">Total Users</div><div className="stat-value">{stats.totalUsers || 0}</div></div>
            <div className="stat-card success-card"><div className="stat-label">Total Issuers</div><div className="stat-value">{stats.totalIssuers || 0}</div></div>
            <div className="stat-card warn-card"><div className="stat-label">Total Students</div><div className="stat-value">{stats.totalStudents || 0}</div></div>
            <div className="stat-card accent-card"><div className="stat-label">Fraud Analyses</div><div className="stat-value">{stats.fraudAnalyses || 0}</div></div>
          </section>
        )}

        <section className="table-panel">
          <div className="table-toolbar">
            <div>
              <h2>User Management</h2>
              <p>Manage users, status, and roles.</p>
            </div>
            <button type="button" className="primary-btn small-btn" onClick={() => setShowCreateIssuer((value) => !value)}>Create Issuer</button>
          </div>

          {showCreateIssuer && (
            <form className="auth-form" onSubmit={createIssuer} style={{ marginBottom: 20 }}>
              <div className="table-wrap" style={{ padding: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  <input placeholder="Name" value={issuerForm.name} onChange={(e) => setIssuerForm({ ...issuerForm, name: e.target.value })} />
                  <input placeholder="Email" value={issuerForm.email} onChange={(e) => setIssuerForm({ ...issuerForm, email: e.target.value })} />
                  <input type="password" placeholder="Password" value={issuerForm.password} onChange={(e) => setIssuerForm({ ...issuerForm, password: e.target.value })} />
                  <input placeholder="University" value={issuerForm.university} onChange={(e) => setIssuerForm({ ...issuerForm, university: e.target.value })} />
                </div>
                <button type="submit" className="primary-btn" style={{ marginTop: 12 }}>Save Issuer</button>
              </div>
            </form>
          )}

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>University</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((account) => (
                  <tr key={account.id}>
                    <td>{account.name}</td>
                    <td>{account.email}</td>
                    <td>
                      <select value={account.role} onChange={(e) => updateUserRole(account.id, e.target.value)}>
                        <option value="ADMIN">ADMIN</option>
                        <option value="ISSUER">ISSUER</option>
                        <option value="STUDENT">STUDENT</option>
                      </select>
                    </td>
                    <td>{account.university || "—"}</td>
                    <td>
                      <select value={account.status} onChange={(e) => updateUserStatus(account.id, e.target.value)}>
                        <option value="active">active</option>
                        <option value="disabled">disabled</option>
                      </select>
                    </td>
                    <td>{new Date(account.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button type="button" className="secondary-btn small-btn" onClick={() => alert("User detail modal can be extended in a later iteration.")}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
