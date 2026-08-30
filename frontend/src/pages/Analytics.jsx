import { useEffect, useState } from "react";
import { apiFetch } from "../services/auth";

const initialAnalytics = {
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
    success_rate: 0,
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

function MetricCard({ title, value, description, icon, tone = "" }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className={`stat-icon ${tone}`}>{icon}</div>
        <span className="stat-label">{title}</span>
      </div>

      <div className="stat-value">{value}</div>

      <div className="stat-description">
        {description}
      </div>
    </div>
  );
}

function Analytics() {
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async (selectedDays = days) => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(
        `/analytics?days=${selectedDays}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load analytics."
        );
      }

      setAnalytics({
        executions: {
          ...initialAnalytics.executions,
          ...(data?.executions || {}),
        },
        tasks: {
          ...initialAnalytics.tasks,
          ...(data?.tasks || {}),
        },
        documents: {
          ...initialAnalytics.documents,
          ...(data?.documents || {}),
        },
        logs: {
          ...initialAnalytics.logs,
          ...(data?.logs || {}),
        },
      });
    } catch (err) {
      setError(
        err?.message ||
          "Unable to connect to the analytics service."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics(7);
  }, []);

  const executionSuccessRate =
    Number(analytics.executions.success_rate || 0);

  const taskSuccessRate =
    Number(analytics.tasks.success_rate || 0);

  const documentProcessingRate =
    Number(analytics.documents.processing_rate || 0);

  return (
    <div className="analytics-page">
      {/* ============================================================
          PAGE HEADER
      ============================================================ */}

      <div className="page-heading">
        <div>
          <span className="eyebrow">
            INTELLIGENCE
          </span>

          <h1>Analytics</h1>

          <p>
            Review automation performance, task
            activity, document processing, and
            operational logs.
          </p>
        </div>

        <div className="topbar-actions">
          <select
            value={days}
            onChange={(event) => {
              const value = Number(event.target.value);
              setDays(value);
              loadAnalytics(value);
            }}
            className="period-select"
            disabled={loading}
            aria-label="Analytics period"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          <button
            className="secondary-button"
            type="button"
            onClick={() => loadAnalytics(days)}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ============================================================
          ERROR
      ============================================================ */}

      {error && (
        <div className="alert alert-error">
          <strong>Analytics:</strong>
          <span>{error}</span>
        </div>
      )}

      {/* ============================================================
          OVERVIEW
      ============================================================ */}

      <div className="stats-grid">
        <MetricCard
          title="Workflow Executions"
          value={
            loading
              ? "—"
              : analytics.executions.total
          }
          description={
            loading
              ? "Loading activity"
              : `${executionSuccessRate}% success rate`
          }
          icon="↗"
          tone="blue"
        />

        <MetricCard
          title="Completed Tasks"
          value={
            loading
              ? "—"
              : analytics.tasks.completed
          }
          description={
            loading
              ? "Loading activity"
              : `${analytics.tasks.total} total tasks`
          }
          icon="✓"
          tone="green"
        />

        <MetricCard
          title="Documents Processed"
          value={
            loading
              ? "—"
              : analytics.documents.processed
          }
          description={
            loading
              ? "Loading activity"
              : `${documentProcessingRate}% processing rate`
          }
          icon="▤"
          tone="violet"
        />

        <MetricCard
          title="Automation Logs"
          value={
            loading
              ? "—"
              : analytics.logs.total
          }
          description={`Last ${days} days`}
          icon="◉"
          tone="orange"
        />
      </div>

      {/* ============================================================
          EXECUTION PERFORMANCE
      ============================================================ */}

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                AUTOMATION PERFORMANCE
              </span>

              <h2>Execution Performance</h2>
            </div>

            <span className="period-badge">
              Last {days} days
            </span>
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
                {loading
                  ? "—"
                  : analytics.executions.total}
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
                  : analytics.executions.completed}
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
                  : analytics.executions.running}
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
                  : analytics.executions.failed}
              </strong>
            </div>
          </div>
        </section>

        {/* ============================================================
            TASK PERFORMANCE
        ============================================================ */}

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                TASK OPERATIONS
              </span>

              <h2>Task Performance</h2>
            </div>

            <span className="period-badge">
              {taskSuccessRate}% success
            </span>
          </div>

          <div className="performance-list">
            <div className="performance-row">
              <div className="performance-name">
                <span className="performance-icon">
                  ▣
                </span>
                <span>Total tasks</span>
              </div>

              <strong>
                {loading
                  ? "—"
                  : analytics.tasks.total}
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
                  : analytics.tasks.completed}
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
                  : analytics.tasks.running}
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
                  : analytics.tasks.failed}
              </strong>
            </div>
          </div>
        </section>
      </div>

      {/* ============================================================
          DOCUMENTS + LOGS
      ============================================================ */}

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                DOCUMENT OPERATIONS
              </span>

              <h2>Document Processing</h2>
            </div>

            <span className="period-badge">
              {documentProcessingRate}% processed
            </span>
          </div>

          <div className="performance-list">
            <div className="performance-row">
              <div className="performance-name">
                <span className="performance-icon">
                  ▤
                </span>
                <span>Total documents</span>
              </div>

              <strong>
                {loading
                  ? "—"
                  : analytics.documents.total}
              </strong>
            </div>

            <div className="performance-row">
              <div className="performance-name">
                <span className="performance-icon success">
                  ✓
                </span>
                <span>Processed</span>
              </div>

              <strong>
                {loading
                  ? "—"
                  : analytics.documents.processed}
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
                  : analytics.documents.failed}
              </strong>
            </div>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                SYSTEM ACTIVITY
              </span>

              <h2>Automation Logs</h2>
            </div>

            <span className="healthy-badge">
              Activity
            </span>
          </div>

          <div className="analytics-log-summary">
            <div className="analytics-log-number">
              {loading
                ? "—"
                : analytics.logs.total}
            </div>

            <p>
              Automation log entries recorded during
              the selected reporting period.
            </p>
          </div>

          <div className="system-summary">
            <span className="status-dot" />

            <span>
              Operational activity is being tracked
              by the backend analytics service.
            </span>
          </div>
        </section>
      </div>

      {/* ============================================================
          REPORT SUMMARY
      ============================================================ */}

      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <span className="panel-eyebrow">
              REPORT SUMMARY
            </span>

            <h2>Operational Overview</h2>
          </div>

          <span className="period-badge">
            {days} day report
          </span>
        </div>

        <div className="analytics-summary-grid">
          <div className="workflow-summary-card">
            <span>Execution success rate</span>
            <strong>
              {loading
                ? "—"
                : `${executionSuccessRate}%`}
            </strong>
          </div>

          <div className="workflow-summary-card">
            <span>Task success rate</span>
            <strong>
              {loading
                ? "—"
                : `${taskSuccessRate}%`}
            </strong>
          </div>

          <div className="workflow-summary-card">
            <span>Document processing rate</span>
            <strong>
              {loading
                ? "—"
                : `${documentProcessingRate}%`}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Analytics;