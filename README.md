# FlowMind AI

### AI-Powered Business Operations Automation System

FlowMind AI is a full-stack business automation platform designed to turn business requests and documents into structured, AI-assisted operational workflows.

The platform combines **React + Vite**, **FastAPI**, **PostgreSQL**, and **Gemini-based AI** to provide request automation, document intelligence, workflow execution, human-in-the-loop review, analytics, monitoring, and conversational AI assistance.

---

## Overview

FlowMind AI follows a controlled automation model:

> **Automate routine work. Escalate uncertain or high-risk work. Keep humans in control of critical decisions.**

A business request can be analyzed by AI, assigned an intent, priority, confidence score, and summary, and then routed through either automated execution or human review.

```text
                    Business Request
                           |
                           v
                  Request Validation
                           |
                           v
                      AI Analysis
                           |
                +----------+----------+
                |                     |
                v                     v
        High Confidence          High Risk /
        Low Risk                 Low Confidence
                |                     |
                v                     v
       Automated Execution      Human Review
                                      |
                              +-------+-------+
                              |               |
                           Approve          Reject
                              |               |
                              v               v
                          Completed        Rejected
                              |
                              v
                    Analytics / Monitoring
```

---

## Key Features

### Business Request Automation

- Create and process business requests.
- AI-powered intent classification.
- Priority classification.
- Confidence scoring.
- AI-generated request summaries.
- Automated execution for eligible low-risk requests.
- Human-review escalation for uncertain or high-risk requests.
- Request processing results and history.

### AI Assistant

- Natural-language business automation assistant.
- Workflow and process guidance.
- Business document and analytics guidance.
- Suggested prompts.
- Multi-message conversations.
- Markdown-formatted AI responses.
- Loading and error handling.
- Authentication handling.
- Conversation clearing.

### Document Intelligence

- PDF/business document upload.
- AI-assisted document analysis.
- Structured information extraction.
- Document summaries.
- Operational insights.
- Processing status tracking.

### Human-in-the-Loop Review

- Pending review queue.
- Request context and AI analysis.
- Intent, priority, confidence, and review reason.
- Reviewer notes.
- Approve and execute.
- Reject with mandatory notes.
- Automatic queue refresh after decisions.

### Workflow Automation

- Workflow creation and configuration.
- Configurable workflow steps.
- Manual workflow execution.
- Execution history.
- Workflow version tracking.
- Active/inactive workflow status.

### Analytics

- Workflow execution metrics.
- Completed task metrics.
- Document processing metrics.
- Automation log metrics.
- Success, running, and failed execution counts.
- Time-range based operational metrics.

### Monitoring

- Today's execution activity.
- Completed, running, and failed task counts.
- Document activity.
- Log activity.
- API server health.
- Analytics health.
- Database health.
- Overall system status.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, JavaScript/JSX, CSS |
| Backend | Python, FastAPI, Pydantic, SQLAlchemy |
| Database | PostgreSQL |
| AI | Gemini-based AI integration |
| API | REST / HTTP JSON |
| Authentication | Bearer Token Authentication |
| Development | Git, GitHub, VS Code, Uvicorn |

---

## System Architecture

```text
+--------------------------------------------------+
|                  FLOWMIND AI                     |
+--------------------------------------------------+

                 React + Vite
                      |
                      | HTTP / JSON
                      | Bearer Token
                      v
              +------------------+
              |  FastAPI Backend  |
              +------------------+
              | Authentication   |
              | AI               |
              | Requests         |
              | Workflows        |
              | Documents       |
              | Reviews          |
              | Analytics        |
              +--------+---------+
                       |
              +--------+---------+
              |                  |
              v                  v
       +-------------+    +---------------+
       | PostgreSQL  |    | Gemini / AI   |
       |  Database   |    | Integration   |
       +-------------+    +---------------+
```

---

## Application Modules

| Module | Purpose |
|---|---|
| Authentication | Login, access tokens, and protected routes |
| Requests | Business request creation, AI analysis, decisions, execution, and history |
| Workflows | Workflow configuration, steps, execution, and history |
| Documents | Upload and AI-assisted document analysis |
| Human Review | Approval and rejection of escalated requests |
| Analytics | Historical operational metrics |
| Monitoring | Current activity and service health |
| AI Assistant | Conversational business automation guidance |

---

## Business Request Decision Engine

FlowMind AI separates routine automation from requests that require human oversight.

### Automated Path

A typical low-risk request can produce:

```text
Intent: Request Invoice Copy
Priority: LOW
Confidence: 0.98
Decision: AUTOMATE
Action: AUTO_EXECUTE
Human Approval: Not Required
Status: SUCCESS
```

