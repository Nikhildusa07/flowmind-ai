import { useEffect, useState } from "react";
import { apiFetch } from "../services/auth";

function Monitoring() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMonitoring = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(
        "/analytics?days=1"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load monitoring data."
        );
      }

      setAnalytics(data);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to connect to the monitoring service."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoring();
  }, []);

  const executions = analytics?.executions || {};
  const tasks = analytics?.tasks || {};
  const documents = analytics?.documents || {};
  const logs = analytics?.logs || {};

  return (
    <div className="monitoring-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            INTELLIGENCE
          </span>

          <h1>Monitoring</h1>

          <p>
            Monitor workflow executions, tasks,
            documents, and system activity.
          </p>
        </div>

        <div className="dashboard-status is-ok">
          <span className="status-dot" />

          <div>
            <span>System</span>
            <strong>
              {loading ? "Checking..." : "Operational"}
            </strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Monitoring:</strong>
          <span>{error}</span>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon blue">↗</div>
            <span className="stat-label">
              Executions Today
            </span>
          </div>

          <div className="stat-value">
            {loading ? "—" : executions.total || 0}
          </div>

          <div className="stat-description">
            {loading
              ? "Checking activity"
              : `${executions.failed || 0} failed`}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon green">✓</div>
            <span className="stat-label">
              Completed Tasks
            </span>
          </div>

          <div className="stat-value">
            {loading ? "—" : tasks.completed || 0}
          </div>

          <div className="stat-description">
            {loading
              ? "Checking activity"
              : `${tasks.running || 0} running`}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon violet">▤</div>
            <span className="stat-label">
              Documents
            </span>
          </div>

          <div className="stat-value">
            {loading ? "—" : documents.total || 0}
          </div>

          <div className="stat-description">
            {loading
              ? "Checking activity"
              : `${documents.failed || 0} failed`}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon orange">◉</div>
            <span className="stat-label">
              Logs Today
            </span>
          </div>

          <div className="stat-value">
            {loading ? "—" : logs.total || 0}
          </div>

          <div className="stat-description">
            System activity
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                EXECUTION MONITOR
              </span>

              <h2>Workflow Activity</h2>
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={loadMonitoring}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="performance-list">
            <div className="performance-row">
              <div className="performance-name">
                <span className="performance-icon">
                  ↗
                </span>
                <span>Total executions</span>
              </div>

              <strong>
                {loading ? "—" : executions.total || 0}
              </strong>
            </div>

            <div className="performance-row">
              <div className="performance-name">
                <span className="performance-icon success">
                  ✓
                </span>
                <span>Completed</span>
              </div>

              <strong>
                {loading
                  ? "—"
                  : executions.completed || 0}
              </strong>
            </div>

            <div className="performance-row">
              <div className="performance-name">
                <span className="performance-icon running">
                  ◌
                </span>
                <span>Running</span>
              </div>

              <strong>
                {loading
                  ? "—"
                  : executions.running || 0}
              </strong>
            </div>

            <div className="performance-row">
              <div className="performance-name">
                <span className="performance-icon failed">
                  !
                </span>
                <span>Failed</span>
              </div>

              <strong>
                {loading
                  ? "—"
                  : executions.failed || 0}
              </strong>
            </div>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                SERVICE HEALTH
              </span>

              <h2>System Status</h2>
            </div>

            <span className="healthy-badge">
              Operational
            </span>
          </div>

          <div className="system-status-list">
            <div className="system-status-row">
              <div>
                <strong>API Server</strong>
                <span>FastAPI backend</span>
              </div>

              <span className="service-state">
                Operational
              </span>
            </div>

            <div className="system-status-row">
              <div>
                <strong>Analytics</strong>
                <span>Operational metrics</span>
              </div>

              <span className="service-state">
                Operational
              </span>
            </div>

            <div className="system-status-row">
              <div>
                <strong>Database</strong>
                <span>PostgreSQL</span>
              </div>

              <span className="service-state">
                Operational
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Monitoring;