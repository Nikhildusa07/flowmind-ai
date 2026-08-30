import { useEffect, useRef, useState } from "react";
const API_BASE_URL = "https://flowmind-ai-14ng.onrender.com";

const ALLOWED_EXTENSIONS = [
  "pdf",
  "xlsx",
  "xls",
  "csv",
  "docx",
  "txt",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const DOCUMENT_STATS_KEY = "flowmind_document_stats";
const DOCUMENT_ACTIVITY_KEY = "flowmind_document_activity";

const initialDocumentStats = {
  total: 0,
  successful: 0,
  failed: 0,
};

function getAuthHeaders() {
  const token = localStorage.getItem("flowmind_access_token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function formatFileSize(bytes) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(bytes / 1024 ** index).toFixed(
    index === 0 ? 0 : 1
  )} ${units[index]}`;
}

function getFileExtension(filename) {
  return filename
    .split(".")
    .pop()
    .toLowerCase();
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function ResultFields({ data }) {
  if (!data || typeof data !== "object") {
    return (
      <div className="document-result-value">
        {formatValue(data)}
      </div>
    );
  }

  const entries = Object.entries(data);

  if (!entries.length) {
    return (
      <div className="document-result-empty">
        No structured result data returned.
      </div>
    );
  }

  return (
    <div className="document-result-fields">
      {entries.map(([key, value]) => (
        <div
          className="document-result-field"
          key={key}
        >
          <span className="document-result-key">
            {key.replace(/_/g, " ")}
          </span>

          <div className="document-result-value">
            {typeof value === "object" ? (
              <pre>
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              formatValue(value)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Documents() {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [result, setResult] = useState(null);
  const [activity, setActivity] = useState([]);

  /*
   * ============================================================
   * PERSISTENT DOCUMENT STATISTICS
   * ============================================================
   *
   * These values are loaded from localStorage so they survive
   * page refreshes.
   */
  const [documentStats, setDocumentStats] = useState(() => {
    try {
      const savedStats = localStorage.getItem(
        DOCUMENT_STATS_KEY
      );

      if (savedStats) {
        const parsed = JSON.parse(savedStats);

        return {
          ...initialDocumentStats,
          ...parsed,
        };
      }
    } catch {
      // Ignore invalid local storage.
    }

    return initialDocumentStats;
  });

  const totalDocuments = documentStats.total;
  const successfulDocuments =
    documentStats.successful;
  const failedDocuments =
    documentStats.failed;

  /*
   * ============================================================
   * LOAD PERSISTED DATA
   * ============================================================
   */

  useEffect(() => {
    try {
      const savedActivity =
        localStorage.getItem(
          DOCUMENT_ACTIVITY_KEY
        );

      if (savedActivity) {
        const parsed = JSON.parse(savedActivity);

        if (Array.isArray(parsed)) {
          setActivity(parsed);
        }
      }
    } catch {
      // Ignore invalid local history.
    }
  }, []);

  /*
   * ============================================================
   * SAVE DOCUMENT STATISTICS
   * ============================================================
   */

  useEffect(() => {
    try {
      localStorage.setItem(
        DOCUMENT_STATS_KEY,
        JSON.stringify(documentStats)
      );
    } catch {
      // Ignore localStorage failures.
    }
  }, [documentStats]);

  /*
   * ============================================================
   * ACTIVITY HELPERS
   * ============================================================
   */

  const saveActivity = (newActivity) => {
    setActivity(newActivity);

    try {
      localStorage.setItem(
        DOCUMENT_ACTIVITY_KEY,
        JSON.stringify(newActivity)
      );
    } catch {
      // Ignore localStorage failures.
    }
  };

  const addActivity = (entry) => {
    const newActivity = [
      entry,
      ...activity,
    ].slice(0, 8);

    saveActivity(newActivity);
  };

  /*
   * ============================================================
   * FILE SELECTION
   * ============================================================
   */

  const selectFile = (file) => {
    setError("");
    setSuccess("");
    setResult(null);

    if (!file) {
      return;
    }

    const extension = getFileExtension(file.name);

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setSelectedFile(null);

      setError(
        "Unsupported file type. Please upload PDF, XLSX, XLS, CSV, DOCX or TXT."
      );

      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);

      setError(
        "File size must be 20 MB or smaller."
      );

      return;
    }

    setSelectedFile(file);
  };

  const handleFileInput = (event) => {
    const file = event.target.files?.[0];

    selectFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];

    selectFile(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setResult(null);
    setError("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /*
   * ============================================================
   * ANALYZE DOCUMENT
   * ============================================================
   */

  const analyzeDocument = async () => {
    if (!selectedFile) {
      setError("Please select a document first.");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setSuccess("");
      setResult(null);

      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await fetch(
        `${API_BASE_URL}/documents/analyze`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        }
      );

      const responseData =
        await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Authentication required. Please log in again."
          );
        }

        throw new Error(
          responseData?.detail ||
            responseData?.message ||
            "Document analysis failed."
        );
      }

      /*
       * ========================================================
       * SUCCESS
       * ========================================================
       */

      setResult(responseData);

      setDocumentStats((current) => ({
        total: current.total + 1,
        successful: current.successful + 1,
        failed: current.failed,
      }));

      setSuccess(
        "Document analyzed successfully."
      );

      addActivity({
        id: `${Date.now()}-${selectedFile.name}`,
        title: "Document analyzed",
        fileName: selectedFile.name,
        time: new Date().toISOString(),
        status: "success",
      });
    } catch (err) {
      /*
       * ========================================================
       * FAILURE
       * ========================================================
       */

      setDocumentStats((current) => ({
        total: current.total + 1,
        successful: current.successful,
        failed: current.failed + 1,
      }));

      setError(
        err.message ||
          "Unable to analyze the document."
      );

      addActivity({
        id: `${Date.now()}-${selectedFile.name}`,
        title: "Document analysis failed",
        fileName: selectedFile.name,
        time: new Date().toISOString(),
        status: "failed",
      });
    } finally {
      setProcessing(false);
    }
  };

  /*
   * ============================================================
   * SUCCESS RATE
   * ============================================================
   */

  const successRate =
    totalDocuments > 0
      ? Math.round(
          (successfulDocuments /
            totalDocuments) *
            100
        )
      : 0;

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="documents-page">

      {/* ========================================================
          PAGE HEADER
      ======================================================== */}

      <div className="page-heading">
        <div>
          <span className="eyebrow">
            INTELLIGENCE
          </span>

          <h1>Document Intelligence</h1>

          <p>
            Turn business files into structured,
            actionable information with AI.
          </p>
        </div>

        <div className="document-header-badge">
          <span className="status-dot" />

          <span>AI Engine Ready to process</span>
        </div>
      </div>

      {/* ========================================================
          ALERTS
      ======================================================== */}

      {error && (
        <div className="alert alert-warning">
          <strong>Document:</strong>

          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <strong>Success:</strong>

          <span>{success}</span>
        </div>
      )}

      {/* ========================================================
          STATISTICS
      ======================================================== */}

      <div className="document-stats-grid">

        <div className="document-stat-card">
          <span className="document-stat-icon">
            ▤
          </span>

          <span className="document-stat-label">
            Documents Processed
          </span>

          <strong>
            {totalDocuments}
          </strong>

          <span className="document-stat-description">
            Total analyzed
          </span>
        </div>

        <div className="document-stat-card">
          <span className="document-stat-icon success">
            ✓
          </span>

          <span className="document-stat-label">
            Successful
          </span>

          <strong>
            {successfulDocuments}
          </strong>

          <span className="document-stat-description">
            Successfully analyzed
          </span>
        </div>

        <div className="document-stat-card">
          <span className="document-stat-icon failed">
            !
          </span>

          <span className="document-stat-label">
            Failed
          </span>

          <strong>
            {failedDocuments}
          </strong>

          <span className="document-stat-description">
            Analysis failures
          </span>
        </div>

        <div className="document-stat-card">
          <span className="document-stat-icon rate">
            %
          </span>

          <span className="document-stat-label">
            Success Rate
          </span>

          <strong>
            {successRate}%
          </strong>

          <span className="document-stat-description">
            Current workspace
          </span>
        </div>

      </div>

      {/* ========================================================
          MAIN DOCUMENT WORKSPACE
      ======================================================== */}

      <div className="documents-grid">

        {/* ======================================================
            UPLOAD PANEL
        ====================================================== */}

        <section className="dashboard-panel">

          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                UPLOAD & ANALYZE
              </span>

              <h2>
                Start a document analysis
              </h2>

              <p>
                Upload a business file and let
                the AI extraction engine identify
                useful information.
              </p>
            </div>

            <span className="period-badge">
              20 MB MAX
            </span>
          </div>

          <div className="document-upload-content">

            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,.xlsx,.xls,.csv,.docx,.txt"
              onChange={handleFileInput}
            />

            <button
              type="button"
              className={`document-dropzone ${
                dragActive
                  ? "drag-active"
                  : ""
              }`}
              onClick={() =>
                fileInputRef.current?.click()
              }
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              disabled={processing}
            >
              <span className="document-upload-icon">
                ↑
              </span>

              <strong>
                Drop your document here
              </strong>

              <span>
                or browse from your computer
              </span>

              <small>
                PDF · XLSX · XLS · CSV · DOCX · TXT
              </small>
            </button>

            {selectedFile && (
              <div className="selected-document">

                <div className="selected-document-icon">
                  ▤
                </div>

                <div className="selected-document-info">
                  <strong>
                    {selectedFile.name}
                  </strong>

                  <span>
                    {formatFileSize(
                      selectedFile.size
                    )}{" "}
                    ·{" "}
                    {getFileExtension(
                      selectedFile.name
                    ).toUpperCase()}
                  </span>
                </div>

                <button
                  type="button"
                  className="document-remove-button"
                  onClick={clearFile}
                  disabled={processing}
                  aria-label="Remove selected document"
                >
                  ×
                </button>

              </div>
            )}

            <div className="document-upload-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={processing}
              >
                Choose File
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={analyzeDocument}
                disabled={
                  !selectedFile || processing
                }
              >
                {processing
                  ? "Analyzing..."
                  : "Analyze Document →"}
              </button>

            </div>

            {processing && (
              <div className="document-processing">

                <span className="loading-spinner" />

                <div>
                  <strong>
                    Processing document
                  </strong>

                  <span>
                    Extracting and analyzing
                    business information...
                  </span>
                </div>

              </div>
            )}

            <div className="document-security-note">
              ✓ Supported files are processed
              through your authenticated workspace.
            </div>

          </div>
        </section>

        {/* ======================================================
            RESULT PANEL
        ====================================================== */}

        <section className="dashboard-panel">

          <div className="panel-header">

            <div>
              <span className="panel-eyebrow">
                AI OUTPUT
              </span>

              <h2>
                Analysis Result
              </h2>

              <p>
                Structured information extracted
                from your document.
              </p>
            </div>

            {result && (
              <span className="healthy-badge">
                ✓ Complete
              </span>
            )}

          </div>

          <div className="document-result-content">

            {!result ? (
              <div className="empty-state">

                <div className="empty-state-icon">
                  ✦
                </div>

                <strong>
                  Ready for analysis
                </strong>

                <span>
                  Upload a business document and
                  run AI analysis to see extracted
                  information here.
                </span>

              </div>
            ) : (
              <ResultFields data={result} />
            )}

          </div>

        </section>

      </div>

      {/* ========================================================
          RECENT ACTIVITY
      ======================================================== */}

      <section className="dashboard-panel document-activity-panel">

        <div className="panel-header">

          <div>
            <span className="panel-eyebrow">
              ACTIVITY
            </span>

            <h2>
              Recent Document Activity
            </h2>
          </div>

          {activity.length > 0 && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                saveActivity([]);
              }}
            >
              Clear
            </button>
          )}

        </div>

        {activity.length === 0 ? (
          <div className="empty-state">

            <div className="empty-state-icon">
              ◉
            </div>

            <strong>
              No document activity
            </strong>

            <span>
              Your document processing activity
              will appear here.
            </span>

          </div>
        ) : (
          <div className="document-activity-list">

            {activity.map((item) => (
              <div
                className="document-activity-row"
                key={item.id}
              >

                <div className="document-activity-icon">
                  {item.status === "success"
                    ? "✓"
                    : "!"}
                </div>

                <div className="document-activity-main">

                  <strong>
                    {item.title}
                  </strong>

                  <span>
                    {item.fileName}
                  </span>

                </div>

                <div className="document-activity-time">
                  {new Date(
                    item.time
                  ).toLocaleString()}
                </div>

                <span
                  className={`status-badge ${
                    item.status === "success"
                      ? "completed"
                      : "failed"
                  }`}
                >
                  {item.status === "success"
                    ? "Success"
                    : "Failed"}
                </span>

              </div>
            ))}

          </div>
        )}

      </section>

      {/* ========================================================
          SUPPORTED DOCUMENTS
      ======================================================== */}

      <section className="document-supported">

        <div>
          <span className="panel-eyebrow">
            SUPPORTED DOCUMENTS
          </span>

          <h2>
            Analyze your business files
          </h2>

          <p>
            FlowMind AI accepts common business
            document formats for automated
            extraction and analysis.
          </p>
        </div>

        <div className="supported-file-grid">

          {[
            ["PDF", "Portable documents"],
            ["XLSX", "Excel spreadsheets"],
            ["XLS", "Legacy spreadsheets"],
            ["CSV", "Structured data"],
            ["DOCX", "Word documents"],
            ["TXT", "Text documents"],
          ].map(([extension, description]) => (
            <div
              className="supported-file-card"
              key={extension}
            >
              <strong>
                {extension}
              </strong>

              <span>
                {description}
              </span>
            </div>
          ))}

        </div>

      </section>

    </div>
  );
}

export default Documents;