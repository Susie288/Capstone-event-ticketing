# Deployment Guide

## Overview

This project is deployed using AWS Serverless Application Model (AWS SAM).

The deployment consists of:

- Next.js Frontend
- Amazon S3
- Amazon CloudFront
- API Gateway
- Lambda Functions
- DynamoDB
- CloudWatch
- IAM Roles

---

# Prerequisites

Install the following software.

## AWS CLI

Verify installation

```bash
aws --version
```

---

## AWS SAM CLI

Verify installation

```bash
sam --version
```

---

## Python

Version

```
Python 3.12
```

Verify

```bash
python --version
```

---

## Node.js

Version

```
22+
```

Verify

```bash
node --version
```

---

## Git

```bash
git --version
```

---

# Clone Repository

```bash
git clone https://github.com/Susie288/Capstone-event-ticketing

cd event-registration-ticketing-system
```

---

# Configure AWS Credentials

```bash
aws configure
```

Provide:

```
AWS Access Key

AWS Secret Access Key

Region

Output Format
```

Verify

```bash
aws sts get-caller-identity
```

---

# Backend Deployment

Navigate to backend

```bash
cd backend
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Build

```bash
sam build
```

---

## First Deployment

```bash
sam deploy --guided
```

During the guided deployment, provide:

```
Stack Name

AWS Region

Confirm Changes

Allow IAM Role Creation

Save Configuration
```

This creates:

- API Gateway
- Lambda Functions
- DynamoDB Tables
- IAM Roles
- CloudWatch Resources
- Optional SNS Topic

---

## Subsequent Deployments

```bash
sam build

sam deploy
```

---

# Frontend Deployment

Navigate to frontend

```bash
cd frontend
```

Install dependencies

```bash
npm install
```

Build production files

```bash
npm run build
```

The output folder will contain the static assets for deployment.

---

# Deploy to Amazon S3

Sync the build output to your S3 bucket:

```bash
aws s3 sync ./out s3://event-ticketing-system-frontendbucket-pnpq7w5qn7jd
```

> If using a standard Next.js production build (`next build`), configure `output: "export"` in `next.config.js` so the `out/` directory is generated.

---

# CloudFront Cache Invalidation

Invalidate cached files after deployment.

```bash
aws cloudfront create-invalidation \
--distribution-id _DISTRIBUTION_ID \
--paths "/*"
```

---

# Verify Deployment

Open your CloudFront URL:

```
https://d1zmqwzh6agine.cloudfront.net\
```

Check:

- Home page loads
- Events display correctly
- Event details open
- Registration succeeds
- Duplicate registration is blocked
- CloudWatch logs are generated

---

# GitHub Actions Deployment

The repository includes GitHub Actions workflows for CI/CD.

Typical pipeline:

1. Checkout source code
2. Install dependencies
3. Run frontend build
4. Build the AWS SAM application
5. Execute tests (if configured)
6. Deploy the SAM stack
7. Upload frontend assets to Amazon S3
8. Invalidate the CloudFront cache


# Monitoring

Monitor the application using:

- Amazon CloudWatch Logs
- CloudWatch Metrics
- CloudWatch Alarms
- AWS Lambda Console
- API Gateway Metrics

---

# Rollback

If a deployment fails:

```bash
sam delete
```

To redeploy:

```bash
sam build

sam deploy
```

CloudFormation also supports rolling back failed stack updates automatically.

---

# Troubleshooting

## CORS Errors

- Verify `ALLOWED_ORIGIN` in `template.yaml`
- Redeploy the SAM stack after changes
- Invalidate the CloudFront cache

---

## API Returns 500 Errors

- Check CloudWatch Logs
- Confirm Lambda environment variables are configured
- Verify IAM permissions
- Ensure the DynamoDB tables exist

---

## Lambda Cannot Access DynamoDB

- Confirm the Lambda execution role has the required DynamoDB permissions
- Verify table names match the configured environment variables

---

## CloudFront Serving Old Content

Run a cache invalidation:

```bash
aws cloudfront create-invalidation \
--distribution-id YOUR_DISTRIBUTION_ID \
--paths "/*"
```

---

# Maintenance

For future updates:

1. Pull the latest code.
2. Make your changes.
3. Run local tests.
4. Execute `sam build`.
5. Deploy with `sam deploy`.
6. Build and upload the frontend.
7. Invalidate the CloudFront cache.
8. Verify the deployment and review CloudWatch logs.