---
description: CDS Services discovery endpoint — list of CDS Services exposed by Payerbox for CRD
---

# CDS Services Discovery

Returns the list of CDS Services available on this server, as defined by the [CDS Hooks 2.0 Discovery endpoint](https://cds-hooks.hl7.org/2.0/#discovery). Payerbox advertises its CRD hooks here, with their prefetch templates and usage requirements.

Defined as part of [CDS Hooks 2.0](https://cds-hooks.hl7.org/2.0/) and used by Payerbox for [CRD](../../prior-auth/crd.md).

## Endpoint

```
GET <base>/cds-services
```

## Auth

Discovery is unauthenticated per CDS Hooks spec — EHRs fetch the service list before configuring credentials. Hook invocations themselves require SMART Backend Services; see [Authentication](../authentication.md).

## Response Fields

| Field | Type | Description |
|---|---|---|
| services | array | Array of available CDS Service definitions |
| services[].id | string | Unique identifier for this CDS Service |
| services[].hook | code | The hook this service should be invoked on (e.g., `order-sign`, `order-select`) |
| services[].title | string | Human-readable name of this service |
| services[].description | string | Description of what this service does |
| services[].prefetch | object | Key/value pairs of FHIR queries for prefetch data |
| services[].usageRequirements | string | Human-readable description of any preconditions for using this service |

## Example

{% tabs %}
{% tab title="Request" %}

```http
GET /cds-services
Accept: application/json
```

{% endtab %}

{% tab title="Response" %}

```json
{
  "services": [
    {
      "id": "order-sign-crd",
      "hook": "order-sign",
      "title": "CRD Prior Authorization (Order Sign)",
      "description": "Provides final prior authorization determination when orders are being signed",
      "prefetch": {
        "patient": "Patient/{{context.patientId}}",
        "encounter": "Encounter/{{context.encounterId}}",
        "coverage": "Coverage?patient={{context.patientId}}&status=active"
      },
      "usageRequirements": "Requires context.patientId and at least one order in context.draftOrders"
    }
  ]
}
```

{% endtab %}
{% endtabs %}
