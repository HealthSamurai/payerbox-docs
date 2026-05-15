# Payer-to-Payer

![Payer-to-Payer flow: Other Payers (clinical and claims) exchange Bulk Export and Member Match with Payerbox to support 5-year record transfer when members switch plans.](../../assets/interop-apis/payer-to-payer-flow.png)

The Payer-to-Payer API lets a receiving payer (new plan) pull a member's clinical, claims, encounter, and prior-authorization history from a previous payer when the member changes coverage. Established by CMS-0057-F, effective January 1, 2027. Replaces the suspended 9115 P2P provision.

## Regulatory anchor

| Property | Value |
|---|---|
| Rule | CMS-0057-F |
| Citation | 42 CFR 422.119(g) and parallels |
| Compliance date | January 1, 2027 |
| Trigger | Member changes payers and opts in |
| Consent model | Opt-in (member must affirmatively consent during enrollment) |
| Data window | Five years before the request |
| Exclusions | Drug prior authorizations; denied prior authorizations; provider remittances; enrollee cost-sharing |

See [Compliance / CMS-0057](../compliance/cms-0057.md).

## Caller and auth

| Property | Value |
|---|---|
| Caller | Receiving payer (the new plan) |
| Authentication | SMART Backend Services Authorization (asymmetric JWT, system-level scope) |
| Token endpoint | `<base>/auth/token` on the responding payer's deployment |

The two payers exchange JWKS endpoints out-of-band (or pre-shared keys) at onboarding time.

See [API Reference / Authentication](../api-reference/authentication.md).

## Consent

CMS-0057-F prescribes **opt-in** for Payer-to-Payer. The receiving payer collects the member's opt-in during enrollment and stores the consent record. On `$bulk-member-match`, the receiving payer asserts the consent in the request payload. The responding payer validates the consent assertion before returning data.

Members can withdraw consent. Withdrawal is captured by the receiving payer and stops further requests.

## Data scope

Five-year window of clinical and claims data, excluding remittances, cost-sharing, drug PAs, and denied PAs.

| Data class | FHIR resources | IG |
|---|---|---|
| USCDI v3 clinical | Patient, Condition, Observation, MedicationRequest, etc. | US Core 6.1.0 |
| Claims and encounters (no remittance, no cost-sharing) | ExplanationOfBenefit (filtered), Claim, Coverage | PDex 2.1.0 |
| Prior authorization (excluding drug PAs and denied PAs) | Claim, ClaimResponse, Task | PDex 2.1.0 |

## Operations

### `$bulk-member-match`

The receiving payer submits one or more `MemberBundle` parameters — each carrying a `MemberPatient` (demographics), `CoverageToMatch`, and an opt-in `Consent`. The operation is **always asynchronous** — the kick-off returns `202 Accepted` with `Content-Location`; when polled, the manifest points at an ndjson `Parameters` resource holding up to three inline `Group` resources.

```http
POST <base>/fhir/Group/$bulk-member-match
Authorization: Bearer <access-token>
Prefer: respond-async
Content-Type: application/fhir+json
```

Three buckets in the response:

| Group | Profile | Contents |
|---|---|---|
| `MatchedMembers` | [`pdex-member-match-group`](https://build.fhir.org/ig/HL7/davinci-epdx/StructureDefinition-pdex-member-match-group.html) | Members matched, consent valid, opt-out clear; submitted `Consent` is persisted by the responding payer |
| `NonMatchedMembers` | [`pdex-member-no-match-group`](https://build.fhir.org/ig/HL7/davinci-epdx/StructureDefinition-pdex-member-no-match-group.html) | No match found |
| `ConsentConstrainedMembers` | [`pdex-member-no-match-group`](https://build.fhir.org/ig/HL7/davinci-epdx/StructureDefinition-pdex-member-no-match-group.html) (code `consentconstraint`) | Matched member with active opt-out, expired consent, or consent that could not be persisted |

The requesting payer's NPI must be present on the OAuth `Client` resource — `$bulk-member-match` rejects NPI-less callers with `403`.

See [API Reference / Operations / $bulk-member-match](../api-reference/operations/bulk-member-match.md).

### `$davinci-data-export` with `payertopayer` exportType

The receiving payer triggers export on the MatchedMembers group:

```http
POST <base>/fhir/Group/<matched-group-id>/$davinci-data-export
Authorization: Bearer <access-token>
Content-Type: application/fhir+json
Prefer: respond-async

{
  "resourceType": "Parameters",
  "parameter": [
    {"name": "exportType", "valueCanonical": "hl7.fhir.us.davinci-pdex#payertopayer"}
  ]
}
```

Response: `202 Accepted` with `Content-Location`. On completion, the Aidbox `$export-status` manifest carries pre-signed ndjson URLs grouped by resource type.

See [API Reference / Operations / $davinci-data-export](../api-reference/operations/davinci-data-export.md).

## Quickstart

1. Onboard with the responding payer: exchange Client ID, JWKS, agreed IG versions.
2. At new-member enrollment, capture opt-in consent. Store the consent record.
3. Sign a JWT, request token at the responding payer's `/auth/token` with `system/*.read` scope.
4. Submit `$bulk-member-match`:

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Prefer: respond-async" \
  -H "Content-Type: application/fhir+json" \
  -d @member-bundles.json \
  "<base>/fhir/Group/\$bulk-member-match"
```

5. Poll the status URL until match completes. Capture the three Group IDs.
6. Trigger export on the MatchedMembers Group.
7. Poll until export complete; ingest the NDJSON.

## Common errors

| HTTP | Cause |
|---|---|
| 400 | `Prefer: respond-async` header missing on kick-off |
| 401 | Token signature invalid or expired |
| 403 | OAuth client carries no NPI identifier |
| 422 | Input `Parameters` failed `$validate` against the input profile |
| 500 | Background processing failed; or upstream Aidbox read/write failed transiently |

Members that route to `NonMatchedMembers` or `ConsentConstrainedMembers` are **not** an error — they appear in their respective buckets and the export skips them.

## What Payerbox covers

- Asynchronous FHIR `$bulk-member-match` with the matched member's submitted `Consent` persisted on the responding side.
- Five-year member history on demand: clinical, claims, encounters.
- FHIR `Consent` resources with full audit trail of opt-in capture and revocation.

