import { useEffect, useState } from "react";
import { apiFetch } from "../services/auth";

const initialForm = { name: "", description: "" };
const initialStepForm = { name: "", step_type: "AI Analysis", configuration: "" };

const DEFAULT_STEPS = [
  { name: "Receive Business Request", step_type: "Data Collection", configuration: { action: "receive", description: "Receive and validate workflow input." } },
  { name: "AI Analysis", step_type: "AI Analysis", configuration: { action: "analyze", description: "Analyze the incoming business request." } },
  { name: "Business Decision", step_type: "Decision", configuration: { action: "decide", description: "Evaluate the request and determine the next action." } },
  { name: "Complete Automation", step_type: "Automated Action", configuration: { action: "complete", description: "Complete the automated workflow action and record the result." } },
];

const STEP_TYPES = ["Data Collection", "AI Analysis", "Classification", "Decision", "Automated Action", "Notification", "Logging", "Human Review"];

async function getData(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { detail: text }; }
}

async function request(path, options = {}) {
  const response = await apiFetch(path, options);
  const data = await getData(response);

  if (!response.ok) {
    if (response.status === 401) throw new Error("Authentication required. Please log in again.");
    if (Array.isArray(data?.detail)) throw new Error(data.detail.map((item) => item?.msg || String(item)).join(", "));
    throw new Error(data?.detail || data?.message || `Request failed with status ${response.status}`);
  }
  return data;
}

function StatusBadge({ status }) {
  const normalized = String(status || "unknown").toLowerCase().replace(/\s+/g, "-");
  return <span className={`workflow-status ${normalized}`}>{status || "Unknown"}</span>;
}

