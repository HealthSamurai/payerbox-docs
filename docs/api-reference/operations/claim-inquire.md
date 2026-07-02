---
description: PAS Claim/$inquire operation reference — Da Vinci PAS.
---

# Claim/$inquire

Checks the status of a previously submitted prior authorization request, defined by the [Da Vinci PAS IG](https://hl7.org/fhir/us/davinci-pas/). The response is a FHIR Bundle containing the latest `ClaimResponse`, or an `OperationOutcome` on error.

## Endpoint

```
POST <base>/fhir/Claim/$inquire
```

## Auth

SMART Backend Services. Scope: `system/Claim.r system/ClaimResponse.r`. See [Authentication](../authentication.md).

## Parameters

| Direction | Parameter | Type | Cardinality | Description |
|---|---|---|---|---|
| IN | resource | Bundle | 1..1 | [PAS Inquiry Request Bundle](https://hl7.org/fhir/us/davinci-pas/STU2.1/StructureDefinition-profile-pas-inquiry-request-bundle.html) containing inquiry criteria |
| OUT | return | Bundle or OperationOutcome | 1..1 | [PAS Inquiry Response Bundle](https://hl7.org/fhir/us/davinci-pas/STU2.1/StructureDefinition-profile-pas-inquiry-response-bundle.html) with status information |

## Example

Check status of a submitted authorization:

{% tabs %}
{% tab title="Request" %}

```http
POST /fhir/Claim/$inquire
Content-Type: application/json
Accept: application/json

{
  "resourceType": "Bundle",
  "meta": { "profile": ["http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-pas-inquiry-request-bundle"] },
  "type": "collection",
  "identifier": { "system": "http://example.org/PATIENT_EVENT_TRACE_NUMBER", "value": "test-bundle-3" },
  "timestamp": "2025-12-08T16:48:02.531010Z",
  "entry": [
    {
      "fullUrl": "urn:uuid:claim-5d4963ef-8cd8-4fa7-b002-a5c67fa2f1da",
      "resource": {
        "resourceType": "Claim",
        "id": "claim-1765213116210",
        "meta": { "profile": ["http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-claim"] },
        "identifier": [{ "system": "http://example.org/claim-id", "value": "claim-1765213116210" }],
        "status": "active",
        "type": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/claim-type", "code": "professional" }] },
        "use": "preauthorization",
        "patient": { "reference": "Patient/patient-1" },
        "created": "2025-12-08T16:58:36.210Z",
        "insurer": { "reference": "Organization/payer-org-1" },
        "provider": { "reference": "Organization/requesting-org-1", "display": "Acme Care Clinic" },
        "priority": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/processpriority", "code": "normal" }] },
        "insurance": [{ "sequence": 1, "focal": true, "coverage": { "reference": "Coverage/coverage-1" } }],
        "item": [
          {
            "sequence": 1,
            "category": { "coding": [{ "system": "https://codesystem.x12.org/005010/1365", "code": "42", "display": "Home Health Care" }] },
            "productOrService": { "coding": [{ "system": "http://www.ama-assn.org/go/cpt", "code": "99213", "display": "Established patient office visit" }] }
          }
        ]
      }
    }
  ]
}
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "meta": { "profile": ["http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-pas-inquiry-response-bundle"] },
  "identifier": { "system": "http://example.org/PATIENT_EVENT_TRACE_NUMBER", "value": "test-bundle-3" },
  "timestamp": "2025-12-17T13:35:44.019420Z",
  "entry": [
    {
      "fullUrl": "ClaimResponse/c0d73c37-12ee-4cde-bfc6-aa6ed216f4dd",
      "resource": {
        "resourceType": "ClaimResponse",
        "id": "c0d73c37-12ee-4cde-bfc6-aa6ed216f4dd",
        "meta": { "profile": ["http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-claimresponse"] },
        "status": "active",
        "type": { "coding": [{ "code": "professional", "system": "http://terminology.hl7.org/CodeSystem/claim-type" }] },
        "use": "preauthorization",
        "patient": { "reference": "Patient/patient-1" },
        "insurer": { "reference": "Organization/payer-org-1" },
        "request": { "reference": "Claim/claim-1765213116210" },
        "created": "2025-12-17T13:34:24.316526Z",
        "outcome": "queued",
        "item": [
          {
            "itemSequence": 1,
            "adjudication": [
              { "category": { "coding": [{ "code": "submitted", "system": "http://terminology.hl7.org/CodeSystem/adjudication" }] } }
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

## Update chains

A prior authorization is updated or cancelled by submitting a new `Claim` that points at the prior one through `Claim.related` (relationship `prior`, or the legacy `replaces`). Under PAS 2.1.0 the decision `ClaimResponse` stays on the original (root) `Claim` of the chain; update and cancel `Claim`s carry none of their own.

From any `Claim` in the chain, `$inquire` walks `Claim.related` backward to the root and returns that `Claim`'s latest `ClaimResponse`. Inquiring on the original `Claim`, an intermediate update, or the newest update returns the same `ClaimResponse`. Cycle and depth guards stop a malformed chain from looping.

Under the legacy 2.0.1 model each `Claim` in a chain carried its own `ClaimResponse`, and `$inquire` resolved forward to the newest one. Payerbox behavior, not a PAS profile element.

See [Claim/$submit](claim-submit.md#claimresponse-link), [PAS](../../prior-auth/pas.md).
