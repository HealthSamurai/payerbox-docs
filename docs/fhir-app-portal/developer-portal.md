---
description: >-
  Register a developer account, choose a client type, and submit clients for
  review in the Developer Portal.
---

# Developer Portal

The Developer Portal is a public-facing website where developers register, test, and manage the clients that connect to Payerbox: interactive [SMART Apps](smart-app.md) and non-interactive [Backend Services](backend-services.md).

## Overview

The Developer Portal enables:

* **Developer registration**: create an account to register clients
* **Client registration**: register a SMART App or a Backend Service
* **Sandbox testing**: run a client against sample data before submission
* **Submission**: send a client for admin review

## Register as a developer

1. Open the Developer Portal and click **Sign Up**
2. Fill out the registration form
3. Check your email and click **Confirm Email Address**
4. Set your password on the confirmation page
5. Click **Sign In** to access your dashboard

## Choose a client type

The dashboard splits registration into two sections. Pick by how the client authenticates and who drives it.

| | [SMART App](smart-app.md) | [Backend Services](backend-services.md) |
|---|---|---|
| Driven by | A user in a browser | A server, no user |
| OAuth grant | `authorization_code` | `client_credentials` |
| Register under | **Smart Apps** | **Backend Services** |
| Auth | Public or confidential; redirect + launch URL | JWKS URI or client secret |
| Scopes | `patient/*`, `user/*`, launch, OIDC | `system/*` only |
| Use for | Patient- or provider-facing apps | Bulk export, server-to-server APIs |

Each client-type page covers its own registration, testing, submission, and status.
