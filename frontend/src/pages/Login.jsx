import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", rememberMe: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login({
        email: form.email,
        password: form.password,
        rememberMe: form.rememberMe,
      });

      const role = data.user?.role;
      if (role === "ADMIN") navigate("/admin");
      else if (role === "ISSUER") navigate("/dashboard");
      else if (role === "STUDENT") navigate("/student-dashboard");
      else navigate("/login");
    } catch (loginError) {
      setError(loginError.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">C</div>
          <span>CertiChain</span>
        </div>

        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Sign in to continue to your portal.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            <span>Email</span>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>

          <label>
            <span>Password</span>
            <div className="password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button type="button" className="link-btn" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <label className="checkbox-row">
            <input type="checkbox" name="rememberMe" checked={form.rememberMe} onChange={handleChange} />
            <span>Remember me</span>
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="primary-btn auth-submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="auth-footer-links">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <div className="auth-footer-note">
          Don&apos;t have an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
