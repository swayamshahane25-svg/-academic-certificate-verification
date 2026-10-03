import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "STUDENT",
  university: "",
};

function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        role: form.role === "ADMIN" ? "STUDENT" : form.role,
      };

      const data = await signup(payload);
      const userRole = data.user?.role || "STUDENT";

      if (userRole === "ADMIN") navigate("/admin");
      else if (userRole === "ISSUER") navigate("/dashboard");
      else navigate("/student-dashboard");
    } catch (signupError) {
      setError(signupError.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card-wide">
        <div className="auth-brand">
          <div className="brand-mark">C</div>
          <span>CertiChain</span>
        </div>

        <h1>Create Account</h1>
        <p className="auth-subtitle">Join your institution and start secure verification.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-grid">
            <label>
              <span>Full Name</span>
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </label>

            <label>
              <span>Email</span>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </label>

            <label>
              <span>Password</span>
              <div className="password-wrap">
                <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} required />
                <button type="button" className="link-btn" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <label>
              <span>Confirm Password</span>
              <div className="password-wrap">
                <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
                <button type="button" className="link-btn" onClick={() => setShowConfirmPassword((value) => !value)}>
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <label>
              <span>Role</span>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="STUDENT">STUDENT</option>
                <option value="ISSUER">ISSUER</option>
              </select>
            </label>

            <label>
              <span>University / Institution</span>
              <input type="text" name="university" value={form.university} onChange={handleChange} required />
            </label>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="primary-btn auth-submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer-note">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;
