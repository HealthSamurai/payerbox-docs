---
description: Summary of the base FHIR R4 RESTful API surface — CRUD, search, and history — exposed by Payerbox via Aidbox.
---

# FHIR RESTful API

Payerbox exposes the full base FHIR R4 RESTful API at `/fhir` — every interaction defined in the [FHIR HTTP spec](https://www.hl7.org/fhir/http.html) is available without per-resource configuration. This page is a summary of the surface; for full semantic detail, modifier reference, and edge-case behavior, see the Aidbox docs on REST API CRUD and FHIR Search.

The `/fhir` base uses FHIR-format resources. Aidbox also exposes a non-FHIR `/` base which uses Aidbox's native resource format — **use `/fhir` for any FHIR-conformant integration**.

## Endpoints

| Interaction | Method | URL |
|---|---|---|
| [Create](#create) | `POST` | `/fhir/<type>` |
| [Conditional create](#conditional-create) | `POST` | `/fhir/<type>?<search-params>` or `POST /fhir/<type>` + `If-None-Exist` |
| [Read](#read) | `GET` | `/fhir/<type>/<id>` |
| [vread](#vread) | `GET` | `/fhir/<type>/<id>/_history/<vid>` |
| [Update](#update) | `PUT` | `/fhir/<type>/<id>` |
| [Conditional update](#conditional-update) | `PUT` | `/fhir/<type>?<search-params>` |
| [Patch](#patch) | `PATCH` | `/fhir/<type>/<id>` |
| [Delete](#delete) | `DELETE` | `/fhir/<type>/<id>` |
| [Conditional delete](#conditional-delete) | `DELETE` | `/fhir/<type>?<search-params>` |
| [Search](#search) | `GET` | `/fhir/<type>?<search-params>` |
| [Transaction / batch](#transaction-and-batch) | `POST` | `/fhir/` |

## Auth

SMART Backend Services and Client Credentials. The caller's OAuth client must be allowed (via Aidbox access policies) to perform the interaction on the target resource type. Any interaction may return `403 Forbidden` if the client is not authorized. See [Authentication](../authentication.md).

## Create

### Endpoint

```
POST /fhir/<type>
```

### Response codes

| Status | Cause |
|---|---|
| 201 Created | Resource created; `Location`, `ETag`, `Last-Modified` headers set |
| 400 Bad Request | Body could not be parsed or failed basic FHIR validation |
| 409 Conflict | Resource with the given `id` already exists (Aidbox respects `id` in the body) |
| 422 Unprocessable Entity | Body violated profile rules or server business rules |

### Example

{% tabs %}
{% tab title="Request" %}
```http
POST /fhir/Patient
Content-Type: application/fhir+json

{
  "resourceType": "Patient",
  "name": [{"given": ["Bob"], "family": "Smith"}],
  "gender": "male",
  "birthDate": "1970-05-15"
}
```
{% endtab %}
{% tab title="Response" %}
```http
HTTP/1.1 201 Created
Location: /fhir/Patient/<id>/_history/1
ETag: W/"1"
Last-Modified: 2026-05-15T13:40:00Z

{
  "resourceType": "Patient",
  "id": "<id>",
  "name": [{"given": ["Bob"], "family": "Smith"}],
  "gender": "male",
  "birthDate": "1970-05-15",
  "meta": {"versionId": "1", "lastUpdated": "2026-05-15T13:40:00Z"}
}
```
{% endtab %}
{% endtabs %}

### Conditional create

```
POST /fhir/<type>?<search-params>
```

Or pass the search criteria in the `If-None-Exist` header. Outcome depends on the number of matches:

- **No matches** — server performs a normal `create` (201).
- **One match** — server returns the existing resource (200), no new resource is created.
- **Multiple matches** — `412 Precondition Failed`; the criteria were not selective enough.

The same `ifNoneExist` field is supported inside `Bundle.entry.request` for transaction bundles (case-sensitive — must be spelled exactly `ifNoneExist`).

## Read

### Endpoint

```
GET /fhir/<type>/<id>
```

### Response codes

| Status | Cause |
|---|---|
| 200 OK | Resource returned |
| 404 Not Found | No resource with the given `id` |
| 410 Gone | Resource was deleted |

### Example

{% tabs %}
{% tab title="Request" %}
```http
GET /fhir/Patient/<id>
```
{% endtab %}
{% tab title="Response" %}
```http
HTTP/1.1 200 OK
Content-Type: application/fhir+json

{
  "resourceType": "Patient",
  "id": "<id>",
  "name": [{"given": ["Bob"], "family": "Smith"}],
  "gender": "male",
  "birthDate": "1970-05-15",
  "meta": {"versionId": "1", "lastUpdated": "2026-05-15T13:40:00Z"}
}
```
{% endtab %}
{% endtabs %}

### vread

```
GET /fhir/<type>/<id>/_history/<vid>
```

Returns a specific version of the resource. `<vid>` is the `meta.versionId` value (typically a monotonically-increasing integer).

## Update

### Endpoint

```
PUT /fhir/<type>/<id>
```

Replaces the resource. If no resource exists at `<id>`, one is created (`upsert` semantics). The `id` cannot be changed once the resource exists.

### Response codes

| Status | Cause |
|---|---|
| 200 OK | Resource updated |
| 201 Created | Resource did not exist and was created |
| 412 Precondition Failed | `If-Match` `versionId` did not match the current version, or `If-Match: *` was sent and the resource does not exist |
| 422 Unprocessable Entity | Body violated profile rules or server business rules |

### Example

{% tabs %}
{% tab title="Request" %}
```http
PUT /fhir/Patient/<id>
Content-Type: application/fhir+json

{
  "resourceType": "Patient",
  "id": "<id>",
  "name": [{"given": ["Bob"], "family": "Smith"}],
  "gender": "male",
  "birthDate": "1970-05-15"
}
```
{% endtab %}
{% tab title="Response" %}
```http
HTTP/1.1 200 OK
Content-Type: application/fhir+json

{
  "resourceType": "Patient",
  "id": "<id>",
  "meta": {"versionId": "2", "lastUpdated": "2026-05-15T13:41:00Z"},
  "name": [{"given": ["Bob"], "family": "Smith"}],
  "gender": "male",
  "birthDate": "1970-05-15"
}
```
{% endtab %}
{% endtabs %}

### Conditional update

```
PUT /fhir/<type>?<search-params>
```

Outcome depends on the number of matches:

- **No matches** — server performs a `create`.
- **One match** — server performs the update against the matching resource (the `id` in the request body is ignored).
- **Multiple matches** — `412 Precondition Failed`.

### Versioned update (optimistic concurrency)

Send `If-Match: <versionId>` to require that the current `meta.versionId` matches. On mismatch the server returns `412 Precondition Failed` with an `OperationOutcome` (`code: conflict`).

Send `If-Match: *` to update-only (refuse to create if the resource does not exist) — returns `412` instead of creating.

## Patch

### Endpoint

```
PATCH /fhir/<type>/<id>
```

Three patch dialects are supported — pick by `Content-Type` (or by the `_method` query parameter):

| Dialect | Content-Type | `_method` | Body shape |
|---|---|---|---|
| Merge Patch ([RFC 7386](https://tools.ietf.org/html/rfc7386)) | `application/merge-patch+json` | `merge-patch` | JSON object with the fields to set / null out |
| JSON Patch ([RFC 6902](https://tools.ietf.org/html/rfc6902)) | `application/json-patch+json` | `json-patch` | JSON array of `{op, path, value}` operations |
| FHIRPath Patch | — | `fhirpath-patch` | `Parameters` resource with `operation` parts |

If the dialect is not specified, Aidbox infers it: `Parameters` resourceType → FHIRPath Patch; array body → JSON Patch; otherwise → Merge Patch.

A successful patch fires the same `update` event as `PUT`. No-op patches (replacing a field with its current value) return `200 OK` but do **not** fire an event.

### Example

{% tabs %}
{% tab title="Request (Merge Patch)" %}
```http
PATCH /fhir/Patient/<id>
Content-Type: application/merge-patch+json

{"active": false, "telecom": null}
```
{% endtab %}
{% tab title="Request (JSON Patch)" %}
```http
PATCH /fhir/Patient/<id>
Content-Type: application/json-patch+json

[
  {"op": "replace", "path": "/active", "value": false},
  {"op": "remove",  "path": "/telecom"}
]
```
{% endtab %}
{% tab title="Request (FHIRPath Patch)" %}
```http
PATCH /fhir/Patient/<id>
Content-Type: application/fhir+json

{
  "resourceType": "Parameters",
  "parameter": [{
    "name": "operation",
    "part": [
      {"name": "type",  "valueCode":   "replace"},
      {"name": "path",  "valueString": "Patient.active"},
      {"name": "value", "valueBoolean": false}
    ]
  }]
}
```
{% endtab %}
{% endtabs %}

## Delete

### Endpoint

```
DELETE /fhir/<type>/<id>
```

### Response codes

| Status | Cause |
|---|---|
| 200 OK | Resource deleted (body contains the deleted resource) |
| 204 No Content | Resource already deleted, did not exist, or `_no-content=true` was passed |
| 404 Not Found | Resource type not registered |
| 412 Precondition Failed | `If-Match` `versionId` did not match the current version |

A subsequent `GET /fhir/<type>/<id>` returns `410 Gone`.

### Example

{% tabs %}
{% tab title="Request" %}
```http
DELETE /fhir/Patient/<id>
```
{% endtab %}
{% tab title="Response" %}
```http
HTTP/1.1 200 OK
Content-Type: application/fhir+json

{
  "resourceType": "Patient",
  "id": "<id>",
  "meta": {"versionId": "3", "lastUpdated": "2026-05-15T13:42:00Z"},
  ...
}
```
{% endtab %}
{% endtabs %}

### Conditional delete

```
DELETE /fhir/<type>?<search-params>
```

- **No matches** — `204 No Content`.
- **One match** — server performs a normal `delete`.
- **Multiple matches** — `412 Precondition Failed` by default. To delete all matches, send `x-conditional-delete: remove-all`.

## Search

### Endpoint

```
GET /fhir/<type>?<param1>=<value1>&<param2>=<value2>&...
```

Returns a `Bundle` of `type: searchset` with the matched resources in `entry[].resource`, a `total` count, and `link[]` entries for pagination (`first` / `prev` / `self` / `next` / `last`).

### Search parameter types

Each search parameter has a type, declared on the `SearchParameter` resource, that drives matching semantics:

<table>
<thead>
<tr><th width="120">Type</th><th>Matching</th><th>Example</th></tr>
</thead>
<tbody>
<tr><td>string</td><td>Case-insensitive, accent-insensitive, starts-with by default</td><td><code>name=John</code></td></tr>
<tr><td>token</td><td>Exact match on a code or <code>system|code</code> pair</td><td><code>status=active</code>, <code>identifier=mysystem|123</code></td></tr>
<tr><td>reference</td><td>Match by reference target</td><td><code>subject=Patient/123</code></td></tr>
<tr><td>date</td><td>Range comparison with FHIR date prefixes (<code>eq</code>, <code>ne</code>, <code>lt</code>, <code>le</code>, <code>gt</code>, <code>ge</code>, <code>sa</code>, <code>eb</code>)</td><td><code>birthdate=ge2019-01-01</code></td></tr>
<tr><td>number</td><td>Numeric comparison; same prefixes as date</td><td><code>probability=gt0.8</code></td></tr>
<tr><td>quantity</td><td>Numeric value comparison only — unit specification not implemented</td><td><code>value-quantity=75.5</code></td></tr>
<tr><td>uri</td><td>Exact, case-sensitive URI match</td><td><code>url=http://example.com</code></td></tr>
<tr><td>composite</td><td>Two-or-more values joined by <code>$</code>; matches only when both values land on the same element</td><td><code>code-value-quantity=loinc|12907-2$1</code></td></tr>
<tr><td>special</td><td>Implementation-defined</td><td><code>_filter</code>, <code>_text</code>, <code>_content</code></td></tr>
</tbody>
</table>

### Modifiers

Append a modifier with a colon to refine the match (`<param>:<modifier>=<value>`):

| Modifier | Applies to | Description |
|---|---|---|
| `:missing` | all | Field absent (`true`) or present (`false`) |
| `:exact` | string | Exact string match (case- and accent-sensitive) |
| `:contains` / `:starts` / `:ends` | string | Substring / prefix / suffix |
| `:text` | all | Textual match against the field's text representation |
| `:not` | token, uri, reference | Negate the match |
| `:in` | token | Match within a `ValueSet` |
| `:of-type` | token | Match `identifier.type` codes |
| `:i` | token | Case-insensitive |
| `:identifier` | reference | Match `Reference.identifier` instead of `Reference.reference` |
| `:iterate` / `:recurse` | `_include`, `_revinclude` | Follow references recursively |

### Common parameters

| Parameter | Effect |
|---|---|
| `_id` | Match by resource id |
| `_lastUpdated` | Match by `meta.lastUpdated` (supports date prefixes) |
| `_profile` | Match by `meta.profile` |
| `_elements` | Return only the listed top-level fields (comma-separated, prefix `-` to exclude) |
| `_count` | Page size (default page) |
| `_page` | Page number (1-based) |
| `_total` | `none` / `estimate` / `accurate` — control the total count strategy |
| `_sort` | Sort key(s); prefix `-` for descending |
| `_include` | Include resources referenced from the matches |
| `_revinclude` | Include resources that reference the matches |
| `_filter` | Boolean expression for OR across different parameters |
| `_text` / `_content` | Full-text search over narrative / resource body |

### _include and _revinclude

```
_include=<source-type>:<search-param>[:<target-type>]
_revinclude=<source-type>:<search-param>[:<target-type>]
```

Append `:iterate` to follow the reference chain recursively.

```http
GET /fhir/Patient?_include=Patient:organization
GET /fhir/Organization?_revinclude=Patient:organization
GET /fhir/Observation?_include=Observation:patient&_include:iterate=Patient:link
```

### Chaining

Filter by a property of a referenced resource:

```http
GET /fhir/Patient?general-practitioner:Practitioner.name=Oz
GET /fhir/Practitioner?_has:Patient:general-practitioner:gender=male
```

- Forward chain — `<reference-param>:<target-type>.<terminal>`
- Reverse chain (`_has`) — `_has:<source-type>:<reference-param>:<terminal>`

Chains of any length are supported; mix forward and reverse with `.` and `:` joins.

### Example

{% tabs %}
{% tab title="Request" %}
```http
GET /fhir/Patient?name=Smith&gender=male&_count=2&_include=Patient:general-practitioner
```
{% endtab %}
{% tab title="Response" %}
```http
HTTP/1.1 200 OK
Content-Type: application/fhir+json

{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 1,
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "<id>",
        "name": [{"family": "Smith", "given": ["John"]}],
        "gender": "male"
      },
      "search": {"mode": "match"}
    }
  ],
  "link": [
    {"relation": "self", "url": "/fhir/Patient?name=Smith&gender=male&_count=2&_page=1"}
  ]
}
```
{% endtab %}
{% endtabs %}

## Transaction and batch

```
POST /fhir/
```

Submit a `Bundle` of `type: transaction` (all-or-nothing) or `type: batch` (per-entry, independent failures). Each `entry.request` carries an HTTP method and URL — the server applies the entries and returns a `Bundle` of `type: transaction-response` / `batch-response` with the per-entry outcomes and resolved references.

## Errors

| Status | Cause |
|---|---|
| 400 | Body parse failure or malformed search expression |
| 401 | Missing or invalid token |
| 403 | OAuth client not authorized to perform the interaction on this resource type |
| 404 | Resource type unknown, or instance not found |
| 409 | `id` already exists (create only) |
| 410 | Resource was deleted |
| 412 | Conditional precondition failed — `If-Match` mismatch, conditional create / update / delete with multiple matches |
| 422 | FHIR-profile or business-rule validation failure |
| 500 | Server-side error |

All `4xx` and `5xx` responses carry an `OperationOutcome` body describing the failure.

For full semantic detail — additional modifiers, advanced `_filter` operators, custom `SearchParameter` registration, AidboxQuery / Search resource / dot-expressions as alternatives to FHIR Search — see the Aidbox REST API docs. For Payerbox-specific operations layered on top of this base API, see the [Operations](README.md) index.
