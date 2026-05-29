# CRD

The Payerbox CRD implementation enables real-time communication between EHR systems and payers to determine documentation and prior authorization requirements at the point of care. Built on the [HL7 Da Vinci Coverage Requirements Discovery Implementation Guide](https://hl7.org/fhir/us/davinci-crd/STU2.0.1/).

When combined with [DTR](dtr/README.md) and [PAS](pas.md), CRD ensures providers are informed of coverage requirements early in the workflow, reducing claim denials and improving the authorization process.

Payerbox implements Da Vinci CRD STU 2.0.1. See [Compliance / CMS-0057](../compliance/cms-0057.md) for the regulatory context.

## How CDS Hooks work in CRD

CRD uses [CDS Hooks 2.0](https://cds-hooks.hl7.org/2.0/) to invoke Payerbox at clinically meaningful workflow events. All hooks follow the same processing pipeline:

1. **Receive Hook Request** — EHR sends a CDS Hooks request (e.g., `order-sign`, `order-select`) with context data and prefetch resources.
2. **Validate request structure** — request body validated against the CDS Hooks schema.
3. **Validate FHIR resources** — `draftOrders` and `prefetch` resources validated against Aidbox.
4. **Persist resources** — the validated request-side resources are persisted to Aidbox for audit and reference.
5. **Fetch missing resources** — references not present in `prefetch` are fetched recursively from the EHR's `fhirServer` using `fhirAuthorization`, then merged into the request's prefetch map for the decision call (not persisted).
6. **Proxy to the Decision Service** — the enriched request is forwarded to the **Decision Service** (external to Payerbox), which returns Cards with coverage requirements, documentation needs, or prior-authorization information.

## Decision Service

The decision-making service is **external to Payerbox** — the payer operates it and configures its URL via:

```
CDS_DECISION_SERVICE_URL=https://your-decision-service.example.com
```

The service holds the payer's coverage rules: medical policy, formulary tiers, network status, member benefits. Payerbox does not ship these rules.

For a complete local setup example, see [Quickstart: Run locally](../get-started/quickstart-run-locally.md).

## Required headers

Operators can require specific HTTP headers on every inbound hook request via a comma-separated allowlist. When any listed header is missing or blank, Payerbox rejects the request with `400` and an `OperationOutcome` before reaching the Decision Service. Discovery (`GET /cds-services`) is not gated — only hook POSTs.

```
CDS_REQUIRED_HEADERS=x-client-id
```

Header names are case-insensitive. Default (unset) — no header validation, requests pass through.

## Enabled hooks

To advertise only a subset of the supported hooks — useful while the upstream Decision Service is implementing CRD incrementally — operators can pass a comma-separated allowlist of hook ids. When set, `GET /cds-services` returns only the listed ids and `POST /cds-services/<other-id>` returns `404` with an `OperationOutcome`.

```
CDS_ENABLED_HOOKS=order-sign-crd,order-select-crd
```

Valid ids are `order-sign-crd`, `order-select-crd`, `order-dispatch-crd`, `appointment-book-crd`; matching is case-insensitive. Default (unset) — all four hooks are exposed.

## Supported hooks

| Hook | When it fires | Reference |
|---|---|---|
| [`order-sign`](../api-reference/operations/cds-hook-order-sign.md) | A clinician is about to sign one or more orders | [CDS Hooks spec](https://cds-hooks.hl7.org/hooks/STU1/order-sign.html) |
| [`order-select`](../api-reference/operations/cds-hook-order-select.md) | A clinician selects orders from a list (pre-sign) | [CDS Hooks spec](https://cds-hooks.hl7.org/hooks/STU1/order-select.html) |
| [`order-dispatch`](../api-reference/operations/cds-hook-order-dispatch.md) | Orders are dispatched to a specific performer | [CDS Hooks spec](https://cds-hooks.hl7.org/hooks/order-dispatch/) |
| [`appointment-book`](../api-reference/operations/cds-hook-appointment-book.md) | An appointment is being scheduled | [CDS Hooks spec](https://cds-hooks.hl7.org/hooks/appointment-book/) |

The full list of services exposed by Payerbox is returned by [`GET /cds-services`](../api-reference/operations/cds-services-discovery.md).

## Authentication

CRD CDS Hooks endpoints use **SMART Backend Services Authorization**. The payer admin provisions Client credentials per EHR integration. The EHR may also include `fhirAuthorization` (OAuth bearer token) in each hook request, used by Payerbox to call back into the EHR's FHIR endpoint when prefetch is incomplete.

See [API Reference / Authentication](../api-reference/authentication.md) for the onboarding and token exchange flow.

## Example

A typical `order-sign` interaction:

{% tabs %}
{% tab title="Request" %}

```http
POST /cds-services/order-sign-crd
Content-Type: application/json
Accept: application/json

{
  "hook": "order-sign",
  "hookInstance": "d1577c69-dfbe-44ad-ba6d-3e05e953b2ea",
  "context": {
    "userId": "PractitionerRole/123",
    "patientId": "1288992",
    "draftOrders": {
      "resourceType": "Bundle",
      "entry": [
        { "resource": { "resourceType": "MedicationRequest", "id": "mr-103", "status": "draft", "intent": "order" } }
      ]
    }
  }
}
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "cards": [
    {
      "summary": "Prior Authorization required for this medication",
      "detail": "Follow the attached link for documentation.",
      "indicator": "warning",
      "source": { "label": "CRD Decision Service" },
      "links": [
        { "label": "Launch DTR to complete Questionnaire", "url": "https://dtr.example.org/launch", "type": "smart" }
      ]
    }
  ]
}
```

{% endtab %}
{% endtabs %}

Full Context tables, Request Parameters, and per-hook examples: [`order-sign`](../api-reference/operations/cds-hook-order-sign.md), [`order-select`](../api-reference/operations/cds-hook-order-select.md), [`order-dispatch`](../api-reference/operations/cds-hook-order-dispatch.md), [`appointment-book`](../api-reference/operations/cds-hook-appointment-book.md).
