---
description: DTR path where the rendering app fetches a packaged Questionnaire from Payerbox via $questionnaire-package
---

# Aidbox as Questionnaire storage

Payerbox can deliver a self-contained Questionnaire bundle to a DTR client that does its own rendering. The client calls [`$questionnaire-package`](../../api-reference/operations/questionnaire-package.md) and receives a Bundle with the Questionnaire, all referenced ValueSets (expanded), and a draft QuestionnaireResponse prefilled from the launch context.

This is the API-side of DTR — Payerbox does not ship a UI for it. Choose it when the rendering app is owned by the EHR or by a third party (e.g., an in-EHR DTR client, an integrator's app), or when the client needs to render without launching a SMART app from Payerbox.

## Example

{% tabs %}
{% tab title="Request" %}

```http
POST /fhir/Questionnaire/$questionnaire-package
Content-Type: application/fhir+json
Accept: application/fhir+json

{
  "resourceType": "Parameters",
  "parameter": [
    { "name": "questionnaire", "valueCanonical": "http://example.org/Questionnaire/prior-auth-form|1.0" }
  ]
}
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "resourceType": "Parameters",
  "parameter": [
    {
      "name": "packagebundle",
      "resource": {
        "resourceType": "Bundle",
        "type": "collection",
        "entry": [
          { "resource": { "resourceType": "Questionnaire", "id": "prior-auth-form", "url": "http://example.org/Questionnaire/prior-auth-form" } },
          { "resource": { "resourceType": "ValueSet", "url": "http://example.org/ValueSet/diagnosis-codes" } },
          { "resource": { "resourceType": "QuestionnaireResponse", "status": "in-progress", "subject": { "reference": "Patient/patient-456" } } }
        ]
      }
    }
  ]
}
```

{% endtab %}
{% endtabs %}

## When to choose this path vs DTR SMART App

| | This path | [DTR SMART App](dtr-smart-app.md) |
|---|---|---|
| Who renders the questionnaire | The client (EHR, third-party DTR app) | Payerbox-shipped SMART app |
| Launch mechanism | Direct API call | EHR SMART on FHIR launch |
| Prefill execution | Client-side, by the DTR client | Client-side, inside the SMART app |

The operation is implemented as a subset of Da Vinci DTR STU 2.0.1: it bundles the Questionnaire and its expanded ValueSets, and prefill uses the questionnaire's FHIRPath `initialExpression`s (no CQL). Full parameter list, limitations, and examples: [`$questionnaire-package`](../../api-reference/operations/questionnaire-package.md).

The QuestionnaireResponse produced by either path becomes the input to [PAS](../pas.md).
