# $davinci-data-export

Operation defined by [Da Vinci PDex STU 2.1.0](https://hl7.org/fhir/us/davinci-pdex/STU2.1/OperationDefinition-davinci-data-export.html) for bulk export of member data. Extends the FHIR [Bulk Data `$export`](https://hl7.org/fhir/uv/bulkdata/STU2/export.html) with an `exportType` parameter that controls consent rules and data scope.

Used by Provider Access and Payer-to-Payer to pull data for a Group of members produced by [`$provider-member-match`](provider-member-match.md) or [`$bulk-member-match`](bulk-member-match.md).

## Endpoint

```
POST <base>/fhir/Group/<group-id>/$davinci-data-export
```

The Group is the cohort of members; `$davinci-data-export` exports their resources.

## Auth

SMART Backend Services. Scope depends on `exportType`:

| `exportType` | Required scope |
|---|---|
| `provider-download` | `system/*.read` |
| `provider-delta` | `system/*.read` |
| `payertopayer` | `system/*.read` |

See [Authentication](../authentication.md).

## Parameters

| Parameter | Type | Description |
|---|---|---|
| `exportType` | code | `provider-download` (full dump) / `provider-delta` (incremental) / `payertopayer` (P2P exchange) |
| `_since` | instant | Only resources updated since this time. Required for `provider-delta`. |
| `_type` | comma-separated codes | Limit to specific resource types (e.g., `Patient,Coverage,ExplanationOfBenefit`) |
| `_typeFilter` | string | Per-type search expression (e.g., `Observation?category=laboratory`) |
| `_outputFormat` | string | `application/fhir+ndjson` (default and only supported value in 2.1.0) |

## exportType values

| Value | Consent rule | Data scope |
|---|---|---|
| `provider-download` | Member opt-out applies | Full set of resources for each member in the Group |
| `provider-delta` | Member opt-out applies | Only resources updated since `_since` |
| `payertopayer` | Consent must be in the Group (asserted at `$bulk-member-match` time) | Five-year window; excludes drug PAs, denied PAs, provider remittances, enrollee cost-sharing |

## Request

```bash
POST <base>/fhir/Group/<group-id>/$davinci-data-export?exportType=provider-download
Authorization: Bearer <access-token>
Accept: application/fhir+json
Prefer: respond-async
```

Or with body:

```http
POST <base>/fhir/Group/<group-id>/$davinci-data-export
Authorization: Bearer <access-token>
Content-Type: application/fhir+json
Accept: application/fhir+json
Prefer: respond-async
```

```json
{
  "resourceType": "Parameters",
  "parameter": [
    { "name": "exportType", "valueCode": "payertopayer" },
    { "name": "_since", "valueInstant": "2024-01-01T00:00:00Z" },
    { "name": "_type", "valueString": "Patient,Coverage,ExplanationOfBenefit,Condition,Observation,MedicationRequest" }
  ]
}
```

## Response — kick-off

```http
HTTP/1.1 202 Accepted
Content-Location: <base>/fhir/$export-status/<job-id>
```

## Polling

```bash
GET <base>/fhir/$export-status/<job-id>
Authorization: Bearer <access-token>
```

### In progress

```http
HTTP/1.1 202 Accepted
X-Progress: "50% complete"
Retry-After: 30
```

### Complete

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "transactionTime": "2026-05-08T18:30:00Z",
  "request": "<base>/fhir/Group/<group-id>/$davinci-data-export?exportType=payertopayer",
  "requiresAccessToken": true,
  "output": [
    { "type": "Patient",       "url": "<base>/fhir/$export-output/<job-id>/patient.ndjson",       "count": 1234 },
    { "type": "Coverage",      "url": "<base>/fhir/$export-output/<job-id>/coverage.ndjson",      "count": 1234 },
    { "type": "ExplanationOfBenefit", "url": "<base>/fhir/$export-output/<job-id>/eob.ndjson",    "count": 89432 },
    { "type": "Observation",   "url": "<base>/fhir/$export-output/<job-id>/observation.ndjson",   "count": 254109 }
  ],
  "error": [],
  "deleted": []
}
```

### Output download

```bash
curl -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/fhir+ndjson" \
  <base>/fhir/$export-output/<job-id>/patient.ndjson
```

NDJSON: one FHIR resource per line. Stream-parse line-by-line.

## Cancellation

```bash
DELETE <base>/fhir/$export-status/<job-id>
Authorization: Bearer <access-token>
```

Returns `202 Accepted` and cancels the job.

## Errors

| HTTP | Cause |
|---|---|
| 400 | Invalid `exportType` or missing required parameter (e.g., `_since` for `provider-delta`) |
| 401 | Invalid token |
| 403 | Token scope insufficient; consent constraints not met for `payertopayer` |
| 404 | Group not found |
| 410 | Status URL expired (jobs are retained for a configurable window after completion) |
| 422 | Member match results not present in Group for `payertopayer` |

