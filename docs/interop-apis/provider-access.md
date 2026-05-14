---
description: Da Vinci PDex Provider Access API — backend-services auth, member matching, and bulk clinical data export for in-network treating providers under CMS-0057-F.
---

# Provider Access API

![Provider Access flow: Provider calls Payerbox FHIR platform with $provider-member-match, receives data via $davinci-data-export; Health Plan data sources feed Payerbox with members' data; Member portal handles educational resources and opt-out, with opt-out flag flowing back to the FHIR platform for consent filtering.](../../assets/interop-apis/provider-access-flow.svg)

The [Da Vinci PDex Provider Access API](https://build.fhir.org/ig/HL7/davinci-epdx/provider-access-api-v2.html) lets an in-network provider with a treatment relationship to a payer's member pull that member's clinical, claims, encounter, and prior-authorization data in bulk. Established by [CMS-0057-F](../compliance/cms-0057.md), effective January 1, 2027.

## What Payerbox covers

- PDex Implementation Guide preconfigured.
- `$provider-member-match` and `$davinci-data-export` operations available on the Interop bundle.
- Plugs into the payer's existing attribution roster — accepts `Group` ingestion or an equivalent lookup feed.
- Member opt-out filtering applied before any Provider Access response.
- Audit logging per provider request, scoped to the requesting provider.

## Caller and auth

| Property | Value |
|---|---|
| Caller | In-network provider system (EHR, care-coordination platform) |
| Authentication | SMART Backend Services (asymmetric JWT, JWKS or pre-shared public key) per PDex's SHOULD-level recommendation for CMS-0057-F conformance. OAuth2 client_credentials (client_id + client_secret) is supported as a simpler alternative for sandboxes and non-conformance use cases. |
| Token endpoint | `<base>/auth/token` |
| Scope | PDex proposes a narrowed Group-scoped scope (`system/Group.u?code=...`) rather than blanket `system/*.read`. The exact scope a deployment requires is configurable. |

See [API Reference / Authentication](../api-reference/authentication.md).

## Two paths to the data

PDex v2.2.0 keeps two patterns for delivering Provider Access data. For **CMS-0057-F conformance the IG recommends v2** (Attestation). v1 is retained primarily for value-based-care attribution workflows.

### v1 — Payer-attributed Group export

The payer maintains an attribution roster mapping each in-network provider to the members the payer considers attributed to that provider, exposed as a `Group` resource per provider. The provider calls `$davinci-data-export` against that Group:

```
POST <base>/fhir/Group/<group-id>/$davinci-data-export
Prefer: respond-async
```

No per-call match step — the roster is the gating mechanism, augmented by the member opt-out list.

### v2 — Provider-attested member match

The provider asserts the treatment relationship at request time, the payer matches the provider's patient list against enrolled members, and the provider then exports the matched Group.

1. **Match members.** Submit a batch of patient demographics, coverage references, and a treatment-relationship attestation to `$provider-member-match`:

   ```
   POST <base>/fhir/Group/$provider-member-match
   Prefer: respond-async
   ```

   The payer returns up to three Group resources in the response:
   - `MatchedMembers` — members successfully matched and whose treatment attestation has been verified
   - `NonMatchedMembers` — members the payer could not match, or whose attestation could not be verified
   - `ConsentConstrainedMembers` — matched members who have opted out of provider data sharing (the payer may suppress this group for privacy)

2. **Export data.** Use the `MatchedMembers` Group id with `$davinci-data-export`:

   ```
   POST <base>/fhir/Group/<matched-members-group-id>/$davinci-data-export
   Prefer: respond-async
   ```

   The async pattern follows FHIR Bulk Data semantics: poll `Content-Location`, retrieve NDJSON manifests when complete.

Both `$provider-member-match` and `$davinci-data-export` are **always asynchronous** — kick-off returns `202 Accepted` with a `Content-Location` header; the client polls until the result is ready.

`$davinci-data-export` is defined in the [Da Vinci ATR IG](http://hl7.org/fhir/us/davinci-atr/) and **referenced** by PDex; it is a profiled extension of FHIR Bulk Data Export and is the only bulk entry point for Provider Access.

## Consent model

CMS-0057-F prescribes **opt-out** for Provider Access. Default is share-on; a member who opts out is removed from the data response for all in-network providers — PDex v2.2.0 frames the opt-out as all-or-nothing, not per-provider. The member can opt out and reverse the choice at any time.

Opt-out is captured by the payer and surfaced to Payerbox so the API filters out opted-out members before responding, regardless of whether v1 or v2 is used.

## Data scope

Same data set Provider Access shares with Patient Access, **excluding provider remittances and enrollee cost-sharing**.

| Data class | FHIR resources | IG |
|---|---|---|
| USCDI clinical | Patient, Condition, Observation, MedicationRequest, ... | US Core (PDex accepts 3.1.1 or 6.1; pick the version your USCDI obligation requires) |
| Claims and encounters (no remittance, no cost-sharing) | ExplanationOfBenefit (filtered), Claim, Coverage | PDex 2.2.0 |
| Prior authorization | Claim, ClaimResponse, Task | PDex 2.2.0 |

Service date floor: **January 1, 2016**.

## Operations

### `$provider-member-match`

v2 only. The provider submits demographics + (optional) prior coverage and an attestation; the payer returns the three result Groups (`MatchedMembers`, `NonMatchedMembers`, `ConsentConstrainedMembers`).

{% tabs %}
{% tab title="Request" %}
```http
POST <base>/fhir/Group/$provider-member-match
Authorization: Bearer <access-token>
Content-Type: application/fhir+json
```
```json
{
  "resourceType": "Parameters",
  "parameter": [
    { "name": "MemberPatient",
      "resource": {
        "resourceType": "Patient",
        "name": [{ "family": "Smith", "given": ["John"] }],
        "birthDate": "1970-04-15",
        "gender": "male"
      } },
    { "name": "CoverageToMatch",
      "resource": {
        "resourceType": "Coverage",
        "status": "active",
        "subscriberId": "1A23B45C67D8"
      } }
  ]
}
```
{% endtab %}

{% tab title="Response" %}
```json
{
  "resourceType": "Parameters",
  "parameter": [
    { "name": "MatchedMembers",
      "resource": { "resourceType": "Group", "id": "matched-2026-05-14" } },
    { "name": "NonMatchedMembers",
      "resource": { "resourceType": "Group", "id": "nonmatched-2026-05-14" } },
    { "name": "ConsentConstrainedMembers",
      "resource": { "resourceType": "Group", "id": "optedout-2026-05-14" } }
  ]
}
```
{% endtab %}
{% endtabs %}

Full parameter table, all variants and error responses: [`$provider-member-match` reference](../api-reference/operations/provider-member-match.md).

### `$davinci-data-export`

v1 and v2. Async bulk export against a Group of attributed (v1) or matched (v2) members. Defined in the [Da Vinci ATR IG](http://hl7.org/fhir/us/davinci-atr/) and referenced by PDex.

{% tabs %}
{% tab title="Request" %}
```http
POST <base>/fhir/Group/<group-id>/$davinci-data-export?exportType=provider-download
Authorization: Bearer <access-token>
Accept: application/fhir+json
Prefer: respond-async
```
{% endtab %}

{% tab title="Response" %}
```http
HTTP/1.1 202 Accepted
Content-Location: <base>/fhir/$export-status/<job-id>
```

Poll the `Content-Location` URL. When complete, it returns an `output` array of NDJSON file URLs grouped by resource type.
{% endtab %}
{% endtabs %}

Full parameter table (including `exportType`, `_since`, `_type`, `_typeFilter`), poll/manifest payloads, and error responses: [`$davinci-data-export` reference](../api-reference/operations/davinci-data-export.md).
