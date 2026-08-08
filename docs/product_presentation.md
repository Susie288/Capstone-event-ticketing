# Product Presentation: Serverless Event Registration & Ticketing System

**Presenter**: Susan Seyram Darke  
**Program**: getINNOtized / AZUBI AFRICA AWS Cloud Engineering  
**GitHub Repository**: [Susie288/Capstone-event-ticketing](https://github.com/Susie288/Capstone-event-ticketing)

---

## 🎯 1. Problem Statement

Traditional event registration methods relying on manual forms (e.g. Microsoft Forms) and spreadsheet management (Excel):
- **Lack Scalability**: Fail under high concurrent traffic spikes during popular event launches.
- **Data Inconsistency**: Risk race conditions, overbooking past seat capacity, and duplicate entries.
- **Manual Overhead**: Require manual data processing, email confirmation dispatching, and error tracking.
- **Security Vulnerabilities**: Expose participant data without proper rate limiting, input sanitization, or access controls.

### The Solution
A cloud-native, serverless REST API and web application built on AWS that automates event listing, ticket booking, participant lookup, and cancellation with sub-second response times, automated CI/CD, real-time CloudWatch observability, and strict zero-maintenance cost bounds within the AWS Free Tier.

---

## 🏗️ 2. Architecture & Technical Challenges

### Architecture Overview

![Event Ticketing System Architecture Diagram](./architecture-diagram.png)

- **Frontend**: Next.js 15 app hosted in an S3 Bucket (`BucketOwnerEnforced`, Private) and served via Amazon CloudFront CDN with Origin Access Control (OAC).
- **API Gateway**: HTTP API Gateway with CORS policy, path parameters, and default route rate limiting (`100` burst / `50` req/sec).
- **Compute**: Python 3.12 AWS Lambda functions (`GetEvents`, `Register`, `GetRegistrations`, `CancelRegistration`).
- **Database**: Amazon DynamoDB with On-Demand Billing (`PAY_PER_REQUEST`).
  - `EventsTable`: Hash key `event_id`
  - `RegistrationsTable`: Hash key `event_id`, Range key `email` + Global Secondary Indexes (`email-index`, `registration-id-index`).
- **Observability**: CloudWatch Logs (structured JSON), custom CloudWatch Metrics (`EventTicketingSystem`), CloudWatch Alarms (5% error rate alert), and an Operational Dashboard.
- **Cost Controls**: `AWS::Budgets::Budget` configured with a $1.00 USD monthly cap and 80% notification triggers.
- **CI/CD**: GitHub Actions workflows (`deploy-ci.yml`) automating SAM build/deployment, Next.js static export, S3 sync, and CloudFront cache invalidation on push to `main`.

### Architectural Challenges & Solutions
1. **Concurrency & Race Conditions**:
   - *Challenge*: Multiple users attempting to register for the last available seat simultaneously.
   - *Solution*: Utilized DynamoDB `TransactWriteItems` / `ConditionCheckItem` to atomically decrement remaining capacity and insert registration in a single transaction.
2. **CORS & Public API Security**:
   - *Challenge*: Defending public endpoints against DDoS attacks and cross-origin injection.
   - *Solution*: Implemented API Gateway rate limiting, strict CORS origins, and input sanitization (`shared/validators.py`) stripping HTML tags and validating input lengths and event ID patterns.
3. **Observability Without Overhead**:
   - *Challenge*: Measuring request counts, failure reasons, and handler durations without degrading API latency.
   - *Solution*: Created a lightweight, lazy-initialized `metrics.py` context manager wrapping Lambda handlers.

---

## 📺 3. Live Product Demo Walkthrough

### Demo Step 1: Browse Available Events
- **Action**: User opens the CloudFront web app URL or calls `GET /events`.
- **Backend Flow**: `GetEventsFunction` scans/queries `EventsTable` and returns JSON list of events with available seat counts.
- **Metrics**: `ApiRequestCount` emitted with `FunctionName: GetEventsFunction`, `Status: Success`.

### Demo Step 2: Register for an Event
- **Action**: User fills name and email to register for an event.
- **Backend Flow**: `RegisterFunction` validates email format, sanitizes inputs, checks seat availability, creates registration record in `RegistrationsTable`, decrements capacity in `EventsTable`, and triggers an optional SNS email notification.
- **Duplicate Prevention**: Re-registering with the same email returns HTTP 400 with message `"You have already registered for this event"`.

### Demo Step 3: View & Cancel Registrations
- **Action**: User looks up bookings via `GET /registrations/{email}` and cancels via `DELETE /registration/{id}`.
- **Backend Flow**: `GetRegistrationsFunction` queries the `email-index` GSI. `CancelRegistrationFunction` updates booking status to `CANCELLED` and restores event seat capacity.

### Demo Step 4: Operational Dashboard & CloudWatch Monitoring
- **Action**: Presenter opens AWS CloudWatch Console > Dashboards > `event-ticketing-system-OperationalDashboard`.
- **Highlights**:
  - Live metric widgets displaying API traffic volume (Success vs Error).
  - Breakdown of failed registrations by reason.
  - Lambda execution duration graph in milliseconds.
  - Active CloudWatch Alarms (`Api5xxErrorAlarm`).

---

## 📄 4. Summary of Deliverables Checklist

| Deliverable | Location / Resource | Status |
|-------------|---------------------|--------|
| **GitHub Repository** | [github.com/Susie288/Capstone-event-ticketing](https://github.com/Susie288/Capstone-event-ticketing) | ✅ Pushed & Public |
| **CI/CD Pipeline** | [.github/workflows/deploy-ci.yml](file:///.github/workflows/deploy-ci.yml) | ✅ Active |
| **Lambda Functions** | [backend/functions/](file:///backend/functions/) (4 Handlers) | ✅ Implemented |
| **DynamoDB Tables** | `EventsTable` & `RegistrationsTable` in [template.yaml](file:///backend/template.yaml) | ✅ Configured |
| **CloudWatch Alarms** | `Api5xxErrorAlarm`, `LambdaExecutionErrorAlarm`, `FailedRegistrationsAlarm` | ✅ Deployed |
| **README File** | [README.md](file:///README.md) | ✅ Complete |
| **Product Presentation** | [docs/product_presentation.md](file:///docs/product_presentation.md) | ✅ Created |
