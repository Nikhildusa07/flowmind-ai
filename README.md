FlowMind AI

AI-Powered Business Operations Automation System

FlowMind AI is a full-stack business automation platform that transforms incoming business requests and business documents into structured, AI-assisted operational workflows.

It combines a React/Vite frontend with a FastAPI backend, authenticated API access, AI-powered analysis, document intelligence, workflow execution, human-in-the-loop review, operational analytics, monitoring, and activity tracking.

Table of Contents

Overview

Key Features

Architecture

Application Flow

Technology Stack

Project Structure

Core Modules

Business Request Automation

AI Assistant

Document Intelligence

Human-in-the-Loop Review

Workflow Automation

Analytics and Monitoring

API Overview

Environment Configuration

Local Development

Testing

Security

Production Checklist

Demonstration Flow

Screenshots

Project Status

Future Enhancements

Author

Conclusion

Overview

FlowMind AI is designed around a simple operational principle:

Automate routine work while routing uncertain or high-risk work to a human reviewer.

The platform analyzes business requests, determines intent and priority, evaluates confidence, and routes each request through an appropriate processing path.

Core Processing Model

                    Business Request
                           |
                           v
                  Request Validation
                           |
                           v
                      AI Analysis
                           |
              +------------+------------+
              |                         |
              v                         v
      High Confidence / Low Risk   Low Confidence /
              |                    High Risk
              v                         |
     Automated Execution              v
                              Human Review
                                  |
                           +------+------+
                           |             |
                        Approve        Reject
                           |             |
                           v             v
                       Completed     Rejected
                           |
                           v
                  Analytics / Monitoring

Key Features

Business Request Automation

Create and process business requests.

AI-powered intent analysis.

Priority classification.

Confidence scoring.

AI-generated summaries.

Automated execution for eligible low-risk requests.

Human-review routing for uncertain or high-risk requests.

Request history and processing results.

AI Assistant

Natural-language business automation assistant.

Guidance for workflows, documents, analytics, tasks, and operations.

Suggested prompts for common use cases.

Multi-message conversations.

Markdown-formatted AI responses.

Loading and error states.

Authentication handling.

Conversation clearing.

Document Intelligence

PDF and business document upload.

AI-assisted document analysis.

Structured information extraction.

Document summaries.

Operational insights.

Document processing status tracking.

Human-in-the-Loop Review

Pending review queue.

Request context and processing information.

Intent, priority, confidence, and review reason.

Reviewer notes.

Approve and execute.

Reject with mandatory review notes.

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

Document activity.

Log activity.

API server status.

Analytics service status.

Database status.

Overall system health.

Architecture

+----------------------------------+
|          React Frontend          |
|              Vite                |
+----------------+-----------------+
                 |
                 | HTTP / JSON
                 | Bearer Token
                 v
+----------------------------------+
|          FastAPI Backend         |
+----------------------------------+
| Authentication API               |
| AI API                           |
| Requests API                     |
| Workflows API                    |
| Documents API                    |
| Reviews API                      |
| Analytics API                    |
+----------------+-----------------+
                 |
           +-----+-----+
           |           |
           v           v
+----------------+  +----------------+
|   PostgreSQL   |  |  Gemini / AI   |
|    Database    |  |  Integration   |
+----------------+  +----------------+

Architectural Principles

Authenticated API access for protected application operations.

Separation of frontend and backend responsibilities.

AI-assisted decision support for request and document processing.

Human oversight for uncertain or high-risk operations.

Operational visibility through analytics and monitoring.

Persistent application data through PostgreSQL.

Application Flow

Business Request
       |
       v
Request Validation
       |
       v
AI Analysis
       |
       +--------------------------+
       |                          |
       v                          v
High Confidence              High Risk /
Low Risk                     Low Confidence
       |                          |
       v                          v
Automated Execution         Human Review
                                  |
                           +------+------+
                           |             |
                        Approve        Reject
                           |             |
                           v             v
                       Completed      Rejected
                           |
                           v
                 Analytics / Monitoring

The decision model allows routine requests to move through automation while keeping sensitive, ambiguous, or high-risk requests under human control.

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

Git

GitHub

Visual Studio Code

Uvicorn

Vite

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

The frontend obtains an access token during login and uses it for protected API requests:

Authorization: Bearer <access_token>

Protected application routes redirect unauthenticated users to the login page.

