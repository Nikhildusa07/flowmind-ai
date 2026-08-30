import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, API_BASE_URL } from "../services/auth";

const initialStats = {
  requests: {
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
  },
  executions: {
    total: 0,
    completed: 0,
    running: 0,
    failed: 0,
    success_rate: 0,
  },
  tasks: {
    total: 0,
    completed: 0,
    running: 0,
    failed: 0,
  },
  documents: {
    total: 0,
    processed: 0,
    failed: 0,
    processing_rate: 0,
  },
  logs: {
    total: 0,
  },
};

function StatCard({
  title,
  value,
  description,
  icon,
  tone = "",
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className={`stat-icon ${tone}`}>
          {icon}
        </div>

        <span className="stat-label">
          {title}
        </span>

        <span className="stat-arrow">
          ↗
        </span>
      </div>

      <div className="stat-value">
        {value}
      </div>

      <div className="stat-description">
        {description}
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] =
    useState("Checking...");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [requestsResponse, healthResponse] =
          await Promise.all([
            apiFetch("/requests/"),
            fetch(`${API_BASE_URL}/health`),
          ]);

        if (!healthResponse.ok) {
          throw new Error(
            "Backend health check failed."
          );
        }

        if (!requestsResponse.ok) {
          const data =
            await requestsResponse
              .json()
              .catch(() => ({}));

          throw new Error(
            data.detail ||
              "Unable to load business requests."
          );
        }

        const requestsData =
          await requestsResponse.json();

        if (!mounted) return;

        const requestList =
          Array.isArray(requestsData?.requests)
            ? requestsData.requests
            : [];

        const completed =
          requestList.filter(
            (item) =>
              String(item.status).toLowerCase() ===
              "completed"
          ).length;

        const failed =
          requestList.filter(
            (item) =>
              String(item.status).toLowerCase() ===
              "failed"
          ).length;

        const pending =
          requestList.filter((item) => {
            const status = String(
              item.status || ""
            ).toLowerCase();

            return (
              status === "pending_review" ||
              status === "processing"
            );
          }).length;

        const total = requestList.length;

        const successRate =
          total > 0
            ? Math.round(
                (completed / total) * 100
              )
            : 0;

        setStats({
          ...initialStats,

          requests: {
            total,
            completed,
            pending,
            failed,
          },

          executions: {
            total,
            completed,
            running: requestList.filter(
              (item) =>
                String(item.status).toLowerCase() ===
                "processing"
            ).length,
            failed,
            success_rate: successRate,
          },

          tasks: {
            total,
            completed,
            running: requestList.filter(
              (item) =>
                String(item.status).toLowerCase() ===
                "processing"
            ).length,
            failed,
          },

          documents: {
            total: 0,
            processed: 0,
            failed: 0,
            processing_rate: 0,
          },

          logs: {
            total,
          },
        });

        setBackendStatus("Operational");
      } catch (err) {
        if (!mounted) return;

        setBackendStatus("Unavailable");
        setError(
          err?.message ||
            "Unable to connect to the FlowMind AI backend."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const operational =
    backendStatus === "Operational";

  return (
    <div className="dashboard">
      {/* ============================================================
          PAGE HEADER
      ============================================================ */}

      <div className="page-heading dashboard-heading">
        <div>
          <span className="eyebrow">
            OVERVIEW
          </span>

          <h1>Dashboard</h1>

          <p>
            Monitor your business automation
            activity and operational performance.
          </p>
        </div>

        <div
          className={`dashboard-status ${
            operational
              ? "is-ok"
              : "is-error"
          }`}
        >
          <span className="status-dot" />

          <div>
            <span>Backend</span>

            <strong>
              {backendStatus}
            </strong>
          </div>
        </div>
      </div>

      {/* ============================================================
          ERROR
      ============================================================ */}

      {error && (
        <div className="alert alert-warning">
          <strong>Dashboard:</strong>{" "}
          {error}
        </div>
      )}

      {/* ============================================================
          STAT CARDS
      ============================================================ */}

      <div className="stats-grid">
        <StatCard
          title="Business Requests"
          value={
            loading
              ? "—"
              : stats.requests.total
          }
          description={
            loading
              ? "Loading activity"
              : `${stats.requests.pending} pending review`
          }
          icon="▣"
          tone="blue"
        />

        <StatCard
          title="Completed Requests"
          value={
            loading
              ? "—"
              : stats.requests.completed
          }
          description={
            loading
              ? "Loading activity"
              : `${stats.executions.success_rate}% success rate`
          }
          icon="✓"
          tone="green"
        />

        <StatCard
          title="Pending Review"
          value={
            loading
              ? "—"
              : stats.requests.pending
          }
          description="Human review required"
          icon="◌"
          tone="violet"
        />

        <StatCard
          title="Request Activity"
          value={
            loading
              ? "—"
              : stats.logs.total
          }
          description="Total processed requests"
          icon="◉"
          tone="orange"
        />
      </div>

      {/* ============================================================
          DASHBOARD GRID
      ============================================================ */}

      <div className="dashboard-grid">
        {/* ========================================================
            REQUEST PERFORMANCE
        ======================================================== */}

        <section className="dashboard-panel execution-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                REQUEST PERFORMANCE
              </span>

              <h2>
                Request Overview
              </h2>
            </div>

            <span className="period-badge">
              Current activity
            </span>
          </div>

          <div className="performance-list">
            {[
              [
                "Total requests",
                stats.requests.total,
                "↗",
                "",
              ],
              [
                "Completed",
                stats.requests.completed,
                "✓",
                "success",
              ],
              [
                "Pending review",
                stats.requests.pending,
                "◌",
                "running",
              ],
              [
                "Failed",
                stats.requests.failed,
                "!",
                "failed",
              ],
            ].map(
              ([
                name,
                value,
                icon,
                tone,
              ]) => (
                <div
                  className="performance-row"
                  key={name}
                >
                  <div className="performance-name">
                    <span
                      className={`performance-icon ${tone}`}
                    >
                      {icon}
                    </span>

                    <span>
                      {name}
                    </span>
                  </div>

                  <strong>
                    {loading ? "—" : value}
                  </strong>
                </div>
              )
            )}
          </div>

          <div className="panel-footer-link">
            <Link to="/requests">
              View business requests{" "}
              <span>→</span>
            </Link>
          </div>
        </section>

        {/* ========================================================
            SYSTEM STATUS
        ======================================================== */}

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                SYSTEM
              </span>

              <h2>
                System Status
              </h2>
            </div>

            <span
              className={
                operational
                  ? "healthy-badge"
                  : "status-badge failed"
              }
            >
              {operational
                ? "Healthy"
                : "Attention"}
            </span>
          </div>

          <div className="system-status-list">
            <div className="system-status-row">
              <div>
                <strong>
                  API Server
                </strong>

                <span>
                  FastAPI backend
                </span>
              </div>

              <span
                className={`service-state ${
                  operational
                    ? ""
                    : "error"
                }`}
              >
                {backendStatus}
              </span>
            </div>

            <div className="system-status-row">
              <div>
                <strong>
                  Database
                </strong>

                <span>
                  PostgreSQL
                </span>
              </div>

              <span className="service-state">
                Operational
              </span>
            </div>

            <div className="system-status-row">
              <div>
                <strong>
                  AI Service
                </strong>

                <span>
                  Gemini integration
                </span>
              </div>

              <span className="service-state">
                Operational
              </span>
            </div>
          </div>

          <div className="system-summary">
            <span className="status-dot" />

            <span>
              Backend health check is responding
              normally.
            </span>
          </div>
        </section>
      </div>

      {/* ============================================================
          QUICK ACTIONS
      ============================================================ */}

      <section className="quick-actions">
        <div className="quick-actions-heading">
          <div>
            <span className="panel-eyebrow">
              QUICK ACCESS
            </span>

            <h2>
              What would you like to do?
            </h2>
          </div>

          <span className="quick-actions-caption">
            Start with a workspace action
          </span>
        </div>

        <div className="quick-action-grid">
          <Link
            to="/requests"
            className="quick-action"
          >
            <span className="quick-action-icon">
              ▣
            </span>

            <div>
              <strong>
                Submit Business Request
              </strong>

              <span>
                Analyze and process a business
                request
              </span>
            </div>

            <span className="quick-action-arrow">
              →
            </span>
          </Link>

          <Link
            to="/workflows"
            className="quick-action"
          >
            <span className="quick-action-icon">
              ↗
            </span>

            <div>
              <strong>
                Manage Workflows
              </strong>

              <span>
                Create and execute automations
              </span>
            </div>

            <span className="quick-action-arrow">
              →
            </span>
          </Link>

          <Link
            to="/documents"
            className="quick-action"
          >
            <span className="quick-action-icon">
              ▤
            </span>

            <div>
              <strong>
                Analyze Document
              </strong>

              <span>
                Extract and analyze business data
              </span>
            </div>

            <span className="quick-action-arrow">
              →
            </span>
          </Link>

          <Link
            to="/assistant"
            className="quick-action"
          >
            <span className="quick-action-icon">
              ✦
            </span>

            <div>
              <strong>
                Ask AI Assistant
              </strong>

              <span>
                Get business automation guidance
              </span>
            </div>

            <span className="quick-action-arrow">
              →
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;