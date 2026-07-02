---
description: >-
  Register a non-interactive Backend Services client (JWKS URI or client
  secret, system scopes) in the Developer Portal.
---

# Backend Services

A Backend Services client is non-interactive: a server authenticates with the `client_credentials` grant, no user involved. Use it for bulk export and server-to-server access. Register one from the **Backend Services** section of the [Developer Portal](developer-portal.md) dashboard.

## Register a Backend Service

1. From the dashboard, click **Register New** under **Backend Services**
2. Fill in the service details
3. Pick an **Authentication** method:
   * **JWKS URI**: host a public JWKS; the service signs a `private_key_jwt` assertion. The SMART Backend Services method, required for ONC G10 / certified bulk data.
   * **Client secret**: the portal generates a `client_id` + `client_secret`, shown once. Simpler, but not SMART Backend Services / G10 compliant. Rotate it from the service's detail page.
4. Set the **system scopes**: the subject is always `System`. Choose scope version (v1 or v2), FHIR resource, and operations (Create, Read, Update, Delete, Search). Produces scope strings like `system/Patient.rs` or `system/*.read`.
5. In multi-organization (OrgBAC) deployments, select the **Organization** whose data the service may access
6. Click **Create**

Token exchange: [Authentication](../api-reference/authentication.md).

## Sandbox and production

Draft and under-review services run against the sandbox (developer Aidbox, sample data). On approval the client is copied to production (Payerbox PHI Aidbox) and its access policy is derived from the scopes. The service's detail page shows the environment constants (FHIR base URL, SMART configuration, token URL, capability statement); production URLs appear once approved.

## Submit for review

When the service is ready:

1. Open the service's draft page
2. Click **Submit for Review**
3. Status changes to **Under Review**

Administrators review it from the [Admin Portal](admin-portal.md) and approve or reject. On approval the service moves to production ([Sandbox and production](#sandbox-and-production)).

## Service status

| Status | Description |
|---|---|
| **Draft** | Created, not yet submitted |
| **Under Review** | Submitted, waiting for admin decision |
| **Active** | Approved and live in production |
| **Rejected** | Declined at review, or deactivated after going live |
