import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../services/auth";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const message = location.state?.message || "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to log in.");
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
            <span className="eyebrow">AI-POWERED OPERATIONS</span>
            <h2>Automate the work.<br />Focus on the growth.</h2>
            <p>
              Manage workflows, analyze documents and monitor business
              operations from one intelligent workspace.
            </p>

            <div className="auth-feature-list">
              <div><span>✓</span><div><strong>Workflow automation</strong><small>Build and execute repeatable business processes.</small></div></div>
              <div><span>✦</span><div><strong>AI document intelligence</strong><small>Extract structured information from business files.</small></div></div>
              <div><span>◉</span><div><strong>Operational visibility</strong><small>Track execution health and automation activity.</small></div></div>
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
            <span className="eyebrow">WELCOME BACK</span>
            <h1>Sign in</h1>
            <p>Sign in to access your FlowMind AI workspace.</p>
          </div>

          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
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
              <div className="form-label-row">
                <label htmlFor="password">Password</label>
                <span>Required</span>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              <span>{loading ? "Signing in..." : "Sign In"}</span>
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="auth-divider"><span>OR</span></div>

          <div className="auth-footer">
            <span>Don't have an account?</span>
            <Link to="/register">Create an account →</Link>
          </div>

          <p className="auth-legal">By continuing, you agree to use this workspace responsibly.</p>
        </section>
      </div>
    </main>
  );
}

export default Login;
