# CRD

The Payerbox CRD implementation enables real-time communication between EHR systems and payers to determine documentation and prior authorization requirements at the point of care. Built on the [HL7 Da Vinci Coverage Requirements Discovery Implementation Guide](https://hl7.org/fhir/us/davinci-crd/STU2.1/).

When combined with [DTR](dtr/README.md) and [PAS](pas.md), CRD ensures providers are informed of coverage requirements early in the workflow, reducing claim denials and improving the authorization process.

Payerbox implements Da Vinci CRD STU 2.1.0. See [Compliance / CMS-0057](../compliance/cms-0057.md) for the regulatory context.

## How CDS Hooks work in CRD

CRD uses [CDS Hooks 2.0](https://cds-hooks.hl7.org/2.0/) to invoke Payerbox at clinically meaningful workflow events. All hooks follow the same processing pipeline:

1. **Receive Hook Request** — EHR sends a CDS Hooks request (e.g., `order-sign`, `order-select`) with context data and prefetch resources.
2. **Validate request structure** — request body validated against the CDS Hooks schema.
3. **Validate FHIR resources** — `draftOrders` and `prefetch` resources validated against Aidbox. References missing from the request are fetched recursively from the EHR's `fhirServer` using `fhirAuthorization` and validated together with the rest.
4. **Persist resources** — the whole validated set, including fetched resources, is stored in Aidbox (tagged as CRD hook context) for audit and later DTR use. Persistence is best-effort: a storage failure does not fail the hook.
5. **Resolve prefetch** — prefetch templates the EHR did not fulfill are resolved, and the resulting resources are merged into the request's prefetch map for the decision call.
6. **Proxy to the Decision Service** — the enriched request is forwarded to the **Decision Service** (external to Payerbox), whose determinations Payerbox renders as informational Cards and coverage-information system actions.

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

## Validation strictness

Hook-context resources (context and prefetch content) are validated before they reach the Decision Service. By default validation is strict: any error-level finding fails the hook request.

```
FHIR_VALIDATION_LENIENT=true
```

In lenient mode, terminology display-name mismatches, referenced-resource profile mismatches, and context references that cannot be resolved (the referenced resources may exist only in the EHR's own store) are logged as warnings and the hook proceeds; only structural and profile errors fail the request. Default (unset) — strict. The same flag also controls [PAS submission validation](pas.md#validation-strictness).

## Supported hooks

| Hook | When it fires | Reference |
|---|---|---|
| [`order-sign`](../api-reference/operations/cds-hook-order-sign.md) | A clinician is about to sign one or more orders | [CDS Hooks spec](https://cds-hooks.hl7.org/hooks/STU1/order-sign.html) |
| [`order-select`](../api-reference/operations/cds-hook-order-select.md) | A clinician selects orders from a list (pre-sign) | [CDS Hooks spec](https://cds-hooks.hl7.org/hooks/STU1/order-select.html) |
| [`order-dispatch`](../api-reference/operations/cds-hook-order-dispatch.md) | Orders are dispatched to a specific performer | [CDS Hooks spec](https://cds-hooks.hl7.org/hooks/order-dispatch/) |
| [`appointment-book`](../api-reference/operations/cds-hook-appointment-book.md) | An appointment is being scheduled | [CDS Hooks spec](https://cds-hooks.hl7.org/hooks/appointment-book/) |

The full list of services exposed by Payerbox is returned by [`GET /cds-services`](../api-reference/operations/cds-services-discovery.md).

## System actions

Per the Da Vinci CRD IG, coverage determinations are delivered as CDS Hooks `systemActions[]` — actions the EHR applies automatically, without presenting a suggestion for the user to accept. For each order the Decision Service evaluated, the response carries an `update` system action whose resource is the draft order with the `ext-coverage-information` extension appended. Cards are purely informational (summary, indicator, detail, links, source) — they never duplicate the coverage assertion and never carry suggestions.

The extension's sub-extensions:

| Sub-extension | Value | Notes |
|---|---|---|
| `coverage` | Reference to the patient's `Coverage` | Taken from the order's `insurance[0]`, falling back to `prefetch.coverage`. If neither is available, no system action is emitted for that order. |
| `covered` | `covered` \| `conditional` | `conditional` when the determination names missing information |
| `pa-needed` | `auth-needed` \| `no-auth` | Omitted on the undetermined fallback (see below) |
| `date` | Date of the assertion | Always present |
| `coverage-assertion-id` | Unique id for this assertion | Always present |
| `info-needed` | What is missing | Present iff `covered` is `conditional` |
| `doc-needed` | `clinical` | Present when documentation or a questionnaire is required |
| `questionnaire` | Canonical URL of the Questionnaire | Present when documentation must be collected via [DTR](dtr/README.md) |

The `questionnaire` sub-extension is the DTR launch mechanism: the EHR reads the canonical from the applied extension and launches DTR itself. CRD 2.1.0 retires launching DTR via a card link, so Payerbox does not return `type: "smart"` DTR launch links on cards.

Payerbox does not repeat an assertion the order already carries: when the draft order already has an identical `ext-coverage-information` for the same Coverage, no system action is emitted for it.

### Undetermined coverage

Da Vinci CRD 2.1.0 requires a coverage assertion on `order-sign`, `order-dispatch`, and `appointment-book` responses even when coverage cannot be determined. On these hooks, when the Decision Service fails to evaluate an order, Payerbox still returns a coverage-information system action with `covered` = `conditional`, `info-needed` = `OTH`, and a human-readable `reason` — and no `pa-needed` claim — alongside an explanatory card. On `order-select` only the explanatory card is returned.

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
  },
  "prefetch": {
    "coverage": { "resourceType": "Coverage", "id": "cov-001", "status": "active", "beneficiary": { "reference": "Patient/1288992" } }
  }
}
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "cards": [
    {
      "summary": "Documentation and policy resources",
      "indicator": "info",
      "source": {
        "label": "CRD Decision Service",
        "topic": { "system": "http://hl7.org/fhir/us/davinci-crd/CodeSystem/temp", "code": "external-reference" }
      },
      "links": [
        { "label": "Medication policy", "url": "https://example.org/policies/medication-pa", "type": "absolute" }
      ]
    }
  ],
  "systemActions": [
    {
      "type": "update",
      "description": "Update the draft MedicationRequest with CRD coverage information.",
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "mr-103",
        "status": "draft",
        "intent": "order",
        "extension": [
          {
            "url": "http://hl7.org/fhir/us/davinci-crd/StructureDefinition/ext-coverage-information",
            "extension": [
              { "url": "coverage", "valueReference": { "reference": "Coverage/cov-001" } },
              { "url": "covered", "valueCode": "covered" },
              { "url": "pa-needed", "valueCode": "auth-needed" },
              { "url": "date", "valueDate": "2026-09-03" },
              { "url": "coverage-assertion-id", "valueString": "3f8d2c1a-6b7e-4a2f-9c0d-1e2f3a4b5c6d" },
              { "url": "doc-needed", "valueCode": "clinical" },
              { "url": "questionnaire", "valueCanonical": "https://example.org/fhir/Questionnaire/medication-pa" }
            ]
          }
        ]
      }
    }
  ]
}
```

{% endtab %}
{% endtabs %}

Full Context tables, Request Parameters, and per-hook examples: [`order-sign`](../api-reference/operations/cds-hook-order-sign.md), [`order-select`](../api-reference/operations/cds-hook-order-select.md), [`order-dispatch`](../api-reference/operations/cds-hook-order-dispatch.md), [`appointment-book`](../api-reference/operations/cds-hook-appointment-book.md).