function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [steps, setSteps] = useState([]);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [executions, setExecutions] = useState([]);
  const [executionsLoading, setExecutionsLoading] = useState(false);
  const [showStepForm, setShowStepForm] = useState(false);
  const [stepForm, setStepForm] = useState(initialStepForm);
  const [addingStep, setAddingStep] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const clearMessages = () => { setError(""); setSuccess(""); };

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await request("/workflows", { method: "GET" });
      setWorkflows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load workflows.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorkflows(); }, []);

  const loadSteps = async (id) => {
    const data = await request(`/workflows/${id}/steps`, { method: "GET" });
    return Array.isArray(data) ? data : [];
  };

  const loadExecutions = async (id) => {
    const data = await request(`/workflows/${id}/executions`, { method: "GET" });
    return Array.isArray(data) ? data : [];
  };

  const createDefaultSteps = async (workflowId) => {
    const created = [];
    for (let i = 0; i < DEFAULT_STEPS.length; i += 1) {
      const item = DEFAULT_STEPS[i];
      try {
        const step = await request(`/workflows/${workflowId}/steps`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            step_type: item.step_type,
            step_order: i + 1,
            configuration: JSON.stringify(item.configuration),
          }),
        });
        created.push(step);
      } catch (err) {
        console.warn("Default step creation failed:", err);
      }
    }
    return created;
  };

  const ensureWorkflowSteps = async (workflow) => {
    let current = await loadSteps(workflow.id);
    if (current.length) return current;
    await createDefaultSteps(workflow.id);
    current = await loadSteps(workflow.id);
    return current;
  };

  const createWorkflow = async (event) => {
    event.preventDefault();
    clearMessages();
    if (!form.name.trim()) { setError("Workflow name is required."); return; }

    try {
      setCreating(true);
      const created = await request("/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() || null }),
      });

      const createdSteps = await createDefaultSteps(created.id);
      setWorkflows((current) => [created, ...current]);
      setForm(initialForm);
      setShowCreateForm(false);
      setSelectedWorkflow(created);
      setSteps(createdSteps);
      setExecutions([]);
      setSuccess(createdSteps.length ? "Workflow created with a ready-to-run automation pipeline." : "Workflow created. Add steps before execution.");
    } catch (err) {
      setError(err.message || "Unable to create workflow.");
    } finally {
      setCreating(false);
    }
  };

  const updateWorkflowStatus = async (workflow, status) => {
    try {
      setActionLoading(`status-${workflow.id}`);
      clearMessages();
      if (String(status).toLowerCase() === "active") {
        const prepared = await ensureWorkflowSteps(workflow);
        setSteps(prepared);
        if (!prepared.length) throw new Error("The workflow could not be prepared with an executable step.");
      }

      const updated = await request(`/workflows/${workflow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      setWorkflows((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelectedWorkflow((current) => current?.id === updated.id ? updated : current);
      setSuccess(String(status).toLowerCase() === "active" ? "Workflow activated and ready to execute." : "Workflow status updated.");
    } catch (err) {
      setError(err.message || "Unable to update workflow.");
    } finally {
      setActionLoading("");
    }
  };

  const deleteWorkflow = async (workflow) => {
    if (!window.confirm(`Delete workflow "${workflow.name}"?`)) return;
    try {
      setActionLoading(`delete-${workflow.id}`);
      clearMessages();
      await request(`/workflows/${workflow.id}`, { method: "DELETE" });
      setWorkflows((current) => current.filter((item) => item.id !== workflow.id));
      if (selectedWorkflow?.id === workflow.id) {
        setSelectedWorkflow(null); setSteps([]); setExecutions([]); setShowStepForm(false);
      }
      setSuccess("Workflow deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete workflow.");
    } finally {
      setActionLoading("");
    }
  };

  const openWorkflow = async (workflow) => {
    try {
      clearMessages();
      setSelectedWorkflow(workflow);
      setSteps([]);
      setExecutions([]);
      setStepsLoading(true);
      setExecutionsLoading(true);
      const [workflowSteps, workflowExecutions] = await Promise.all([
        loadSteps(workflow.id),
        loadExecutions(workflow.id),
      ]);
      setSteps(workflowSteps);
      setExecutions(workflowExecutions);
    } catch (err) {
      setError(err.message || "Unable to load workflow details.");
    } finally {
      setStepsLoading(false);
      setExecutionsLoading(false);
    }
  };

  const addWorkflowStep = async (event) => {
    event.preventDefault();
    if (!selectedWorkflow) return;
    clearMessages();
    if (!stepForm.name.trim()) { setError("Step name is required."); return; }

    try {
      setAddingStep(true);
      const nextOrder = steps.length ? Math.max(...steps.map((s) => Number(s.step_order) || 0)) + 1 : 1;
      let configuration = stepForm.configuration.trim();

      if (configuration) {
        try { JSON.parse(configuration); } catch { configuration = JSON.stringify({ description: configuration }); }
      } else {
        configuration = JSON.stringify({ action: stepForm.step_type });
      }

      const createdStep = await request(`/workflows/${selectedWorkflow.id}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: stepForm.name.trim(),
          step_type: stepForm.step_type,
          step_order: nextOrder,
          configuration,
        }),
      });

      setSteps((current) => [...current, createdStep].sort((a, b) => Number(a.step_order) - Number(b.step_order)));
      setStepForm(initialStepForm);
      setShowStepForm(false);

      const refreshed = await request(`/workflows/${selectedWorkflow.id}`, { method: "GET" });
      setSelectedWorkflow(refreshed);
      setWorkflows((current) => current.map((item) => item.id === refreshed.id ? refreshed : item));
      setSuccess("Workflow step added successfully.");
    } catch (err) {
      setError(err.message || "Unable to add workflow step.");
    } finally {
      setAddingStep(false);
    }
  };

  const executeWorkflow = async (workflow) => {
    try {
      setActionLoading(`execute-${workflow.id}`);
      clearMessages();

      let workflowSteps = await loadSteps(workflow.id);
      if (!workflowSteps.length) {
        workflowSteps = await ensureWorkflowSteps(workflow);
        setSteps(workflowSteps);
      }
      if (!workflowSteps.length) throw new Error("Unable to prepare this workflow for execution.");

      let executable = workflow;
      if (String(workflow.status).toLowerCase() !== "active") {
        executable = await request(`/workflows/${workflow.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "active" }),
        });
        setWorkflows((current) => current.map((item) => item.id === executable.id ? executable : item));
      }

      const execution = await request(`/workflows/${workflow.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger_type: "manual",
          input_data: "Manual execution from FlowMind AI dashboard.",
        }),
      });

      const freshExecutions = await loadExecutions(workflow.id);
      setExecutions(freshExecutions.some((item) => item.id === execution?.id) ? freshExecutions : [execution, ...freshExecutions]);
      setSelectedWorkflow(executable);
      setSuccess("Workflow executed successfully.");
    } catch (err) {
      setError(err.message || "Workflow execution failed.");
    } finally {
      setActionLoading("");
    }
  };

  const total = workflows.length;
  const active = workflows.filter((w) => String(w.status).toLowerCase() === "active").length;
  const draft = workflows.filter((w) => String(w.status).toLowerCase() === "draft").length;
  const inactive = workflows.filter((w) => String(w.status).toLowerCase() === "inactive").length;

  return (
    <div className="workflows-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">AUTOMATION</span>
          <h1>Workflows</h1>
          <p>Create, manage and execute your business automation workflows.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => { clearMessages(); setShowCreateForm((v) => !v); }}>
          + Create Workflow
        </button>
      </div>

      {success && <div className="alert alert-success"><strong>Success:</strong> {success}</div>}
      {error && <div className="alert alert-warning"><strong>Workflow:</strong> {error}</div>}

      {showCreateForm && (
        <section className="workflow-form-panel">
          <div className="panel-header">
            <div><span className="panel-eyebrow">NEW AUTOMATION</span><h2>Create Workflow</h2></div>
            <span className="form-step-badge">01</span>
          </div>
          <form className="workflow-form" onSubmit={createWorkflow}>
            <div className="form-group">
              <label htmlFor="workflow-name">Workflow name</label>
              <input id="workflow-name" value={form.name} maxLength={200} disabled={creating} placeholder="e.g. Invoice Processing" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="workflow-description">Description</label>
              <textarea id="workflow-description" value={form.description} rows={4} disabled={creating} placeholder="Describe what this workflow does..." onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="button" className="secondary-button" disabled={creating} onClick={() => { setShowCreateForm(false); setForm(initialForm); }}>Cancel</button>
              <button type="submit" className="primary-button" disabled={creating}>{creating ? "Creating..." : "Create Workflow →"}</button>
            </div>
          </form>
        </section>
      )}

      <div className="workflow-summary-grid">
        <div className="workflow-summary-card"><span className="summary-icon">▦</span><div><span>Total Workflows</span><strong>{total}</strong></div></div>
        <div className="workflow-summary-card summary-active"><span className="summary-icon">✓</span><div><span>Active</span><strong>{active}</strong></div></div>
        <div className="workflow-summary-card summary-draft"><span className="summary-icon">◌</span><div><span>Drafts</span><strong>{draft}</strong></div></div>
        <div className="workflow-summary-card summary-inactive"><span className="summary-icon">○</span><div><span>Inactive</span><strong>{inactive}</strong></div></div>
      </div>

      <section className="dashboard-panel workflow-library-panel">
        <div className="panel-header">
          <div><span className="panel-eyebrow">WORKFLOW LIBRARY</span><h2>Your Workflows</h2></div>
          <button className="secondary-button" type="button" onClick={loadWorkflows} disabled={loading}>{loading ? "Loading..." : "↻ Refresh"}</button>
        </div>

        {loading ? (
          <div className="empty-state compact"><div className="empty-state-icon">◌</div><strong>Loading workflows...</strong><span>Fetching your automation library.</span></div>
        ) : workflows.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">↗</div><strong>No workflows yet</strong><span>Create your first workflow to start building business automations.</span><button className="primary-button" type="button" onClick={() => setShowCreateForm(true)}>Create Your First Workflow</button></div>
        ) : (
          <div className="workflow-list">
            {workflows.map((workflow) => {
              const status = String(workflow.status || "").toLowerCase();
              const executing = actionLoading === `execute-${workflow.id}`;
              const activating = actionLoading === `status-${workflow.id}`;
              const deleting = actionLoading === `delete-${workflow.id}`;

              return (
                <article className="workflow-card" key={workflow.id}>
                  <div className="workflow-card-main">
                    <div className="workflow-card-icon">↗</div>
                    <div className="workflow-card-content">
                      <div className="workflow-card-title-row"><h3>{workflow.name}</h3><StatusBadge status={workflow.status} /></div>
                      <p>{workflow.description || "No description provided."}</p>
                      <div className="workflow-meta">
                        <span><b>Version</b> {workflow.version ?? "—"}</span>
                        <span><b>Created</b> {workflow.created_at ? new Date(workflow.created_at).toLocaleDateString() : "—"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="workflow-card-actions">
                    <button className="secondary-button" type="button" onClick={() => openWorkflow(workflow)}>Details</button>
                    <button className={status === "active" ? "primary-button" : "secondary-button"} type="button" disabled={executing || activating} onClick={() => status === "active" ? executeWorkflow(workflow) : updateWorkflowStatus(workflow, "active")}>
                      {executing ? "Running..." : activating ? "Preparing..." : status === "active" ? "▶ Execute" : "Activate"}
                    </button>
                    <button className="danger-button" type="button" disabled={deleting} onClick={() => deleteWorkflow(workflow)}>{deleting ? "Deleting..." : "Delete"}</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedWorkflow && (
        <section className="dashboard-panel workflow-details-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">WORKFLOW DETAILS</span>
              <h2>{selectedWorkflow.name}</h2>
              <div className="workflow-detail-status"><StatusBadge status={selectedWorkflow.status} /><span>Version {selectedWorkflow.version ?? "—"}</span></div>
            </div>
            <button className="secondary-button" type="button" onClick={() => { setSelectedWorkflow(null); setSteps([]); setExecutions([]); setShowStepForm(false); }}>Close</button>
          </div>

          <div className="workflow-detail-grid">
            <div className="workflow-detail-section">
              <div className="detail-section-header"><div><span className="panel-eyebrow">PIPELINE</span><h3>Workflow Steps</h3></div><button className="primary-button" type="button" onClick={() => setShowStepForm((v) => !v)}>+ Add Step</button></div>

              {showStepForm && (
                <form className="workflow-form step-form" onSubmit={addWorkflowStep}>
                  <div className="form-group"><label>Step name</label><input value={stepForm.name} disabled={addingStep} placeholder="e.g. Validate Invoice" onChange={(e) => setStepForm({ ...stepForm, name: e.target.value })} /></div>
                  <div className="form-group"><label>Step type</label><select value={stepForm.step_type} disabled={addingStep} onChange={(e) => setStepForm({ ...stepForm, step_type: e.target.value })}>{STEP_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
                  <div className="form-group"><label>Configuration</label><textarea rows={3} value={stepForm.configuration} disabled={addingStep} placeholder='Optional JSON or description, e.g. {"action":"validate"}' onChange={(e) => setStepForm({ ...stepForm, configuration: e.target.value })} /></div>
                  <div className="form-actions"><button type="button" className="secondary-button" onClick={() => { setShowStepForm(false); setStepForm(initialStepForm); }}>Cancel</button><button type="submit" className="primary-button" disabled={addingStep}>{addingStep ? "Adding..." : "Add Step"}</button></div>
                </form>
              )}

              {stepsLoading ? <div className="detail-loading">Loading steps...</div> : steps.length === 0 ? (
                <div className="detail-empty"><div className="empty-state-icon">↗</div><strong>Workflow pipeline is empty</strong><span>Prepare the workflow to create the default automation pipeline.</span><button className="primary-button" type="button" onClick={async () => { try { setStepsLoading(true); clearMessages(); const prepared = await ensureWorkflowSteps(selectedWorkflow); setSteps(prepared); setSuccess("Default workflow steps created successfully."); } catch (err) { setError(err.message); } finally { setStepsLoading(false); } }}>Prepare Workflow</button></div>
              ) : (
                <div className="step-list">
                  {steps.map((step, index) => (
                    <div className="step-row" key={step.id}>
                      <div className="step-number">{step.step_order ?? index + 1}</div>
                      <div className="step-connector" />
                      <div className="step-content"><strong>{step.name}</strong><span>{step.step_type}</span>{step.configuration && <small>Configured</small>}</div>
                      <span className="step-check">✓</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="workflow-detail-section">
              <div className="detail-section-header"><div><span className="panel-eyebrow">RUN HISTORY</span><h3>Executions</h3></div><button className="secondary-button" type="button" disabled={executionsLoading} onClick={async () => { try { setExecutionsLoading(true); setExecutions(await loadExecutions(selectedWorkflow.id)); } catch (err) { setError(err.message); } finally { setExecutionsLoading(false); } }}>↻ Refresh</button></div>

              {executionsLoading ? <div className="detail-loading">Loading executions...</div> : executions.length === 0 ? (
                <div className="detail-empty"><div className="empty-state-icon">◌</div><strong>No executions yet</strong><span>Execute this workflow to create the first execution record.</span></div>
              ) : (
                <div className="execution-list">
                  {executions.map((execution) => (
                    <div className="execution-row" key={execution.id}>
                      <div className="execution-marker">↗</div>
                      <div><strong>{execution.trigger_type || "manual"}</strong><span>{execution.created_at ? new Date(execution.created_at).toLocaleString() : "—"}</span>{execution.completed_at && <small>Completed {new Date(execution.completed_at).toLocaleString()}</small>}{execution.error_message && <small className="execution-error">{execution.error_message}</small>}</div>
                      <StatusBadge status={execution.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="workflow-detail-actions">
            <button className="primary-button large-button" type="button" disabled={actionLoading === `execute-${selectedWorkflow.id}`} onClick={() => executeWorkflow(selectedWorkflow)}>
              {actionLoading === `execute-${selectedWorkflow.id}` ? "Running Workflow..." : "▶ Execute Workflow"}
            </button>
            {String(selectedWorkflow.status).toLowerCase() !== "active" && <button className="secondary-button large-button" type="button" onClick={() => updateWorkflowStatus(selectedWorkflow, "active")}>Activate Workflow</button>}
          </div>
        </section>
      )}
    </div>
  );
}

export default Workflows;
