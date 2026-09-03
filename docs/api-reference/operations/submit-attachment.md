---
description: PAS $submit-attachment operation reference — Da Vinci CDex
---

# $submit-attachment

Submits clinical documentation (attachments) to associate with a previously submitted prior authorization request. This operation follows the [Da Vinci CDex (Clinical Data Exchange) Implementation Guide](https://hl7.org/fhir/us/davinci-cdex/OperationDefinition-submit-attachment.html) and supports the **solicited attachment** workflow — the Claim must already exist in the system before attachments can be submitted.

Unlike `Claim/$submit` and `Claim/$inquire`, this is a **system-level** operation (not scoped to a resource type) and accepts a FHIR `Parameters` resource instead of a `Bundle`.

## Endpoint

```
POST <base>/fhir/$submit-attachment
```

## Auth

SMART Backend Services. Scope requirements depend on the attachment content type (e.g. `system/DocumentReference.c`) plus Claim update (`system/Claim.u`). See [Authentication](../authentication.md).

## Parameters

| Parameter | Type | Cardinality | Description |
|---|---|---|---|
| TrackingId | Identifier | 1..1 | Correlation identifier tying attachments to a prior authorization (must match an existing Claim identifier) |
| AttachTo | code | 1..1 | `"claim"` or `"preauthorization"` — indicates what the attachment relates to |
| MemberId | Identifier | 1..1 | Patient member identifier |
| Attachment | BackboneElement | 1..* | Container for attachment content and metadata (see sub-parameters below) |
| Final | boolean | 0..1 | Whether this is the final attachment submission for the given TrackingId. Defaults to `true` when omitted. When `true`, the prior authorization is re-queued for review — see [Re-queue on Final](#re-queue-on-final) |
| PayerId | Identifier | 0..1 | Payer identifier |
| OrganizationId | Identifier | 0..1 | Submitting organization identifier |
| ProviderId | Identifier | 0..1 | Provider identifier |
| ServiceDate | dateTime | 0..1 | Date of service the attachment relates to |
| AdminRefNumber | Identifier | 0..1 | Administrative reference number for the prior authorization |

{% hint style="info" %}
`TrackingId`, `AttachTo`, `MemberId`, and at least one `Attachment` are required. Requests missing any of these four parameters — or carrying a blank `TrackingId.value` — fail validation with HTTP 422.
{% endhint %}

**Attachment sub-parameters** (nested `part` elements):

| Sub-parameter | Type | Cardinality | Description |
|---|---|---|---|
| LineItem | string | 0..* | Claim line item number(s) the attachment applies to |
| Code | CodeableConcept | 0..1 | LOINC or PWK01 code identifying the attachment type. When provided, it is stored in the Claim's `supportingInfo.code` |
| Content | Resource | 1..1 | The FHIR resource containing the attachment data — a `DocumentReference` or a `QuestionnaireResponse`, the reference targets the PAS `supportingInfo` slice admits |

## Processing flow

1. **Validation** — The `Parameters` resource is validated against the [CDex Parameters Submit Attachment profile](https://hl7.org/fhir/us/davinci-cdex/StructureDefinition-cdex-parameters-submit-attachment.html). Missing required parameters or invalid structure returns HTTP 422.
2. **Claim Lookup** — The system searches for an existing `Claim` matching the `TrackingId` identifier and `AttachTo` use code. If no matching Claim is found, the request is rejected with HTTP 422. Unsolicited attachments (where no prior Claim exists) are not supported.
3. **Decision Check** — If the Claim's latest `ClaimResponse` has `outcome = "complete"`, the prior authorization is finalized and the request is rejected with HTTP 422 (`business-rule`). The diagnostic carries the `ClaimResponse.disposition` so the caller can tell an approved authorization from a denied one.
4. **Duplicate Check** — Attachments whose `Content` resource `id` is already linked from the Claim's `supportingInfo` are rejected. When every attachment in the request collides, the request fails with HTTP 422 (`duplicate`). When only some collide, the non-colliding attachments are attached and the response is HTTP 200 with a `warning` issue listing the collisions. To submit new content, use a unique `id` or omit `id` to have one generated.
5. **Cloud Storage Upload** — For `DocumentReference` resources containing inline base64 data (`content[].attachment.data`), the data is automatically uploaded to cloud storage. The base64 data is replaced with a URL reference, and the `size` field is populated.
6. **Content Persistence** — All attachment content resources are persisted in Aidbox via a FHIR transaction bundle.
7. **Claim Association** — The Claim is updated with new `supportingInfo` entries referencing the persisted content resources. Each entry includes a fixed PAS-valid category code and an optional `code` from the Attachment's `Code` parameter.
8. **Re-queue on Final** — see below.

## Re-queue on Final

When `Final` is `true` (the default), a successful submission puts the prior authorization back in review: the Claim's latest `ClaimResponse` gets `outcome` set to `"queued"`, and its `disposition`, `preAuthRef`, and `communicationRequest` elements are removed. A system watching the `ClaimResponse` (via [`Claim/$inquire`](claim-inquire.md) or [Event Notifications](../../prior-auth/event-notifications.md)) will therefore see a pended decision revert to `queued`, and previously present fields disappear, until the payer's review of the new documentation produces a fresh decision.

With `Final = false` the `ClaimResponse` is left untouched — use it to stream attachments across several calls and set `Final = true` on the last one.

## Error responses

| Status | Condition |
|---|---|
| 200 | Attachments accepted and associated with the Claim. On a partial id collision the `OperationOutcome` carries an extra `warning` issue (code `duplicate`) listing the attachments that were skipped |
| 422 | Validation failure (missing required parameters, blank `TrackingId.value`, invalid structure, no matching Claim found) |
| 422 | Finalized prior authorization — the Claim's latest `ClaimResponse` has `outcome = "complete"` (issue code `business-rule`) |
| 422 | Attachment id collision — every attachment's `Content` resource `id` is already linked from the Claim's `supportingInfo` (issue code `duplicate`) |
| 500 | Server error (content resource persistence or Claim update failed) |

## Example

{% tabs %}
{% tab title="Request" %}

```http
POST /fhir/$submit-attachment
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
{% tab title="Error: Finalized Authorization" %}

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "business-rule",
      "diagnostics": "Cannot submit attachments for Claim/claim-1765213116210: ClaimResponse outcome=complete, disposition=Denied (prior authorization denied)."
    }
  ]
}
```

{% endtab %}
{% tab title="Error: Attachment Id Collision" %}

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "duplicate",
      "diagnostics": "Attachment id collision: DocumentReference/doc-1 already linked to Claim/claim-1765213116210. To submit new content use a unique id, or omit `id` to have one auto-generated."
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
