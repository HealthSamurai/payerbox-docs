---
description: Da Vinci PDex $davinci-data-export operation reference — async bulk export of member data scoped to a Group.
---

# $davinci-data-export

Exports clinical, claims, encounter, and prior-authorization data for the members of a `Group` as ndjson, defined by the [Da Vinci ATR IG](http://hl7.org/fhir/us/davinci-atr/) and referenced by the [Da Vinci PDex IG](https://build.fhir.org/ig/HL7/davinci-epdx/). It is the bulk entry point for both [Provider Access](../../interop-apis/provider-access.md) (Group produced by [`$provider-member-match`](provider-member-match.md)) and [Payer-to-Payer](../../interop-apis/payer-to-payer.md) (Group produced by [`$bulk-member-match`](bulk-member-match.md)).

The operation is **always asynchronous** and follows the [FHIR Bulk Data export pattern](https://hl7.org/fhir/uv/bulkdata/export.html): kick-off returns `202 Accepted` with `Content-Location`, the client polls the status URL, and downloads each ndjson file referenced in the completed manifest.

`exportType` selects the PDex scenario the request runs under and governs consent rules and data scope per the IG (see [`exportType` values](#exporttype-values)). The kick-off endpoint is owned by Payerbox's interop app; status polling, output download, and cancellation are served by Aidbox at its standard Bulk Data Export URLs (`$export-status`, signed output URLs).

## Auth

SMART Backend Services and Client Credentials. The caller's OAuth client must be allowed to read the Group and the resource types referenced by `_type` (and their referenced resources, since Aidbox `$export` chases references). See [Authentication](../authentication.md).

## Kick-off

### Endpoint

```
POST <base>/fhir/Group/<group-id>/$davinci-data-export
```

`<group-id>` is the id of a Group resource — typically `MatchedMembers` from `$provider-member-match` or `$bulk-member-match`. `Prefer: respond-async` is required. Requests without it are rejected with `400`.

### Parameters

The request body must be a FHIR `Parameters` resource. Unsupported parameter names are rejected with `400`. Aidbox's `$export` also validates the body against its `BulkExportProfile` and returns `422` on shape errors (for example, an empty `parameter[]`).

<table>
<thead>
<tr><th>Dir.</th><th width="150">Parameter</th><th width="190">Type</th><th>Card.</th><th>Description</th></tr>
</thead>
<tbody>
<tr><td>IN</td><td><code>exportType</code></td><td>canonical (<code>valueCanonical</code>)</td><td>0..1</td><td>One of <code>hl7.fhir.us.davinci-pdex#provider-download</code>, <code>hl7.fhir.us.davinci-pdex#provider-delta</code>, <code>hl7.fhir.us.davinci-pdex#provider-snapshot</code>, <code>hl7.fhir.us.davinci-pdex#payertopayer</code>. Selects the PDex scenario (consent rule + data scope) — see <a href="#exporttype-values"><code>exportType</code> values</a>.</td></tr>
<tr><td>IN</td><td><code>_since</code></td><td>instant (<code>valueInstant</code>)</td><td>0..1</td><td>Only resources updated since this time. <strong>Required</strong> when <code>exportType = hl7.fhir.us.davinci-pdex#provider-delta</code>.</td></tr>
<tr><td>IN</td><td><code>_until</code></td><td>instant (<code>valueInstant</code>)</td><td>0..1</td><td>Only resources updated up to this time.</td></tr>
<tr><td>IN</td><td><code>_type</code></td><td>string (<code>valueString</code>)</td><td>0..1</td><td>Comma-separated FHIR resource types to include (e.g. <code>Patient,Coverage,ExplanationOfBenefit</code>).</td></tr>
<tr><td>IN</td><td><code>_typeFilter</code></td><td>string (<code>valueString</code>)</td><td>0..*</td><td>Per-type FHIR search expression (e.g. <code>Observation?category=laboratory</code>).</td></tr>
<tr><td>IN</td><td><code>_outputFormat</code></td><td>string (<code>valueString</code>)</td><td>0..1</td><td>Output format. <code>application/fhir+ndjson</code> is the default and only value supported in PDex 2.1.0.</td></tr>
<tr><td>IN</td><td><code>patient</code></td><td>reference (<code>valueReference</code>)</td><td>0..*</td><td>Narrow the export to specific Patients.</td></tr>
<tr><td>OUT</td><td>—</td><td>—</td><td>—</td><td><code>202 Accepted</code> with <code>Content-Location</code> pointing at the Aidbox status URL.</td></tr>
</tbody>
</table>

### Example

{% tabs %}
{% tab title="Request" %}
```http
POST /fhir/Group/<group-id>/$davinci-data-export
Content-Type: application/fhir+json
Prefer: respond-async

{
  "resourceType": "Parameters",
  "parameter": [
    {"name": "exportType", "valueCanonical": "hl7.fhir.us.davinci-pdex#payertopayer"},
    {"name": "_type",      "valueString":    "Patient,Coverage,ExplanationOfBenefit,Condition,Observation,MedicationRequest"},
    {"name": "_since",     "valueInstant":   "2021-01-01T00:00:00Z"}
  ]
}
```
{% endtab %}
{% tab title="Response (accepted)" %}
```http
HTTP/1.1 202 Accepted
Content-Location: <base>/fhir/$export-status/<job-id>
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
{% tab title="Response (bad body)" %}
```http
HTTP/1.1 400 Bad Request
Content-Type: application/fhir+json
```

Interop returns one of these diagnostics:

- `Request body must be a FHIR Parameters resource`
- `Unsupported parameter(s): <name>`
- `Parameter exportType must appear at most once`
- `Parameter exportType must use valueCanonical`
- `Unsupported exportType: <value>`
- `exportType provider-delta requires _since`
{% endtab %}
{% tab title="Response (group not found)" %}
```http
HTTP/1.1 404 Not Found
Content-Type: application/fhir+json

{
  "resourceType": "OperationOutcome",
  "id": "not-found",
  "issue": [{
    "severity": "fatal",
    "code": "not-found",
    "diagnostics": "Resource Group/<id> not found"
  }]
}
```
{% endtab %}
{% endtabs %}

## Status polling

### Endpoint

```
GET <base>/fhir/$export-status/<job-id>
```

Served by Aidbox per the [FHIR Bulk Data status spec](https://hl7.org/fhir/uv/bulkdata/export.html#bulk-data-status-request). `<job-id>` is the id at the end of the `Content-Location` from kick-off.

### Parameters

| Job state | HTTP | Headers | Body |
|---|---|---|---|
| in progress | 202 | `X-Progress`, `Retry-After` | — |
| completed | 200 | `Content-Type: application/json` | [Bulk Data manifest](https://hl7.org/fhir/uv/bulkdata/export.html#response---complete-status) |
| failed | 500 | — | `BulkExportStatus` resource carrying `status="error"` and an `extension[BulkExportStatus.internal-error]` |
| not found / expired | 404 | — | `OperationOutcome` |

### Example

{% tabs %}
{% tab title="Request" %}
```http
GET /fhir/$export-status/<job-id>
```
{% endtab %}
{% tab title="Response (in progress)" %}
```http
HTTP/1.1 202 Accepted
X-Progress: in-progress
Retry-After: 30
```
{% endtab %}
{% tab title="Response (completed)" %}
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "transactionTime": "2026-05-15T13:40:00Z",
  "request": "<base>/fhir/Group/<group-id>/$export",
  "requiresAccessToken": true,
  "output": [
    {"type": "Patient",              "url": "<signed-url>/patient.ndjson"},
    {"type": "Coverage",             "url": "<signed-url>/coverage.ndjson"},
    {"type": "ExplanationOfBenefit", "url": "<signed-url>/eob.ndjson"}
  ],
  "error": [],
  "deleted": []
}
```
{% endtab %}
{% tab title="Response (failed)" %}
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "resourceType": "BulkExportStatus",
  "id": "<job-id>",
  "status": "error",
  "request": "<base>/fhir/Group/<group-id>/$export",
  "extension": [{
    "url": "urn:url:extension:BulkExportStatus.internal-error",
    "valueString": "<reason>"
  }]
}
```
{% endtab %}
{% endtabs %}

## Output download

### Endpoint

Each entry in the completed manifest's `output[].url` is a pre-signed URL pointing at the object-store bucket Aidbox is configured to use (S3, MinIO, etc.). Fetch them directly:

```
GET <output-url>
Authorization: Bearer <token>      # only if `requiresAccessToken: true`
Accept: application/fhir+ndjson
```

Each file is newline-delimited JSON — one FHIR resource per line. Stream-parse line by line.

### Example

{% tabs %}
{% tab title="Request" %}
```http
GET <signed-url>/patient.ndjson
Accept: application/fhir+ndjson
```
{% endtab %}
{% tab title="Response" %}
```http
HTTP/1.1 200 OK
Content-Type: application/fhir+ndjson
```

Body (one resource per line):

```
{"resourceType":"Patient","id":"patient-1","name":[{"family":"Smith","given":["John"]}],"gender":"male","birthDate":"1970-05-15"}
{"resourceType":"Patient","id":"patient-2","name":[{"family":"Doe","given":["Jane"]}],"gender":"female","birthDate":"1985-03-12"}
```
{% endtab %}
{% endtabs %}

## Cancellation

### Endpoint

```
DELETE <base>/fhir/$export-status/<job-id>
```

Served by Aidbox per the [FHIR Bulk Data cancel spec](https://hl7.org/fhir/uv/bulkdata/export.html#bulk-data-delete-request). Returns `202 Accepted` for a known job (running or terminal) and `404` for an unknown id.

### Example

{% tabs %}
{% tab title="Request" %}
```http
DELETE /fhir/$export-status/<job-id>
```
{% endtab %}
{% tab title="Response" %}
```http
HTTP/1.1 202 Accepted
```
{% endtab %}
{% endtabs %}

## exportType values

| Value | Used by | Consent rule | Data scope |
|---|---|---|---|
| `hl7.fhir.us.davinci-pdex#provider-download` | Provider Access | Member opt-out applies | Full set of resources for each member in the Group |
| `hl7.fhir.us.davinci-pdex#provider-delta` | Provider Access | Member opt-out applies | Only resources updated since `_since` (`_since` is required) |
| `hl7.fhir.us.davinci-pdex#provider-snapshot` | Provider Access | Member opt-out applies | Point-in-time snapshot of each member's record |
| `hl7.fhir.us.davinci-pdex#payertopayer` | Payer-to-Payer | Active opt-in `Consent` asserted at `$bulk-member-match` time | Five-year window; excludes drug PAs, denied PAs, provider remittances, and enrollee cost-sharing |

## Errors

| Status | Where | Cause |
|---|---|---|
| 400 | Kick-off (interop) | `Prefer: respond-async` missing; body not `Parameters`; unsupported parameter; unsupported `exportType`; `exportType` not using `valueCanonical`; `provider-delta` without `_since` |
| 404 | Kick-off (Aidbox) | `Group/<id>` not found |
| 404 | Status / cancel (Aidbox) | Unknown `<job-id>` or job expired |
| 422 | Kick-off (Aidbox) | Body fails `BulkExportProfile` validation (for example empty `parameter[]`) |
| 500 | Status (Aidbox) | Background export failed — see `BulkExportStatus.extension[BulkExportStatus.internal-error]` |

For architectural context see the [Provider Access](../../interop-apis/provider-access.md) and [Payer-to-Payer](../../interop-apis/payer-to-payer.md) pillars.