Requests

Handles:

Business request creation.

AI analysis.

Intent and priority processing.

Decision routing.

Automated execution.

Human-review escalation.

Processing results.

Request history.

Workflows

Provides:

Workflow configuration.

Workflow steps.

Manual execution.

Execution history.

Workflow version tracking.

Active/inactive workflow state.

Documents

Provides:

Document upload.

PDF processing.

AI-assisted document analysis.

Structured extraction.

Summaries.

Operational insights.

Reviews

Provides human-in-the-loop processing for requests requiring manual decisions.

Reviewers can:

Inspect request context.

Review AI analysis.

Add review notes.

Approve and execute.

Reject requests.

Analytics

Provides aggregated operational metrics for a selected time period.

Monitoring

Provides current operational activity and service health information.

AI Assistant

Provides an interactive natural-language interface for business automation guidance and operational questions.

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

This approach allows routine requests to be processed automatically while sensitive or high-risk requests receive human oversight.

AI Assistant

The AI Assistant provides a conversational interface for questions related to:

Business automation.

Workflow design.

Document processing.

Analytics.

Monitoring.

Operational decisions.

Example Prompt

How can I automate repetitive business tasks?

The assistant can return structured guidance containing:

Workflow architecture.

Recommended processing steps.

Decision logic.

Automation opportunities.

Human-review conditions.

Practical next steps.

The interface supports:

Multi-message conversations.

Suggested prompts.

Markdown-style headings and lists.

Loading indicators.

Authentication errors.

API errors.

Conversation clearing.

Document Intelligence

FlowMind AI can process business PDFs such as invoices.

Example

Filename: sample_invoice.pdf
File Type: PDF
Status: processed

Example analysis:

Summary:
Pending invoice INV-2026-002 from XQORA Supplies
issued on August 17, 2026, with a base amount of
75,000 plus 13,500 tax.

Total Liability:
88,500

Due Date:
August 30, 2026

The analysis can also produce operational insights such as:

Payment-window observations.

Financial obligations.

Tax calculations.

Other extracted business information.

Human-in-the-Loop Review

The Human Review interface displays pending requests with:

Request ID.

Customer.

Intent.

Priority.

Confidence score.

Request content.

Review reason.

Approve

The reviewer can approve a request and allow the configured automated processing path to execute.

Reject

The reviewer can reject a request after providing review notes. The request is then recorded as rejected.

This provides a controlled boundary between AI-assisted decision-making and automated execution.

Workflow Automation

A workflow can contain multiple configured business-processing steps.

Example Workflow

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

Active/inactive status.

Workflow version.

Configured steps.

Manual execution.

Execution history.

Completion status.

Analytics and Monitoring

Analytics

Analytics provides historical operational information such as:

Workflow executions.

Completed tasks.

Documents processed.

Automation logs.

Success rate.

Running executions.

Failed executions.

Selected time-range metrics.

Monitoring

Monitoring focuses on current activity and service health:

Executions today.

Completed tasks.

Running tasks.

Failed tasks.

Documents.

Logs today.

API server health.

Analytics health.

Database health.

Overall system status.

API Overview

The FastAPI backend provides REST APIs for:

/auth
/ai
/workflows
/documents
/requests
/reviews
/analytics

Health Endpoints

/
 /health

Interactive API Documentation

When running locally, FastAPI provides:

http://127.0.0.1:8000/docs
http://127.0.0.1:8000/redoc

Environment Configuration

Create a local .env file for environment-specific configuration.

Example:

DATABASE_URL=your_database_connection_string
SECRET_KEY=your_secret_key
GEMINI_API_KEY=your_gemini_api_key

Use the exact environment variable names required by the backend configuration.

Security Rule

Never commit real credentials, passwords, tokens, or API keys to GitHub.

Recommended repository setup:

.env          -> local only
.env.example  -> safe configuration template

Local Development

Prerequisites

Install:

Python 3.10+

Node.js 18+

npm

PostgreSQL

Git

Verify the installations:

python --version
node --version
npm --version
git --version

Backend Setup

Open a terminal in the backend directory.

1. Create a virtual environment

Windows:

python -m venv venv

2. Activate the environment

venv\Scripts\activate

3. Install dependencies

If requirements.txt is in the project root:

pip install -r ../requirements.txt

Or, if it is located inside backend:

pip install -r requirements.txt

