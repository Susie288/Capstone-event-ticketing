# Event Ticketing Backend

Python 3.12 AWS Lambda backend for the event-ticketing-system frontend. It exposes an HTTP API through API Gateway, stores events and registrations in DynamoDB, and emits JSON logs to CloudWatch.

## Architecture

API Gateway routes requests to one Lambda per endpoint. Lambda handlers validate and translate the API Gateway proxy event, services apply business rules, repositories perform DynamoDB operations, and `shared/` provides responses, validation, and structured logging. AWS SAM provisions the API, functions, tables, and least-privilege IAM role.

## Folder structure

```text
backend/
  shared/             reusable API responses, logging, validation
  functions/          Lambda entry points
  services/           business rules
  repositories/       DynamoDB access
  models/             API/data mappings
  config/             settings and boto3 factories
  tests/              unit tests
  events/             sample Lambda proxy events
```

## API

| Method | Route | Lambda | Response |
| --- | --- | --- | --- |
| GET | `/events` | `getEvents` | Array of frontend-compatible events |
| POST | `/register` | `register` | New registration, HTTP 201 |
| POST | `/registrations` | `register` | Frontend-compatible alias of `/register` |
| GET | `/registrations/{email}` | `getRegistrations` | Array of a user's registrations |
| DELETE | `/registration/{id}` | `cancelRegistration` | Cancellation confirmation |

All responses are API Gateway proxy responses with JSON bodies and CORS headers. Errors use `{ "message": "...", "code": "..." }`: 400 for validation, 404 for missing resources, 409 for duplicate/sold-out registrations, and 500 for unexpected failures.

### Lambda request flow

- `getEvents`: receives a GET proxy event, scans Events, maps DynamoDB attributes to frontend JSON, then returns 200.
- `register`: parses the proxy `body`, validates `eventId`, `fullName`, `email`, and optional `phone`, creates a UUID, then transactionally creates the registration and decrements seats. It returns 201, 400, 404, 409, or 500.
- `getRegistrations`: reads `{email}` from `pathParameters`, queries the email index, and returns 200/400/500.
- `cancelRegistration`: reads `{id}`, resolves it via the registration-ID index, transactionally changes its status to `CANCELLED` and restores a seat, then returns 200/400/404/500.

## DynamoDB design

`event-ticketing-events` has partition key `event_id`. Its attributes include name, description, date, time, venue, organizer, image URL, total seats, and available seats. The events endpoint scans this small catalog; for a large catalog, add a category/date access pattern and index.

`event-ticketing-registrations` has partition key `event_id` and sort key `email`. It stores `registration_id`, event name, full name, phone, status, and `created_at`. That primary key makes one email-per-event a conditional, atomic write. `email-index` (partition key `email`) supports a user's registrations; `registration-id-index` (partition key `registration_id`) supports cancellation by ID. DynamoDB transactions protect seat allocation and prevent duplicate registrations under concurrent requests.

## Environment variables

| Name | Meaning | Default |
| --- | --- | --- |
| `EVENTS_TABLE` | Events DynamoDB table | `event-ticketing-events` |
| `REGISTRATIONS_TABLE` | Registrations DynamoDB table | `event-ticketing-registrations` |
| `EMAIL_INDEX` | Registrations email GSI | `email-index` |
| `REGISTRATION_ID_INDEX` | Registration-ID GSI | `registration-id-index` |
| `ALLOWED_ORIGIN` | Exact allowed frontend origin | `*` locally |
| `LOG_LEVEL` | CloudWatch logging level | `INFO` |

## Local testing

Python 3.12 includes boto3 in Lambda, but install dependencies locally first:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m unittest discover -s tests
```

Use the JSON files in `events/` as sample API Gateway v1 events. Set AWS credentials and table environment variables before invoking handlers against AWS. DynamoDB Local is also suitable for repository integration tests.

## Deployment

The AWS SAM template is [`../template.yaml`](../template.yaml). Configure AWS credentials, install the AWS SAM CLI, set the deployed frontend URL, then run:

```bash
sam build
sam deploy --guided --parameter-overrides AllowedOrigin=https://your-frontend.example
```

SAM packages `backend/`, creates both tables and GSIs, creates IAM permissions for only the required DynamoDB/log actions, deploys four Python 3.12 Lambdas, configures HTTP API Gateway, and creates a private S3 frontend bucket behind CloudFront Origin Access Control. Use the `ApiUrl` CloudFormation output as `NEXT_PUBLIC_API_BASE_URL` in the frontend. Upload a static frontend export to the `FrontendBucketName` output, then open `FrontendUrl`. For local API testing, run `sam local start-api`.

## Troubleshooting

- **500 / missing settings:** verify Lambda environment variables and AWS region.
- **403 DynamoDB:** confirm the deployed Lambda role contains the table and index ARNs.
- **CORS blocked:** make `allowed_origin` match the frontend origin exactly, then redeploy.
- **Registration conflict:** 409 means the user already registered or the event has no seats.
- **Empty registrations:** verify the queried email is normalized lowercase and the `email-index` GSI is active.