### Human Review Path

A sensitive or high-risk request can produce:

```text
Intent: Report Unauthorized Account Access
Priority: URGENT
Confidence: 0.98
Decision: ESCALATE
Action: HUMAN_REVIEW
Human Approval: Required
Status: PENDING_REVIEW
```

This provides a controlled boundary between AI analysis and automated business execution.

---

## Human Review

Requests that require human intervention appear in the Human Review queue with information such as:

- Request ID
- Customer
- Request content
- Intent
- Priority
- Confidence score
- Review reason

### Approve

The reviewer can approve an eligible request and allow the configured processing path to execute.

### Reject

The reviewer can reject a request by providing review notes. The decision is recorded as rejected.

This human-in-the-loop model helps prevent uncertain or sensitive requests from being executed without appropriate oversight.

---

## Document Intelligence

FlowMind AI can analyze business documents such as invoices.

### Example

```text
Filename: sample_invoice.pdf
File Type: PDF
Status: processed
```

Example extracted information:

```text
Invoice: INV-2026-002
Vendor: XQORA Supplies
Issue Date: August 17, 2026
Base Amount: 75,000
Tax: 13,500
Total Liability: 88,500
Due Date: August 30, 2026
```

The analysis can additionally produce operational insights such as payment-window observations, financial obligations, and tax calculations.

---

## Workflow Automation

A configured workflow can contain multiple business-processing steps.

Example:

```text
1. Receive Business Request
              |
              v
2. AI Analysis
              |
              v
3. Business Decision
              |
              v
4. Complete Automation
              |
              v
5. Validation / Additional Processing
```

The workflow interface provides:

- Active/inactive status.
- Workflow version.
- Configured steps.
- Manual execution.
- Execution history.
- Completion status.

---

## AI Assistant

The AI Assistant provides a conversational interface for questions related to:

- Business automation.
- Workflow design.
- Document processing.
- Analytics.
- Monitoring.
- Operational decisions.

Example prompt:

```text
How can I automate repetitive business tasks?
```

The assistant can provide structured workflow recommendations, decision logic, automation opportunities, and practical implementation guidance.

---

## Analytics & Monitoring

### Analytics

Analytics provides historical operational information including:

- Total workflow executions.
- Completed tasks.
- Documents processed.
- Automation logs.
- Success rate.
- Running executions.
- Failed executions.
- Time-range metrics.

### Monitoring

Monitoring focuses on current system activity:

- Executions today.
- Completed tasks.
- Running tasks.
- Failed tasks.
- Documents.
- Logs today.
- API server status.
- Analytics status.
- Database status.
- Overall system health.

---

## API Overview

The backend exposes REST APIs for:

```text
/auth
/ai
/requests
/workflows
/documents
/reviews
/analytics
```

Health endpoints:

```text
/
 /health
```

When running locally, FastAPI documentation is available at:

```text
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/redoc
```

---

## Project Structure

```text
FlowMind AI/
│
├── backend/
│   └── app/
│       ├── api/
│       ├── analytics/
│       ├── core/
│       ├── models/
│       └── ...
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── screenshots/
│
├── README.md
├── requirements.txt
└── .gitignore
```

---

## Prerequisites

Install the following before running the project:

- Python 3.10+
- Node.js 18+
- npm
- PostgreSQL
- Git

Verify installations:

```bash
python --version
node --version
npm --version
git --version
```

---

## Environment Configuration

Create a local `.env` file for environment-specific configuration.

Example:

```env
DATABASE_URL=your_database_connection_string
SECRET_KEY=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

Use the exact environment variable names required by the backend configuration.

### Important

Do **not** commit:

```text
.env
API keys
Passwords
Access tokens
Production secrets
```

For GitHub, use a safe template such as:

```text
.env.example
```

---

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Nikhildusa07/flowmind-ai.git
cd flowmind-ai
```

### 2. Backend Setup

Open a terminal in the `backend` directory:

```powershell
cd backend
```

Create a virtual environment:

```powershell
python -m venv venv
```

Activate it on Windows:

```powershell
venv\Scripts\activate
```

Install dependencies:

```powershell
pip install -r ../requirements.txt
```

Configure the local `.env` file.

Start the FastAPI server:

