# Payer-to-Payer

![Payer-to-Payer flow: Another payer calls Payerbox's $bulk-member-match to identify a member and pulls the matched member's history via $davinci-data-export; Payerbox returns data fed from the Health Plan's internal data sources. The receiving payer (not Payerbox) captures the member's opt-in consent during enrollment and submits it with the request.](../../assets/interop-apis/payer-to-payer-flow.svg)

The Payer-to-Payer API lets a receiving payer (new plan) pull a member's clinical, claims, encounter, and prior-authorization history from a previous payer when the member changes coverage. Established by CMS-0057-F, effective January 1, 2027. Replaces the suspended 9115 P2P provision.

## What Payerbox covers

- Asynchronous FHIR `$bulk-member-match` with the matched member's submitted `Consent` persisted on the responding side.
- Five-year member history on demand: clinical, claims, encounters.
- FHIR `Consent` resources with full audit trail of opt-in capture and revocation.

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

Five-year window of date-of-service, excluding remittances, cost-sharing, drug prior authorizations, and denied prior authorizations. See [Compliance / CMS-0057](../compliance/cms-0057.md) for the CFR anchor and full data-window rules.

| Data class | FHIR resources | IG |
|---|---|---|
| USCDI v3 clinical | Patient, Condition, Observation, MedicationRequest, etc. | US Core 6.1.0 |
| Claims and encounters (no remittance, no cost-sharing) | ExplanationOfBenefit (CARIN BB Non-Financial Basis profiles), Coverage | PDex 2.1.0 |
| Prior authorization request and decision (excluding drug PAs and denied PAs) | ExplanationOfBenefit (`use=preauthorization`) | PDex 2.1.0 |

## Test dataset

Operation examples below reference this dataset. Load it first to reproduce them.

Download:

{% file src="/docs/payerbox/assets/seeds/p2p-member-match.ndjson.gz" %}
p2p-member-match.ndjson.gz
{% endfile %}

Or load from the Aidbox REST Console:

```http
POST /fhir/$load
Content-Type: application/json

{"source": "https://www.health-samurai.io/docs/payerbox/assets/seeds/p2p-member-match.ndjson.gz"}
```

## Operations

### `$bulk-member-match`

The receiving payer submits one or more `MemberBundle` parameters — each carrying a `MemberPatient` (demographics), `CoverageToMatch`, and an opt-in HRex `Consent` whose `provision.actor[role=IRCP]` recipient identifies the receiving payer. The operation is **always asynchronous** — the kick-off returns `202 Accepted` with `Content-Location`; when polled, the manifest points at an ndjson `Parameters` resource holding up to three inline `Group` resources.

The example below uses `test-member-001` (Johnson, Robert) from the [Test dataset](#test-dataset), submitted by `test-payer-client`:

```http
POST <base>/fhir/Group/$bulk-member-match
Authorization: Basic <test-payer-client:test-payer-secret>
Prefer: respond-async
Content-Type: application/fhir+json

{
  "resourceType": "Parameters",
  "parameter": [{
    "name": "MemberBundle",
    "part": [
      {"name": "MemberPatient", "resource": {
        "resourceType": "Patient",
        "name": [{"family": "Johnson", "given": ["Robert"]}],
        "gender": "male", "birthDate": "1952-07-25"
      }},
      {"name": "CoverageToMatch", "resource": {
        "resourceType": "Coverage", "status": "active",
        "subscriberId": "SUB-001",
        "beneficiary": {"reference": "Patient/test-member-001"},
        "payor": [{"reference": "Organization/test-payer-001"}]
      }},
      {"name": "Consent", "resource": {
        "resourceType": "Consent", "status": "active",
        "scope": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/consentscope", "code": "patient-privacy"}]},
        "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "IDSCL"}]}],
        "patient": {"reference": "Patient/test-member-001"},
        "dateTime": "2026-04-01T08:00:00Z",
        "policy": [{"uri": "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-consent.html#sensitive"}],
        "provision": {
          "type": "permit",
          "period": {"start": "2026-01-01T00:00:00Z", "end": "2027-01-01T00:00:00Z"},
          "actor": [{
            "role": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType", "code": "IRCP"}]},
            "reference": {"reference": "Organization/test-payer-001"}
          }]
        }
      }}
    ]
  }]
}
```

Three buckets in the response:

| Group | Profile | Contents |
|---|---|---|
| `MatchedMembers` | [`pdex-member-match-group`](https://build.fhir.org/ig/HL7/davinci-epdx/StructureDefinition-pdex-member-match-group.html) | Members matched, consent valid, opt-out clear; submitted `Consent` is persisted by the responding payer |
| `NonMatchedMembers` | [`pdex-member-no-match-group`](https://build.fhir.org/ig/HL7/davinci-epdx/StructureDefinition-pdex-member-no-match-group.html) | No match found |
| `ConsentConstrainedMembers` | [`pdex-member-no-match-group`](https://build.fhir.org/ig/HL7/davinci-epdx/StructureDefinition-pdex-member-no-match-group.html) (code `consentconstraint`) | Matched member with active opt-out, expired consent, or consent that could not be persisted |

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
