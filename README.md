# AI Email Auto-Reply & Forwarding System

An AI-powered email automation system built using **Node.js, Resend, Webhooks, and an AI reply service**.

The system receives incoming emails through Resend, forwards them to a configured recipient, generates an AI-based reply, and sends the reply back to the original sender.

---

## 🚀 Features

- 📩 Receive emails through Resend Inbound Email
- 🔗 Process incoming emails using Resend Webhooks
- 📤 Automatically forward incoming emails to a configured recipient
- 🤖 Generate AI-powered replies
- 📧 Send AI-generated replies back to the original sender
- 💾 Store incoming email information in a database
- 🔐 Secure webhook handling using a webhook secret
- ⚙️ Environment-based configuration
- 🧪 Supports local development using ngrok

---

## 🏗️ Architecture

```text
                    ┌──────────────────┐
                    │     Customer     │
                    │   Sends Email    │
                    └────────┬─────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │     Resend Inbound       │
              │                          │
              │ anything@resend-domain  │
              └────────────┬─────────────┘
                           │
                           │ email.received
                           ▼
              ┌──────────────────────────┐
              │      Resend Webhook      │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │       Node.js API        │
              │                          │
              │  /webhooks/resend        │
              └────────────┬─────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       ┌───────────────┐        ┌────────────────┐
       │    Forward    │        │   AI Reply     │
       │  Original Mail│        │    Service     │
       └───────┬───────┘        └───────┬────────┘
               │                        │
               ▼                        ▼
          ┌──────────┐           ┌──────────────┐
          │ Recipient│           │ Resend API   │
          └──────────┘           └──────┬───────┘
                                        │
                                        ▼
                              Original Email Sender
