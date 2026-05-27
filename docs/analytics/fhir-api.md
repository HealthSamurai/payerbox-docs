---
description: Counts and slices on Payerbox's prior-auth data through the FHIR API - anatomy of a request, the headline query patterns, modifiers.
---

# Counts and aggregates via FHIR API

Every query is a `GET` to `/fhir/<ResourceType>`, every filter is a
[SearchParameter](https://www.health-samurai.io/docs/aidbox/api/rest-api/fhir-search/searchparameter),
and the response is a [`Bundle`](https://www.health-samurai.io/docs/aidbox/api/rest-api/bundle)
of type `searchset` - matched resources plus pagination links.

Examples below use `ExplanationOfBenefit` (EOB) - for prior auth,
the [PDex Prior Authorization](http://hl7.org/fhir/us/davinci-pdex/StructureDefinition-pdex-priorauthorization.html)
profile. The base resource also covers paid and denied claims; `use`
disambiguates (`claim`, `preauthorization`, `predetermination`).

## Anatomy

{% tabs %}
{% tab title="Request" %}
```http
GET /fhir/ExplanationOfBenefit
Accept: application/json
```
{% endtab %}
{% tab title="Response" %}
```http
HTTP/1.1 200 OK
Content-Type: application/fhir+json

{
  "resourceType": "Bundle",
  "type": "searchset",
  "link": [
    {"relation": "self", "url": ".../fhir/ExplanationOfBenefit"},
    {"relation": "next", "url": ".../fhir/ExplanationOfBenefit?_page=2"}
  ],
  "entry": [
    { "resource": { "resourceType": "ExplanationOfBenefit", "id": "...", "...": "..." } }
  ]
}
```
{% endtab %}
{% endtabs %}

## Counts

`_summary=count` returns the total with no rows in the body:

{% tabs %}
{% tab title="Request" %}
```http
GET /fhir/ExplanationOfBenefit?_summary=count
```
{% endtab %}
{% tab title="Response" %}
```http
HTTP/1.1 200 OK
Content-Type: application/fhir+json

{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 30214876
}
```
{% endtab %}
{% endtabs %}

Combine with any SearchParameter to count a slice:

```http
GET /fhir/ExplanationOfBenefit?use=preauthorization&_summary=count
GET /fhir/ExplanationOfBenefit?use=claim&_summary=count
```

## Search capabilities

The Aidbox UI lists the SearchParameters available for any resource
type under **Resources → ExplanationOfBenefit → Search parameters**:

![Available SearchParameters for ExplanationOfBenefit shown in the Aidbox UI - care-team, claim, coverage, created, disposition, encounter, identifier, patient, provider, status, and more, each with type and description columns](../../assets/analytics/eob-search-parameters.avif)

The patterns below use those parameters.

| Capability | Example | Description |
|---|---|---|
| Read by id | `GET /fhir/ExplanationOfBenefit/XXXX-XXXX-XXXX-XXXX-XXXX` | Direct primary-key lookup |
| Filter by reference | `GET /fhir/ExplanationOfBenefit?patient=Patient/XXXX-XXXX-XXXX-XXXX-XXXX` | EOBs for one member; also `provider`, `insurer`, `coverage` |
| Filter by code/status | `GET /fhir/ExplanationOfBenefit?use=preauthorization&status=active` | Combine codes - implicit AND |
| Filter by date | `GET /fhir/ExplanationOfBenefit?_lastUpdated=ge2026-05-01` | `_lastUpdated` = system time; `service-date` = clinical date |
| Compound | `GET /fhir/ExplanationOfBenefit?patient=...&_lastUpdated=ge2020-01-01` | Reference + date - for per-member time-windowed reports |
| OR within a param | `GET /fhir/ExplanationOfBenefit?status=draft,entered-in-error` | Either status |
| Modifiers | `GET /fhir/ExplanationOfBenefit?status:not=active` | `:not`, `:missing`, `:exact`, etc. |
| Sort & page | `GET /fhir/ExplanationOfBenefit?_sort=-_lastUpdated&_page=2` | Leading `-` = descending; page 2 of results |
| Field selection | `GET /fhir/ExplanationOfBenefit?_elements=id,status,outcome` | Return only the named fields |
| Include referenced | `GET /fhir/ExplanationOfBenefit?_include=ExplanationOfBenefit:patient` | Pull related Patient into the Bundle |
| Chaining | `GET /fhir/ExplanationOfBenefit?patient:Patient.gender=female` | Filter by an attribute of the referenced resource |
| Reverse chaining | `GET /fhir/Patient?_has:ExplanationOfBenefit:patient:use=preauthorization` | Patients who have at least one prior-auth EOB |

Full reference in
[FHIR search](https://www.health-samurai.io/docs/aidbox/api/rest-api/fhir-search)
in the Aidbox docs.

### Looking up EOBs by member identifier

To find every EOB for a given member ID: the identifier lives on
the `Patient`, not on the EOB, so the search chains into the
reference and must name the target type (`:Patient`):

```http
GET /fhir/ExplanationOfBenefit?patient:Patient.identifier=1A23B45C67D8
```

The match works two ways:

- **Value only** - matches any identifier with that value.
- **System + value** - pipe-separated, matches a specific
  `identifier.system` plus `identifier.value`:

```http
GET /fhir/ExplanationOfBenefit?patient:Patient.identifier=https://example.org/member-ids|100071056
```

Same pattern for any reference - by provider NPI:

```http
GET /fhir/ExplanationOfBenefit?provider:Organization.identifier=https://example.org/npi|1234567893
```

## Where this stops being enough

FHIR Search is read-shaped, not analytical. When you need
aggregation, joins across resource types, or fields without a
SearchParameter, step up to [flat views on FHIR data](flat-views.md) or
[SQL on FHIR data](sql-mat-views.md). For Aidbox's alternative
search surfaces (`Search` resource, AidboxQuery, dot expressions)
see
[Aidbox Search](https://www.health-samurai.io/docs/aidbox/api/rest-api/aidbox-search)
in the Aidbox docs.

## Response tabs (Aidbox REST Console)

The Response panel has **Body**, **Headers**, **Raw**, **Explain**.
For a query like `?patient=Patient/<id>` each one shows:

{% tabs %}
{% tab title="Headers" %}
```
x-duration:       429
x-temp-dur-in-pg: 86
x-request-id:     45c24181cfcfe184ec28c4fa457a2598
content-type:     application/json
content-length:   353939
```

`x-duration` is total HTTP wall time in milliseconds;
`x-temp-dur-in-pg` is how much of that was spent in Postgres.
`x-request-id` correlates the call with server logs.
{% endtab %}
{% tab title="Raw" %}
```
HTTP/1.1 200 OK
content-type: application/json
content-length: 353939
x-duration: 429
x-temp-dur-in-pg: 86

{"resourceType":"Bundle","type":"searchset","entry":[...]}
```

The unparsed HTTP response - status line, headers, and body in one
block. Useful for debugging content-type negotiation or copying the
exact wire format.
{% endtab %}
{% tab title="Query" %}
```sql
SELECT resource
FROM   explanationofbenefit
WHERE  resource #>> '{patient,id}' = 'XXXX-XXXX-XXXX-XXXX-XXXX'
LIMIT  30;
```

The SQL Aidbox emits from the FHIR URL. (Explain has a **Statement**
sub-tab too, showing the parameterized form.)
{% endtab %}
{% tab title="Execution Plan" %}
```
Limit  (cost=0.56..34.19 rows=30 width=451) (actual time=0.015..0.082 rows=30 loops=1)
  Buffers: shared hit=34
  → Index Scan using explanationofbenefit_pt_idx on explanationofbenefit
        (cost=0.56..362.61 rows=323 width=451) (actual time=0.014..0.079 rows=30 loops=1)
      Index Cond: ((resource #>> '{patient,id}'::text[]) = 'XXXX-...'::text)
      Buffers: shared hit=34
Planning Time: 1.480 ms
Execution Time: 0.098 ms
```

Postgres `EXPLAIN` for the emitted SQL. Open it when a query is slow
or to check that a SearchParameter is hitting the index you expect.
{% endtab %}
{% endtabs %}