```powershell
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

### 3. Frontend Setup

Open a second terminal:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## Authentication

Protected API requests use Bearer Token authentication:

```http
Authorization: Bearer <access_token>
```

The frontend uses the authenticated token for protected backend operations.

Unauthenticated access is handled by redirecting users to the login page where required.

---

## Testing

The application has been tested across the major end-to-end operational flows.

### Functional Testing

- [x] Registration
- [x] Login
- [x] Protected routes
- [x] Business request creation
- [x] AI request analysis
- [x] Automated execution
- [x] Human-review escalation
- [x] Human approval
- [x] Human rejection
- [x] Document upload
- [x] Document processing
- [x] AI Assistant
- [x] Workflow configuration
- [x] Workflow execution
- [x] Execution history
- [x] Analytics
- [x] Monitoring
- [x] Refresh operations
- [x] Error handling

### AI Testing

The AI functionality was evaluated for:

- Intent classification.
- Priority classification.
- Confidence behavior.
- Business-request understanding.
- Document understanding.
- Response quality.
- Ambiguous requests.
- High-risk requests.
- Low-confidence requests.

### Failure Testing

Important failure scenarios include:

- Invalid login.
- Missing authentication.
- Invalid request input.
- Backend unavailable.
- AI service failure.
- Invalid document.
- Review action failure.
- Workflow execution failure.

---

## Security

Before production deployment:

- Never commit `.env`.
- Never commit API keys or passwords.
- Use `.env.example`.
- Restrict production CORS origins.
- Use HTTPS.
- Use strong production secrets.
- Apply appropriate database permissions.
- Validate uploaded document type and size.
- Keep development credentials separate from production credentials.
- Verify protected endpoints reject unauthenticated requests.

---

## Production Checklist

### Repository

- [ ] Remove unnecessary files.
- [ ] Remove unused generated files.
- [ ] Remove `.env`.
- [ ] Add `.env.example`.
- [ ] Verify `.gitignore`.
- [ ] Scan repository for secrets.
- [ ] Verify README setup instructions.

### Backend

- [ ] Configure production database.
- [ ] Configure production secrets.
- [ ] Configure trusted CORS origins.
- [ ] Verify authentication.
- [ ] Verify AI integration.
- [ ] Verify document processing.
- [ ] Verify health endpoints.

### Frontend

- [ ] Configure production API URL.
- [ ] Verify all routes.
- [ ] Verify authentication redirects.
- [ ] Verify error states.
- [ ] Verify responsive behavior.
- [ ] Run the production build successfully.

---

## Demonstration Flow

A complete project demonstration can follow this sequence:

```text
Dashboard
   |
   v
Create Business Request
   |
   v
AI Analysis
   |
   +-------------------------+
   |                         |
   v                         v
Automated Request       Human Review
   |                         |
   v                    +----+----+
Completed               |         |
                     Approve    Reject
                        |         |
                        v         v
                    Completed   Rejected
                        |
                        v
                Upload Document
                        |
                        v
                Document Analysis
                        |
                        v
                Configure Workflow
                        |
                        v
                Execute Workflow
                        |
                        v
                Execution History
                        |
                        v
                   Analytics
                        |
                        v
                   Monitoring
                        |
                        v
                  AI Assistant
```

---

## Screenshots

The repository contains application screenshots under:

```text
screenshots/
```

Recommended screenshot categories:

```text
screenshots/
├── dashboard/
├── requests/
├── ai-assistant/
├── documents/
├── human-review/
├── workflows/
├── analytics/
└── monitoring/
```

Screenshots provide visual evidence of the implemented application modules and end-to-end workflows.

---

## Project Status

**Status: Completed and functionally tested**

The current implementation includes:

- Authentication and protected routes.
- Dashboard.
- Business request automation.
- AI-powered request analysis.
- Automated request execution.
- Human-in-the-loop review.
- Approve/reject processing.
- Document intelligence.
- AI Assistant.
- Workflow management.
- Workflow execution history.
- Analytics.
- Monitoring.
- Backend health checks.
- PostgreSQL-backed application data.
- Gemini-based AI integration.

The primary end-to-end application flows have been tested during development.

---

## Future Enhancements

Potential future improvements include:

- Email integrations.
- Slack and Microsoft Teams notifications.
- Scheduled workflow execution.
- Role-based access control.
- Advanced workflow branching.
- Real-time monitoring.
- Exportable analytics reports.
- Advanced OCR pipelines.
- Multiple AI model providers.
- Background workers and queues.
- CI/CD deployment.
- Expanded automated test coverage.

---

## Author

**Nikhil Dusa**

**FlowMind AI**  
AI-Powered Business Operations Automation System

---

## Conclusion

FlowMind AI demonstrates a controlled approach to AI-powered business automation by combining:

```text
AI Analysis
     +
Business Rules
     +
Workflow Automation
     +
Human Review
     +
Operational Monitoring
     +
Activity Tracking
```

The platform is designed to automate routine business operations efficiently while maintaining human oversight for uncertain, sensitive, or high-risk decisions.

---

## License

This project was developed for demonstration, development, and evaluation of AI-powered business operations automation.
