import { useEffect, useState } from "react";
import { apiFetch } from "../services/auth";

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notes, setNotes] = useState({});
  const [selectedReview, setSelectedReview] = useState(null);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("/reviews/?status=pending");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load human review queue."
        );
      }

      setReviews(data.reviews || []);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load human review requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleAction = async (review, action) => {
    const reviewId = review.review_id;
    const reviewNotes = notes[reviewId]?.trim() || "";

    if (action === "reject" && !reviewNotes) {
      setError(
        "Review notes are required before rejecting a request."
      );
      return;
    }

    try {
      setProcessingId(reviewId);
      setError("");
      setSuccess("");

      const response = await apiFetch(
        `/reviews/${reviewId}/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            review_notes: reviewNotes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            `Unable to ${action} this request.`
        );
      }

      setSuccess(
        data.message ||
          `Request ${action}d successfully.`
      );

      setSelectedReview(null);

      setNotes((previous) => {
        const next = { ...previous };
        delete next[reviewId];
        return next;
      });

      await loadReviews();
    } catch (err) {
      setError(
        err?.message ||
          `Unable to ${action} this request.`
      );
    } finally {
      setProcessingId("");
    }
  };

  return (
    <div className="reviews-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">INTELLIGENCE</span>
          <h1>Human Review</h1>
          <p>
            Review requests that require human approval
            before automated processing.
          </p>
        </div>

        <div className="healthy-badge">
          {reviews.length} Pending Review
        </div>
      </div>

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

      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <span className="panel-eyebrow">
              REVIEW QUEUE
            </span>
            <h2>Requests Awaiting Approval</h2>
          </div>

          <button
            className="secondary-button"
            onClick={loadReviews}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <strong>Loading review queue...</strong>
            <span>
              Retrieving requests that require human
              review.
            </span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              ✓
            </div>

            <strong>No pending reviews</strong>

            <span>
              All requests have been processed. New
              high-priority or uncertain requests will
              appear here.
            </span>
          </div>
        ) : (
          <div className="workflow-list">
            {reviews.map((review) => {
              const request = review.request;
              const isProcessing =
                processingId === review.review_id;
              const isSelected =
                selectedReview?.review_id ===
                review.review_id;

              return (
                <div
                  className="workflow-card"
                  key={review.review_id}
                >
                  <div className="workflow-card-main">
                    <div className="workflow-card-icon">
                      ✓
                    </div>

                    <div className="workflow-card-content">
                      <div className="workflow-card-title-row">
                        <h3>
                          {request.request_id}
                        </h3>

                        <span className="status-badge failed">
                          Pending Review
                        </span>

                        <span className="period-badge">
                          {request.priority}
                        </span>
                      </div>

                      <p>
                        {request.input_text ||
                          "Business request"}
                      </p>

                      <div className="workflow-meta">
                        <span>
                          Customer:{" "}
                          <b>
                            {request.customer_name}
                          </b>
                        </span>

                        <span>
                          Intent:{" "}
                          <b>
                            {request.intent ||
                              "General Request"}
                          </b>
                        </span>

                        <span>
                          Confidence:{" "}
                          <b>
                            {request.confidence_score ??
                              0}
                          </b>
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: "12px",
                          padding: "12px",
                          borderRadius: "9px",
                          background: "#fff8dd",
                          color: "#756629",
                          fontSize: "11px",
                          lineHeight: 1.55,
                        }}
                      >
                        <strong>
                          Review reason:
                        </strong>{" "}
                        {review.reason}
                      </div>

                      {isSelected && (
                        <div
                          style={{
                            marginTop: "14px",
                          }}
                        >
                          <label
                            htmlFor={`notes-${review.review_id}`}
                            style={{
                              display: "block",
                              marginBottom: "7px",
                              color: "#344b6a",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            Review Notes
                          </label>

                          <textarea
                            id={`notes-${review.review_id}`}
                            value={
                              notes[
                                review.review_id
                              ] || ""
                            }
                            onChange={(event) =>
                              setNotes(
                                (previous) => ({
                                  ...previous,
                                  [review.review_id]:
                                    event.target.value,
                                })
                              )
                            }
                            placeholder="Enter your review decision notes..."
                            rows={4}
                            maxLength={2000}
                            disabled={isProcessing}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="workflow-card-actions">
                    {!isSelected ? (
                      <button
                        className="secondary-button"
                        onClick={() =>
                          setSelectedReview(review)
                        }
                        disabled={isProcessing}
                      >
                        Review
                      </button>
                    ) : (
                      <>
                        <button
                          className="secondary-button"
                          onClick={() =>
                            setSelectedReview(null)
                          }
                          disabled={isProcessing}
                        >
                          Cancel
                        </button>

                        <button
                          className="danger-button"
                          onClick={() =>
                            handleAction(
                              review,
                              "reject"
                            )
                          }
                          disabled={isProcessing}
                        >
                          {isProcessing
                            ? "Processing..."
                            : "Reject"}
                        </button>

                        <button
                          className="primary-button"
                          onClick={() =>
                            handleAction(
                              review,
                              "approve"
                            )
                          }
                          disabled={isProcessing}
                        >
                          {isProcessing
                            ? "Processing..."
                            : "Approve & Execute"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Reviews;