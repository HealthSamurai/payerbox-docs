---
description: PAS $submit-attachment operation reference — Da Vinci CDex
---

# $submit-attachment

Submits clinical documentation (attachments) to associate with a previously submitted prior authorization request. This operation follows the [Da Vinci CDex (Clinical Data Exchange) Implementation Guide](https://hl7.org/fhir/us/davinci-cdex/OperationDefinition-submit-attachment.html) and supports the **solicited attachment** workflow — the Claim must already exist in the system before attachments can be submitted.

Unlike `Claim/$submit` and `Claim/$inquire`, this is a **system-level** operation (not scoped to a resource type) and accepts a FHIR `Parameters` resource instead of a `Bundle`.

## Endpoint

```
POST <base>/$submit-attachment
```

## Auth

SMART Backend Services. Scope requirements depend on the attachment content type (e.g. `system/DocumentReference.c`) plus Claim update (`system/Claim.u`). See [Authentication](../authentication.md).

## Parameters

| Parameter | Type | Cardinality | Description |
|---|---|---|---|
| TrackingId | Identifier | 1..1 | Correlation identifier tying attachments to a prior authorization (must match an existing Claim identifier) |
| AttachTo | code | 1..1 | `"claim"` or `"preauthorization"` — indicates what the attachment relates to |
| MemberId | Identifier | 1..1 | Patient member identifier |
| Final | boolean | 1..1 | Whether this is the final attachment submission for the given TrackingId |
| Attachment | BackboneElement | 1..* | Container for attachment content and metadata (see sub-parameters below) |

{% hint style="info" %}
The CDex profile enforces a minimum of 5 elements in the `parameter` array. All five parameters listed above must be present to pass validation.
{% endhint %}

**Attachment sub-parameters** (nested `part` elements):

| Sub-parameter | Type | Cardinality | Description |
|---|---|---|---|
| Code | CodeableConcept | 0..1 | LOINC or PWK01 code identifying the attachment type. When provided, it is stored in the Claim's `supportingInfo.code` |
| Content | Resource | 1..1 | The FHIR resource containing the attachment data (e.g., `DocumentReference`, `Bundle`, `QuestionnaireResponse`, `Observation`) |

## Processing flow

1. **Validation** — The `Parameters` resource is validated against the [CDex Parameters Submit Attachment profile](https://hl7.org/fhir/us/davinci-cdex/StructureDefinition-cdex-parameters-submit-attachment.html). Missing required parameters or invalid structure returns HTTP 422.
2. **Claim Lookup** — The system searches for an existing `Claim` matching the `TrackingId` identifier and `AttachTo` use code. If no matching Claim is found, the request is rejected with HTTP 422. Unsolicited attachments (where no prior Claim exists) are not supported.
3. **Cloud Storage Upload** — For `DocumentReference` resources containing inline base64 data (`content[].attachment.data`), the data is automatically uploaded to cloud storage. The base64 data is replaced with a URL reference, and the `size` field is populated.
4. **Content Persistence** — All attachment content resources are persisted in Aidbox via a FHIR transaction bundle.
5. **Claim Association** — The Claim is updated with new `supportingInfo` entries referencing the persisted content resources. Each entry includes a fixed PAS-valid category code and an optional `code` from the Attachment's `Code` parameter.

## Error responses

| Status | Condition |
|---|---|
| 200 | Attachments accepted and associated with the Claim |
| 422 | Validation failure (missing required parameters, invalid structure, no matching Claim found) |
| 500 | Server error (content resource persistence or Claim update failed) |

## Example

{% tabs %}
{% tab title="Request" %}

```http
POST /$submit-attachment
Content-Type: application/json
Accept: application/json

{
  "resourceType": "Parameters",
  "parameter": [
    {
      "name": "TrackingId",
      "valueIdentifier": {
        "system": "http://example.org/claim-id",
        "value": "claim-1765213116210"
      }
    },
    {
      "name": "AttachTo",
      "valueCode": "preauthorization"
    },
    {
      "name": "MemberId",
      "valueIdentifier": {
        "system": "http://example.org/MIN",
        "value": "99999"
      }
    },
    {
      "name": "Attachment",
      "part": [
        {
          "name": "Code",
          "valueCodeableConcept": {
            "coding": [
              {
                "system": "http://loinc.org",
                "code": "11506-3",
                "display": "Progress note"
              }
            ]
          }
        },
        {
          "name": "Content",
          "resource": {
            "resourceType": "DocumentReference",
            "status": "current",
            "type": {
              "coding": [
                { "system": "http://loinc.org", "code": "11506-3", "display": "Progress note" }
              ]
            },
            "content": [
              {
                "attachment": {
                  "contentType": "text/plain",
                  "data": "UHJvZ3Jlc3Mgbm90ZSBjb250ZW50IGZvciB0aGUgcGF0aWVudCB2aXNpdC4="
                }
              }
            ]
          }
        }
      ]
    },
    {
      "name": "Final",
      "valueBoolean": true
    }
  ]
}
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "information",
      "code": "informational",
      "diagnostics": "Attachments accepted and associated with Claim/claim-1765213116210"
    }
  ]
}
```

{% endtab %}
{% tab title="Error: No Matching Claim" %}

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "invalid",
      "diagnostics": "No matching Claim found for the given TrackingId. Unsolicited attachments are not supported."
    }
  ]
}
```

{% endtab %}
{% endtabs %}
