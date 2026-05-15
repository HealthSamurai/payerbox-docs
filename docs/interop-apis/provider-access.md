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
| Authentication | SMART Backend Services (asymmetric JWT) per PDex's SHOULD-level recommendation for CMS-0057-F conformance. OAuth 2.0 Client Credentials (`client_id` + `client_secret`) is supported as a simpler alternative for sandboxes and trusted internal services. |
| Token endpoint | `<base>/auth/token` |
| Scope | `system/*.read` is the common default; deployments may narrow this per resource type via Aidbox access policies. The interop app additionally requires the provider's NPI on the OAuth `Client` resource (`Client.details.identifier[system=http://hl7.org/fhir/sid/us-npi]`). |

See [API Reference / Authentication](../api-reference/authentication.md).

## Two paths to the data

PDex 2.1.0 keeps two patterns for delivering Provider Access data. For **CMS-0057-F conformance the IG recommends v2** (Attestation). v1 is retained primarily for value-based-care attribution workflows.

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
| USCDI clinical | Patient, Condition, Observation, MedicationRequest, ... | US Core (PDex 2.1.0 accepts 3.1.1 or 6.1; pick the version your USCDI obligation requires) |
| Claims and encounters (no remittance, no cost-sharing) | ExplanationOfBenefit (filtered), Claim, Coverage | PDex 2.1.0 |
| Prior authorization | Claim, ClaimResponse, Task | PDex 2.1.0 |

Service date floor: **January 1, 2016**.

## Operations

### `$provider-member-match`

v2 only. The provider submits one or more `MemberBundle` parameters — each carrying a `MemberPatient` (demographics), `CoverageToMatch`, and a `Consent` (treatment-relationship attestation). The kick-off returns `202 Accepted` with a `Content-Location`; when polled, the manifest points at an ndjson `Parameters` resource holding up to three inline `Group` resources (`MatchedMembers`, `NonMatchedMembers`, `ConsentConstrainedMembers`).

{% tabs %}
{% tab title="Request" %}
```http
POST <base>/fhir/Group/$provider-member-match
Authorization: Bearer <access-token>
Content-Type: application/fhir+json
Prefer: respond-async

{
  "resourceType": "Parameters",
  "parameter": [{
    "name": "MemberBundle",
    "part": [
      {"name": "MemberPatient", "resource": {
        "resourceType": "Patient",
        "name": [{"family": "Smith", "given": ["John"]}],
        "gender": "male", "birthDate": "1970-05-15"
      }},
      {"name": "CoverageToMatch", "resource": {
        "resourceType": "Coverage", "status": "active",
        "beneficiary": {"reference": "Patient/patient-1"},
        "payor": [{"reference": "Organization/payer-org-1"}]
      }},
      {"name": "Consent", "resource": {
        "resourceType": "Consent", "status": "active",
        "patient": {"reference": "Patient/patient-1"}
      }}
    ]
  }]
}
```
{% endtab %}

{% tab title="Response" %}
```http
HTTP/1.1 202 Accepted
Content-Location: <base>/fhir/Group/$provider-member-match-status/<task-id>
```

Poll the status URL until `200 OK`; the manifest's `output[0].url` points at the ndjson `Parameters` body with the three inline `Group` resources.
{% endtab %}
{% endtabs %}

Full parameter table, status / output / cancel endpoints, and all response variants: [`$provider-member-match` reference](../api-reference/operations/provider-member-match.md).

### `$davinci-data-export`

v1 and v2. Async bulk export against a Group of attributed (v1) or matched (v2) members. Defined in the [Da Vinci ATR IG](http://hl7.org/fhir/us/davinci-atr/) and referenced by PDex.

{% tabs %}
{% tab title="Request" %}
```http
POST <base>/fhir/Group/<group-id>/$davinci-data-export
Authorization: Bearer <access-token>
Content-Type: application/fhir+json
Prefer: respond-async

{
  "resourceType": "Parameters",
  "parameter": [
    {"name": "exportType", "valueCanonical": "hl7.fhir.us.davinci-pdex#provider-download"},
    {"name": "_type",      "valueString":    "Patient,Coverage,ExplanationOfBenefit"}
  ]
}
```
{% endtab %}

{% tab title="Response" %}
```http
HTTP/1.1 202 Accepted
Content-Location: <base>/fhir/$export-status/<job-id>
```

Poll the `Content-Location` URL. When complete, it returns a manifest whose `output[].url` entries are pre-signed ndjson URLs grouped by resource type.
{% endtab %}
{% endtabs %}

Full parameter table (`exportType` allowed values, `_since`, `_until`, `_type`, `_typeFilter`, `_outputFormat`, `patient`), poll / output / cancel endpoints, and error responses: [`$davinci-data-export` reference](../api-reference/operations/davinci-data-export.md).
