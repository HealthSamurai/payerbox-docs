# PAS

The Payerbox PAS API enables direct submission of prior authorization requests from EHR/UM systems using FHIR. Built on the [HL7 Da Vinci Prior Authorization Support Implementation Guide](https://hl7.org/fhir/us/davinci-pas/STU2.1/).

When combined with [CRD](crd.md) and [DTR](dtr/README.md), PAS ensures authorizations are submitted when necessary with all required information for initial decision-making.

Payerbox implements Da Vinci PAS STU 2.1.0. See [Compliance / CMS-0057](../compliance/cms-0057.md) for the regulatory context.

## Lifecycle

PAS supports three operations forming a typical flow:

1. **[Claim/$submit](../api-reference/operations/claim-submit.md)** — Submit a prior authorization request as a FHIR Bundle. Payerbox returns a `ClaimResponse` with `outcome = "queued"`; the payer's UM system later updates the same `ClaimResponse` to convey the decision via the `reviewAction` extension (e.g. X12 code `A1` = certified / approved, `A3` = not certified / denied, `A4` = pended).
2. **[Claim/$inquire](../api-reference/operations/claim-inquire.md)** — Poll the status of a previously submitted request.
3. **[$submit-attachment](../api-reference/operations/submit-attachment.md)** — (Optional) Submit clinical documentation associated with an existing prior authorization, when the payer requests additional information.

The Da Vinci PAS Request Bundle profile requires exactly one focal `Claim` per Bundle — the underlying X12 278 transaction carries one prior authorization per BHT. Submit multiple requests with multiple `Claim/$submit` calls.

## Authentication

PAS uses **SMART Backend Services Authorization**. The payer admin provisions Client credentials per partner integration (EHR vendor, UM vendor, integrator). See [API Reference / Authentication](../api-reference/authentication.md) for the onboarding and token exchange flow.

## Example

Submit a prior authorization:

{% tabs %}
{% tab title="Request" %}

```http
POST /fhir/Claim/$submit
Content-Type: application/json
Accept: application/json

{
  "resourceType": "Bundle",
  "meta": { "profile": ["http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-pas-request-bundle"] },
  "type": "collection",
  "entry": [
    { "resource": { "resourceType": "Claim", "id": "claim-1", "status": "active", "use": "preauthorization", "patient": { "reference": "Patient/patient-1" }, "insurer": { "reference": "Organization/payer-org-1" } } },
    { "resource": { "resourceType": "Patient", "id": "patient-1", "name": [{ "family": "Smith", "given": ["John"] }] } },
    { "resource": { "resourceType": "Coverage", "id": "coverage-1", "status": "active", "beneficiary": { "reference": "Patient/patient-1" } } }
  ]
}
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "ClaimResponse",
        "id": "response-1",
        "status": "active",
        "use": "preauthorization",
        "outcome": "queued",
        "request": { "reference": "Claim/claim-1" }
      }
    }
  ]
}
```

{% endtab %}
{% endtabs %}

Full Bundle profiles, all parameters, and edge cases: [Claim/$submit](../api-reference/operations/claim-submit.md). For status checks and attachment workflows: [Claim/$inquire](../api-reference/operations/claim-inquire.md), [$submit-attachment](../api-reference/operations/submit-attachment.md).

## Validation strictness

Every `Claim/$submit` Bundle is validated against the Da Vinci PAS profiles before anything is persisted. By default validation is strict: any error-level finding rejects the submission with `422` and an `OperationOutcome` listing all findings.

Operators can relax this per deployment:

```
FHIR_VALIDATION_LENIENT=true
```

In lenient mode, findings that do not affect the integrity of the submission — terminology display-name mismatches and referenced-resource profile mismatches — are logged as warnings instead of rejecting the request, and a `422` response body carries only the blocking findings. Structural errors, profile violations, and references to resources missing from the Bundle still reject the submission.

Lenient mode is intended for sandbox and onboarding environments, where trading partners iterate on their payloads and cosmetic findings should not block end-to-end testing. Keep production deployments strict. Default (unset) — strict. The same flag also controls [CRD hook-context validation](crd.md#validation-strictness).

## Forwarding to the payer's UM system

After `Claim/$submit` returns the queued `ClaimResponse`, Payerbox forwards the request to the payer's utilization management (UM) system for adjudication. Forwarding is configured per payer with a `UMTenantConfig` resource: incoming Claims are routed by matching `Claim.insurer` against the tenant's insurer reference or identifier, queued as a FHIR `Task`, and delivered by a background worker with retries.

`UMTenantConfig.connector` selects the integration:

| Connector | UM system contract |
|---|---|
| `guidingcare` | HealthEdge GuidingCare REST API, with ConceptMap-driven code translation |
| `pas-passthrough` | Any UM system that itself implements Da Vinci PAS: the request Bundle is forwarded to the delegate's own `Claim/$submit`, and status can be refreshed via its `Claim/$inquire` |

With `pas-passthrough`, onboarding a PAS-conformant delegate is a configuration change only — no code changes or redeployment. The key `UMTenantConfig` elements:

| Element | Purpose |
|---|---|
| `connector` | `guidingcare` or `pas-passthrough` |
| `insurer.reference` / `insurer.identifier` | Routing key matched against `Claim.insurer` |
| `endpoint.baseUrl` | UM system API base URL |
| `endpoint.auth` | `oauth2-client-credentials` (token URL + client id, secret resolved from an environment variable) or `api-key`. Secrets are referenced by environment variable name, never stored in the resource |
| `endpoint.timeoutMs` / `endpoint.connectTimeoutMs` | Per-attempt timeouts (defaults: 30000 / 10000 ms) |
| `endpoint.retry` | Delivery attempts and backoff (defaults: 5 attempts, 30s / 2m / 10m / 30m) |
| `inquireRefresh` | When `true`, `Claim/$inquire` fetches the live decision from the UM system instead of returning only the stored `ClaimResponse` |

Delivery notes for `pas-passthrough`:

- The delegate must implement Da Vinci PAS 2.1.0 `Claim/$submit` (and `Claim/$inquire` for status refresh).
- The forwarded Bundle carries the original submitter's transaction identifier as `Bundle.identifier`, and the Claim is forwarded with its original identifier (TRN). Retries of the same delivery carry the same identifiers, so a conformant delegate deduplicates them as PAS duplicate-TRN submissions.
- Ambiguous delivery failures (for example, a timeout after the delegate may have accepted the request) are parked for manual review rather than blindly retried.

## Notifications

Rather than polling `Claim/$inquire`, a downstream system can subscribe to decision events and be notified when a `ClaimResponse` is recorded. See [Event Notifications](event-notifications.md) for how to set up a FHIR topic-based subscription.
