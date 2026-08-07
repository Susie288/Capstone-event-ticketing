# Event Registration & Ticketing System API Documentation

## Overview

The Event Registration & Ticketing System exposes a REST API through Amazon API Gateway. The API allows users to:

- Retrieve all available events
- Retrieve details for a specific event
- Register for an event

The backend is built using AWS Lambda and deployed using AWS SAM.

---

# Base URL

Production

```
https://ozzn5awl2c.execute-api.us-east-1.amazonaws.com 
```

Local Development

```
http://127.0.0.1:3000
```

---

# Authentication

Currently, the API does not require authentication.

Future versions may use:

- Amazon Cognito
- JWT Authentication
- API Keys

---

# Response Format

Every endpoint returns a JSON response.

Successful response:

```json
{
  "success": true,
  "data": {}
}
```

Failed response:

```json
{
  "success": false,
  "message": "Error message"
}
```

---

# Endpoints

## 1. Get All Events

Returns every available event.

### Request

```
GET /events
```

### Example Request

```http
GET /events HTTP/1.1
Host: api.example.com
```

### Successful Response

```json
{
  "success": true,
  "data": [
    {
      "eventId": "001",
      "title": "AWS Community Day",
      "location": "Accra",
      "date": "2026-09-15"
    }
  ]
}
```

### Status Codes

| Code | Description |
|------|-------------|
|200|Success|
|500|Internal Server Error|

---

## 2. Get Event

Returns a single event.

### Request

```
GET /events/{id}
```

Example

```
GET /events/001
```

### Successful Response

```json
{
  "success": true,
  "data": {
    "eventId": "001",
    "title": "AWS Community Day",
    "location": "Accra",
    "date": "2026-09-15"
  }
}
```

### Event Not Found

```json
{
  "success": false,
  "message": "Event not found."
}
```

### Status Codes

|Code|Description|
|----|-----------|
|200|Success|
|404|Not Found|
|500|Internal Server Error|

---

## 3. Register for Event

Creates a registration.

### Request

```
POST /register
```

### Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "eventId": "001",
  "name": "John Doe",
  "email": "john@example.com"
}
```

---

### Successful Response

```json
{
  "success": true,
  "message": "Registration successful.",
  "registrationId": "REG-1024"
}
```

---

### Duplicate Registration

```json
{
  "success": false,
  "message": "You have already registered for this event using this email address."
}
```

---

### Validation Error

```json
{
  "success": false,
  "message": "Missing required fields."
}
```

---

### Status Codes

|Code|Description|
|----|-----------|
|201|Registration Created|
|400|Validation Error|
|409|Duplicate Registration|
|500|Internal Server Error|

---

# Error Responses

## 400 Bad Request

```json
{
    "success": false,
    "message": "Missing required fields."
}
```

---

## 404 Not Found

```json
{
    "success": false,
    "message": "Event not found."
}
```

---

## 409 Conflict

```json
{
    "success": false,
    "message": "You have already registered for this event using this email address."
}
```

---

## 500 Internal Server Error

```json
{
    "success": false,
    "message": "Internal Server Error"
}
```

---

# Data Models

## Event

|Field|Type|Description|
|------|----|-----------|
|eventId|String|Unique event ID|
|title|String|Event title|
|location|String|Venue|
|date|String|Event date|

---

## Registration

|Field|Type|Description|
|------|----|-----------|
|registrationId|String|Registration ID|
|eventId|String|Event ID|
|name|String|Registrant name|
|email|String|Registrant email|

---

# CORS

Allowed Origin

```
https://d1zmqwzh6agine.cloudfront.net\
```

Configured through AWS SAM.

---

# Logging

API requests are logged in:

- Amazon CloudWatch

The logs include:

- Request IDs
- Lambda execution time
- Errors
- Validation failures

---

