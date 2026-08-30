import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/auth";

function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(fullName, email, password);
      navigate("/login", {
        replace: true,
        state: { message: "Registration successful. Please sign in." },
      });
    } catch (err) {
      setError(err.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-showcase">
          <div className="auth-showcase-brand">
            <span className="brand-mark brand-mark-large">F</span>
            <div>
              <strong>FlowMind AI</strong>
              <span>Business Automation</span>
            </div>
          </div>

          <div className="auth-showcase-content">
            <span className="eyebrow">GET STARTED</span>
            <h2>Build your<br />automation workspace.</h2>
            <p>
              Create one workspace for intelligent workflows, documents
              and business operations.
            </p>

            <div className="auth-feature-list">
              <div><span>✓</span><div><strong>One connected workspace</strong><small>Keep automation activity organized in one place.</small></div></div>
              <div><span>✦</span><div><strong>AI-assisted decisions</strong><small>Turn business information into useful actions.</small></div></div>
              <div><span>◉</span><div><strong>Clear operational insights</strong><small>See what is running, completed and needs attention.</small></div></div>
            </div>
          </div>

          <div className="auth-showcase-footer">Autonomous AI-Powered Business Automation</div>
        </section>

        <section className="auth-card">
          <div className="auth-card-top">
            <span className="auth-mobile-mark">F</span>
            <span className="auth-secure">● Secure workspace</span>
          </div>

          <div className="auth-heading">
            <span className="eyebrow">CREATE WORKSPACE</span>
            <h1>Create account</h1>
            <p>Set up your FlowMind AI workspace account.</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              <span>{loading ? "Creating account..." : "Create Account"}</span>
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="auth-divider"><span>ALREADY A MEMBER?</span></div>

          <div className="auth-footer">
            <span>Already have an account?</span>
            <Link to="/login">Sign in →</Link>
          </div>

          <p className="auth-legal">Create an account to access your private automation workspace.</p>
        </section>
      </div>
    </main>
  );
}

export default Register;
