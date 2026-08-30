FlowMind AI

AI-Powered Business Operations Automation System

FlowMind AI is a full-stack business automation platform that transforms
incoming business requests and documents into structured, AI-assisted
operational workflows.

It combines a React/Vite frontend with a FastAPI backend, authenticated
API access, AI-powered analysis, document intelligence, workflow
execution, human-in-the-loop review, operational analytics, monitoring,
and activity tracking.

Features

Business Request Automation

Create and process business requests.

AI-powered intent, priority, confidence, and summary analysis.

Automated execution for eligible low-risk requests.

Human review routing for uncertain or high-risk requests.

Request history and processing results.

AI Assistant

Natural-language business automation assistant.

Guidance for workflows, documents, analytics, tasks, and operations.

Suggested prompts.

Multi-message conversations.

Markdown-formatted AI responses.

Loading, error, and authentication handling.

Conversation clearing.

Document Intelligence

PDF/business document upload.

AI-assisted document analysis.

Structured information extraction.

Document summaries and operational insights.

Processing status tracking.

Human-in-the-Loop Review

Pending review queue.

Request context, intent, priority, confidence, and review reason.

Reviewer notes.

Approve and execute.

Reject with mandatory notes.

Automatic queue refresh after decisions.

Workflow Automation

Workflow creation and configuration.

Configurable workflow steps.

Manual workflow execution.

Execution history.

Workflow status and version tracking.

Analytics

Workflow execution metrics.

Completed task metrics.

Document processing metrics.

Automation log metrics.

Success, running, and failed execution counts.

Time-range based analytics.

Monitoring

Today's execution activity.

Completed, running, and failed task counts.

Document and log activity.

API server status.

Analytics status.

Database status.

Overall system health.

Architecture

+-----------------------------+
|        React Frontend       |
|          Vite               |
+-------------+---------------+
              |
              | HTTP / JSON
              | Bearer Token
              v
+-----------------------------+
|       FastAPI Backend       |
+-----------------------------+
| Authentication API          |
| AI API                      |
| Requests API                |
| Workflows API               |
| Documents API               |
| Reviews API                 |
| Analytics                   |
+-------------+---------------+
              |
        +-----+-----+
        |           |
        v           v
+-------------+ +----------------+
| PostgreSQL  | | Gemini / AI     |
|  Database   | | Integration    |
+-------------+ +----------------+

Application Flow

Business Request
       |
       v
Request Validation
       |
       v
AI Analysis
       |
       +----------------------+
       |                      |
       v                      v
High Confidence          High Risk /
Low Risk                 Low Confidence
       |                      |
       v                      v
Automated Execution      Human Review
                              |
                         +----+----+
                         |         |
                      Approve    Reject
                         |         |
                         v         v
                     Completed  Rejected
                         |
                         v
                 Analytics / Monitoring

The core principle is:

Automate routine work while routing uncertain or high-risk work to a
human reviewer.

Technology Stack

Frontend

React

Vite

React Router

JavaScript / JSX

CSS

Backend

Python

FastAPI

Pydantic

SQLAlchemy

PostgreSQL

FastAPI CORS middleware

AI

Gemini-based AI integration

Natural-language analysis

Request classification

Document intelligence

AI Assistant responses

Development

Git / GitHub

VS Code

Vite

Uvicorn

Project Structure

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
│
└── requirements.txt

Core Modules

Authentication

The frontend obtains an access token during login and uses it for
protected API requests:

Authorization: Bearer <access_token>

Protected routes redirect unauthenticated users to the login page.

Requests

Handles business request creation, AI analysis, decision processing,
execution results, and request history.

Workflows

Provides workflow configuration, workflow steps, manual execution, and
execution history.

Documents

Provides document upload and AI-assisted document processing.

Reviews

Provides human-in-the-loop approval and rejection for requests requiring
manual decisions.

Analytics

Provides aggregated operational metrics for a selected time period.

Monitoring

Provides current operational activity and service health information.

AI Assistant

Provides an interactive natural-language interface to the AI service.

Business Request Automation

A successful low-risk request can produce information such as:

Intent: Request Invoice Copy
Priority: LOW
Confidence: 0.98
Decision: AUTOMATE
Action: AUTO_EXECUTE
Human Approval: Not Required
Status: SUCCESS

A request requiring human intervention can produce:

Intent: Report Unauthorized Account Access
Priority: URGENT
Confidence: 0.98
Decision: ESCALATE
Action: HUMAN_REVIEW
Human Approval: Required
Status: PENDING_REVIEW

This ensures that routine requests can be processed automatically while
sensitive or high-risk requests receive human oversight.

Human Review

The Human Review interface displays pending requests together with:

Request ID

Customer

Intent

Priority

Confidence score

Request content

Review reason

Approve

The reviewer can approve a request and allow the configured automated
processing path to execute.

Reject

The reviewer can reject a request after providing review notes. The
request is then recorded as rejected.

Document Intelligence

FlowMind AI can process business PDFs such as invoices.

Example:

Filename: sample_invoice.pdf
File Type: PDF
Status: processed

Summary:
Pending invoice INV-2026-002 from XQORA Supplies
issued on August 17, 2026, with a base amount of
75,000 plus 13,500 tax.

Total Liability:
88,500

Due Date:
August 30, 2026

The document analysis can also produce operational insights such as
payment-window observations, financial obligations, and tax
calculations.

Workflow Automation

