---
description: Da Vinci PDex $provider-member-match operation reference — async kick-off, status polling, ndjson output, cancellation.
---

# $provider-member-match

Matches a batch of provider-submitted members against payer-side Patients and produces up to three `Group` resources, defined by the [Da Vinci PDex IG](https://build.fhir.org/ig/HL7/davinci-epdx/) v2.2.0. The `MatchedMembers` Group id is the input to [`$davinci-data-export`](davinci-data-export.md) for the Provider Access bulk export.

The operation is **always asynchronous** and follows the [FHIR Bulk Data kick-off pattern](https://hl7.org/fhir/uv/bulkdata/export.html#bulk-data-kick-off-request): kick-off returns `202 Accepted` with `Content-Location`, the client polls the status URL, and downloads the result as a single-line ndjson `Parameters` resource.

## Test dataset

Request and Response examples on this page reference this dataset. Load it first to reproduce them.

Load from the Aidbox REST Console — the bundle goes through the normal FHIR write path so AccessPolicies and Clients become active immediately:

<details>

<summary>Click to view test dataset bundle JSON</summary>

```http
POST /fhir
Content-Type: application/fhir+json

{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "request": {"method": "PUT", "url": "/Client/test-payer-client"},
      "resource": {
        "resourceType": "Client",
        "id": "test-payer-client",
        "secret": "test-payer-secret",
        "grant_types": ["basic"],
        "details": {"identifier": [{"system": "http://hl7.org/fhir/sid/us-npi", "value": "5555555555"}]}
      }
    },
    {
      "request": {"method": "PUT", "url": "/Client/test-provider-client"},
      "resource": {
        "resourceType": "Client",
        "id": "test-provider-client",
        "secret": "test-provider-secret",
        "grant_types": ["basic"],
        "details": {"identifier": [{"system": "http://hl7.org/fhir/sid/us-npi", "value": "1982947230"}]}
      }
    },
    {
      "request": {"method": "PUT", "url": "/AccessPolicy/allow-test-payer-client"},
      "resource": {
        "resourceType": "AccessPolicy",
        "id": "allow-test-payer-client",
        "engine": "allow",
        "link": [{"resourceType": "Client", "id": "test-payer-client"}]
      }
    },
    {
      "request": {"method": "PUT", "url": "/AccessPolicy/allow-test-provider-client"},
      "resource": {
        "resourceType": "AccessPolicy",
        "id": "allow-test-provider-client",
        "engine": "allow",
        "link": [{"resourceType": "Client", "id": "test-provider-client"}]
      }
    },
    {
      "request": {"method": "PUT", "url": "/Organization/test-payer-001"},
      "resource": {
        "resourceType": "Organization",
        "id": "test-payer-001",
        "name": "Test Payer Organization",
        "identifier": [{"system": "http://hl7.org/fhir/sid/us-npi", "value": "5555555555"}]
      }
    },
    {
      "request": {"method": "PUT", "url": "/Organization/test-provider-001"},
      "resource": {
        "resourceType": "Organization",
        "id": "test-provider-001",
        "name": "Test Provider Organization",
        "identifier": [{"system": "http://hl7.org/fhir/sid/us-npi", "value": "1982947230"}]
      }
    },
    {
      "request": {"method": "PUT", "url": "/Organization/other-payer-001"},
      "resource": {
        "resourceType": "Organization",
        "id": "other-payer-001",
        "name": "Other Payer (not the requester)",
        "identifier": [{"system": "http://hl7.org/fhir/sid/us-npi", "value": "9999999999"}]
      }
    },
    {
      "request": {"method": "PUT", "url": "/Patient/test-member-001"},
      "resource": {
        "resourceType": "Patient",
        "id": "test-member-001",
        "name": [{"family": "Johnson", "given": ["Robert"]}],
        "gender": "male",
        "birthDate": "1952-07-25",
        "identifier": [{"system": "http://example.org/member-id", "value": "M12345"}]
      }
    },
    {
      "request": {"method": "PUT", "url": "/Patient/test-member-002"},
      "resource": {
        "resourceType": "Patient",
        "id": "test-member-002",
        "name": [{"family": "Williams", "given": ["Sarah"]}],
        "gender": "female",
        "birthDate": "1985-03-12",
        "identifier": [{"system": "http://example.org/member-id", "value": "M67890"}]
      }
    },
    {
      "request": {"method": "PUT", "url": "/Coverage/test-coverage-001"},
      "resource": {
        "resourceType": "Coverage",
        "id": "test-coverage-001",
        "status": "active",
        "subscriberId": "SUB-001",
        "beneficiary": {"reference": "Patient/test-member-001"},
        "payor": [{"reference": "Organization/test-payer-001"}]
      }
    },
    {
      "request": {"method": "PUT", "url": "/Coverage/test-coverage-002"},
      "resource": {
        "resourceType": "Coverage",
        "id": "test-coverage-002",
        "status": "active",
        "subscriberId": "SUB-002",
        "beneficiary": {"reference": "Patient/test-member-002"},
        "payor": [{"reference": "Organization/test-payer-001"}]
      }
    },
    {
      "request": {"method": "PUT", "url": "/Consent/test-optout-member-002"},
      "resource": {
        "resourceType": "Consent",
        "id": "test-optout-member-002",
        "status": "active",
        "scope": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/consentscope", "code": "patient-privacy"}]},
        "patient": {"reference": "Patient/test-member-002"},
        "category": [{"coding": [{"system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose", "code": "provider-access"}]}],
        "provision": {"type": "deny"},
        "policyRule": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "OPTIN"}]}
      }
    }
  ]
}
```

</details>

## Auth

SMART Backend Services. See [Authentication](../authentication.md).

## Kick-off

### Endpoint

```
POST <base>/fhir/Group/$provider-member-match
```

`Prefer: respond-async` is required. Requests without it are rejected with `400`.

### Parameters

The request body is a `Parameters` resource with one or more `MemberBundle` entries, validated against the [`provider-parameters-multi-member-match-bundle-in`](https://build.fhir.org/ig/HL7/davinci-epdx/StructureDefinition-provider-parameters-multi-member-match-bundle-in.html) profile.

| Direction | Parameter | Type | Cardinality | Description |
|---|---|---|---|---|
| IN | `MemberBundle` | part group | 1..* | One per submitted member; contains `MemberPatient`, `CoverageToMatch`, `Consent`, optional `CoverageToLink` |
| IN | `MemberBundle.MemberPatient` | Patient | 1..1 | [HRex Patient Demographics](https://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-patient-demographics) — `family`, `given[0]`, `birthDate`, `gender` are all required for matching |
| IN | `MemberBundle.CoverageToMatch` | Coverage | 1..1 | [HRex Coverage](https://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-coverage); `subscriberId` and `payor[0].reference` are read by the matcher |
| IN | `MemberBundle.Consent` | Consent | 1..1 | [Provider Treatment Relationship Consent](https://build.fhir.org/ig/HL7/davinci-epdx/StructureDefinition-provider-treatment-relationship-consent.html); attestation accepted when `status = "active"` |
| IN | `MemberBundle.CoverageToLink` | Coverage | 0..1 | HRex Coverage |
| OUT (kick-off) | — | — | — | `202 Accepted` with `Content-Location` header pointing at the status URL |

### Example

{% tabs %}
{% tab title="Request" %}
```http
POST /fhir/Group/$provider-member-match
Authorization: Basic dGVzdC1wcm92aWRlci1jbGllbnQ6dGVzdC1wcm92aWRlci1zZWNyZXQ=
Content-Type: application/fhir+json
Prefer: respond-async

{
  "resourceType": "Parameters",
  "parameter": [
    {
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
          "scope": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/consentscope", "code": "treatment"}]},
          "category": [
            {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "IDSCL"}]},
            {"coding": [{"system": "http://loinc.org", "code": "64292-6"}]}
          ],
          "patient": {"reference": "Patient/test-member-001"},
          "dateTime": "2026-01-15T10:00:00Z",
          "performer": [{"identifier": {"system": "http://hl7.org/fhir/sid/us-npi", "value": "1982947230"}, "display": "Test Provider"}],
          "policyRule": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "OPTIN"}]}
        }}
      ]
    },
    {
      "name": "MemberBundle",
      "part": [
        {"name": "MemberPatient", "resource": {
          "resourceType": "Patient",
          "name": [{"family": "Williams", "given": ["Sarah"]}],
          "gender": "female", "birthDate": "1985-03-12"
        }},
        {"name": "CoverageToMatch", "resource": {
          "resourceType": "Coverage", "status": "active",
          "subscriberId": "SUB-002",
          "beneficiary": {"reference": "Patient/test-member-002"},
          "payor": [{"reference": "Organization/test-payer-001"}]
        }},
        {"name": "Consent", "resource": {
          "resourceType": "Consent", "status": "active",
          "scope": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/consentscope", "code": "treatment"}]},
          "category": [
            {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "IDSCL"}]},
            {"coding": [{"system": "http://loinc.org", "code": "64292-6"}]}
          ],
          "patient": {"reference": "Patient/test-member-002"},
          "dateTime": "2026-01-15T10:00:00Z",
          "performer": [{"identifier": {"system": "http://hl7.org/fhir/sid/us-npi", "value": "1982947230"}, "display": "Test Provider"}],
          "policyRule": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "OPTIN"}]}
        }}
      ]
    },
    {
      "name": "MemberBundle",
      "part": [
        {"name": "MemberPatient", "resource": {
          "resourceType": "Patient",
          "name": [{"family": "Unknown", "given": ["Nobody"]}],
          "gender": "male", "birthDate": "2000-01-01"
        }},
        {"name": "CoverageToMatch", "resource": {
          "resourceType": "Coverage", "status": "active",
          "subscriberId": "SUB-999",
          "beneficiary": {"reference": "Patient/test-member-001"},
          "payor": [{"reference": "Organization/test-payer-001"}]
        }},
        {"name": "Consent", "resource": {
          "resourceType": "Consent", "status": "active",
          "scope": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/consentscope", "code": "treatment"}]},
          "category": [
            {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "IDSCL"}]},
            {"coding": [{"system": "http://loinc.org", "code": "64292-6"}]}
          ],
          "patient": {"reference": "Patient/test-member-001"},
          "dateTime": "2026-01-15T10:00:00Z",
          "performer": [{"identifier": {"system": "http://hl7.org/fhir/sid/us-npi", "value": "1982947230"}, "display": "Test Provider"}],
          "policyRule": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "OPTIN"}]}
        }}
      ]
    }
  ]
}
```

Three submitted MemberBundles drive the three output buckets:

- **Johnson** → demographics match `Patient/test-member-001`; no opt-out → `MatchedMembers`
- **Williams** → demographics match `Patient/test-member-002`; active opt-out `Consent/test-optout-member-002` → `ConsentConstrainedMembers`
- **Unknown** → demographics do not match any seeded Patient → `NonMatchedMembers`

{% endtab %}
{% tab title="Response (accepted)" %}
```http
HTTP/1.1 202 Accepted
Content-Location: <base>/fhir/Group/$provider-member-match-status/<task-id>
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
GET <base>/fhir/Group/$provider-member-match-status/<task-id>
```

`<task-id>` is the id at the end of the `Content-Location` from kick-off. Calls from a client other than the originating requester get `404` (cross-tenant guard).

### Parameters

Response shape depends on the underlying `Task` status:

| Task status | HTTP | Headers | Body |
|---|---|---|---|
| `requested` | 202 | `Retry-After: 5` | — |
| `in-progress` | 202 | `Retry-After: 5`, `X-Progress: Processing members` | — |
| `completed` | 200 | `Content-Type: application/json` | Bulk Data manifest |
| `failed` | 500 | — | `OperationOutcome` |
| `cancelled` / not found | 404 | — | `OperationOutcome` |

### Example

{% tabs %}
{% tab title="Request" %}
```http
GET /fhir/Group/$provider-member-match-status/<task-id>
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
  "transactionTime": "2026-04-20T12:34:56Z",
  "request": "<base>/fhir/Group/$provider-member-match",
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

URL comes from `output[0].url` in the manifest. Body is a single ndjson line — a `Parameters` resource conforming to the [`provider-parameters-multi-member-match-bundle-out`](https://build.fhir.org/ig/HL7/davinci-epdx/StructureDefinition-provider-parameters-multi-member-match-bundle-out.html) profile, with each non-empty bucket as one inline `Group`. Empty buckets are omitted.

### Parameters

| Direction | Parameter | Type | Cardinality | Description |
|---|---|---|---|---|
| OUT | `MatchedMembers` | Group | 0..1 | [`pdex-treatment-relationship`](https://build.fhir.org/ig/HL7/davinci-epdx/StructureDefinition-pdex-treatment-relationship.html); members matched, attestation valid, no opt-out. Group id is the input to `$davinci-data-export`. |
| OUT | `NonMatchedMembers` | Group | 0..1 | [`pdex-member-no-match-group`](https://build.fhir.org/ig/HL7/davinci-epdx/StructureDefinition-pdex-member-no-match-group.html); no match, ambiguous match, or invalid attestation. Submitted Patients are carried in `Group.contained[]` (fragment refs `#1`, `#2`, …). |
| OUT | `ConsentConstrainedMembers` | Group | 0..1 | [`pdex-member-opt-out`](https://build.fhir.org/ig/HL7/davinci-epdx/StructureDefinition-pdex-member-opt-out.html); matched member with an active opt-out `Consent`. |

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
  "meta": {"profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/provider-parameters-multi-member-match-bundle-out"]},
  "parameter": [
    {
      "name": "MatchedMembers",
      "resource": {
        "resourceType": "Group",
        "id": "<task-id>-matched",
        "meta": {"profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-treatment-relationship"]},
        "active": true, "type": "person", "actual": true,
        "code": {"coding": [{"system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/PdexMultiMemberMatchResultCS", "code": "match"}]},
        "identifier": [{"system": "http://hl7.org/fhir/sid/us-npi", "value": "1982947230"}],
        "managingEntity": {"identifier": {"system": "http://hl7.org/fhir/sid/us-npi", "value": "5555555555"}, "display": "Payer Organization"},
        "characteristic": [{
          "code": {"coding": [{"system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/PdexMultiMemberMatchResultCS", "code": "match"}]},
          "valueReference": {"identifier": {"system": "http://hl7.org/fhir/sid/us-npi", "value": "1982947230"}, "display": "Provider Organization"},
          "exclude": false,
          "period": {"start": "2026-05-28", "end": "2026-06-27"}
        }],
        "quantity": 1,
        "member": [{"entity": {"reference": "Patient/test-member-001", "display": "Johnson, Robert"}, "inactive": false}]
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
          "exclude": false,
          "period": {"start": "2026-05-28", "end": "2026-06-27"}
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
    },
    {
      "name": "ConsentConstrainedMembers",
      "resource": {
        "resourceType": "Group",
        "id": "<task-id>-consent",
        "meta": {"profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-member-opt-out"]},
        "active": true, "type": "person", "actual": true,
        "code": {"coding": [{"system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/PdexMultiMemberMatchResultCS", "code": "consentconstraint"}]},
        "managingEntity": {"identifier": {"system": "http://hl7.org/fhir/sid/us-npi", "value": "5555555555"}, "display": "Payer Organization"},
        "characteristic": [{
          "code": {"coding": [{"system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/PdexMultiMemberMatchResultCS", "code": "consentconstraint"}]},
          "valueCodeableConcept": {"coding": [{"system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/opt-out-scope", "code": "provider-specific"}]},
          "exclude": false,
          "period": {"start": "2026-05-28", "end": "2026-06-27"}
        }],
        "quantity": 1,
        "member": [{"entity": {"reference": "Patient/test-member-002", "display": "Williams, Sarah"}, "inactive": false}]
      }
    }
  ]
}
```
{% endtab %}
{% endtabs %}

`managingEntity.identifier` is the payer's NPI, resolved from the first member's `Coverage.payor[0]` Organization; falls back to `"unknown"` if the Organization is missing or has no NPI. `characteristic[].period` is a 30-day validity window — `start = today`, `end = today + 30 days`.

## Cancellation

### Endpoint

```
DELETE <base>/fhir/Group/$provider-member-match-cancel/<task-id>
```

A custom URL is used (rather than `DELETE` on the status URL) because Aidbox operation dispatch is keyed on method + URL. Cross-tenant calls return `404`.

### Parameters

Behaviour depends on the current `Task` status:

| Task status | Action | Response |
|---|---|---|
| `requested` / `in-progress` | Set `Task.status = "cancelled"`. The background worker stops at its next checkpoint (per-member loop + pre-persist) without writing Groups or the Binary. | `202 Accepted` |
| `completed` / `failed` / `cancelled` | Delete the `Task` and every resource referenced from `Task.output` (Groups, Binary). | `202 Accepted` |
| not found | — | `404` with `OperationOutcome` |

### Example

{% tabs %}
{% tab title="Request" %}
```http
DELETE /fhir/Group/$provider-member-match-cancel/<task-id>
```
{% endtab %}
{% tab title="Response" %}
```http
HTTP/1.1 202 Accepted
```
{% endtab %}
{% endtabs %}

## Matching behavior

Each submitted member is evaluated independently and lands in exactly one bucket. Per-member failures never fail the batch — problematic members are routed to `NonMatchedMembers`.

**Demographic match.** All four fields are required on the submitted Patient and queried against payer Patients:

| Field | Search behaviour |
|---|---|
| `Patient.name[0].family` | FHIR `family` (case-insensitive exact) |
| `Patient.name[0].given[0]` | FHIR `given` (case-insensitive exact) |
| `Patient.birthDate` | FHIR `birthdate` exact |
| `Patient.gender` | FHIR `gender` exact |

If `Patient.identifier` entries are present they are added as `identifier` search tokens (`system|value` or bare `value`). If `Coverage.subscriberId` is present the query also requires `_has:Coverage:beneficiary:subscriber-id=<subscriberId>`.

A member is **unmatched** when the search returns zero entries **or** more than one (ambiguous matches are rejected conservatively). Missing any required demographic field also routes to `NonMatchedMembers`.

**Treatment attestation.** Accepted when the `Consent` part is present and `Consent.status = "active"`. There is no deeper verification of the attestation claim itself.

**Opt-out check.** After a successful match, an Aidbox search runs against the matched Patient (the opt-out category code uses the `pdex-consent-api-purpose` CodeSystem from PDex 2.2.0):

```http
GET /fhir/Consent
  ?patient=<matched-patient-id>
  &status=active
  &category=http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose|provider-access
  &provision-type=deny
```

Any matching `Consent` constrains the member to `ConsentConstrainedMembers`. Revocations (`provision.type = "permit"`) do not surface in the query and therefore do not block. If the opt-out query itself fails (non-2xx), the member fails safe to `ConsentConstrainedMembers`.

## Group lifecycle

Each output Group carries a 30-day validity window in `Group.characteristic[0].period`. A background job inside the interop app runs hourly:

1. Groups whose `period.end` is in the past and whose `active = true` are flipped to `active = false`.
2. Groups with `active = false` whose `period.end` is more than 90 days in the past are hard-deleted along with the Task and Binary they belong to.

The scan filters on `_profile=<pdex-treatment-relationship,pdex-member-no-match-group,pdex-member-opt-out>` — non-PDex Groups in the same Aidbox instance are left alone.

## Errors

| Status | Where | Cause |
|---|---|---|
| 400 | Kick-off | `Prefer: respond-async` header missing |
| 404 | Status / cancel / output | Unknown `<task-id>`, status `cancelled`, or caller is not the originating requester |
| 422 | Kick-off | Input `Parameters` failed `$validate` against the input profile |
| 500 | Status | Background processing failed; generic `OperationOutcome` returned (real cause in interop-app logs) |
| 500 | Kick-off / status / cancel | Upstream Aidbox read or write failed transiently |

Individual member failures (validation issues, exceptions while evaluating one member) route to `NonMatchedMembers` with a reason recorded in `Task` logs — they do not fail the batch.

After a `MatchedMembers` Group is returned, the provider uses its id with [`$davinci-data-export`](davinci-data-export.md) to pull the matched patients' clinical data. Architectural context lives in the [Provider Access API](../../interop-apis/provider-access.md) pillar.
