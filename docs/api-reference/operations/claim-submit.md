---
description: PAS Claim/$submit operation reference — Da Vinci PAS STU 2.1.0
---

# Claim/$submit

Submits a prior authorization request as a FHIR Bundle for adjudication, defined by [Da Vinci PAS STU 2.1.0](https://hl7.org/fhir/us/davinci-pas/STU2.1/OperationDefinition-Claim-submit.html). The response is a FHIR Bundle containing a `ClaimResponse`, or an `OperationOutcome` on error.

The Da Vinci PAS Request Bundle profile requires exactly one focal `Claim` per Bundle — the underlying X12 278 transaction carries one prior authorization per BHT. To submit multiple prior authorizations, make multiple `Claim/$submit` calls.

## Endpoint

```
POST <base>/fhir/Claim/$submit
```

## Auth

SMART Backend Services. Scope: `system/Claim.cu system/ClaimResponse.r`. See [Authentication](../authentication.md).

## Parameters

| Direction | Parameter | Type | Cardinality | Description |
|---|---|---|---|---|
| IN | resource | Bundle | 1..1 | [PAS Request Bundle](https://hl7.org/fhir/us/davinci-pas/STU2.1/StructureDefinition-profile-pas-request-bundle.html) containing a single focal `Claim` and all referenced resources |
| OUT | return | Bundle or OperationOutcome | 1..1 | [PAS Response Bundle](https://hl7.org/fhir/us/davinci-pas/STU2.1/StructureDefinition-profile-pas-response-bundle.html) with `ClaimResponse`, or `OperationOutcome` on error |

## Example

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
            "category": { "coding": [{ "system": "https://codesystem.x12.org/005010/1365", "code": "42", "display": "Home Health Care" }] },
            "productOrService": { "coding": [{ "system": "http://www.ama-assn.org/go/cpt", "code": "99213", "display": "Established patient office visit" }] },
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
        "identifier": [{ "system": "http://hospital.example.org/patients", "value": "MRN123456" }],
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
        "beneficiary": { "reference": "Patient/patient-1" },
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
