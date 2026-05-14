---
description: order-select CDS Hook — fires when a clinician selects orders from a list before signing
---

# order-select

The `order-select` hook fires when a clinician selects one or more orders from a list of potential orders for a patient. It occurs while the clinician is still in the process of selecting orders to include in the current ordering session, before they are finalized. The context contains all draft orders being considered, plus a `selections` array indicating which specific orders have been selected.

Defined by the [CDS Hooks order-select specification](https://cds-hooks.hl7.org/hooks/STU1/order-select.html). Implemented by Payerbox for [CRD](../../prior-auth/crd.md) per the [Da Vinci CRD IG](https://hl7.org/fhir/us/davinci-crd/).

## Endpoint

```
POST <base>/cds-services/order-select-crd
```

## Auth

SMART Backend Services. See [Authentication](../authentication.md).

## Context

| Field | Optionality | Prefetch Token | Type | Description |
|---|---|---|---|---|
| userId | REQUIRED | Yes | string | The id of the current user (e.g., `PractitionerRole/123` or `Practitioner/abc`) |
| patientId | REQUIRED | Yes | string | The FHIR `Patient.id` of the current patient in context |
| encounterId | OPTIONAL | Yes | string | The FHIR `Encounter.id` of the current encounter in context |
| selections | REQUIRED | No | array | An array of resource references (e.g., `MedicationRequest/123`) indicating which orders from `draftOrders` have been selected |
| draftOrders | REQUIRED | No | Bundle | A Bundle of FHIR request resources with a `draft` status, representing orders in the current ordering session |

## Request Parameters

| Field | Optionality | Type | Description |
|---|---|---|---|
| hook | REQUIRED | string | Must be `order-select` |
| hookInstance | REQUIRED | string | A universally unique identifier for this particular hook call |
| context | REQUIRED | object | Hook-specific contextual data (see Context table above) |
| fhirServer | OPTIONAL | URL | The base URL of the CDS Client's FHIR server |
| fhirAuthorization | OPTIONAL | object | OAuth 2.0 bearer access token for FHIR server access |
| prefetch | OPTIONAL | object | FHIR data that was prefetched by the CDS Client |

## Example

{% hint style="info" %}
This example shows a typical coverage information Card. Your decision service (configured via `CDS_DECISION_SERVICE_URL`) may return different Card types depending on coverage requirements.
{% endhint %}

{% tabs %}
{% tab title="Request" %}

```http
POST /cds-services/order-select-crd
Content-Type: application/json
Accept: application/json

{
  "hook": "order-select",
  "hookInstance": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "fhirServer": "https://ehr.example.com/fhir",
  "fhirAuthorization": {
    "access_token": "some-opaque-fhir-access-token",
    "token_type": "Bearer",
    "expires_in": 300,
    "scope": "user/Patient.read user/Observation.read",
    "subject": "cds-service"
  },
  "context": {
    "userId": "PractitionerRole/123",
    "patientId": "1288992",
    "encounterId": "89284",
    "selections": ["MedicationRequest/smart-MedicationRequest-103"],
    "draftOrders": {
      "resourceType": "Bundle",
      "entry": [
        {
          "resource": {
            "resourceType": "MedicationRequest",
            "id": "smart-MedicationRequest-103",
            "status": "draft",
            "intent": "order",
            "medicationCodeableConcept": {
              "coding": [{ "system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "617993", "display": "Amoxicillin 120 MG/ML / clavulanate potassium 8.58 MG/ML Oral Suspension" }]
            },
            "subject": { "reference": "Patient/1288992" }
          }
        },
        {
          "resource": {
            "resourceType": "ServiceRequest",
            "id": "smart-ServiceRequest-456",
            "status": "draft",
            "intent": "order",
            "code": {
              "coding": [{ "system": "http://snomed.info/sct", "code": "73761001", "display": "Colonoscopy" }]
            },
            "subject": { "reference": "Patient/1288992" }
          }
        }
      ]
    }
  },
  "prefetch": {
    "patient": {
      "resourceType": "Patient",
      "id": "1288992",
      "name": [{ "given": ["John"], "family": "Doe" }],
      "birthDate": "1970-01-01",
      "gender": "male"
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
      "uuid": "c3d4e5f6-a7b8-9012-cdef-345678901234",
      "summary": "Coverage information for selected medication",
      "detail": "The selected medication is covered under the patient's plan with a $25 copay.",
      "indicator": "info",
      "source": {
        "label": "CRD Decision Service",
        "url": "https://cds.example.org",
        "topic": { "code": "coverage-info", "system": "http://hl7.org/fhir/us/davinci-crd/CodeSystem/cardType", "display": "Coverage Information" }
      }
    }
  ]
}
```

{% endtab %}
{% endtabs %}