4. Configure environment variables

Create the local .env file and configure:

Database connection.

Authentication secret.

AI integration settings.

5. Start FastAPI

From the backend directory:

uvicorn app.main:app --reload

Backend:

http://127.0.0.1:8000

Frontend Setup

Open a second terminal in the frontend directory.

1. Install dependencies

npm install

2. Start Vite

npm run dev

Frontend:

http://localhost:5173

The frontend communicates with the configured FastAPI backend.

Testing

The application should be validated across the following areas.

Functional Testing

Registration.

Login.

Protected routes.

Business request creation.

AI request analysis.

Automated execution.

Human-review escalation.

Human approval.

Human rejection.

Document upload.

Document processing.

AI Assistant.

Workflow configuration.

Workflow execution.

Execution history.

Analytics.

Monitoring.

Refresh operations.

Error handling.

AI Testing

Evaluate:

Intent classification.

Priority classification.

Confidence behavior.

Business-request understanding.

Document understanding.

Response quality.

Ambiguous requests.

High-risk requests.

Low-confidence requests.

Security Testing

Verify:

Protected endpoints reject unauthenticated access.

Invalid authentication is handled correctly.

Secrets are not exposed in frontend code.

Production credentials are not committed.

Uploaded files follow application validation rules.

Failure Testing

Test scenarios such as:

Invalid login.

Missing authentication.

Invalid request input.

Backend unavailable.

AI service failure.

Invalid document.

Review action failure.

Workflow execution failure.

Each failure should produce a clear user-facing result and leave the application in a recoverable state.

Security

Before deployment:

Never commit .env.

Never commit API keys or passwords.

Use .env.example.

Restrict production CORS origins.

Use HTTPS in production.

Use strong production secrets.

Apply appropriate database permissions.

Validate uploaded document type and size.

Keep development credentials separate from production credentials.

Production Checklist

Repository

Remove unnecessary files.

Remove unused generated files.

Remove .env.

Add .env.example.

Verify .gitignore.

Confirm no secrets are committed.

Verify README setup instructions.

Backend

Configure production database.

Configure production secrets.

Configure trusted CORS origins.

Verify authentication.

Verify AI integration.

Verify document processing.

Verify health endpoints.

Frontend

Configure production API URL.

Verify all routes.

Verify authentication redirects.

Verify error states.

Verify responsive behavior.

Run the production build successfully.

Demonstration Flow

A complete demonstration can follow this sequence:

1. Dashboard
      |
2. Create Business Request
      |
3. AI Analysis
      |
4. Automated Request Execution
      |
5. Create High-Risk / Low-Confidence Request
      |
6. Human Review
      |
7. Approve or Reject
      |
8. Upload Business Document
      |
9. Document Analysis
      |
10. Configure / Execute Workflow
      |
11. Review Execution History
      |
12. Analytics
      |
13. Monitoring
      |
14. AI Assistant

Screenshots

The screenshots/ directory contains visual evidence of the implemented application.

Recommended evidence categories:

screenshots/
├── dashboard/
├── requests/
├── ai-assistant/
├── documents/
├── human-review/
├── workflows/
├── analytics/
└── monitoring/

Screenshots should demonstrate the major application workflows and successful end-to-end functionality.

Project Status

The current implementation includes the major operational application flow:

Authentication.

Protected routes.

Dashboard.

Business requests.

AI Assistant.

Document processing.

Human Review.

Workflow management.

Workflow execution history.

Analytics.

Monitoring.

Backend health checks.

PostgreSQL-backed application data.

AI service integration.

The main end-to-end functional flows have been tested during development.

Future Enhancements

Potential future improvements include:

Email integrations.

Slack and Microsoft Teams notifications.

Scheduled workflow execution.

Role-based access control.

Advanced workflow branching.

Real-time monitoring.

Exportable analytics reports.

More advanced OCR pipelines.

Multiple AI model providers.

Background workers and queues.

CI/CD deployment.

Expanded automated test coverage.

Author

Nikhil Dusa

FlowMind AI
AI-Powered Business Operations Automation System

Conclusion

FlowMind AI demonstrates a controlled approach to AI-powered business automation by combining:

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

The platform is designed to automate routine business operations efficiently while maintaining human oversight for uncertain, sensitive, or high-risk decisions.

License

This project was developed as an AI-powered business automation system for demonstration, development, and evaluation purposes.
