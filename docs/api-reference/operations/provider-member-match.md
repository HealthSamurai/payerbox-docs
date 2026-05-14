# $provider-member-match

Operation defined by [Da Vinci PDex STU 2.1.0](https://hl7.org/fhir/us/davinci-pdex/STU2.1/OperationDefinition-member-match.html) for **provider-initiated attribution** in Provider Access.

The provider submits a list of patients it treats with demographics and (optional) prior coverage references. Payerbox matches them against enrolled members and creates a Group resource that the provider then uses as the target of `Group/$export`.

This is the v2 path of Provider Access. The v1 path uses a payer-maintained attribution roster (no member-match step needed).

## Endpoint

```
POST <base>/fhir/$provider-member-match
```

## Auth

SMART Backend Services. Scope: `system/*.read` (or more granular: `system/Patient.r system/Coverage.r system/Group.cu`).

See [Authentication](../authentication.md).

## Request

A FHIR Parameters resource containing one Parameters entry per member to match.

```http
POST <base>/fhir/$provider-member-match
Authorization: Bearer <access-token>
Content-Type: application/fhir+json
Accept: application/fhir+json
```

```json
{
  "resourceType": "Parameters",
  "parameter": [
    {
      "name": "MemberPatient",
      "resource": {
        "resourceType": "Patient",
        "name": [{ "family": "Smith", "given": ["John"] }],
        "birthDate": "1970-04-15",
        "identifier": [{ "system": "http://hl7.org/fhir/sid/us-mbi", "value": "1A23B45C67D8" }],
        "gender": "male"
      }
    },
    {
      "name": "CoverageToMatch",
      "resource": {
        "resourceType": "Coverage",
        "status": "active",
        "subscriberId": "1A23B45C67D8",
        "payor": [{ "identifier": { "value": "PRIOR-PAYER-ID" } }]
      }
    },
    {
      "name": "Consent",
      "resource": { "resourceType": "Consent", "...": "(optional)" }
    }
  ]
}
```

| Parameter | Cardinality | Description |
|---|---|---|
| `MemberPatient` | 1..1 | Patient resource with demographics |
| `CoverageToMatch` | 0..1 | Coverage from the prior payer (helps disambiguate) |
| `Consent` | 0..1 | Member consent record, if the provider has captured one |

Submit one Parameters payload per member. For bulk matching across many members at once, use [`$bulk-member-match`](bulk-member-match.md) (that's Payer-to-Payer, not Provider Access).

## Response

A Parameters resource with the match result, plus a Group reference if the match succeeded.

### Successful match

```json
{
  "resourceType": "Parameters",
  "parameter": [
    {
      "name": "MemberPatient",
      "resource": {
        "resourceType": "Patient",
        "id": "matched-member-uuid",
        "identifier": [{ "system": "http://example.org/payer-mbi", "value": "9X87Y65Z43W2" }],
        "...": "..."
      }
    },
    {
      "name": "MatchedGroup",
      "valueReference": { "reference": "Group/provider-attributed-<uuid>" }
    }
  ]
}
```

The returned Patient's `id` is Payerbox's internal member id. Use the `MatchedGroup` reference as the target of `Group/$export`.

### No match

```json
{
  "resourceType": "Parameters",
  "parameter": [
    {
      "name": "ResultStatus",
      "valueCode": "no-match"
    }
  ]
}
```

### Multiple candidates

```json
{
  "resourceType": "Parameters",
  "parameter": [
    {
      "name": "ResultStatus",
      "valueCode": "multiple-matches"
    }
  ]
}
```

When `multiple-matches` is returned, supply additional demographics (full address, phone, alternate identifiers) and retry.

## Group lifecycle

| Event | Group state |
|---|---|
| Successful match | Group created, member added |
| Re-match with same provider for the same member | Group reused; member added if not already present |
| Member opts out | Group still exists, but `$export` filters this member out of the response |
| Member's attribution to this provider changes | Provider re-matches; old Group may become stale |

> TODO(engineering): document Group expiry / refresh policy.

## Errors

| HTTP | Cause |
|---|---|
| 400 | Malformed Parameters payload; missing `MemberPatient` |
| 401 | Invalid token |
| 403 | Token scope insufficient |
| 422 | `MemberPatient.identifier` references an unknown system, or `CoverageToMatch.payor` is not a recognized prior payer |

