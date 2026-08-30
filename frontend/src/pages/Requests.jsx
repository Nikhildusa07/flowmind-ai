import { useEffect, useState } from "react";
import { apiFetch } from "../services/auth";

const initialForm = {
  customer_name: "",
  customer_email: "",
  subject: "",
  message: "",
};

function Requests() {
  const [form, setForm] = useState(initialForm);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const loadRequests = async () => {
    try {
      setLoadingRequests(true);

      const response = await apiFetch("/requests/");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load business requests."
        );
      }

      setRequests(data.requests || []);
    } catch (err) {
      setError(
        err?.message || "Unable to load business requests."
      );
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLastResult(null);

    if (!form.customer_name.trim()) {
      setError("Customer name is required.");
      return;
    }

    if (!form.customer_email.trim()) {
      setError("Customer email is required.");
      return;
    }

    if (!form.message.trim() && !form.subject.trim()) {
      setError(
        "Please enter a subject or business request message."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await apiFetch("/requests/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: form.customer_name.trim(),
          customer_email: form.customer_email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Request submission failed."
        );
      }

      setLastResult(data);

      setSuccess(
        data.message ||
          "Business request submitted successfully."
      );

      setForm(initialForm);

      await loadRequests();
    } catch (err) {
      setError(
        err?.message || "Unable to submit business request."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === "completed") {
      return "completed";
    }

    if (status === "failed") {
      return "failed";
    }

    return "";
  };

  return (
    <div className="requests-page">
      {/* ============================================================
          PAGE HEADER
      ============================================================ */}

      <div className="page-heading">
        <div>
          <span className="eyebrow">BUSINESS OPERATIONS</span>

          <h1>Business Requests</h1>

          <p>
            Submit business requests and monitor their
            AI analysis, decision, automation, and review
            status.
          </p>
        </div>

        <div className="healthy-badge">
          Request Processing
        </div>
      </div>

      {/* ============================================================
          ALERTS
      ============================================================ */}

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <strong>Success:</strong>
          <span>{success}</span>
        </div>
      )}

      {/* ============================================================
          REQUEST FORM
      ============================================================ */}

      <section className="workflow-form-panel">
        <div className="panel-header">
          <div>
            <span className="panel-eyebrow">
              NEW REQUEST
            </span>

            <h2>Submit Business Request</h2>
          </div>

          <span className="period-badge">
            AI + Automation
          </span>
        </div>

        <form
          className="workflow-form"
          onSubmit={handleSubmit}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "18px",
            }}
          >
            <div className="form-group">
              <label htmlFor="customer_name">
                Customer Name
              </label>

              <input
                id="customer_name"
                name="customer_name"
                type="text"
                value={form.customer_name}
                onChange={handleChange}
                placeholder="Enter customer name"
                maxLength={100}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="customer_email">
                Customer Email
              </label>

              <input
                id="customer_email"
                name="customer_email"
                type="email"
                value={form.customer_email}
                onChange={handleChange}
                placeholder="customer@example.com"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="subject">
                Subject
              </label>

              <span>Optional</span>
            </div>

            <input
              id="subject"
              name="subject"
              type="text"
              value={form.subject}
              onChange={handleChange}
              placeholder="Example: Need invoice automation"
              maxLength={500}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="message">
                Business Request
              </label>

              <span>
                {form.message.length}/5000
              </span>
            </div>

            <textarea
              id="message"
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Describe the business request you want FlowMind AI to analyze and process..."
              maxLength={5000}
              rows={7}
              disabled={loading}
            />
          </div>

          <div
            style={{
              padding: "13px 15px",
              border: "1px solid #e4e9f2",
              borderRadius: "10px",
              background: "#f8fafc",
              color: "#748198",
              fontSize: "11px",
              lineHeight: 1.6,
            }}
          >
            <strong
              style={{
                color: "#405a7d",
              }}
            >
              Processing flow:
            </strong>{" "}
            Request → Security Check → Gemini AI Analysis
            → Decision Engine → Automation / Human Review
            → Customer Notification
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setForm(initialForm);
                setError("");
                setSuccess("");
                setLastResult(null);
              }}
              disabled={loading}
            >
              Clear
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : "Submit Request"}
            </button>
          </div>
        </form>
      </section>

      {/* ============================================================
          LAST RESULT
      ============================================================ */}

      {lastResult && (
        <section
          className="dashboard-panel"
          style={{ marginBottom: "22px" }}
        >
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                LATEST RESULT
              </span>

              <h2>Request Processing Result</h2>
            </div>

            <span
              className={
                lastResult.status === "completed"
                  ? "healthy-badge"
                  : "period-badge"
              }
            >
              {String(
                lastResult.status || "processed"
              ).replace("_", " ")}
            </span>
          </div>

          <div
            style={{
              padding: "22px",
              display: "grid",
              gap: "18px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: "14px",
              }}
            >
              <div className="workflow-summary-card">
                <div>
                  <span>Request ID</span>
                  <strong
                    style={{
                      fontSize: "16px",
                    }}
                  >
                    {lastResult.request_id || "—"}
                  </strong>
                </div>
              </div>

              <div className="workflow-summary-card">
                <div>
                  <span>Decision</span>
                  <strong
                    style={{
                      fontSize: "16px",
                    }}
                  >
                    {lastResult.decision?.decision ||
                      "—"}
                  </strong>
                </div>
              </div>

              <div className="workflow-summary-card">
                <div>
                  <span>Action</span>
                  <strong
                    style={{
                      fontSize: "16px",
                    }}
                  >
                    {lastResult.decision
                      ?.action_type || "—"}
                  </strong>
                </div>
              </div>
            </div>

            {lastResult.ai_analysis && (
              <div
                style={{
                  padding: "17px",
                  border: "1px solid #e5eaf2",
                  borderRadius: "12px",
                  background: "#fbfcff",
                }}
              >
                <div
                  style={{
                    color: "#5065e8",
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: ".14em",
                    marginBottom: "12px",
                  }}
                >
                  AI ANALYSIS
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "9px",
                    color: "#53627b",
                    fontSize: "12px",
                  }}
                >
                  <div>
                    <strong>Intent:</strong>{" "}
                    {lastResult.ai_analysis.intent ||
                      "—"}
                  </div>

                  <div>
                    <strong>Priority:</strong>{" "}
                    {lastResult.ai_analysis.priority ||
                      "—"}
                  </div>

                  <div>
                    <strong>Confidence:</strong>{" "}
                    {lastResult.ai_analysis
                      .confidence_score ?? "—"}
                  </div>

                  <div>
                    <strong>Summary:</strong>{" "}
                    {lastResult.ai_analysis.summary ||
                      "—"}
                  </div>
                </div>
              </div>
            )}

            {lastResult.decision && (
              <div
                style={{
                  padding: "17px",
                  border: "1px solid #e5eaf2",
                  borderRadius: "12px",
                  background: "#fbfcff",
                }}
              >
                <div
                  style={{
                    color: "#5065e8",
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: ".14em",
                    marginBottom: "12px",
                  }}
                >
                  DECISION ENGINE
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "8px",
                    color: "#53627b",
                    fontSize: "12px",
                  }}
                >
                  <div>
                    <strong>Decision:</strong>{" "}
                    {lastResult.decision.decision}
                  </div>

                  <div>
                    <strong>Action:</strong>{" "}
                    {lastResult.decision.action_type}
                  </div>

                  <div>
                    <strong>Reason:</strong>{" "}
                    {lastResult.decision.reason}
                  </div>

                  <div>
                    <strong>Human Approval:</strong>{" "}
                    {lastResult.decision
                      .requires_human_approval
                      ? "Required"
                      : "Not Required"}
                  </div>
                </div>
              </div>
            )}

            {lastResult.automation && (
              <div
                style={{
                  padding: "17px",
                  border: "1px solid #e5eaf2",
                  borderRadius: "12px",
                  background: "#fbfcff",
                }}
              >
                <div
                  style={{
                    color: "#5065e8",
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: ".14em",
                    marginBottom: "12px",
                  }}
                >
                  AUTOMATION
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "8px",
                    color: "#53627b",
                    fontSize: "12px",
                  }}
                >
                  <div>
                    <strong>Status:</strong>{" "}
                    {lastResult.automation.status ||
                      "—"}
                  </div>

                  <div>
                    <strong>Action:</strong>{" "}
                    {lastResult.automation.action ||
                      lastResult.automation.action_type ||
                      "—"}
                  </div>

                  <div>
                    <strong>Message:</strong>{" "}
                    {lastResult.automation.message ||
                      "—"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============================================================
          REQUEST HISTORY
      ============================================================ */}

      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <span className="panel-eyebrow">
              REQUEST HISTORY
            </span>

            <h2>Recent Business Requests</h2>
          </div>

          <button
            className="secondary-button"
            onClick={loadRequests}
            disabled={loadingRequests}
          >
            {loadingRequests
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {loadingRequests ? (
          <div className="empty-state">
            <strong>Loading requests...</strong>
            <span>
              Retrieving business request activity
              from the FlowMind AI backend.
            </span>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              ▣
            </div>

            <strong>
              No business requests yet
            </strong>

            <span>
              Submit your first request above to
              test the complete AI-powered request
              processing workflow.
            </span>
          </div>
        ) : (
          <div className="workflow-list">
            {requests.map((item) => (
              <div
                className="workflow-card"
                key={item.request_id}
              >
                <div className="workflow-card-main">
                  <div className="workflow-card-icon">
                    ▣
                  </div>

                  <div className="workflow-card-content">
                    <div className="workflow-card-title-row">
                      <h3>
                        {item.request_id}
                      </h3>

                      <span
                        className={`status-badge ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {String(
                          item.status || "unknown"
                        ).replace("_", " ")}
                      </span>

                      <span className="period-badge">
                        {item.priority || "MEDIUM"}
                      </span>
                    </div>

                    <p>
                      {item.input_text ||
                        item.ai_summary ||
                        "Business request"}
                    </p>

                    <div className="workflow-meta">
                      <span>
                        Customer:{" "}
                        <b>
                          {item.customer_name}
                        </b>
                      </span>

                      <span>
                        Intent:{" "}
                        <b>
                          {item.intent ||
                            "General Request"}
                        </b>
                      </span>

                      <span>
                        Confidence:{" "}
                        <b>
                          {item.confidence_score ??
                            0}
                        </b>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="workflow-card-actions">
                  <span
                    className={
                      item.action_taken ===
                      "AUTO_EXECUTE"
                        ? "healthy-badge"
                        : "period-badge"
                    }
                  >
                    {item.action_taken ||
                      "PENDING"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Requests;