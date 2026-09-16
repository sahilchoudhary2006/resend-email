# Architecture

## 1. Current Architecture

The current implementation is a monolithic Express.js server (`server.js`) that operates in one of two modes depending on environment variables:

- **Simple Mode (Gmail IMAP/SMTP)**: Uses `imapflow` to idle and watch a single Gmail inbox. It marks emails as `\Seen` and replies using `nodemailer` and App Passwords.
- **Full Pipeline Mode (Resend Webhook)**: Starts an Express server listening on `POST /webhook` for `email.received` events from Resend. It replies using the Resend SDK.

### Current Data Flow
- **State**: In-memory `Set` (`repliedIds`) to track processed `messageId`s.
- **Email Flow**:
  - Inbound: IMAP `exists` event OR Resend webhook (`POST /webhook`).
  - Outbound: SMTP via `nodemailer` OR API call via `resend.emails.send`.

### Existing Shortcomings
- **No Persistence**: Restarting the server clears the `repliedIds` set, potentially causing duplicate replies.
- **Single Tenant**: Only supports a single `CLIENT_EMAIL` hardcoded in `.env`.
- **Security**: The Resend webhook endpoint lacks signature verification.
- **Monolithic**: All business logic, routing, and email processing are housed in `server.js`.
- **Threading**: Webhook mode prepends "Re: " to subjects but does not use `In-Reply-To` or `References` headers for robust threading.

## 2. Proposed Architecture

We will transition to a modular, multi-tenant architecture designed to act as an email infrastructure and automation layer on top of Resend.

### Layered Architecture
- **Routes Layer**: Express routers mapping HTTP endpoints to controllers.
- **Controller Layer**: Handles HTTP request parsing, validation, and response formatting.
- **Service Layer**: Contains core business logic (e.g., `ResendService`, `AIReplyService`, `WebhookService`).
- **Repository/Model Layer**: Interfaces with the PostgreSQL database (via Prisma) for data persistence.

### Proposed Directory Structure
```
src/
├── app.js                 # Express app setup and middleware
├── server.js              # Server entry point
├── config/                # Environment variables, constants
├── routes/                # API route definitions
│   └── v1/
├── controllers/           # HTTP handlers
├── services/              # Core business logic
│   ├── resend/            # Resend SDK wrapper
│   ├── email/             # Inbound/Outbound processing
│   ├── domain/            # Domain management
│   ├── template/          # Template management
│   ├── broadcast/         # Broadcast campaigns
│   ├── automation/        # Event-driven workflows
│   ├── webhook/           # Webhook verification and routing
│   ├── metrics/           # Statistics and tracking
│   └── ai/                # AI reply generation abstractions
├── models/                # Prisma schema and generated client
├── repositories/          # Database access layer
├── middleware/            # Auth, validation, error handling
├── utils/                 # Helpers, loggers
└── workers/               # Async task processors (future)
```

## 3. Database Model

We will use PostgreSQL (with Prisma ORM).

### Core Entities
- **Client**: Represents a tenant (e.g., Acme Corp). Tracks `domain`, `email`, `status`.
- **Domain**: Associated with a Client. Tracks DNS verification status via Resend.
- **Contact**: Represents an end-user interacting with the Client.
- **EmailThread**: Groups related `EmailMessage`s and `Reply`s together.
- **EmailMessage**: Individual inbound/outbound emails.
- **Reply**: AI-generated, template-based, or manual replies.
- **Template**: Reusable email structures with variables.
- **Broadcast**: Marketing campaigns sent to multiple `Contact`s.
- **BroadcastRecipient**: Tracking for individual broadcast deliveries.
- **Automation**: Event-driven workflow definitions.
- **WebhookEvent**: Idempotent ledger of incoming Resend events.

## 4. API Structure

The API will be RESTful, versioned, and modular.

```text
/api/v1/clients
/api/v1/domains
/api/v1/contacts
/api/v1/templates
/api/v1/broadcasts
/api/v1/automations
/api/v1/emails
/api/v1/threads
/api/v1/replies
/api/v1/metrics
/webhooks/resend
/health
```

## 5. Service Boundaries & Event Flow

### Webhook Flow
1. Resend sends `email.received` to `POST /webhooks/resend`.
2. `WebhookController` passes the raw payload to `WebhookService` for signature validation.
3. If valid, the event is persisted to `WebhookEvent` to ensure idempotency.
4. `WebhookService` routes the payload to `IncomingEmailService`.

### Reply Flow
1. `IncomingEmailService` parses the email, identifies the `Client`, creates an `EmailMessage`, and assigns it to an `EmailThread`.
2. The system evaluates `Automation` rules or delegates to `AIReplyService`.
3. `AIReplyService` generates a `Reply` draft (mocked provider initially).
4. Depending on configuration, the reply is auto-sent or flagged for human review.
5. `EmailService` calls `ResendService.sendEmail()`, injecting proper `In-Reply-To` and `References` headers.

## 6. Security Model

- **Webhook Verification**: All Resend webhooks will be cryptographically verified using `svix` and `WEBHOOK_SECRET`.
- **Tenant Isolation**: Every database query and service action will be scoped to a `clientId`. Clients cannot send emails from domains they do not own.
- **Idempotency**: Webhook events will be tracked by `eventId` to prevent duplicate processing.
- **Secret Management**: API keys will exclusively reside in `.env`.

## 7. Future AI Integration Points

The `AIReplyService` is designed as an abstraction layer. Future iterations will:
- Connect to LLM providers (OpenAI, Anthropic).
- Inject historical `EmailThread` and `Contact` context into prompts.
- Implement intent classification for dynamic routing (e.g., Sales vs. Support).
