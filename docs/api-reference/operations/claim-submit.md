---
description: PAS Claim/$submit operation reference — Da Vinci PAS.
---

# Claim/$submit

Submits a prior authorization request as a FHIR Bundle for adjudication, defined by the [Da Vinci PAS IG](https://hl7.org/fhir/us/davinci-pas/). The response is a FHIR Bundle containing a `ClaimResponse`, or an `OperationOutcome` on error.

The Da Vinci PAS Request Bundle profile requires exactly one focal `Claim` per Bundle — the underlying X12 278 transaction carries one prior authorization per BHT. To submit multiple prior authorizations, make multiple `Claim/$submit` calls.

## Endpoint

```
POST <base>/fhir/Claim/$submit
```

### ClaimResponse link

Before persisting, Payerbox links the `Claim` to its `ClaimResponse`: the stored `Claim` carries an extension whose `valueReference` points at the `ClaimResponse`.

```json
{
  "url": "https://fhir.aidbox.app/fhir/StructureDefinition/claim-response-reference",
  "valueReference": { "reference": "ClaimResponse/c0d73c37-12ee-4cde-bfc6-aa6ed216f4dd" }
}
```

The id rides along on the `Claim` in [change notifications](../../prior-auth/event-notifications.md), so a consumer correlates the pair without a separate `ClaimResponse` search. Present on initial submits and on PAS 2.1.0 update/cancel requests, which reuse the prior authorization's original `ClaimResponse` instead of minting a new one. Payerbox behavior, not a PAS profile element.

### Duplicate submissions

A submission is matched against existing claims by the first `Claim.identifier` (its `system` and `value`). If a claim with the same identifier already exists, `$submit` returns its latest `ClaimResponse` and creates nothing new. This makes retries safe: resending the same bundle does not fork the authorization into a second record.

Matching uses only the identifier. Changed `item[]` content does not create a new claim; to change a prior authorization, submit a new `Claim` (new `Claim.identifier`) whose `Claim.related` points at the previous `Claim`. See [Update flow](#update-flow). Identifiers without both `system` and `value` are not matched and always create a new claim.

### Update flow

To change a prior authorization, submit a new `Claim` pointing at the previous one. A submission counts as an update when the `Claim` declares [`profile-claim-update`](https://hl7.org/fhir/us/davinci-pas/STU2.1/StructureDefinition-profile-claim-update.html) in `meta.profile`, or when `Claim.related` carries relationship code `prior` (PAS 2.1.0) or `replaces` (2.0.1). Both are then required: without either, the submission is rejected with `422`.

Under PAS 2.1.0 the update reuses the prior authorization's original `ClaimResponse`: the same `ClaimResponse.id` comes back, no second one is created, and the original `Claim` is left as it was. See [Update chains](claim-inquire.md#update-chains) for how `Claim/$inquire` resolves the chain.

An update is rejected once the prior authorization is denied, meaning every `ClaimResponse.item` carries a `reviewAction` extension with review action code `A3` (Not Certified) from `https://codesystem.x12.org/005010/306`. Items only partly `A3` do not block an update. Payerbox reads that extension both from `item.adjudication`, where the PAS IG places it, and from `item` itself, so a decision written back in either shape blocks the update.

A cancel is the same request with certificationType `3` (Cancel), and its response has the same shape.

See [Update](#update) for the payloads.

## Auth

SMART Backend Services. Scope: `system/Claim.cu system/ClaimResponse.r`. See [Authentication](../authentication.md).

## Parameters

| Direction | Parameter | Type | Cardinality | Description |
|---|---|---|---|---|
| IN | resource | Bundle | 1..1 | [PAS Request Bundle](https://hl7.org/fhir/us/davinci-pas/STU2.1/StructureDefinition-profile-pas-request-bundle.html) containing a single focal `Claim` and all referenced resources |
| OUT | return | Bundle or OperationOutcome | 1..1 | [PAS Response Bundle](https://hl7.org/fhir/us/davinci-pas/STU2.1/StructureDefinition-profile-pas-response-bundle.html) with `ClaimResponse`, or `OperationOutcome` on error |

## Examples

### Initial submit

Submit a prior authorization request:

{% tabs %}
{% tab title="Request" %}

```http
POST /fhir/Claim/$submit
Content-Type: application/json
Accept: application/json

{
  "resourceType": "Bundle",
  "meta": {
    "profile": [
      "http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-pas-request-bundle"
    ]
  },
  "type": "collection",
  "identifier": {
    "system": "http://example.org/PATIENT_EVENT_TRACE_NUMBER",
    "value": "test-bundle-3"
  },
  "timestamp": "2025-12-08T16:48:02.531010Z",
  "entry": [
    {
      "fullUrl": "urn:uuid:claim-1765213116210",
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
            "extension": [
              { "url": "http://hl7.org/fhir/us/davinci-pas/StructureDefinition/extension-serviceItemRequestType", "valueCodeableConcept": { "coding": [{ "system": "https://codesystem.x12.org/005010/1525", "code": "SC", "display": "Specialty Care Review" }] } },
              { "url": "http://hl7.org/fhir/us/davinci-pas/StructureDefinition/extension-certificationType", "valueCodeableConcept": { "coding": [{ "system": "https://codesystem.x12.org/005010/1322", "code": "I", "display": "Initial" }] } }
            ],
            "category": { "coding": [{ "system": "https://codesystem.x12.org/005010/1365", "code": "42", "display": "Home Health Care" }] },
            "productOrService": { "coding": [{ "system": "http://www.ama-assn.org/go/cpt", "code": "99213", "display": "Established patient office visit" }] },
            "locationCodeableConcept": { "coding": [{ "system": "https://www.cms.gov/Medicare/Coding/place-of-service-codes/Place_of_Service_Code_Set", "code": "11", "display": "Office" }] },
            "detail": [
              {
                "sequence": 1,
                "productOrService": { "coding": [{ "system": "http://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets", "code": "E0250", "display": "Hospital bed, fixed height, with mattress" }] }
              }
            ]
          }
        ]
      }
    },
    {
      "fullUrl": "urn:uuid:patient-patient-1",
      "resource": {
        "resourceType": "Patient",
        "id": "patient-1",
        "meta": { "profile": ["http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-beneficiary", "http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-subscriber"] },
        "identifier": [{ "type": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/v2-0203", "code": "MB", "display": "Member Number" }] }, "system": "http://example.org/member-id", "value": "MEM123456" }],
        "active": true,
        "name": [{ "use": "official", "family": "Smith", "given": ["John", "Robert"] }],
        "telecom": [{ "system": "phone", "value": "555-123-4567", "use": "home" }],
        "gender": "male",
        "birthDate": "1970-05-15",
        "address": [{ "use": "home", "line": ["123 Main Street"], "city": "Springfield", "state": "IL", "postalCode": "62701", "country": "USA" }]
      }
    },
    {
      "fullUrl": "urn:uuid:coverage-coverage-1",
      "resource": {
        "resourceType": "Coverage",
        "id": "coverage-1",
        "meta": { "profile": ["http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-coverage"] },
        "status": "active",
        "type": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "HIP", "display": "health insurance plan policy" }] },
        "subscriber": { "reference": "Patient/patient-1" },
        "subscriberId": "MEM123456",
        "beneficiary": { "reference": "Patient/patient-1" },
        "relationship": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/subscriber-relationship", "code": "self", "display": "Self" }] },
        "payor": [{ "reference": "Organization/payer-org-1" }],
        "class": [
          {
            "type": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/coverage-class", "code": "plan", "display": "Plan" }] },
            "value": "GOLD-PLAN-001",
            "name": "Gold Plus Plan"
          }
        ]
      }
    },
    {
      "fullUrl": "urn:uuid:org-requesting-org-1",
      "resource": {
        "resourceType": "Organization",
        "id": "requesting-org-1",
        "meta": { "profile": ["http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-requestor"] },
        "identifier": [{ "system": "http://hl7.org/fhir/sid/us-npi", "value": "8189991234" }],
        "active": true,
        "name": "Acme Care Clinic"
      }
    },
    {
      "fullUrl": "urn:uuid:org-payer-org-1",
      "resource": {
        "resourceType": "Organization",
        "id": "payer-org-1",
        "meta": { "profile": ["http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-insurer"] },
        "identifier": [{ "system": "http://hl7.org/fhir/sid/us-npi", "value": "1234567893" }],
        "active": true,
        "name": "Acme Health Insurance"
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
  "meta": { "profile": ["http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-pas-response-bundle"] },
  "identifier": { "system": "http://example.org/PATIENT_EVENT_TRACE_NUMBER", "value": "test-bundle-3" },
  "timestamp": "2025-12-17T13:34:24.333467Z",
  "entry": [
    {
      "fullUrl": "<base>/fhir/ClaimResponse/c0d73c37-12ee-4cde-bfc6-aa6ed216f4dd",
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

Only the `ClaimResponse` is shown above. The Bundle carries it first, then the resources it references (`Patient`, `Coverage`, both `Organization`s and the stored `Claim`), each with a `fullUrl` under the deployment's FHIR base URL, written `<base>` here.

### Update

Revise a line on an existing prior authorization:

{% tabs %}
{% tab title="Update request" %}

```http
POST /fhir/Claim/$submit
Content-Type: application/json
Accept: application/json

{
  "resourceType": "Bundle",
  "meta": { "profile": ["http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-pas-request-bundle"] },
  "type": "collection",
  "identifier": { "system": "http://example.org/PATIENT_EVENT_TRACE_NUMBER", "value": "test-bundle-4" },
  "timestamp": "2025-12-18T09:12:44.118000Z",
  "entry": [
    {
      "fullUrl": "urn:uuid:claim-1765299164118",
      "resource": {
        "resourceType": "Claim",
        "id": "claim-1765299164118",
        "meta": { "profile": ["http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-claim-update"] },
        "identifier": [{ "system": "http://example.org/claim-id", "value": "claim-1765299164118" }],
        "status": "active",
        "type": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/claim-type", "code": "professional" }] },
        "use": "preauthorization",
        "patient": { "reference": "Patient/patient-1" },
        "created": "2025-12-18T09:12:44.118Z",
        "insurer": { "reference": "Organization/payer-org-1" },
        "provider": { "reference": "Organization/requesting-org-1", "display": "Acme Care Clinic" },
        "priority": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/processpriority", "code": "normal" }] },
        "related": [
          {
            "claim": { "reference": "Claim/claim-1765213116210" },
            "relationship": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/ex-relatedclaimrelationship", "code": "prior" }] }
          }
        ],
        "insurance": [{ "sequence": 1, "focal": true, "coverage": { "reference": "Coverage/coverage-1" } }],
        "item": [
          {
            "sequence": 1,
            "extension": [
              { "url": "http://hl7.org/fhir/us/davinci-pas/StructureDefinition/extension-serviceItemRequestType", "valueCodeableConcept": { "coding": [{ "system": "https://codesystem.x12.org/005010/1525", "code": "SC", "display": "Specialty Care Review" }] } },
              { "url": "http://hl7.org/fhir/us/davinci-pas/StructureDefinition/extension-certificationType", "valueCodeableConcept": { "coding": [{ "system": "https://codesystem.x12.org/005010/1322", "code": "I", "display": "Initial" }] } },
              { "url": "http://hl7.org/fhir/us/davinci-pas/StructureDefinition/extension-infoChanged", "valueCode": "changed" }
            ],
            "category": { "coding": [{ "system": "https://codesystem.x12.org/005010/1365", "code": "42", "display": "Home Health Care" }] },
            "productOrService": { "coding": [{ "system": "http://www.ama-assn.org/go/cpt", "code": "99213", "display": "Established patient office visit" }] },
            "locationCodeableConcept": { "coding": [{ "system": "https://www.cms.gov/Medicare/Coding/place-of-service-codes/Place_of_Service_Code_Set", "code": "11", "display": "Office" }] },
            "servicedDate": "2025-12-22",
            "quantity": { "value": 3 }
          }
        ]
      }
    }
  ]
}
```

`extension-infoChanged` marks what the update does to the item: `changed` for a revision, `added` for a new line. The `Patient`, `Coverage` and `Organization` entries are the same as in the [initial submit](#initial-submit) and left out here, which a payer that already stores them accepts.

{% endtab %}
{% tab title="Update response" %}

```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "meta": { "profile": ["http://hl7.org/fhir/us/davinci-pas/StructureDefinition/profile-pas-response-bundle"] },
  "identifier": { "system": "http://example.org/PATIENT_EVENT_TRACE_NUMBER", "value": "test-bundle-4" },
  "timestamp": "2025-12-18T09:12:44.902311Z",
  "entry": [
    {
      "fullUrl": "<base>/fhir/ClaimResponse/c0d73c37-12ee-4cde-bfc6-aa6ed216f4dd",
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

`ClaimResponse.request` still names the original `Claim`, so the entries that follow carry that `Claim`, not the update one.

{% endtab %}
{% tab title="Denied authorization" %}

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "business-rule",
      "diagnostics": "Cannot update a prior authorization that has been denied. Submit a new request instead."
    }
  ]
}
```

{% endtab %}
{% endtabs %}
