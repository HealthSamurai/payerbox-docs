---
description: >-
  Endpoint reference for member consent capture: the member endpoints behind
  the Data sharing page, the admin endpoints for consent settings, previous
  payers and reviews, and the FHIR records a choice writes.
---

# Member Consent Endpoints

The FHIR App Portal backend exposes two sets of endpoints for member consent capture:

- **Member endpoints**, behind the [Data Sharing](../../fhir-app-portal/data-sharing.md) page: read the member's choices, submit a choice, upload a representative's document of authority, and look up previous payers.
- **Admin endpoints**, behind [Consent Settings](../../fhir-app-portal/consent-settings.md) and [Consent Reviews](../../fhir-app-portal/consent-reviews.md): the capture settings, the previous-payer registry, a member's consent overview, and review decisions.

A member submits a choice as the answers to one of two consent forms, as a FHIR `QuestionnaireResponse`. The portal writes the resulting records to the admin Aidbox. A Provider Access choice becomes a Consent conforming to the Da Vinci PDex STU 2.1 [Provider Consent](https://hl7.org/fhir/us/davinci-pdex/STU2.1/StructureDefinition-pdex-provider-consent.html) profile, and a Payer-to-Payer choice becomes an HRex STU 1.1 [Consent](https://hl7.org/fhir/us/davinci-hrex/STU1.1/StructureDefinition-hrex-consent.html). The answered form is kept as a US Core STU 6.1 [QuestionnaireResponse](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-questionnaireresponse.html) (see [Records written](#records-written)).

## Endpoints

| Method | Path | Caller |
|---|---|---|
| `GET` | `/api/user-api/member/consents` | Member |
| `POST` | `/api/user-api/member/consents` | Member |
| `POST` | `/api/user-api/member/documents` | Member |
| `GET` | `/api/user-api/member/previous-payers` | Member |
| `GET`, `PUT` | `/admin/consent/settings` | Admin |
| `GET` | `/admin/consent/previous-payers` | Admin |
| `GET` | `/admin/consent/previous-payers/check` | Admin |
| `POST` | `/admin/consent/previous-payers` | Admin |
| `GET` | `/admin/consent/members/{patientId}` | Admin |
| `POST` | `/admin/consent/reviews/{consentId}` | Admin |

Paths are relative to the Admin Portal's host. Every endpoint answers `404` with `consent_capture_off` while the deployment does not enable member consent capture. On a read-only deployment the member write endpoints answer `403` with `consent_capture_read_only`.

## Auth

- **Member endpoints**: the member's portal session cookie, set when the member signs in to the portal. The signed-in user must be linked to a `Patient`, which is the only member the calls act for. Requests other than `GET` must also carry an `X-Requested-With` or `X-Target-Portal` header, which a cross-site form cannot set.
- **Admin endpoints**: an admin-role portal session, or a Bearer token of the `admin-api` client obtained with client credentials.

See [Authentication](../authentication.md).

## GET /api/user-api/member/consents

Everything the Data sharing page shows: the capture settings, both consent forms, and the member's consent records.

| Field | Type | Description |
|---|---|---|
| `mode` | string | `read-write` or `read-only`. |
| `configured` | boolean | `true` when the plan organization and the Payer-to-Payer end date are set. Members can save choices only then. |
| `patientId` | string | The `Patient` linked to the session. |
| `organization` | object or null | The plan organization: `id`, `display`. |
| `p2pPeriodEnd` | date or null | End date of new Payer-to-Payer authorizations. |
| `showNonSensitiveOption` | boolean | Whether the Payer-to-Payer form offers the non-sensitive scope. |
| `questionnaires` | object | `provider-access` and `payer-to-payer`: the two `Questionnaire` resources, or `null` where one is not loaded. |
| `consents` | Consent[] | The member's consents for both switches, newest first. |
| `responses` | QuestionnaireResponse[] | The answered forms. |
| `documents` | DocumentReference[] | Consent documents and uploaded documents of authority. |
| `provenances` | Provenance[] | Capture and review provenance. |
| `relatedPersons` | RelatedPerson[] | Representatives who signed. |

The lists hold only this feature's records: Consents with scope `patient-privacy`, consent documents with LOINC `59284-0`, the forms they index, and representatives with the authority relationship codes the capture writes.

{% tabs %}
{% tab title="Request" %}
```http
GET /api/user-api/member/consents
Cookie: <session cookie>
```
{% endtab %}
{% tab title="Response" %}
```json
{
  "mode": "read-write",
  "configured": true,
  "patientId": "example-member",
  "organization": { "id": "example-health-plan", "display": "Example Health Plan" },
  "p2pPeriodEnd": "2027-12-31",
  "showNonSensitiveOption": true,
  "questionnaires": {
    "provider-access": { "resourceType": "Questionnaire", "url": "http://healthsamurai.io/fhir/Questionnaire/provider-access-member-opt-out", "version": "1.0.0", "...": "..." },
    "payer-to-payer": { "resourceType": "Questionnaire", "url": "http://healthsamurai.io/fhir/Questionnaire/p2p-member-consent", "version": "1.1.0", "...": "..." }
  },
  "consents": [{ "resourceType": "Consent", "id": "67d8623c-9af9-4dac-a40d-f5f30bb856ea", "status": "active", "...": "..." }],
  "responses": [],
  "documents": [],
  "provenances": [],
  "relatedPersons": []
}
```
{% endtab %}
{% endtabs %}

## POST /api/user-api/member/consents

Submits one choice: the answers to one of the two forms. The server fills the rest of the record from the session and the settings: `subject`, `author`, `source`, `authored`, `status`, the member block, the signature date and the Payer-to-Payer end date. Values the client sends for these are ignored.

### Body

| Field | Cardinality | Description |
|---|---|---|
| `resourceType` | 1..1 | `QuestionnaireResponse` |
| `questionnaire` | 1..1 | Canonical of one of the two forms, with or without `\|version`. |
| `item` | 0..* | The answered items, either nested in the form's groups or flat. |

| Form | Questionnaire URL |
|---|---|
| Provider Access | `http://healthsamurai.io/fhir/Questionnaire/provider-access-member-opt-out` |
| Payer-to-Payer | `http://healthsamurai.io/fhir/Questionnaire/p2p-member-consent` |

Answer codes are local to the forms and carry no `system`, except `prior-plan-relationship`.

| linkId | Form | Answer | Required |
|---|---|---|---|
| `sharing-choice` | Provider Access | `valueCoding.code`: `share-all`, `opt-out` | Yes |
| `consent-choice` | Payer-to-Payer | `valueCoding.code`: `opt-in-full`, `opt-in-non-sensitive` (only when offered), `withdraw` | Yes |
| `prior-plan` | Payer-to-Payer | Repeating group, one per plan the member names | At least one on an opt-in |
| `prior-plan`.`prior-plan-organization` | Payer-to-Payer | `valueReference` to a registered previous payer, `Organization/<id>` | Yes |
| `prior-plan`.`prior-plan-member-id` | Payer-to-Payer | `valueString` | No |
| `prior-plan`.`prior-plan-relationship` | Payer-to-Payer | `valueCoding`, system `http://terminology.hl7.org/CodeSystem/subscriber-relationship`: `self`, `spouse`, `child`, `other` | Yes |
| `prior-plan`.`prior-plan-kind` | Payer-to-Payer | `valueCoding.code`: `previous`, `concurrent` | Yes |
| `signer-relationship` | Both | `valueCoding.code`: `self`, `representative` | Yes |
| `representative-name` | Both | `valueString`, name and relationship to the member | For a representative |
| `representative-authority` | Both | `valueCoding.code`: `power-of-attorney`, `legal-guardian`, `other` | For a representative |
| `representative-authority-other` | Both | `valueString` describing the authority | When `other` |
| `representative-doc` | Both | `valueAttachment` returned by [`POST /api/user-api/member/documents`](#post-apiuser-apimemberdocuments) | For a representative |
| `signer-signature` | Both | `valueAttachment` with `contentType` `image/png` or `image/jpeg` and base64 `data` | Yes |

### Response

`201`:

| Field | Description |
|---|---|
| `questionnaireResponseId` | The stored form. |
| `documentReferenceId` | The consent document that indexes it. |
| `consentId` | The new Consent, or `null` for a Payer-to-Payer withdrawal, which writes no Consent. |
| `consentStatus` | `active`, `draft` for a representative's choice that shares more and waits for review, or `null`. |
| `retired` | How many earlier records of the switch the save retired. |

### Examples

{% tabs %}
{% tab title="Opt-out by the member" %}
```http
POST /api/user-api/member/consents
Cookie: <session cookie>
X-Requested-With: XMLHttpRequest
Content-Type: application/json

{
  "resourceType": "QuestionnaireResponse",
  "questionnaire": "http://healthsamurai.io/fhir/Questionnaire/provider-access-member-opt-out|1.0.0",
  "item": [
    { "linkId": "sharing-choice", "answer": [{ "valueCoding": { "code": "opt-out" } }] },
    { "linkId": "signer-relationship", "answer": [{ "valueCoding": { "code": "self" } }] },
    { "linkId": "signer-signature", "answer": [{ "valueAttachment": { "contentType": "image/png", "data": "iVBORw0KGgo...", "title": "signature.png" } }] }
  ]
}
```
{% endtab %}
{% tab title="201" %}
```json
{
  "questionnaireResponseId": "64ca24e1-e85a-48eb-8f56-85f815f3f058",
  "documentReferenceId": "23f02707-189f-40b7-a752-6f19cb37116b",
  "consentId": "67d8623c-9af9-4dac-a40d-f5f30bb856ea",
  "consentStatus": "active",
  "retired": 1
}
```
{% endtab %}
{% tab title="Payer-to-Payer opt-in" %}
```json
{
  "resourceType": "QuestionnaireResponse",
  "questionnaire": "http://healthsamurai.io/fhir/Questionnaire/p2p-member-consent|1.1.0",
  "item": [
    { "linkId": "consent-choice", "answer": [{ "valueCoding": { "code": "opt-in-full" } }] },
    { "linkId": "prior-plan", "item": [
      { "linkId": "prior-plan-organization", "answer": [{ "valueReference": { "reference": "Organization/lakeside-health-plan", "display": "Lakeside Health Plan" } }] },
      { "linkId": "prior-plan-member-id", "answer": [{ "valueString": "LHP-4471902" }] },
      { "linkId": "prior-plan-relationship", "answer": [{ "valueCoding": { "system": "http://terminology.hl7.org/CodeSystem/subscriber-relationship", "code": "self" } }] },
      { "linkId": "prior-plan-kind", "answer": [{ "valueCoding": { "code": "previous" } }] }
    ] },
    { "linkId": "signer-relationship", "answer": [{ "valueCoding": { "code": "self" } }] },
    { "linkId": "signer-signature", "answer": [{ "valueAttachment": { "contentType": "image/png", "data": "iVBORw0KGgo...", "title": "signature.png" } }] }
  ]
}
```
{% endtab %}
{% tab title="Representative, waits for review" %}
```json
{
  "resourceType": "QuestionnaireResponse",
  "questionnaire": "http://healthsamurai.io/fhir/Questionnaire/provider-access-member-opt-out|1.0.0",
  "item": [
    { "linkId": "sharing-choice", "answer": [{ "valueCoding": { "code": "share-all" } }] },
    { "linkId": "signer-relationship", "answer": [{ "valueCoding": { "code": "representative" } }] },
    { "linkId": "representative-name", "answer": [{ "valueString": "Sam Lee, son" }] },
    { "linkId": "representative-authority", "answer": [{ "valueCoding": { "code": "power-of-attorney" } }] },
    { "linkId": "representative-doc", "answer": [{ "valueAttachment": { "url": "Binary/9a6f2c1e-4d3b-4e8a-9f5c-2b7d1e0a8c34", "contentType": "application/pdf", "title": "power-of-attorney.pdf" } }] },
    { "linkId": "signer-signature", "answer": [{ "valueAttachment": { "contentType": "image/png", "data": "iVBORw0KGgo...", "title": "signature.png" } }] }
  ]
}
```

The response has `"consentStatus": "draft"` and `"retired": 0`: the choice waits for an administrator, and the earlier one stays in force.
{% endtab %}
{% tab title="400 invalid answers" %}
```json
{ "error": "invalid_answers", "details": ["prior-plan: name at least one previous or concurrent health plan"] }
```
{% endtab %}
{% tab title="422 refused by Aidbox" %}
```json
{
  "error": "consent_write_rejected",
  "message": "Sorry, we can't save it now. Please try again later or contact Member Services.",
  "detail": { "resourceType": "OperationOutcome", "issue": [{ "severity": "error", "diagnostics": "Referenced resource Patient/example-member content doesn't conform to any of target profiles: http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient" }] }
}
```
{% endtab %}
{% endtabs %}

A save is one Aidbox transaction under the member's own token: the new records and the retirement of the earlier records of the same switch apply together or not at all. The `message` of every write error is written for the member.

## POST /api/user-api/member/documents

Uploads a representative's document of authority before the form is submitted. The body is `multipart/form-data` with the file in the field `file`: a PDF, JPEG or PNG of up to 10 MB. The file is stored as a `Binary` whose `securityContext` is the member's Patient.

{% tabs %}
{% tab title="Request" %}
```http
POST /api/user-api/member/documents
Cookie: <session cookie>
X-Requested-With: XMLHttpRequest
Content-Type: multipart/form-data; boundary=----form

------form
Content-Disposition: form-data; name="file"; filename="power-of-attorney.pdf"
Content-Type: application/pdf

<file bytes>
------form--
```
{% endtab %}
{% tab title="201" %}
```json
{ "url": "Binary/9a6f2c1e-4d3b-4e8a-9f5c-2b7d1e0a8c34", "contentType": "application/pdf", "title": "power-of-attorney.pdf", "size": 48211 }
```
{% endtab %}
{% tab title="415" %}
```json
{ "error": "unsupported_type", "allowed": ["application/pdf", "image/jpeg", "image/png"] }
```
{% endtab %}
{% endtabs %}

Use the response as the `representative-doc` answer.

## GET /api/user-api/member/previous-payers

The registered previous payers whose name contains `q`, at most 20, without the plan organization.

{% tabs %}
{% tab title="Request" %}
```http
GET /api/user-api/member/previous-payers?q=lake
Cookie: <session cookie>
```
{% endtab %}
{% tab title="Response" %}
```json
{ "payers": [{ "id": "lakeside-health-plan", "name": "Lakeside Health Plan", "npi": "1245319599", "active": true }] }
```
{% endtab %}
{% endtabs %}

## GET, PUT /admin/consent/settings

Reads and replaces the settings of [Consent Settings](../../fhir-app-portal/consent-settings.md). `PUT` takes `organizationId`, `p2pPeriodEnd` and `showNonSensitiveOption`, and answers like `GET`.

| Field | Type | Description |
|---|---|---|
| `organizationId` | string or null | Aidbox id of the plan's `Organization`. `PUT` refuses an id that matches no Organization. |
| `p2pPeriodEnd` | date or null | `YYYY-MM-DD`, not in the past. |
| `showNonSensitiveOption` | boolean | Default `true`. |
| `organizationDisplay` | string or null | Response only: the Organization's name. |
| `mode` | string | Response only: `read-write` or `read-only`. |
| `source` | string | Response only: `defaults` until the settings are saved once, then `settings`. |
| `configured` | boolean | Response only: the organization and the end date are both set. |
| `version` | integer | Response only: `1`. |

{% tabs %}
{% tab title="Request" %}
```http
PUT /admin/consent/settings
Authorization: Bearer <admin-api token>
Content-Type: application/json

{ "organizationId": "example-health-plan", "p2pPeriodEnd": "2027-12-31", "showNonSensitiveOption": true }
```
{% endtab %}
{% tab title="Response" %}
```json
{
  "version": 1,
  "source": "settings",
  "mode": "read-write",
  "organizationId": "example-health-plan",
  "organizationDisplay": "Example Health Plan",
  "p2pPeriodEnd": "2027-12-31",
  "showNonSensitiveOption": true,
  "configured": true
}
```
{% endtab %}
{% tab title="400" %}
```json
{ "error": "p2pPeriodEnd must not be in the past" }
```
{% endtab %}
{% endtabs %}

## Previous payers: /admin/consent/previous-payers

| Endpoint | Description |
|---|---|
| `GET /admin/consent/previous-payers?q=` | The registered previous payers, name order, at most 200, without the plan organization. Response: `{ "payers": [...] }`. |
| `GET /admin/consent/previous-payers/check?npi=` | Whether the NPI is well formed and whether a registered previous payer carries it. Response: `{ "npi", "valid", "existing": { "id", "name" } or null }`. |
| `POST /admin/consent/previous-payers` | Registers a previous payer from `{ "name", "npi" }`: an `Organization` declaring the HRex Organization profile, typed `pay`, with the NPI identifier and the previous-payer tag. Answers `201` with the new payer. |

{% tabs %}
{% tab title="Request" %}
```http
POST /admin/consent/previous-payers
Authorization: Bearer <admin-api token>
Content-Type: application/json

{ "name": "Summit Health", "npi": "1987654328" }
```
{% endtab %}
{% tab title="201" %}
```json
{ "id": "68efe1ee-1567-40e9-9698-e27ff7b2c3f6", "name": "Summit Health", "npi": "1987654328", "active": true }
```
{% endtab %}
{% tab title="409" %}
```json
{
  "error": "npi_exists",
  "message": "A previous payer with NPI 1987654328 is already registered: Summit Health. Nothing was created.",
  "existing": { "id": "68efe1ee-1567-40e9-9698-e27ff7b2c3f6", "name": "Summit Health" }
}
```
{% endtab %}
{% endtabs %}

`name` is required, at most 200 characters; `npi` must be ten digits with a valid check digit. The NPI is unique among registered previous payers only. The create is conditional on the NPI and the tag, so two concurrent registrations cannot both succeed.

## GET /admin/consent/members/{patientId}

A member's consent overview, as the **Data sharing** card on Member Details shows it: the same `consents`, `responses`, `documents`, `provenances`, `relatedPersons` and `questionnaires` as the member endpoint, plus `patientId`, `mode` and `pending`, the choices waiting for review.

| `pending[]` field | Description |
|---|---|
| `consentId` | The draft Consent. |
| `category` | `provider-access` or `payer-to-payer`. |
| `decision` | `permit` or `deny`. |
| `scope` | Payer-to-Payer: `all` or `nonsensitive`; otherwise `null`. |
| `dateTime` | When the representative signed. |
| `signer` | `name`, `authority`, `relatedPersonId`. |
| `authorityDocument` | `url`, `contentType`, `title` of the uploaded document, or `null`. |
| `questionnaireResponseId` | The answered form. |

## POST /admin/consent/reviews/{consentId}

Approves or rejects a representative's draft.

| Field | Description |
|---|---|
| `decision` | `approve` or `reject`. |
| `note` | Optional. Stored in the audit event only; longer notes are cut to 1,000 characters. |

{% tabs %}
{% tab title="Request" %}
```http
POST /admin/consent/reviews/0f617f31-1465-445d-8169-ef75832453f0
Authorization: Bearer <admin-api token>
Content-Type: application/json

{ "decision": "approve", "note": "Power of attorney checked" }
```
{% endtab %}
{% tab title="Response" %}
```json
{ "consentId": "0f617f31-1465-445d-8169-ef75832453f0", "status": "active", "retired": 1 }
```
{% endtab %}
{% tab title="409" %}
```json
{ "error": "not_pending", "status": "active" }
```
{% endtab %}
{% endtabs %}

An approval sets the Consent to `active`, adds its PDex or HRex profile, and retires the earlier records of the switch. A rejection sets it to `rejected` and changes nothing else. Both write a `Provenance` (activity `UPDATE`, agent type `verifier`) in the same FHIR transaction, with `If-Match` on every Consent.

## Records written

One member save writes, in one transaction:

| Resource | Content |
|---|---|
| `QuestionnaireResponse` | The answered form, US Core QuestionnaireResponse profile. `subject` is the member; `author` and `source` are the member or the representative. |
| `DocumentReference` | The consent document: LOINC `59284-0` *Consent Document*, attachment pointing to the QuestionnaireResponse, `custodian` the plan organization. HRex Consent requires a source document, so both forms get one. |
| `DocumentReference` | Representatives only: the document of authority, `type.text` *Personal representative authority document*, attachment pointing to the uploaded `Binary`. |
| `RelatedPerson` | Representatives only: US Core RelatedPerson profile, `relationship` `POWATT`, `GUARD` (v3-RoleCode) or `RESP` (v3-ParticipationType). |
| `Consent` | The choice. None for a Payer-to-Payer withdrawal. |
| `Provenance` | Activity `CREATE` and `ONLINEWRIT`; agents author (with `onBehalfOf` the member for a representative) and custodian; `entity` the form's canonical. |

The Consent takes its shape from the switch:

| Element | Provider Access | Payer-to-Payer |
|---|---|---|
| `meta.profile` | `http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-provider-consent` | `http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-consent` |
| `category` | `IDSCL` and PDex API purpose `provider-access` | `IDSCL` and PDex API purpose `payer-to-payer` |
| `provision.type` | `deny` for an opt-out, `permit` to share again | `permit` |
| `provision.period` | `start` = the day of the choice | `start` = the day of the choice, `end` = the settings' end date |
| `provision.actor` | The plan organization as `performer`; for a representative, also the RelatedPerson in their authority role | Each named plan as `performer` (source) and the plan organization as `IRCP` (recipient); for a representative, also the RelatedPerson in their authority role |
| `policy` | None | `#sensitive` for all information, `#regular` for non-sensitive only |
| `policyRule` | `cric` | None |
| `performer` | The member, also when a representative signs | The member, or the representative who signed |

Records carry their profile only while `active`: a representative's draft has none until it is approved, and a retired or rejected record loses it. The profiles' canonical URLs carry no version.

{% code title="Consent written for a Provider Access opt-out" %}
```json
{
  "resourceType": "Consent",
  "id": "67d8623c-9af9-4dac-a40d-f5f30bb856ea",
  "meta": {
    "profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-provider-consent"],
    "lastUpdated": "2026-10-06T14:22:00.959447Z"
  },
  "status": "active",
  "scope": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/consentscope", "code": "patient-privacy", "display": "Privacy Consent" }] },
  "category": [
    { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "IDSCL", "display": "information disclosure" }] },
    { "coding": [{ "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose", "code": "provider-access" }] }
  ],
  "patient": { "reference": "Patient/example-member" },
  "dateTime": "2026-10-06T14:22:00.000Z",
  "performer": [{ "reference": "Patient/example-member" }],
  "organization": [{ "reference": "Organization/example-health-plan" }],
  "sourceReference": { "reference": "DocumentReference/23f02707-189f-40b7-a752-6f19cb37116b" },
  "policyRule": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/consentpolicycodes", "code": "cric", "display": "Common Rule Informed Consent" }] },
  "provision": {
    "type": "deny",
    "period": { "start": "2026-10-06" },
    "actor": [{
      "role": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type", "code": "performer", "display": "Performer" }] },
      "reference": { "reference": "Organization/example-health-plan" }
    }],
    "action": [{ "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/consentaction", "code": "disclose", "display": "Disclose" }] }]
  }
}
```
{% endcode %}

{% code title="Payer-to-Payer opt-in: the elements that differ" %}
```json
{
  "meta": { "profile": ["http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-consent"] },
  "category": [
    { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "IDSCL" }] },
    { "coding": [{ "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose", "code": "payer-to-payer" }] }
  ],
  "policy": [{ "uri": "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-consent.html#sensitive" }],
  "provision": {
    "type": "permit",
    "period": { "start": "2026-10-06", "end": "2027-12-31" },
    "actor": [
      { "role": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type", "code": "performer" }] },
        "reference": { "reference": "Organization/lakeside-health-plan", "display": "Lakeside Health Plan" } },
      { "role": { "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType", "code": "IRCP" }] },
        "reference": { "reference": "Organization/example-health-plan" } }
    ],
    "action": [{ "coding": [{ "system": "http://terminology.hl7.org/CodeSystem/consentaction", "code": "disclose" }] }]
  }
}
```
{% endcode %}

The earlier records of the same switch, active or draft, are retired in the same transaction: `status` becomes `inactive` and the PDex or HRex profile is removed, pinned with `If-Match` to the version read.

## Errors

Member endpoints:

| Status | `error` | When |
|---|---|---|
| `400` | `invalid_json`, `invalid_body`, `unknown_questionnaire` | The body is not JSON, not a QuestionnaireResponse with a `questionnaire`, or names another form. `unknown_questionnaire` lists the `allowed` canonicals. |
| `400` | `invalid_answers` | `details` lists what is wrong, such as a missing answer, an unknown item, a plan that is not a registered previous payer, or the non-sensitive option where it is not offered. |
| `400` | `invalid_multipart`, `file_required`, `empty_file` | Document upload without a usable `file`. |
| `401` | `Authentication required`, `Session expired` | No portal session, or an expired one. |
| `403` | `csrf_header_required` | A non-`GET` request without `X-Requested-With` or `X-Target-Portal`. |
| `403` | `not_a_member` | The signed-in user is not linked to a Patient. |
| `403` | `consent_capture_read_only` | A write on a read-only deployment. |
| `403` | `consent_write_forbidden` | Aidbox refused the write under the member's token. |
| `404` | `consent_capture_off` | Member consent capture is not enabled. |
| `409` | `consent_capture_not_configured` | The plan organization or the Payer-to-Payer end date is not set, or the organization is not found. |
| `409` | `consent_write_conflict` | A record changed between the read and the write; nothing was saved. |
| `413` | `file_too_large` | The document exceeds 10 MB (`maxBytes`). |
| `415` | `unsupported_type` | The document is not a PDF, JPEG or PNG. |
| `422` | `consent_write_rejected` | Aidbox rejected a record: `detail` holds its `OperationOutcome`. |
| `500` | `questionnaire_missing` | The form is not loaded on the deployment. |
| `502` | `consent_lookup_failed`, `response_lookup_failed`, `document_lookup_failed`, `patient_lookup_failed`, `consent_save_failed`, `consent_write_failed`, `document_upload_failed`, `previous_payers_unavailable` | Aidbox could not be read or written. |

Admin endpoints:

| Status | `error` | When |
|---|---|---|
| `400` | `invalid_patient_id`, `invalid_consent_id` | The id in the path is not a valid Aidbox id. |
| `400` | A validation message | Settings, registration or review body problems, for example `p2pPeriodEnd must not be in the past`, `Organization/<id> not found`, `Enter a valid 10-digit NPI`, `decision must be approve or reject`. |
| `401` | `Authentication required`, `Invalid or expired token` | No credentials, or credentials Aidbox does not accept. |
| `403` | `Forbidden` | The caller is neither an admin nor the `admin-api` client. |
| `404` | `consent_capture_off`, `not_found` | Capture is not enabled, or the Consent does not exist or does not belong to this feature. |
| `409` | `npi_exists` | A registered previous payer already carries the NPI. |
| `409` | `not_pending`, `review_conflict` | The Consent is no longer a draft, or a record changed during the review; nothing was saved. |
| `500` | `consent_without_patient` | The draft has no patient reference. |
| `502` | `consent_lookup_failed`, `review_save_failed`, `consent_review_failed`, and `Failed to …` messages | Aidbox could not be read or written. |

## Current limitations

- Member endpoints accept only portal sessions; there is no token-based access for members.
- One plan organization per deployment.
- The Consent and QuestionnaireResponse profiles name profiles as reference targets, so referenced records must declare those profiles in `meta.profile`, without a version:
  - the member's Patient: `us-core-patient`;
  - the plan organization and previous payers: `hrex-organization`;
  - a representative: `us-core-relatedperson`.

  The portal declares them on the previous payers and representatives it creates. Patients and the plan organization come from your data. A save that references a record without its declaration fails with `422` `consent_write_rejected`.
- The non-sensitive Payer-to-Payer scope moves no data until sensitive data is labeled.
- Previous payers cannot be renamed or removed through these endpoints.
- Reads return up to 2,000 records of each type per member, newest first.

## Related

{% content-ref url="../../fhir-app-portal/data-sharing.md" %}
[data-sharing.md](../../fhir-app-portal/data-sharing.md)
{% endcontent-ref %}

{% content-ref url="../../data-integration/consent/README.md" %}
[README.md](../../data-integration/consent/README.md)
{% endcontent-ref %}

{% content-ref url="provider-member-match.md" %}
[provider-member-match.md](provider-member-match.md)
{% endcontent-ref %}
