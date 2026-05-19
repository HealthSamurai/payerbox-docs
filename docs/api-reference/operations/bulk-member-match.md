---
description: Da Vinci PDex $bulk-member-match operation reference — async kick-off, status polling, ndjson output, cancellation.
---

# $bulk-member-match

Matches a batch of member bundles submitted by a requesting payer against the responding payer's Patients and produces up to three `Group` resources, defined by the [Da Vinci PDex IG](https://build.fhir.org/ig/HL7/davinci-epdx/) (STU 2.1.0). The `MatchedMembers` Group id is the input to [`$davinci-data-export`](davinci-data-export.md) with `exportType=payertopayer` for the Payer-to-Payer bulk export.

The operation is **always asynchronous** and follows the [FHIR Bulk Data kick-off pattern](https://hl7.org/fhir/uv/bulkdata/export.html#bulk-data-kick-off-request): kick-off returns `202 Accepted` with `Content-Location`, the client polls the status URL, and downloads the result as a single-line ndjson `Parameters` resource.

## Auth

SMART Backend Services Claim Credentials. The requesting payer's NPI is normally present on the OAuth `Client` resource as `identifier[system=http://hl7.org/fhir/sid/us-npi]`. See [Authentication](../authentication.md).

An authenticated admin session (Aidbox Console) without a client NPI is also accepted: the requesting payer is derived from `Coverage.payor[0]` in the first submitted `MemberBundle`, resolved to an `Organization` by `identifier[system=us-npi]`. If the referenced Organization is unregistered or carries no `us-npi` identifier, the kick-off rejects with `422 Unprocessable Entity`. Fully anonymous callers (no client NPI and no user session) are rejected with `403`.

## Kick-off

### Endpoint

```
POST <base>/fhir/Group/$bulk-member-match
```

`Prefer: respond-async` is required. Requests without it are rejected with `400`.

### Parameters

The request body is a `Parameters` resource with one or more `MemberBundle` entries, validated against the [`pdex-parameters-multi-member-match-bundle-in`](https://build.fhir.org/ig/HL7/davinci-epdx/StructureDefinition-pdex-parameters-multi-member-match-bundle-in.html) profile.

| Direction | Parameter | Type | Cardinality | Description |
|---|---|---|---|---|
| IN | `MemberBundle` | part group | 1..* | One per submitted member; contains `MemberPatient`, `CoverageToMatch`, `Consent`, optional `CoverageToLink` |
| IN | `MemberBundle.MemberPatient` | Patient | 1..1 | [HRex Patient Demographics](http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-patient-demographics.html) — `family`, `given[0]`, `birthDate`, `gender` are all required for matching; `identifier` entries are added to the matching query as `identifier` search tokens |
| IN | `MemberBundle.CoverageToMatch` | Coverage | 1..1 | [HRex Coverage](http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-coverage.html); `subscriberId` (when present) is added to the matching query as `_has:Coverage:beneficiary:subscriber-id` |
| IN | `MemberBundle.Consent` | Consent | 1..1 | [HRex Consent](http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-consent.html); `status`, `provision.period`, `provision.actor[role=IRCP]`, and `policy.uri` are evaluated at match time (see [Matching behavior](#matching-behavior)) |
| IN | `MemberBundle.CoverageToLink` | Coverage | 0..1 | HRex Coverage |
| OUT (kick-off) | — | — | — | `202 Accepted` with `Content-Location` header pointing at the status URL |

### Example

{% tabs %}
{% tab title="Request" %}
```http
POST /fhir/Group/$bulk-member-match
Content-Type: application/fhir+json
Prefer: respond-async

{
  "resourceType": "Parameters",
  "parameter": [
    {
      "name": "MemberBundle",
      "part": [
        {
          "name": "MemberPatient",
          "resource": {
            "resourceType": "Patient",
            "name": [{"family": "Smith", "given": ["John"]}],
            "gender": "male",
            "birthDate": "1970-05-15",
            "identifier": [{"system": "http://hl7.org/fhir/sid/us-mbi", "value": "1A23B45C67D8"}]
          }
        },
        {
          "name": "CoverageToMatch",
          "resource": {
            "resourceType": "Coverage",
            "status": "active",
            "subscriberId": "1A23B45C67D8",
            "beneficiary": {"reference": "Patient/patient-1"},
            "payor": [{"identifier": {"system": "http://hl7.org/fhir/sid/us-npi", "value": "1234567893"}}]
          }
        },
        {
          "name": "Consent",
          "resource": {
            "resourceType": "Consent",
            "status": "active",
            "scope": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/consentscope", "code": "patient-privacy"}]},
            "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "IDSCL"}]}],
            "patient": {"reference": "Patient/patient-1"},
            "dateTime": "2026-04-01T08:00:00Z",
            "policy": [{"uri": "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-consent.html#sensitive"}],
            "provision": {
              "type": "permit",
              "period": {"start": "2026-01-01T00:00:00Z", "end": "2027-01-01T00:00:00Z"},
              "actor": [{
                "role": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType", "code": "IRCP"}]},
                "reference": {"identifier": {"system": "http://hl7.org/fhir/sid/us-npi", "value": "1234567893"}}
              }]
            }
          }
        }
      ]
    }
  ]
}
```
{% endtab %}
{% tab title="Response (accepted)" %}
```http
HTTP/1.1 202 Accepted
Content-Location: <base>/fhir/Group/$bulk-member-match-status/<task-id>
```
{% endtab %}
{% tab title="Response (missing Prefer)" %}
```http
HTTP/1.1 400 Bad Request
Content-Type: application/fhir+json

{
  "resourceType": "OperationOutcome",
  "issue": [{
    "severity": "error",
    "code": "processing",
    "diagnostics": "This operation requires Prefer: respond-async header"
  }]
}
```
{% endtab %}
{% tab title="Response (no NPI)" %}
```http
HTTP/1.1 403 Forbidden
Content-Type: application/fhir+json

{
  "resourceType": "OperationOutcome",
  "issue": [{
    "severity": "error",
    "code": "forbidden",
    "diagnostics": "OAuth client must carry an NPI identifier"
  }]
}
```
{% endtab %}
{% tab title="Response (validation fail)" %}
```http
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/fhir+json
```

The body is the `OperationOutcome` returned by Aidbox `$validate` against the input profile.
{% endtab %}
{% endtabs %}

## Status polling

### Endpoint

```
GET <base>/fhir/Group/$bulk-member-match-status/<task-id>
```

`<task-id>` is the id at the end of the `Content-Location` from kick-off. Calls from a client whose NPI does not match `Task.requester.identifier` get `404` (cross-tenant guard).

### Parameters

Response shape depends on the underlying `Task` status:

| Task status | HTTP | Headers | Body |
|---|---|---|---|
| `requested` | 202 | `Retry-After: 5` | — |
| `in-progress` | 202 | `Retry-After: 5`, `X-Progress: Processing members` | — |
| `completed` | 200 | `Content-Type: application/json` | Bulk Data manifest |
| `failed` | 500 | — | `OperationOutcome` |
| `cancelled` / not found / tombstoned (Aidbox `410 Gone`) | 404 | — | `OperationOutcome` |

### Example

{% tabs %}
{% tab title="Request" %}
```http
GET /fhir/Group/$bulk-member-match-status/<task-id>
```
{% endtab %}
{% tab title="Response (in progress)" %}
```http
HTTP/1.1 202 Accepted
Retry-After: 5
X-Progress: Processing members
```
{% endtab %}
{% tab title="Response (completed)" %}
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "transactionTime": "2026-05-15T13:17:56Z",
  "request": "<base>/fhir/Group/$bulk-member-match",
  "requiresAccessToken": true,
  "output": [
    {"type": "Parameters", "url": "<base>/output/<task-id>.ndjson"}
  ],
  "error": []
}
```
{% endtab %}
{% tab title="Response (failed)" %}
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/fhir+json

{
  "resourceType": "OperationOutcome",
  "issue": [{
    "severity": "error",
    "code": "exception",
    "diagnostics": "Internal error processing request"
  }]
}
```
{% endtab %}
{% endtabs %}

## Output download

### Endpoint

```
GET <base>/output/<task-id>.ndjson
```

URL comes from `output[0].url` in the manifest. Body is a single ndjson line — a `Parameters` resource conforming to the [`pdex-parameters-multi-member-match-bundle-out`](https://build.fhir.org/ig/HL7/davinci-epdx/StructureDefinition-pdex-parameters-multi-member-match-bundle-out.html) profile. `MatchedMembers` is always present (1..1 per the output profile); the other two buckets appear only when non-empty.

### Parameters

| Direction | Parameter | Type | Cardinality | Description |
|---|---|---|---|---|
| OUT | `MatchedMembers` | Group | 1..1 | [`pdex-member-match-group`](https://build.fhir.org/ig/HL7/davinci-epdx/StructureDefinition-pdex-member-match-group.html); members matched, consent passed, opt-out clear, and the submitted Consent persisted. Group id is the input to `$davinci-data-export?exportType=payertopayer`. `quantity = 0` and `member` omitted when empty. |
| OUT | `NonMatchedMembers` | Group | 0..1 | [`pdex-member-no-match-group`](https://build.fhir.org/ig/HL7/davinci-epdx/StructureDefinition-pdex-member-no-match-group.html); no match found. Submitted Patients are carried in `Group.contained[]` (fragment refs `#1`, `#2`, …). |
| OUT | `ConsentConstrainedMembers` | Group | 0..1 | [`pdex-member-no-match-group`](https://build.fhir.org/ig/HL7/davinci-epdx/StructureDefinition-pdex-member-no-match-group.html) with code `consentconstraint`; matched member whose Consent failed a match-time check, has an active opt-out, or whose Consent could not be persisted. |

### Example

{% tabs %}
{% tab title="Request" %}
```http
GET /output/<task-id>.ndjson
```
{% endtab %}
{% tab title="Response" %}
```http
HTTP/1.1 200 OK
Content-Type: application/fhir+ndjson
```

Body (single ndjson line, formatted for readability):

```json
{
  "resourceType": "Parameters",
  "meta": {"profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-parameters-multi-member-match-bundle-out"]},
  "parameter": [
    {
      "name": "MatchedMembers",
      "resource": {
        "resourceType": "Group",
        "id": "<task-id>-matched",
        "meta": {"profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-member-match-group"]},
        "active": true, "type": "person", "actual": true,
        "code": {"coding": [{"system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/PdexMultiMemberMatchResultCS", "code": "match"}]},
        "characteristic": [{
          "code": {"coding": [{"system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/PdexMultiMemberMatchResultCS", "code": "match"}]},
          "valueReference": {
            "identifier": {"system": "http://hl7.org/fhir/sid/us-npi", "value": "1234567893"},
            "reference": "Organization/payer-org-1"
          },
          "exclude": false
        }],
        "quantity": 1,
        "member": [{"entity": {"reference": "Patient/patient-1", "display": "Smith, John"}, "inactive": false}]
      }
    },
    {
      "name": "ConsentConstrainedMembers",
      "resource": {
        "resourceType": "Group",
        "id": "<task-id>-consent",
        "meta": {"profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-member-no-match-group"]},
        "active": true, "type": "person", "actual": true,
        "code": {"coding": [{"system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/PdexMultiMemberMatchResultCS", "code": "consentconstraint"}]},
        "characteristic": [{
          "code": {"coding": [{"system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/PdexMultiMemberMatchResultCS", "code": "consentconstraint"}]},
          "valueReference": {
            "identifier": {"system": "http://hl7.org/fhir/sid/us-npi", "value": "1234567893"},
            "reference": "Organization/payer-org-1"
          },
          "exclude": false
        }],
        "quantity": 1,
        "member": [{"entity": {"reference": "Patient/patient-2", "display": "Doe, Jane"}, "inactive": false}]
      }
    },
    {
      "name": "NonMatchedMembers",
      "resource": {
        "resourceType": "Group",
        "id": "<task-id>-nomatch",
        "meta": {"profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-member-no-match-group"]},
        "active": true, "type": "person", "actual": true,
        "code": {"coding": [{"system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/PdexMultiMemberMatchResultCS", "code": "nomatch"}]},
        "contained": [{"resourceType": "Patient", "id": "1", "name": [{"family": "Unknown", "given": ["Nobody"]}], "gender": "male", "birthDate": "2000-01-01"}],
        "characteristic": [{
          "code": {"coding": [{"system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/PdexMultiMemberMatchResultCS", "code": "nomatch"}]},
          "valueBoolean": true,
          "exclude": false
        }],
        "quantity": 1,
        "member": [{
          "entity": {
            "reference": "#1",
            "extension": [{
              "url": "http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/base-ext-match-parameters",
              "valueReference": {"reference": "#1"}
            }]
          },
          "inactive": false
        }]
      }
    }
  ]
}
```
{% endtab %}
{% endtabs %}

`MatchedMembers` and `ConsentConstrainedMembers` carry the requesting payer's NPI in `characteristic[0].valueReference.identifier`; the literal `Organization/<id>` reference is added when the responding payer has an Organization registered for that NPI. `Patient.identifier` entries submitted on `MemberPatient` are used as additional matching tokens but are not echoed back on the matched Group.

## Cancellation

### Endpoint

```
DELETE <base>/fhir/Group/$bulk-member-match-cancel/<task-id>
```

A custom URL is used (rather than `DELETE` on the status URL) because Aidbox operation dispatch is keyed on method + URL. Cross-tenant calls return `404`.

### Parameters

Behaviour depends on the current `Task` status:

| Task status | Action | Response |
|---|---|---|
| `requested` / `in-progress` | Set `Task.status = "cancelled"`. The background worker stops at its next checkpoint (per-member loop + pre-persist) without writing Groups, the Binary, or persisted Consents. | `202 Accepted` |
| `completed` / `failed` / `cancelled` | Delete the `Task` and every resource referenced from `Task.output` (Groups, Binary, and persisted Consents). | `202 Accepted` |
| not found / tombstoned | — | `404` with `OperationOutcome` (Aidbox `410 Gone` is mapped to `404` so clients stop polling) |

### Example

{% tabs %}
{% tab title="Request" %}
```http
DELETE /fhir/Group/$bulk-member-match-cancel/<task-id>
```
{% endtab %}
{% tab title="Response" %}
```http
HTTP/1.1 202 Accepted
```
{% endtab %}
{% endtabs %}

## Matching behavior

Each submitted member is evaluated independently. Per-member failures never fail the batch — problematic members are routed to `NonMatchedMembers` or `ConsentConstrainedMembers`.

**Demographic match.** Same algorithm as [`$provider-member-match`](provider-member-match.md#matching-behavior): all four of `family`, `given[0]`, `birthDate`, `gender` are required and queried against payer Patients. `Patient.identifier` entries become `identifier` search tokens (FHIR AND semantics — every submitted identifier must match). Identifier-AND is bulk-specific: [`$provider-member-match`](provider-member-match.md#matching-behavior) ignores submitted `Patient.identifier` entries, because provider-side systems carry MRNs the payer does not store. `Coverage.subscriberId`, when present, becomes `_has:Coverage:beneficiary:subscriber-id`. Zero or ambiguous (>1) results route to `NonMatchedMembers`.

**Match-time consent checks.** A matched member is moved to `ConsentConstrainedMembers` if **any** of the following is true:

| Check | Constrains when |
|---|---|
| `Consent.status` | not `"active"` |
| `Consent.provision.period` | absent, unparseable, or does not cover the current time |
| `Consent.provision.actor[role=IRCP]` recipient | does not resolve to the requesting payer — checked in order: literal `Organization/<id>` reference (when the payer Org is registered), inline `identifier` matching the OAuth client's NPI, or NPI dereferenced from an `Organization/<id>` reference |
| `Consent.policy[*].uri` | not `#sensitive` — `#regular` and missing/unknown policy URIs both constrain (fail-safe; Payerbox does not yet redact sensitive data, so non-`#sensitive` consents cannot be honored) |
| Active `provider-access` deny `Consent` on the matched Patient (opt-out) | any active hit; a failing opt-out query (non-2xx) fails safe to constrained |

The opt-out check reuses the same Aidbox search as [`$provider-member-match`](provider-member-match.md#matching-behavior): `Consent?status=active&category=provider-access&patient=<id>&decision=deny`.

**Consent persistence.** For each remaining matched member the submitted `Consent` is upserted into Aidbox with a deterministic id (`SHA-1(payer-org-id|patient-id)`); `Consent.patient` is rewritten to the matched payer Patient and `Consent.organization` to the requesting payer's Organization (FHIR shape is `0..*`; today exactly one element is written). The persisted Consent is what the later `$davinci-data-export?exportType=payertopayer` query reads against. If persistence fails — including the case where the requesting payer's NPI has no `Organization` registered in the responding payer's Aidbox — the member is re-bucketed to `ConsentConstrainedMembers`.

**Stale Consent deactivation.** If a later `$bulk-member-match` for the same `(matched-patient, requesting-payer)` lands the member in `ConsentConstrainedMembers` (failed match-time check, opt-out hit, or persistence failure), the prior persisted `Consent` at the deterministic id is flipped to `status = inactive`. The row is retained for audit, but `$davinci-data-export?exportType=payertopayer` will not honor it on subsequent reads.

## Group lifecycle

Output Groups carry no `period.end` and no TTL extension today. Until lifecycle management ships, `$bulk-member-match` output Groups remain `active = true` indefinitely; the only removal path is [`$bulk-member-match-cancel`](#cancellation) on a completed Task, which sweeps the Task and every resource referenced from `Task.output` (Groups, Binary, and persisted Consents).

## Errors

| Status | Where | Cause |
|---|---|---|
| 400 | Kick-off | `Prefer: respond-async` header missing |
| 403 | Kick-off | OAuth client carries no NPI identifier and no authenticated user session is present |
| 404 | Status / cancel / output | Unknown `<task-id>`, status `cancelled`, or caller NPI does not match `Task.requester.identifier` |
| 409 | Kick-off | Requesting payer NPI is registered on more than one `Organization` in the responding payer's directory; resolve duplicates and retry |
| 422 | Kick-off | Input `Parameters` failed `$validate` against the input profile; or, for admin sessions, `Coverage.payor[0]` could not be resolved to a registered `Organization` with a `us-npi` identifier |
| 500 | Kick-off | Failed to resolve requesting payer Organization (transient Aidbox read failure) |
| 500 | Status | Background processing failed; generic `OperationOutcome` returned (real cause in interop-app logs) |
| 500 | Kick-off / status / cancel | Upstream Aidbox read or write failed transiently |

Individual member failures (validation issues, exceptions while evaluating one member, Consent persistence failures) route to `NonMatchedMembers` or `ConsentConstrainedMembers` with a reason recorded in `Task` logs — they do not fail the batch.

After a `MatchedMembers` Group is returned, the requesting payer uses its id with [`$davinci-data-export?exportType=payertopayer`](davinci-data-export.md) to pull the matched members' clinical data. Architectural context lives in the [Payer-to-Payer](../../interop-apis/payer-to-payer.md) pillar.
