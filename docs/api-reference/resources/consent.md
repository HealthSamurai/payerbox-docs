---
description: >-
  FHIR reference for member consent in Payerbox: the Provider Access opt-out
  and the Payer-to-Payer opt-in as Consent resources in Aidbox, with the
  endpoints, search parameters, the rules Aidbox validates, and examples.
---

# Consent

A member's data-sharing decisions are FHIR `Consent` resources in Payerbox's Aidbox, under two Da Vinci profiles:

| Decision | Profile | IG |
|---|---|---|
| Provider Access opt-out, or a return to sharing | [PDex Provider Consent](https://hl7.org/fhir/us/davinci-pdex/STU2.1/StructureDefinition-pdex-provider-consent.html), `http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-provider-consent` | Da Vinci PDex STU 2.1 |
| Payer-to-Payer opt-in | [HRex Consent](https://hl7.org/fhir/us/davinci-hrex/STU1.1/StructureDefinition-hrex-consent.html), `http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-consent` | Da Vinci HRex STU 1.1 |

The records arrive in three ways:
- members record them on the member portal ([Consent Capture](../../fhir-app-portal/member-portal/consent-capture.md));
- the plan's data feed delivers them ([Member Consent](../../data-integration/consent/README.md));
- a system writes them through the FHIR API, as described on this page.

Provider Access checks the opt-outs in [`$provider-member-match`](../operations/provider-member-match.md) and in every [`$davinci-data-export`](../operations/davinci-data-export.md). The Payer-to-Payer opt-ins say which other plans the plan may ask for the member's history.

## Endpoints

| Interaction | Method | URL |
|---|---|---|
| Read | `GET` | `/fhir/Consent/<id>` |
| Search | `GET` | `/fhir/Consent?<search-params>` |
| Create | `POST` | `/fhir/Consent` |
| Create or update | `PUT` | `/fhir/Consent/<id>` |
| Patch | `PATCH` | `/fhir/Consent/<id>` |
| History | `GET` | `/fhir/Consent/<id>/_history` |
| Transaction | `POST` | `/fhir` |

The general behavior of these interactions, including conditional requests and `If-Match`, is in [FHIR RESTful API](../operations/fhir-restful-api.md).

## Auth

A SMART Backend Services or Client Credentials client whose access policy allows the interaction on `Consent`. Members reach their own records only through the member portal. See [Authentication](../authentication.md) and [Access policies](../configuration-resources/access-policies.md).

## Search parameters

| Parameter | Type | Element | Use |
|---|---|---|---|
| `patient` | reference | `Consent.patient` | `Patient/<id>` or `<id>`. |
| `status` | token | `Consent.status` | `active` for records in force; `inactive` for retired ones. |
| `category` | token | `Consent.category` | `http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose\|provider-access` or `\|payer-to-payer` picks the switch; both kinds also carry `http://terminology.hl7.org/CodeSystem/v3-ActCode\|IDSCL`. |
| `provision-type` | token | `Consent.provision.type` | `deny` or `permit`. Added by Payerbox; not a base FHIR parameter. |
| `_profile` | uri | `meta.profile` | The PDex or HRex canonical above. |
| `scope` | token | `Consent.scope` | `http://terminology.hl7.org/CodeSystem/consentscope\|patient-privacy`. |
| `date` | date | `Consent.dateTime` | When the decision was made. |
| `period` | date | `Consent.provision.period` | In force on a day: `period=le<day>&period=ge<day>`, which also matches periods without an end. |
| `organization` | reference | `Consent.organization` | The plan's Organization. |
| `actor` | reference | `Consent.provision.actor.reference` | A Payer-to-Payer source or recipient payer, for example `Organization/<id>`. |
| `source-reference` | reference | `Consent.source[x]` | The consent document. |

The base R4 parameters `action`, `consentor`, `data`, `identifier`, `purpose` and `security-label` are available too.

{% tabs %}
{% tab title="Opt-outs in force" %}
```http
GET /fhir/Consent?patient=Patient/example-member&category=http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose|provider-access&status=active&provision-type=deny
Authorization: Bearer <token>
```
{% endtab %}
{% tab title="Payer-to-Payer opt-ins on a day" %}
```http
GET /fhir/Consent?patient=Patient/example-member&category=http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose|payer-to-payer&status=active&period=le2027-06-01&period=ge2027-06-01
Authorization: Bearer <token>
```
{% endtab %}
{% tab title="Response" %}
```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 1,
  "entry": [
    {
      "resource": {
        "resourceType": "Consent",
        "id": "67d8623c-9af9-4dac-a40d-f5f30bb856ea",
        "meta": { "profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-provider-consent"] },
        "status": "active",
        "provision": { "type": "deny", "period": { "start": "2026-10-06" } }
      }
    }
  ]
}
```
{% endtab %}
{% endtabs %}

## Provider Access opt-out

| Element | Rule |
|---|---|
| `meta.profile` | The PDex Provider Consent canonical, without a version. |
| `meta.lastUpdated` | Required whenever `meta` is sent. |
| `status` | `active`: the profile fixes it, so a record carries the profile only while it is in force. |
| `scope` | `patient-privacy`. |
| `category` | `IDSCL`, and the PDex API purpose `provider-access`. |
| `patient`, `performer` | The member's `Patient`. PDex STU 2.1 allows only the Patient as `performer`. |
| `organization` | The plan's `Organization`. |
| `provision.actor` | The plan's Organization in the role `performer` (the source of the data). A representative who signed can be added in their authority role, for example `POWATT`. |
| `policyRule` | `cric`, with the display *Common Rule Informed Consent*, as the profile fixes it. |
| `provision.type` | `deny` to opt out, `permit` to share again. |
| `provision.period.start` | The day the decision takes effect. |
| `provision.action` | `disclose`. |

{% tabs %}
{% tab title="Request" %}
```http
PUT /fhir/Consent/67d8623c-9af9-4dac-a40d-f5f30bb856ea
Authorization: Bearer <token>
Content-Type: application/fhir+json

{
  "resourceType": "Consent",
  "id": "67d8623c-9af9-4dac-a40d-f5f30bb856ea",
  "meta": {
    "profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-provider-consent"],
    "lastUpdated": "2026-10-06T14:22:00Z"
  },
  "status": "active",
  "scope": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/consentscope", "code": "patient-privacy" }] },
  "category": [
    { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "IDSCL" }] },
    { "coding": [{ "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose", "code": "provider-access" }] }
  ],
  "patient": { "reference": "Patient/example-member" },
  "dateTime": "2026-10-06T14:22:00Z",
  "performer": [{ "reference": "Patient/example-member" }],
  "organization": [{ "reference": "Organization/example-health-plan" }],
  "policyRule": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/consentpolicycodes", "code": "cric", "display": "Common Rule Informed Consent" }] },
  "provision": {
    "type": "deny",
    "period": { "start": "2026-10-06" },
    "actor": [{
      "role": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type", "code": "performer" }] },
      "reference": { "reference": "Organization/example-health-plan" }
    }],
    "action": [{ "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/consentaction", "code": "disclose" }] }]
  }
}
```
{% endtab %}
{% tab title="201" %}
```json
{
  "resourceType": "Consent",
  "id": "67d8623c-9af9-4dac-a40d-f5f30bb856ea",
  "meta": {
    "profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-provider-consent"],
    "versionId": "3927",
    "lastUpdated": "2026-10-06T14:22:00.112Z"
  },
  "status": "active",
  "...": "..."
}
```
{% endtab %}
{% endtabs %}

## Payer-to-Payer opt-in

| Element | Rule |
|---|---|
| `meta.profile` | The HRex Consent canonical, without a version. |
| `status` | `active`, fixed by the profile. |
| `scope`, `category` | `patient-privacy`; `IDSCL`, and the PDex API purpose `payer-to-payer`. |
| `policy.uri` | `http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-consent.html#sensitive` for all information, `…#regular` for non-sensitive information only. The names are the profile's: `#sensitive` is the wider grant. |
| `sourceReference` | A `DocumentReference` for the signed form. HRex requires a source document, and it must exist before the Consent is written. |
| `provision.type` | `permit`. |
| `provision.period` | `start`, and an `end` set by the plan's policy. |
| `provision.actor` | Each previous or concurrent payer in the role `performer` (the source), and the plan's Organization in the role `IRCP` (the recipient). |
| `performer` | The member's `Patient`, or the `RelatedPerson` who signed for them. |

{% code title="The elements that differ from the opt-out" %}
```json
{
  "meta": { "profile": ["http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-consent"], "lastUpdated": "2026-10-06T14:22:00Z" },
  "category": [
    { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "IDSCL" }] },
    { "coding": [{ "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose", "code": "payer-to-payer" }] }
  ],
  "policy": [{ "uri": "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-consent.html#sensitive" }],
  "sourceReference": { "reference": "DocumentReference/3f534529-49b7-4de8-b51c-e9f0d6831242" },
  "provision": {
    "type": "permit",
    "period": { "start": "2026-10-06", "end": "2027-12-31" },
    "actor": [
      { "role": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type", "code": "performer" }] },
        "reference": { "reference": "Organization/lakeside-health-plan" } },
      { "role": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType", "code": "IRCP" }] },
        "reference": { "reference": "Organization/example-health-plan" } }
    ],
    "action": [{ "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/consentaction", "code": "disclose" }] }]
  }
}
```
{% endcode %}

## Retire a record

A decision is never edited in place. A new decision is a new `Consent`, and the one it replaces is retired. A Payer-to-Payer withdrawal only retires the opt-in. Both profiles fix `status` to `active`, so a retirement sets `status` to `inactive` and removes the profile in the same JSON merge patch. A patch that changes only the status is refused.

{% tabs %}
{% tab title="Request" %}
```http
PATCH /fhir/Consent/67d8623c-9af9-4dac-a40d-f5f30bb856ea
Authorization: Bearer <token>
Content-Type: application/merge-patch+json
If-Match: W/"3927"

{ "status": "inactive", "meta": { "profile": null } }
```
{% endtab %}
{% tab title="200" %}
```json
{
  "resourceType": "Consent",
  "id": "67d8623c-9af9-4dac-a40d-f5f30bb856ea",
  "meta": { "versionId": "3931", "lastUpdated": "2026-10-07T09:10:00.204Z" },
  "status": "inactive",
  "...": "..."
}
```
{% endtab %}
{% tab title="422 status only" %}
```json
{
  "resourceType": "OperationOutcome",
  "issue": [{ "severity": "error", "code": "invalid", "diagnostics": "The value 'inactive' does not match the expected pattern 'active'" }]
}
```
{% endtab %}
{% endtabs %}

Send `profile: null`; an empty array is refused.

## Referenced records

Aidbox checks every reference a profile constrains. The referenced record must exist, be of the right type, and declare the profile the target names in its `meta.profile`, without a version:

| Reference | The record must declare |
|---|---|
| `patient`, and `performer` when it is the member | `http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient` |
| `organization` and the provision actors | `http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-organization` |
| `sourceReference` | Any `DocumentReference` |

Aidbox checks only the declaration, not the record's content. A declaration with a version (`us-core-patient|6.1.0`) matches only when that is the version the plain URL resolves to on the deployment.

## Records written alongside

Records captured on the member portal come with:

| Resource | Content |
|---|---|
| `DocumentReference` | The consent document, LOINC `59284-0` *Consent Document*: `Consent.sourceReference` points to it, and its attachment points to the QuestionnaireResponse. |
| `QuestionnaireResponse` | The answered form, US Core QuestionnaireResponse profile. |
| `Provenance` | Who signed, how (activity `CREATE`, `ONLINEWRIT`), and the form's canonical; a review adds one with the administrator as `verifier`. |
| `RelatedPerson`, `DocumentReference` | For a representative: the RelatedPerson (US Core RelatedPerson profile, relationship `POWATT`, `GUARD` or `RESP`), and the document of authority. |

## Errors

| Status | When | `diagnostics` |
|---|---|---|
| `401`, `403` | The token is missing or invalid, or the access policy does not allow the interaction. | |
| `404` | No Consent with that id. | |
| `412` | `If-Match` names a version that is not the current one. | `Version ID validation failed. Requested versionId W/"999999"; versionId 3927` |
| `422` | The record breaks its profile. | `The value 'draft' does not match the expected pattern 'active'` |
| `422` | A referenced record does not declare the target profile. | `Referenced resource Patient/example-member content doesn't conform to any of target profiles: http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient` |
| `422` | An HRex Consent without a recognized `policy.uri`. | `Invalid slice cardinality 'hrex'. Current count is '0', expected between '1' and 'Infinity'.` |

```json
{
  "resourceType": "OperationOutcome",
  "issue": [
    {
      "severity": "error",
      "code": "invalid",
      "diagnostics": "Referenced resource Patient/example-member content doesn't conform to any of target profiles: http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient"
    }
  ]
}
```

## Current limitations

- The profile canonicals carry no version. Aidbox validates against the versions the deployment has loaded: PDex 2.1.0 and its HRex dependencies.
- A record carries its PDex or HRex profile only while `active`. A representative's draft has none until it is approved, and retired or rejected records lose it.
- The member portal shows only Consents with scope `patient-privacy` that are either profiled or carry one of the two PDex API purposes, for the plan organization set in [Consent Settings](../../fhir-app-portal/consent-settings.md) or for none.
- `period=<day>` without a prefix matches only periods that fit inside that day; use `le` and `ge` as above.
- An opt-in for non-sensitive information only moves no data until sensitive data is labeled: other payers return the member as consent-constrained.

## Related

{% content-ref url="../../fhir-app-portal/member-portal/consent-capture.md" %}
[consent-capture.md](../../fhir-app-portal/member-portal/consent-capture.md)
{% endcontent-ref %}

{% content-ref url="../../data-integration/consent/README.md" %}
[README.md](../../data-integration/consent/README.md)
{% endcontent-ref %}

{% content-ref url="../operations/provider-member-match.md" %}
[provider-member-match.md](../operations/provider-member-match.md)
{% endcontent-ref %}
