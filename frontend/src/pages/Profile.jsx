import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user, logout } = useAuth();

  if (!user) {
    return <div className="page-loading">Please log in.</div>;
  }

  return (
    <div className="auth-shell">
      <div className="auth-card narrow-card">
        <div className="auth-brand">
          <div className="brand-mark">C</div>
          <span>CertiChain</span>
        </div>

        <h1>Profile</h1>
        <div className="auth-form profile-box">
          <div><span>Name</span><strong>{user.name}</strong></div>
          <div><span>Email</span><strong>{user.email}</strong></div>
          <div><span>Role</span><strong>{user.role}</strong></div>
          <div><span>University</span><strong>{user.university || "—"}</strong></div>
        </div>

        <button type="button" className="primary-btn auth-submit" onClick={logout}>Logout</button>
      </div>
    </div>
  );
}

export default Profile;