A workflow can contain multiple configured business-processing steps.

Example:

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

The workflow interface provides:

Active/inactive status

Workflow version

Configured steps

Manual execution

Execution history

Completion status

Analytics and Monitoring

Analytics

Analytics provides historical information such as:

Workflow executions

Completed tasks

Documents processed

Automation logs

Success rate

Running executions

Failed executions

Monitoring

Monitoring focuses on current activity:

Executions today

Completed tasks

Documents

Logs today

Running tasks

Failed tasks

API server health

Analytics health

Database health

Overall system status

API Overview

The FastAPI backend provides REST APIs for:

/auth
/ai
/workflows
/documents
/requests
/reviews
/analytics

Health endpoints:

/
 /health

FastAPI also provides interactive API documentation during development:

<http://127.0.0.1:8000/docs>
<http://127.0.0.1:8000/redoc>

Environment Configuration

Create a local .env file for environment-specific configuration.

Example:

DATABASE_URL=your_database_connection_string
SECRET_KEY=your_secret_key
GEMINI_API_KEY=your_gemini_api_key

Use the exact environment variable names required by the backend
configuration.

Never commit real credentials or API keys to GitHub.

Recommended repository setup:

.env              -> local only
.env.example      -> safe template for GitHub

Local Development

Prerequisites

Install:

Python 3.10+

Node.js 18+

npm

PostgreSQL

Git

Verify:

python --version
node --version
npm --version
git --version

Backend Setup

Open a terminal in the backend directory.

Create virtual environment

Windows:

python -m venv venv

Activate:

venv\Scripts\activate

Install dependencies

If requirements.txt is in the project root:

pip install -r ../requirements.txt

Or, if copied into the backend directory:

pip install -r requirements.txt

Configure environment variables

Create the local .env file and configure the database, authentication,
and AI settings.

Start FastAPI

For the standard application entry point:

uvicorn app.main:app --reload

Backend:

<http://127.0.0.1:8000>

Frontend Setup

Open another terminal in the frontend directory.

Install dependencies

npm install

Start Vite

npm run dev

Frontend:

<http://localhost:5173>

The frontend communicates with the configured FastAPI backend.

Testing

The complete application should be validated across the following areas.

Functional Testing

Registration

Login

Protected routes

Business request creation

AI request analysis

Automated execution

Human review escalation

Human approval

Human rejection

Document upload

Document processing

AI Assistant

Workflow configuration

Workflow execution

Execution history

Analytics

Monitoring

Refresh operations

Error handling

AI Testing

Evaluate:

Intent classification

Priority classification

Confidence behavior

Business-request understanding

Document understanding

Response quality

Ambiguous requests

High-risk requests

Low-confidence requests

Security Testing

Verify:

Protected endpoints reject unauthenticated access.

Invalid authentication is handled.

Secrets are not exposed in frontend code.

Production credentials are not committed.

Uploaded files follow application validation rules.

Failure Testing

Test scenarios such as:

Invalid login

Missing authentication

Invalid request input

Backend unavailable

AI service failure

Invalid document

Review action failure

Workflow execution failure

Each failure should produce a clear user-facing result and leave the
application in a recoverable state.

Security

Before deployment:

Never commit .env.

Never commit API keys or passwords.

Use .env.example.

Restrict production CORS origins.

Use HTTPS.

Use strong production secrets.

Apply appropriate database permissions.

Validate document type and size.

Keep development credentials separate from production credentials.

Production Checklist

Repository

Remove unnecessary files.

Remove unused generated files.

Remove .env.

Add .env.example.

Check .gitignore.

Confirm no secrets are committed.

Verify README setup instructions.

Backend

Configure production database.

Configure production secrets.

Configure trusted CORS origins.

Verify authentication.

Verify AI integration.

Verify document processing.

Verify health endpoint.

Frontend

Configure production API URL.

Verify all routes.

Verify authentication redirects.

Verify error states.

Verify responsive behavior.

Run the production build successfully.

Demonstration

Dashboard

Requests

AI Assistant

Documents

Human Review

Workflow execution

Analytics

Monitoring

Successful automated request

Human-review request

Approval

Rejection

Screenshots

The screenshots/ directory contains visual evidence of the implemented
application.

Recommended evidence:

screenshots/
├── dashboard
├── requests
├── ai-assistant
├── documents
├── human-review
├── workflows
├── analytics
└── monitoring

Project Status

The current implementation includes the major operational application
flow:

Authentication

Protected routes

Dashboard

Business requests

AI Assistant

Document processing

Human Review

Workflow management

Workflow execution history

Analytics

Monitoring

Backend health checks

PostgreSQL-backed application data

AI service integration

The main end-to-end functional flows have been tested during
development.

Future Enhancements

Potential future improvements include:

Email integrations

Slack and Microsoft Teams notifications

Scheduled workflow execution

Role-based access control

Advanced workflow branching

Real-time monitoring

Exportable analytics reports

More advanced OCR pipelines

Multiple AI model providers

Background workers and queues

CI/CD deployment

Expanded automated test coverage

Author

Nikhil Dusa

FlowMind AI
AI-Powered Business Operations Automation System

Conclusion

FlowMind AI demonstrates a controlled approach to AI-powered business
automation by combining:

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

The platform is designed to automate routine business operations
efficiently while maintaining human oversight for uncertain, sensitive,
or high-risk decisions.
#   f l o w m i n d - a i  
 