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
