# Project Defense Explainer & Technical Workflow Guide
## Serverless Event Registration & Ticketing System

**Author / Presenter**: Susan Seyram Darke  
**Program**: getINNOtized / AZUBI AFRICA AWS Cloud Engineering  
**Repository**: [Susie288/Capstone-event-ticketing](https://github.com/Susie288/Capstone-event-ticketing)

---

## 🧭 Executive Summary & Core Objective

The **Serverless Event Registration & Ticketing System** replaces inefficient, manual registration methods (such as Microsoft Forms and Excel spreadsheets) with a highly scalable, secure, and cloud-native serverless web application built on **AWS**.

### Why Serverless?
- **Zero Idle Costs**: No running servers (EC2) when there is no traffic. You only pay per execution (Lambda) and per request (DynamoDB On-Demand).
- **Auto-Scaling**: Seamlessly handles sudden traffic spikes during popular event ticket drops without pre-provisioning capacity.
- **Low Operational Overhead**: AWS manages server provisioning, OS patching, scaling, and high availability.

---

## 🏗️ System Architecture & Data Workflows

Below is the complete architectural layout:

```
[ Web Browser / Client ]
           │
     (1) HTTPS Request
           │
           ▼
[ Amazon CloudFront CDN ] ──(OAC)──► [ Amazon S3 Bucket ]
           │                         (Next.js Static Frontend)
     (2) REST API Calls
           │
           ▼
[ Amazon API Gateway (HTTP API) ]
           │
 ┌─────────┼────────────────┬────────────────┐
 │ (GET)   │ (POST)         │ (GET)          │ (DELETE)
 ▼         ▼                ▼                ▼
GetEvents Register  GetRegistrations CancelRegistration
 Lambda    Lambda       Lambda           Lambda
 │         │                │                │
 └─────────┼────────────────┴────────────────┘
           │
           ▼
 [ Amazon DynamoDB ] ──────► [ Amazon CloudWatch ] ──► [ Amazon SNS ]
(Events & Registrations)    (Logs, Metrics, Alarms)    (Email Notifications)
```

---

## 🔀 Workflow 1: Static Frontend Hosting & Delivery

### High-Level Flow
`Browser -> Amazon CloudFront -> Origin Access Control (OAC) -> Private S3 Bucket`

### How It Works:
1. **Private S3 Bucket**: The Next.js static frontend bundle (`index.html`, JavaScript, CSS) is uploaded to a private S3 bucket. Public access is 100% blocked (`BlockPublicAccess: true`).
2. **CloudFront CDN**: Serves as the single edge endpoint for users worldwide, delivering low latency and caching static assets.
3. **Origin Access Control (OAC)**: Ensures **only CloudFront** can read files from S3 using SigV4 signing. Users cannot bypass CloudFront to access the S3 bucket directly.
4. **Custom Error Page Rewriting**: SPA client-side routing is supported by mapping HTTP 403/404 error responses to `/index.html` with HTTP 200.

---

## 🔀 Workflow 2: Event Discovery (`GET /events`)

### High-Level Flow
`Client -> API Gateway -> GetEventsFunction -> EventsTable -> Client`

### Detailed Steps:
1. **Request Ingestion**: The client sends `GET /events` to API Gateway.
2. **Context Manager Initialization**: `GetEventsFunction` executes within the `request_tracker("GetEventsFunction")` context manager.
3. **Database Scan**: `EventRepository.list_events()` executes a `Scan` or `Query` on the DynamoDB `EventsTable`.
4. **Data Deserialization**: Python models parse raw DynamoDB items into `Event` objects (`id`, `name`, `total_seats`, `available_seats`, `date`).
5. **Response Formatting**: `build_response()` formats a standard JSON HTTP 200 payload with CORS headers.
6. **Metric Publication**: `request_tracker` records execution time (`HandlerDuration`) and publishes `ApiRequestCount` (`Status: Success`) to CloudWatch.

---

## 🔀 Workflow 3: Registration & Concurrency Control (`POST /register`)

### High-Level Flow
`Client -> API Gateway -> Input Sanitization -> RegisterFunction -> Atomic DynamoDB Transaction -> CloudWatch & SNS`

### Detailed Steps:
1. **Input Validation & Sanitization**:
   - `parse_json_body()` validates JSON syntax.
   - `validate_registration()` strips HTML/script tags (`strip_html_tags`), enforces regex checks for `email` and `phone`, validates regex for `eventId`, and enforces string length caps (`MAX_NAME_LENGTH = 80`).
2. **Duplicate Registration Check**:
   - Queries `RegistrationsTable` using `email-index` GSI. If a registration already exists for this `eventId` + `email`, raises a `ValidationError` returning HTTP 400 (`"You have already registered for this event"`).
3. **Atomic Capacity Decrement (Concurrency Protection)**:
   - To prevent seat overbooking under concurrent requests, `RegisterFunction` executes a **DynamoDB Transaction** (`TransactWriteItems`):
     - **Item 1**: Insert new registration record into `RegistrationsTable`.
     - **Item 2**: Update `EventsTable` where `available_seats > 0`, decrementing `available_seats` by 1.
   - If `available_seats == 0`, the transaction fails atomically, returning HTTP 400 (`"Event is sold out"`).
4. **SNS Confirmation**:
   - Emits a message to `RegistrationTopic` SNS topic to dispatch confirmation emails if `NotificationEmail` parameter is set.
5. **Metrics & Logging**:
   - If registration fails, `track_failed_registration(reason)` records custom metric `FailedRegistrations` with dimension `Reason` (`duplicate_registration`, `event_sold_out`, or `invalid_input`).

---

## 🔀 Workflow 4: Participant Booking Lookup (`GET /registrations/{email}`)

### High-Level Flow
`Client -> API Gateway -> GetRegistrationsFunction -> GSI Query -> Client`

### Detailed Steps:
1. **Path Parameter Extraction**: `require_path_parameter()` extracts and sanitizes `{email}` from URL path.
2. **GSI Query**: Executes a DynamoDB `Query` against `email-index` GSI on `RegistrationsTable`.
3. **Optimized Lookup**: GSI query isolates records by email without scanning the whole database table.
4. **Response**: Returns a JSON array of active and cancelled registrations for that email.

---

## 🔀 Workflow 5: Registration Cancellation (`DELETE /registration/{id}`)

### High-Level Flow
`Client -> API Gateway -> CancelRegistrationFunction -> Update DynamoDB Status & Increment Seat -> Client`

### Detailed Steps:
1. **Lookup & State Verification**: Fetches booking by `registration_id` via `registration-id-index` GSI.
2. **Atomic Cancellation**:
   - Updates registration `status` from `CONFIRMED` to `CANCELLED`.
   - Increments `available_seats` by 1 in `EventsTable`.
3. **Response**: Returns HTTP 200 confirming cancellation.

---

## 📊 Observability & Cost Optimization Workflows

### 1. Custom CloudWatch Metrics (`EventTicketingSystem`)
- **`ApiRequestCount`**: Measures traffic volume categorized by `FunctionName` and `Status` (`Success` / `Error`).
- **`FailedRegistrations`**: Tracks business validation failures with `Reason` dimension.
- **`HandlerDuration`**: Tracks Lambda performance and execution latency in milliseconds.

### 2. CloudWatch Alarms
- **`Api5xxErrorAlarm`**: Triggers if 5XX server errors occur (> 5% error rate target).
- **`LambdaExecutionErrorAlarm`**: Triggers on unhandled Python exceptions.
- **`FailedRegistrationsAlarm`**: Triggers if > 5 registration failures occur in 5 minutes.

### 3. Operational Dashboard (`event-ticketing-system-OperationalDashboard`)
- Provides a single-pane real-time view of system request volume, error trends, registration failure causes, and latency metrics.

### 4. Cost Controls
- **AWS Budgets**: Configured `MonthlyFreeTierBudget` with a $1.00 USD cap and 80% notification triggers.
- **DynamoDB On-Demand**: Charges strictly per read/write request ($0 when idle).

---

## 🔄 CI/CD Pipeline Workflow (GitHub Actions)

File: [.github/workflows/deploy-ci.yml](file:///.github/workflows/deploy-ci.yml)

```
[ Code Push to main ]
          │
          ▼
 [ GitHub Actions Runner ]
          │
  ┌───────┴────────────────────────┐
  ▼                                ▼
[ Backend Job ]                  [ Frontend Job ]
  │                                │
  ├─ Python 3.12 Setup             ├─ Node.js 20 Setup
  ├─ AWS Credentials (v4)          ├─ npm ci
  ├─ sam build                     ├─ npm run build (Static Export)
  └─ sam deploy                    ├─ aws s3 sync ./out -> S3
                                   └─ aws cloudfront create-invalidation
```

---

## 🎯 Defense Questions & Model Answers

### Q1: Why did you choose AWS Serverless (Lambda, API Gateway, DynamoDB) over an EC2 instance or Docker container?
> **Answer**: Serverless eliminates idle running costs and server administration. With EC2 or ECS, we pay continuously even when no registrations are occurring. With Lambda and DynamoDB On-Demand, the architecture costs $0 when idle, scales automatically to thousands of requests during registration surges, and requires zero OS security patching.

### Q2: How do you prevent race conditions when 100 users try to book the last available ticket at the exact same millisecond?
> **Answer**: We use DynamoDB `TransactWriteItems` with condition expressions (`available_seats > 0`). DynamoDB executes the seat decrement and registration record creation as a single atomic unit. If another request decrements the last seat first, subsequent transactions fail atomically, returning an `event_sold_out` response without overbooking.

### Q3: Why did you place CloudFront in front of the S3 frontend bucket instead of making the S3 bucket public?
> **Answer**: Restricting S3 via Origin Access Control (OAC) enforces strict security so traffic must pass through CloudFront. CloudFront provides global CDN caching (low latency), SSL/TLS encryption, protection against DDoS attacks, and seamless SPA routing without exposing public S3 bucket policies.

### Q4: How did you implement security and input validation?
> **Answer**: Security is enforced at multiple layers:
> 1. **API Gateway Rate Limiting**: Throttling limits (`100` burst / `50` req/sec) defend against denial-of-service.
> 2. **Input Sanitization**: `shared/validators.py` strips HTML/script tags to prevent XSS/injection, validates email/phone/UUID regexes, and caps maximum field lengths.
> 3. **Least Privilege IAM**: Every Lambda function has custom IAM policies scoped strictly to the specific DynamoDB tables and actions it needs.

### Q5: How do you monitor performance, errors, and cloud costs?
> **Answer**: We implemented custom CloudWatch metrics in the `EventTicketingSystem` namespace tracking request volume, duration, and failed registration reasons. We configured 3 CloudWatch Alarms to alert on high error rates, built an Operational Dashboard for visual monitoring, and set up an AWS Budget capping monthly spend at $1.00 USD with 80% email alerts.
