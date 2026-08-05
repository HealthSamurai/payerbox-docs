---
description: Forwarding PAS prior authorization requests to the payer's utilization management system.
---

# UM System Integration

Payerbox does not adjudicate. [`Claim/$submit`](../api-reference/operations/claim-submit.md) validates and stores the request, returns a `ClaimResponse` with `outcome = "queued"`, and forwards it to the payer's utilization management (UM) system, which produces the authoritative decision. Payerbox writes that decision back onto the same `ClaimResponse`, where [`Claim/$inquire`](../api-reference/operations/claim-inquire.md) and [Event Notifications](event-notifications.md) pick it up.

Forwarding is enabled per payer by a [`UMTenantConfig`](../api-reference/configuration-resources/um-tenant-config.md) resource. With no matching config, Payerbox stores the request and returns `queued` — the UM leg is simply skipped.

## What Payerbox covers

- **Per-payer routing.** `Claim.insurer` is matched against the tenant's Organization reference or identifier. Turning forwarding on for one payer is a data change, not a deploy.
- **Two connectors out of the box** — HealthEdge GuidingCare, and any UM system that itself implements Da Vinci PAS.
- **Asynchronous delivery** through a FHIR `Task` outbox with retries, backoff and lease recovery, so `$submit` latency never depends on the UM system.
- **Ambiguous outcomes reconciled, not re-sent** — a timeout after the UM system may have accepted the request is resolved by lookup, never by a blind second submission.
- **Runtime-editable mapping.** Payer-specific code translation lives in `ConceptMap` resources; secrets are referenced by environment-variable name and never stored in the config.
- **Initial, update and cancel** submissions forwarded as separate deliveries, ordered against the prior authorization.

## Choosing a connector

| `connector` | Use when | Wire contract |
|---|---|---|
| `pas-passthrough` | The UM system implements Da Vinci PAS itself | The request Bundle is rebuilt and POSTed to the delegate's `Claim/$submit`; status refresh via its `Claim/$inquire` |
| `guidingcare` | The payer runs HealthEdge GuidingCare | Proprietary REST (`/claim/$submit`, `/claimresponse`) with `ConceptMap`-driven code translation |

With `pas-passthrough`, onboarding a conformant delegate is configuration only — endpoint, auth and routing keys, no code. `guidingcare` additionally needs the tenant's picklist values and crosswalks, because GuidingCare fields are configured inside the UM tenant and are not discoverable through its API.

A UM system that speaks neither contract needs a new connector implementation.

## Delivery lifecycle

One `Task` per Claim (`id = um-forward-<claim-id>`, `code = urn:prior-auth:um:task-code|um-forward`, `focus = Claim/<id>`) acts as the outbox and the delivery journal.

| `Task.status` | Meaning |
|---|---|
| `requested` | Queued, due at the timestamp in the `next-retry-at` extension |
| `in-progress` | Claimed by the worker; reclaimed automatically if the run dies |
| `on-hold` | Ambiguous outcome, awaiting reconciliation (or parked for a human) |
| `completed` | Decision persisted onto the `ClaimResponse` |
| `failed` | Rejected or exhausted; `ClaimResponse.error[]` carries the reason |

How a failed attempt is classified:

| Failure | Action |
|---|---|
| `4xx` from the UM system | No retry — `ClaimResponse.error[]` is set, `Task` fails |
| `5xx`, or failure before the request left the process | Retry with backoff until attempts are exhausted |
| Timeout after the request was sent | Initial submission goes `on-hold` for reconciliation; an update is retried, because the UM system deduplicates it |

Update and cancel deliveries wait until the prior authorization's own delivery has settled, and carry the authorization id obtained from it.

## Status refresh on `$inquire`

By default `Claim/$inquire` answers from the stored `ClaimResponse`. With `inquireRefresh: true`, Payerbox queries the UM system for a live decision when the stored outcome is still `queued`, persists anything it gets back, and falls through to the stored response on any failure.

## Operating

`GET /health` reports every tenant config and whether it is usable:

```json
{
  "ok": true,
  "um": {
    "tenants": {
      "payer-1-um": { "status": "ready", "gaps": [], "warnings": [] },
      "payer-2-um": { "status": "invalid", "gaps": ["env UM_PAYER2_SECRET not set"], "warnings": [] }
    }
  }
}
```

An `invalid` tenant is excluded from routing — its Claims are stored and returned as `queued`, undelivered. Configs are re-read from Aidbox about once a minute, so edits take effect without a restart.

## Current limitations

- `guidingcare` does not forward cancel requests; such a Task is parked for manual handling.
- `pas-passthrough` has no correlation search, so an ambiguous initial submission goes to manual review instead of being reconciled automatically.
- The worker runs as a single instance per deployment.

## Related

- [`UMTenantConfig`](../api-reference/configuration-resources/um-tenant-config.md) — full element reference and examples
- [PAS](pas.md), [`Claim/$submit`](../api-reference/operations/claim-submit.md), [`Claim/$inquire`](../api-reference/operations/claim-inquire.md)
- [Compliance / CMS-0057](../compliance/cms-0057.md)
