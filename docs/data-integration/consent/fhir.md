---
description: >-
  Submit member consent decisions as FHIR transaction bundles and retrieve the
  resulting resources. Includes business identifiers, conditional updates,
  Provider Access and Payer-to-Payer decisions, forms, and coverage resources.
---

# Member Consent (FHIR)

Submit member consent decisions to Payerbox as FHIR transaction bundles. Each bundle records one decision and includes the Consent and its supporting resources.

Provider Access decisions use the [PDex Provider Consent](https://hl7.org/fhir/us/davinci-pdex/STU2.1/StructureDefinition-pdex-provider-consent.html) profile. Payer-to-Payer decisions use the [HRex Consent](https://hl7.org/fhir/us/davinci-hrex/1.2.0/StructureDefinition-hrex-consent.html) profile, with [HRex Coverage](https://hl7.org/fhir/us/davinci-hrex/1.2.0/StructureDefinition-hrex-coverage.html) resources for the member's previous or concurrent coverage.

For field requirements, see the [Consent](../../api-reference/resources/consent.md) reference; for CSV imports, see [Member Consent (CSV)](csv.md).

## Conventions

- **One transaction per decision.** Submit a `Bundle` of `type: transaction` to `POST /fhir`; all entries succeed or the transaction fails.
- **Conditional updates by business identifier.** Use `PUT <Type>?identifier=<system>|<value>`: no match creates a resource, one match updates it, and multiple matches fail the transaction.
- **One Consent per member and consent type.** Use the Member ID as `identifier.value` and a separate `identifier.system` for each type. New decisions update the Consent; earlier versions remain in `_history`, and each decision has its own form.
- **References by identifier.** Use `<Type>?identifier=<system>|<value>` for existing Patients and Organizations; the server requires exactly one match and replaces the search URL with the resource reference. For resources in the same bundle, use `fullUrl`.
- **Forms as QuestionnaireResponses.** Set `questionnaire` to your Questionnaire's canonical URL.

The example `identifier.system` URLs below are placeholders. Replace them with your own stable identifier systems.

| Resource | Business identifier (`identifier.value`) | Identifier system |
|---|---|---|
| Consent, Provider Access | Member ID | `https://example.org/fhir/sid/provider-access-consent` |
| Consent, Payer-to-Payer | Member ID | `https://example.org/fhir/sid/payer-to-payer-consent` |
| QuestionnaireResponse; DocumentReference (Payer-to-Payer only) | form identifier (`PAC-000117`) | `https://example.org/fhir/sid/consent-form` |
| Coverage | plan entry identifier (`PCV-000342-1`) | `https://example.org/fhir/sid/other-plan-coverage` |
| Organization for a manually entered health plan | plan entry identifier | `https://example.org/fhir/sid/unlisted-payer` |

| Referenced resource | Reference |
|---|---|
| The member | `Patient?identifier=https://example.org/fhir/sid/member-id\|<Member ID>` |
| Your plan's Organization | Use the NAIC code of the Organization configured in [Consent Settings](../../fhir-app-portal/consent-settings.md): `Organization?identifier=urn:oid:2.16.840.1.113883.6.300\|<NAIC code>`. For a TIN, use `Organization?identifier=urn:oid:2.16.840.1.113883.4.4\|<XX-XXXXXXX>`. |
| Another health plan's Organization | Use the NAIC code or TIN of a plan registered in [Consent Settings](../../fhir-app-portal/consent-settings.md#other-health-plans-members-can-pick) or loaded with your data. |
| A resource in the same bundle | Use its `fullUrl`. |

An identifier may also appear on an Organization outside the registered plan list. If the identifier matches multiple Organizations, use the intended Organization's logical reference, `Organization/<id>`.

## Before the first decision

Referenced Patients and Organizations must already exist and declare these profiles in `meta.profile`:

| Resource | Required profiles | Identifier |
|---|---|---|
| Your plan and registered health plans | HRex Organization | NAIC or TIN |
| Member | US Core Patient; HRex Patient Demographics for Coverage references | Member ID |

See [Referenced records](../../api-reference/resources/consent.md#referenced-records) for details.

These resources are loaded with your data or configured through Consent Settings. Bundle 00 creates them in an empty test environment, using the five-digit NAIC value `12345` required by US Core.

The bundle includes explicit resource IDs, which must match any existing resources found by the conditional updates.

### 00. Sandbox setup

{% file src="../../../assets/data-integration/consent/00-sandbox-setup.json" %}
00-sandbox-setup.json
{% endfile %}

{% tabs %}
{% tab title="Request" %}

```http
POST /fhir
Content-Type: application/fhir+json
Prefer: return=minimal

{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "Organization",
        "id": "example-health-plan",
        "meta": {"profile": ["http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-organization"]},
        "active": true,
        "type": [{
          "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/organization-type",
            "code": "pay",
            "display": "Payer"
          }]
        }],
        "name": "Example Health Plan",
        "identifier": [{"system": "urn:oid:2.16.840.1.113883.6.300", "value": "12345"}]
      },
      "request": {"method": "PUT", "url": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|12345"}
    },
    {
      "resource": {
        "resourceType": "Organization",
        "id": "lakeside-health-plan",
        "meta": {"profile": ["http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-organization"]},
        "active": true,
        "type": [{
          "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/organization-type",
            "code": "pay",
            "display": "Payer"
          }]
        }],
        "name": "Lakeside Health Plan",
        "identifier": [{"system": "urn:oid:2.16.840.1.113883.6.300", "value": "67890"}]
      },
      "request": {"method": "PUT", "url": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|67890"}
    },
    {
      "resource": {
        "resourceType": "Organization",
        "id": "riverbend-health-cooperative",
        "meta": {"profile": ["http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-organization"]},
        "active": true,
        "type": [{
          "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/organization-type",
            "code": "pay",
            "display": "Payer"
          }]
        }],
        "name": "Riverbend Health Cooperative",
        "identifier": [{"system": "urn:oid:2.16.840.1.113883.6.300", "value": "54321"}]
      },
      "request": {"method": "PUT", "url": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|54321"}
    },
    {
      "resource": {
        "resourceType": "Patient",
        "id": "example-member",
        "meta": {
          "profile": [
            "http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient",
            "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-patient-demographics"
          ]
        },
        "identifier": [{
          "type": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v2-0203", "code": "MB"}]},
          "system": "https://example.org/fhir/sid/member-id",
          "value": "MBR0000012"
        }],
        "active": true,
        "name": [{"family": "Alvarez", "given": ["Maria", "Elena"]}],
        "gender": "female",
        "birthDate": "1961-04-17"
      },
      "request": {"method": "PUT", "url": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"}
    }
  ]
}
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "type": "transaction-response",
  "resourceType": "Bundle",
  "entry": [
    {
      "response": {
        "etag": "135",
        "location": "<base>/fhir/Organization/example-health-plan/_history/135",
        "status": "201",
        "lastModified": "2026-10-22T13:05:58.678191Z"
      }
    },
    {
      "response": {
        "etag": "137",
        "location": "<base>/fhir/Organization/lakeside-health-plan/_history/137",
        "status": "201",
        "lastModified": "2026-10-22T13:05:58.678191Z"
      }
    },
    {
      "response": {
        "etag": "139",
        "location": "<base>/fhir/Organization/riverbend-health-cooperative/_history/139",
        "status": "201",
        "lastModified": "2026-10-22T13:05:58.678191Z"
      }
    },
    {
      "response": {
        "etag": "141",
        "location": "<base>/fhir/Patient/example-member/_history/141",
        "status": "201",
        "lastModified": "2026-10-22T13:05:58.678191Z"
      }
    }
  ],
  "id": "ba1304df-16b1-442d-a07e-5189e1517c41"
}
```

{% endtab %}
{% endtabs %}

## The decisions

Examples 01–05 follow one member's consent decisions in chronological order.

### 01. Provider Access opt-out

On October 6, the member opts out of sharing through the Provider Access API.

- The Consent is created (`201`) with the Member ID as `identifier.value`, `provision.type` set to `deny`, and `provision.period.start` set to the decision date. The period has no end date.
- `policyRule` requires the `cric` coding, including its `display`.
- `category` includes `IDSCL`, required by PDex 2.1.0, and the API purpose `provider-access` from the PDex 2.2.0 draft. The API purpose distinguishes Provider Access from Payer-to-Payer decisions; both use `IDSCL`.
- The `provision.actor` with role `performer` references your plan's Organization, which would disclose the data through the Provider Access API.
- `sourceReference` links directly to the QuestionnaireResponse; PDex does not require a DocumentReference.

{% file src="../../../assets/data-integration/consent/01-provider-access-opt-out.json" %}
01-provider-access-opt-out.json
{% endfile %}

{% tabs %}
{% tab title="Request" %}

```http
POST /fhir
Content-Type: application/fhir+json
Prefer: return=minimal

{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "QuestionnaireResponse",
        "meta": {"profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"]},
        "identifier": {"system": "https://example.org/fhir/sid/consent-form", "value": "PAC-000117"},
        "questionnaire": "https://example.org/fhir/Questionnaire/provider-access-opt-out",
        "status": "completed",
        "subject": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "authored": "2026-10-06T14:22:00-04:00",
        "author": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "item": [
          {
            "linkId": "decision",
            "text": "Do you want your health information shared with your treating providers?",
            "answer": [{
              "valueCoding": {"code": "opt-out", "display": "No, do not share my information with my providers"}
            }]
          },
          {
            "linkId": "signature",
            "text": "Signature",
            "item": [
              {
                "linkId": "signer",
                "text": "Who is completing this form?",
                "answer": [{"valueCoding": {"code": "self", "display": "Member (myself)"}}]
              },
              {"linkId": "signed-on", "text": "Date", "answer": [{"valueDate": "2026-10-06"}]}
            ]
          }
        ]
      },
      "request": {
        "method": "PUT",
        "url": "QuestionnaireResponse?identifier=https://example.org/fhir/sid/consent-form|PAC-000117"
      },
      "fullUrl": "urn:uuid:5e7a7a00-0000-4000-8000-000000000001"
    },
    {
      "resource": {
        "resourceType": "Consent",
        "meta": {"profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-provider-consent"]},
        "identifier": [{"system": "https://example.org/fhir/sid/provider-access-consent", "value": "MBR0000012"}],
        "status": "active",
        "scope": {
          "coding": [{"system": "http://terminology.hl7.org/CodeSystem/consentscope", "code": "patient-privacy"}]
        },
        "category": [
          {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "IDSCL"}]},
          {
            "coding": [{
              "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose",
              "code": "provider-access"
            }]
          }
        ],
        "patient": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "dateTime": "2026-10-06T14:22:00-04:00",
        "performer": [{"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"}],
        "organization": [{"reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|12345"}],
        "sourceReference": {"reference": "urn:uuid:5e7a7a00-0000-4000-8000-000000000001"},
        "policyRule": {
          "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/consentpolicycodes",
            "code": "cric",
            "display": "Common Rule Informed Consent"
          }]
        },
        "provision": {
          "type": "deny",
          "period": {"start": "2026-10-06"},
          "actor": [{
            "role": {
              "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                "code": "performer"
              }]
            },
            "reference": {"reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|12345"}
          }],
          "action": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/consentaction", "code": "disclose"}]}]
        }
      },
      "request": {
        "method": "PUT",
        "url": "Consent?identifier=https://example.org/fhir/sid/provider-access-consent|MBR0000012"
      }
    }
  ]
}
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "type": "transaction-response",
  "resourceType": "Bundle",
  "entry": [
    {
      "response": {
        "etag": "143",
        "location": "<base>/fhir/QuestionnaireResponse/1d76de2e-dd29-47bd-a832-1860c4cf353f/_history/143",
        "status": "201",
        "lastModified": "2026-10-22T13:05:59.048287Z"
      }
    },
    {
      "response": {
        "etag": "145",
        "location": "<base>/fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22/_history/145",
        "status": "201",
        "lastModified": "2026-10-22T13:05:59.048287Z"
      }
    }
  ],
  "id": "a03a6d55-f68f-46c1-88ae-b495e54ce8a9"
}
```

{% endtab %}
{% endtabs %}

### 02. Share again

On October 9, the member opts back in. The same Consent is updated (`200`) to `permit`, with new decision and effective dates and form `PAC-000158`; the earlier decision remains in its version history and form `PAC-000117`.

{% file src="../../../assets/data-integration/consent/02-share-again.json" %}
02-share-again.json
{% endfile %}

{% tabs %}
{% tab title="Request" %}

```http
POST /fhir
Content-Type: application/fhir+json
Prefer: return=minimal

{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "QuestionnaireResponse",
        "meta": {"profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"]},
        "identifier": {"system": "https://example.org/fhir/sid/consent-form", "value": "PAC-000158"},
        "questionnaire": "https://example.org/fhir/Questionnaire/provider-access-opt-out",
        "status": "completed",
        "subject": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "authored": "2026-10-09T10:05:00-04:00",
        "author": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "item": [
          {
            "linkId": "decision",
            "text": "Do you want your health information shared with your treating providers?",
            "answer": [{"valueCoding": {"code": "share", "display": "Yes, share my information with my providers"}}]
          },
          {
            "linkId": "signature",
            "text": "Signature",
            "item": [
              {
                "linkId": "signer",
                "text": "Who is completing this form?",
                "answer": [{"valueCoding": {"code": "self", "display": "Member (myself)"}}]
              },
              {"linkId": "signed-on", "text": "Date", "answer": [{"valueDate": "2026-10-09"}]}
            ]
          }
        ]
      },
      "request": {
        "method": "PUT",
        "url": "QuestionnaireResponse?identifier=https://example.org/fhir/sid/consent-form|PAC-000158"
      },
      "fullUrl": "urn:uuid:5e7a7a00-0000-4000-8000-000000000003"
    },
    {
      "resource": {
        "resourceType": "Consent",
        "meta": {"profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-provider-consent"]},
        "identifier": [{"system": "https://example.org/fhir/sid/provider-access-consent", "value": "MBR0000012"}],
        "status": "active",
        "scope": {
          "coding": [{"system": "http://terminology.hl7.org/CodeSystem/consentscope", "code": "patient-privacy"}]
        },
        "category": [
          {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "IDSCL"}]},
          {
            "coding": [{
              "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose",
              "code": "provider-access"
            }]
          }
        ],
        "patient": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "dateTime": "2026-10-09T10:05:00-04:00",
        "performer": [{"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"}],
        "organization": [{"reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|12345"}],
        "sourceReference": {"reference": "urn:uuid:5e7a7a00-0000-4000-8000-000000000003"},
        "policyRule": {
          "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/consentpolicycodes",
            "code": "cric",
            "display": "Common Rule Informed Consent"
          }]
        },
        "provision": {
          "type": "permit",
          "period": {"start": "2026-10-09"},
          "actor": [{
            "role": {
              "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                "code": "performer"
              }]
            },
            "reference": {"reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|12345"}
          }],
          "action": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/consentaction", "code": "disclose"}]}]
        }
      },
      "request": {
        "method": "PUT",
        "url": "Consent?identifier=https://example.org/fhir/sid/provider-access-consent|MBR0000012"
      }
    }
  ]
}
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "type": "transaction-response",
  "resourceType": "Bundle",
  "entry": [
    {
      "response": {
        "etag": "147",
        "location": "<base>/fhir/QuestionnaireResponse/6ce846b9-d22c-4c36-a5e7-fbb1115e5af6/_history/147",
        "status": "201",
        "lastModified": "2026-10-22T13:05:59.596598Z"
      }
    },
    {
      "response": {
        "etag": "149",
        "location": "<base>/fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22/_history/149",
        "status": "200",
        "lastModified": "2026-10-22T13:05:59.596598Z"
      }
    }
  ],
  "id": "8658185f-0828-472a-bdb8-a503f623b778"
}
```

{% endtab %}
{% endtabs %}

### 03. Payer-to-Payer opt-in

On October 12, the member authorizes Example Health Plan to request records from two other health plans: Lakeside, a previous plan selected from the registered list, and Blue Valley, a concurrent plan entered manually.

- Blue Valley's Organization uses the plan entry identifier; the Consent and Coverage reference it by `fullUrl`.
- One Consent covers both source plans: actors with role `performer` disclose data, and your plan's Organization with role `IRCP` receives it. HRex names these slices `source` and `recipient`; the JSON contains only the role codes.
- `category` includes `IDSCL` and the API purpose `payer-to-payer`.
- `policy.uri` uses the HRex policy URI ending in `#sensitive`, which includes sensitive data. Both `provision.period.start` and `provision.period.end` are required.
- Each Coverage includes the member ID in `subscriberId` and the `MB` identifier, the subscriber relationship, and a status of `cancelled` for previous coverage or `active` for concurrent coverage. Submit each as `CoverageToMatch` to the corresponding plan's [`$bulk-member-match`](../../api-reference/operations/bulk-member-match.md).
- HRex requires `Consent.sourceReference` to reference a DocumentReference. Its attachment links to the completed QuestionnaireResponse.
- Each `previous-or-concurrent-plan` group identifies a plan, with `plan-kind` set to `previous` or `concurrent`.

{% file src="../../../assets/data-integration/consent/03-payer-to-payer-opt-in.json" %}
03-payer-to-payer-opt-in.json
{% endfile %}

{% tabs %}
{% tab title="Request" %}

```http
POST /fhir
Content-Type: application/fhir+json
Prefer: return=minimal

{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "Organization",
        "meta": {"profile": ["http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-organization"]},
        "active": true,
        "type": [{
          "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/organization-type",
            "code": "pay",
            "display": "Payer"
          }]
        }],
        "name": "Blue Valley Health Plan",
        "identifier": [{"system": "https://example.org/fhir/sid/unlisted-payer", "value": "PCV-000342-2"}]
      },
      "request": {
        "method": "PUT",
        "url": "Organization?identifier=https://example.org/fhir/sid/unlisted-payer|PCV-000342-2"
      },
      "fullUrl": "urn:uuid:5e7a7a00-0000-4000-8000-000000000005"
    },
    {
      "resource": {
        "resourceType": "QuestionnaireResponse",
        "meta": {"profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"]},
        "identifier": {"system": "https://example.org/fhir/sid/consent-form", "value": "P2P-000342"},
        "questionnaire": "https://example.org/fhir/Questionnaire/payer-to-payer-opt-in",
        "status": "completed",
        "subject": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "authored": "2026-10-12T16:40:00-04:00",
        "author": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "item": [
          {
            "linkId": "previous-or-concurrent-plan",
            "text": "Previous or concurrent health plan",
            "item": [
              {
                "linkId": "plan",
                "text": "Health plan",
                "answer": [{
                  "valueReference": {
                    "reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|67890",
                    "display": "Lakeside Health Plan"
                  }
                }]
              },
              {
                "linkId": "plan-member-id",
                "text": "Member ID with that plan",
                "answer": [{"valueString": "XYZ123456789"}]
              },
              {
                "linkId": "plan-relationship",
                "text": "Was that plan in your own name?",
                "answer": [{
                  "valueCoding": {
                    "system": "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
                    "code": "self",
                    "display": "Self"
                  }
                }]
              },
              {
                "linkId": "plan-kind",
                "text": "Is this a plan you had before, or one you have now?",
                "answer": [{"valueCoding": {"code": "previous", "display": "A plan I had before"}}]
              }
            ]
          },
          {
            "linkId": "previous-or-concurrent-plan",
            "text": "Previous or concurrent health plan",
            "item": [
              {
                "linkId": "plan-name",
                "text": "Plan name (as typed by the member)",
                "answer": [{"valueString": "Blue Valley Health Plan"}]
              },
              {
                "linkId": "plan-member-id",
                "text": "Member ID with that plan",
                "answer": [{"valueString": "BVH-4471902"}]
              },
              {
                "linkId": "plan-relationship",
                "text": "Was that plan in your own name?",
                "answer": [{
                  "valueCoding": {
                    "system": "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
                    "code": "self",
                    "display": "Self"
                  }
                }]
              },
              {
                "linkId": "plan-kind",
                "text": "Is this a plan you had before, or one you have now?",
                "answer": [{"valueCoding": {"code": "concurrent", "display": "A plan I have now, alongside this plan"}}]
              }
            ]
          },
          {
            "linkId": "decision",
            "text": "Your decision",
            "item": [
              {
                "linkId": "opt-in",
                "text": "I authorize Example Health Plan to request my health information from the plans above",
                "answer": [{"valueBoolean": true}]
              },
              {"linkId": "end-date", "text": "This authorization ends on", "answer": [{"valueDate": "2027-12-31"}]}
            ]
          },
          {
            "linkId": "signature",
            "text": "Signature",
            "item": [
              {
                "linkId": "signer",
                "text": "Who is completing this form?",
                "answer": [{"valueCoding": {"code": "self", "display": "Member (myself)"}}]
              },
              {"linkId": "signed-on", "text": "Date", "answer": [{"valueDate": "2026-10-12"}]}
            ]
          }
        ]
      },
      "request": {
        "method": "PUT",
        "url": "QuestionnaireResponse?identifier=https://example.org/fhir/sid/consent-form|P2P-000342"
      },
      "fullUrl": "urn:uuid:5e7a7a00-0000-4000-8000-000000000006"
    },
    {
      "resource": {
        "resourceType": "DocumentReference",
        "identifier": [{"system": "https://example.org/fhir/sid/consent-form", "value": "P2P-000342"}],
        "status": "current",
        "type": {"coding": [{"system": "http://loinc.org", "code": "59284-0", "display": "Consent Document"}]},
        "subject": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "date": "2026-10-12T16:40:00-04:00",
        "author": [{"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"}],
        "custodian": {"reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|12345"},
        "description": "Payer-to-Payer opt-in form",
        "content": [{
          "attachment": {
            "contentType": "application/fhir+json",
            "url": "urn:uuid:5e7a7a00-0000-4000-8000-000000000006",
            "title": "Payer-to-Payer opt-in form (answers)",
            "creation": "2026-10-12T16:40:00-04:00"
          }
        }]
      },
      "request": {
        "method": "PUT",
        "url": "DocumentReference?identifier=https://example.org/fhir/sid/consent-form|P2P-000342"
      },
      "fullUrl": "urn:uuid:5e7a7a00-0000-4000-8000-000000000007"
    },
    {
      "resource": {
        "resourceType": "Consent",
        "meta": {"profile": ["http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-consent"]},
        "identifier": [{"system": "https://example.org/fhir/sid/payer-to-payer-consent", "value": "MBR0000012"}],
        "status": "active",
        "scope": {
          "coding": [{"system": "http://terminology.hl7.org/CodeSystem/consentscope", "code": "patient-privacy"}]
        },
        "category": [
          {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "IDSCL"}]},
          {
            "coding": [{
              "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose",
              "code": "payer-to-payer"
            }]
          }
        ],
        "patient": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "dateTime": "2026-10-12T16:40:00-04:00",
        "performer": [{"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"}],
        "organization": [{"reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|12345"}],
        "sourceReference": {"reference": "urn:uuid:5e7a7a00-0000-4000-8000-000000000007"},
        "policy": [{"uri": "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-consent.html#sensitive"}],
        "provision": {
          "type": "permit",
          "period": {"start": "2026-10-12", "end": "2027-12-31"},
          "actor": [
            {
              "role": {
                "coding": [{
                  "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                  "code": "performer"
                }]
              },
              "reference": {
                "reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|67890",
                "display": "Lakeside Health Plan"
              }
            },
            {
              "role": {
                "coding": [{
                  "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                  "code": "performer"
                }]
              },
              "reference": {
                "reference": "urn:uuid:5e7a7a00-0000-4000-8000-000000000005",
                "display": "Blue Valley Health Plan"
              }
            },
            {
              "role": {
                "coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType", "code": "IRCP"}]
              },
              "reference": {
                "reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|12345",
                "display": "Example Health Plan"
              }
            }
          ],
          "action": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/consentaction", "code": "disclose"}]}]
        }
      },
      "request": {
        "method": "PUT",
        "url": "Consent?identifier=https://example.org/fhir/sid/payer-to-payer-consent|MBR0000012"
      }
    },
    {
      "resource": {
        "resourceType": "Coverage",
        "meta": {"profile": ["http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-coverage"]},
        "identifier": [
          {"system": "https://example.org/fhir/sid/other-plan-coverage", "value": "PCV-000342-1"},
          {
            "type": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v2-0203", "code": "MB"}]},
            "value": "XYZ123456789",
            "assigner": {
              "reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|67890",
              "display": "Lakeside Health Plan"
            }
          }
        ],
        "status": "cancelled",
        "subscriberId": "XYZ123456789",
        "beneficiary": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "relationship": {
          "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
            "code": "self",
            "display": "Self"
          }]
        },
        "payor": [{
          "reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|67890",
          "display": "Lakeside Health Plan"
        }]
      },
      "request": {
        "method": "PUT",
        "url": "Coverage?identifier=https://example.org/fhir/sid/other-plan-coverage|PCV-000342-1"
      }
    },
    {
      "resource": {
        "resourceType": "Coverage",
        "meta": {"profile": ["http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-coverage"]},
        "identifier": [
          {"system": "https://example.org/fhir/sid/other-plan-coverage", "value": "PCV-000342-2"},
          {
            "type": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v2-0203", "code": "MB"}]},
            "value": "BVH-4471902",
            "assigner": {
              "reference": "urn:uuid:5e7a7a00-0000-4000-8000-000000000005",
              "display": "Blue Valley Health Plan"
            }
          }
        ],
        "status": "active",
        "subscriberId": "BVH-4471902",
        "beneficiary": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "relationship": {
          "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
            "code": "self",
            "display": "Self"
          }]
        },
        "payor": [{"reference": "urn:uuid:5e7a7a00-0000-4000-8000-000000000005", "display": "Blue Valley Health Plan"}]
      },
      "request": {
        "method": "PUT",
        "url": "Coverage?identifier=https://example.org/fhir/sid/other-plan-coverage|PCV-000342-2"
      }
    }
  ]
}
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "type": "transaction-response",
  "resourceType": "Bundle",
  "entry": [
    {
      "response": {
        "etag": "151",
        "location": "<base>/fhir/Organization/25966a97-da9d-4605-bdcd-22aaff9e48f2/_history/151",
        "status": "201",
        "lastModified": "2026-10-22T13:05:59.778072Z"
      }
    },
    {
      "response": {
        "etag": "153",
        "location": "<base>/fhir/QuestionnaireResponse/e54ba7e3-4554-4268-8b8c-f2feb93ebc59/_history/153",
        "status": "201",
        "lastModified": "2026-10-22T13:05:59.778072Z"
      }
    },
    {
      "response": {
        "etag": "155",
        "location": "<base>/fhir/DocumentReference/cf0bcafe-0ec9-49cc-896d-6c5131154d86/_history/155",
        "status": "201",
        "lastModified": "2026-10-22T13:05:59.778072Z"
      }
    },
    {
      "response": {
        "etag": "157",
        "location": "<base>/fhir/Consent/01a163b7-eefd-79d5-8dc9-68e497f07371/_history/157",
        "status": "201",
        "lastModified": "2026-10-22T13:05:59.778072Z"
      }
    },
    {
      "response": {
        "etag": "159",
        "location": "<base>/fhir/Coverage/01a163b7-f1ce-7271-8ae3-eb7bcc6547e8/_history/159",
        "status": "201",
        "lastModified": "2026-10-22T13:05:59.778072Z"
      }
    },
    {
      "response": {
        "etag": "161",
        "location": "<base>/fhir/Coverage/01a163b7-f281-7174-8392-b70f103983fe/_history/161",
        "status": "201",
        "lastModified": "2026-10-22T13:05:59.778072Z"
      }
    }
  ],
  "id": "7b65ceaa-5a81-46c3-b1da-a11ede37525e"
}
```

{% endtab %}
{% endtabs %}

### 04. Change of plans

On October 13, the member removes Blue Valley from the authorization; the same Consent now lists only Lakeside and references the new form, while both Coverages remain unchanged.

{% file src="../../../assets/data-integration/consent/04-change-of-plans.json" %}
04-change-of-plans.json
{% endfile %}

{% tabs %}
{% tab title="Request" %}

```http
POST /fhir
Content-Type: application/fhir+json
Prefer: return=minimal

{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "QuestionnaireResponse",
        "meta": {"profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"]},
        "identifier": {"system": "https://example.org/fhir/sid/consent-form", "value": "P2P-000351"},
        "questionnaire": "https://example.org/fhir/Questionnaire/payer-to-payer-opt-in",
        "status": "completed",
        "subject": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "authored": "2026-10-13T09:15:00-04:00",
        "author": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "item": [
          {
            "linkId": "previous-or-concurrent-plan",
            "text": "Previous or concurrent health plan",
            "item": [
              {
                "linkId": "plan",
                "text": "Health plan",
                "answer": [{
                  "valueReference": {
                    "reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|67890",
                    "display": "Lakeside Health Plan"
                  }
                }]
              },
              {
                "linkId": "plan-member-id",
                "text": "Member ID with that plan",
                "answer": [{"valueString": "XYZ123456789"}]
              },
              {
                "linkId": "plan-relationship",
                "text": "Was that plan in your own name?",
                "answer": [{
                  "valueCoding": {
                    "system": "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
                    "code": "self",
                    "display": "Self"
                  }
                }]
              },
              {
                "linkId": "plan-kind",
                "text": "Is this a plan you had before, or one you have now?",
                "answer": [{"valueCoding": {"code": "previous", "display": "A plan I had before"}}]
              }
            ]
          },
          {
            "linkId": "decision",
            "text": "Your decision",
            "item": [
              {
                "linkId": "opt-in",
                "text": "I authorize Example Health Plan to request my health information from the plans above",
                "answer": [{"valueBoolean": true}]
              },
              {"linkId": "end-date", "text": "This authorization ends on", "answer": [{"valueDate": "2027-12-31"}]}
            ]
          },
          {
            "linkId": "signature",
            "text": "Signature",
            "item": [
              {
                "linkId": "signer",
                "text": "Who is completing this form?",
                "answer": [{"valueCoding": {"code": "self", "display": "Member (myself)"}}]
              },
              {"linkId": "signed-on", "text": "Date", "answer": [{"valueDate": "2026-10-13"}]}
            ]
          }
        ]
      },
      "request": {
        "method": "PUT",
        "url": "QuestionnaireResponse?identifier=https://example.org/fhir/sid/consent-form|P2P-000351"
      },
      "fullUrl": "urn:uuid:5e7a7a00-0000-4000-8000-000000000008"
    },
    {
      "resource": {
        "resourceType": "DocumentReference",
        "identifier": [{"system": "https://example.org/fhir/sid/consent-form", "value": "P2P-000351"}],
        "status": "current",
        "type": {"coding": [{"system": "http://loinc.org", "code": "59284-0", "display": "Consent Document"}]},
        "subject": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "date": "2026-10-13T09:15:00-04:00",
        "author": [{"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"}],
        "custodian": {"reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|12345"},
        "description": "Payer-to-Payer opt-in form",
        "content": [{
          "attachment": {
            "contentType": "application/fhir+json",
            "url": "urn:uuid:5e7a7a00-0000-4000-8000-000000000008",
            "title": "Payer-to-Payer opt-in form (answers)",
            "creation": "2026-10-13T09:15:00-04:00"
          }
        }]
      },
      "request": {
        "method": "PUT",
        "url": "DocumentReference?identifier=https://example.org/fhir/sid/consent-form|P2P-000351"
      },
      "fullUrl": "urn:uuid:5e7a7a00-0000-4000-8000-000000000009"
    },
    {
      "resource": {
        "resourceType": "Consent",
        "meta": {"profile": ["http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-consent"]},
        "identifier": [{"system": "https://example.org/fhir/sid/payer-to-payer-consent", "value": "MBR0000012"}],
        "status": "active",
        "scope": {
          "coding": [{"system": "http://terminology.hl7.org/CodeSystem/consentscope", "code": "patient-privacy"}]
        },
        "category": [
          {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "IDSCL"}]},
          {
            "coding": [{
              "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose",
              "code": "payer-to-payer"
            }]
          }
        ],
        "patient": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "dateTime": "2026-10-13T09:15:00-04:00",
        "performer": [{"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"}],
        "organization": [{"reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|12345"}],
        "sourceReference": {"reference": "urn:uuid:5e7a7a00-0000-4000-8000-000000000009"},
        "policy": [{"uri": "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-consent.html#sensitive"}],
        "provision": {
          "type": "permit",
          "period": {"start": "2026-10-13", "end": "2027-12-31"},
          "actor": [
            {
              "role": {
                "coding": [{
                  "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                  "code": "performer"
                }]
              },
              "reference": {
                "reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|67890",
                "display": "Lakeside Health Plan"
              }
            },
            {
              "role": {
                "coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType", "code": "IRCP"}]
              },
              "reference": {
                "reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|12345",
                "display": "Example Health Plan"
              }
            }
          ],
          "action": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/consentaction", "code": "disclose"}]}]
        }
      },
      "request": {
        "method": "PUT",
        "url": "Consent?identifier=https://example.org/fhir/sid/payer-to-payer-consent|MBR0000012"
      }
    }
  ]
}
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "type": "transaction-response",
  "resourceType": "Bundle",
  "entry": [
    {
      "response": {
        "etag": "163",
        "location": "<base>/fhir/QuestionnaireResponse/4d27435a-66c5-4fde-9536-0534113bed11/_history/163",
        "status": "201",
        "lastModified": "2026-10-22T13:06:02.001074Z"
      }
    },
    {
      "response": {
        "etag": "165",
        "location": "<base>/fhir/DocumentReference/e756452c-fcc7-4950-9aa2-ac01d770c173/_history/165",
        "status": "201",
        "lastModified": "2026-10-22T13:06:02.001074Z"
      }
    },
    {
      "response": {
        "etag": "167",
        "location": "<base>/fhir/Consent/01a163b7-eefd-79d5-8dc9-68e497f07371/_history/167",
        "status": "200",
        "lastModified": "2026-10-22T13:06:02.001074Z"
      }
    }
  ],
  "id": "a96315cb-92a4-4654-979e-36212361f81b"
}
```

{% endtab %}
{% endtabs %}

### 05. Payer-to-Payer withdrawal

On October 14, the member withdraws authorization: the same Consent becomes `inactive`, references the withdrawal document, and retains its `provision.period`. The HRex profile is removed because it requires `status: active`.

{% file src="../../../assets/data-integration/consent/05-payer-to-payer-withdrawal.json" %}
05-payer-to-payer-withdrawal.json
{% endfile %}

{% tabs %}
{% tab title="Request" %}

```http
POST /fhir
Content-Type: application/fhir+json
Prefer: return=minimal

{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "QuestionnaireResponse",
        "meta": {"profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"]},
        "identifier": {"system": "https://example.org/fhir/sid/consent-form", "value": "P2P-000360"},
        "questionnaire": "https://example.org/fhir/Questionnaire/payer-to-payer-opt-in",
        "status": "completed",
        "subject": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "authored": "2026-10-14T11:30:00-04:00",
        "author": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "item": [
          {
            "linkId": "decision",
            "text": "Your decision",
            "item": [{
              "linkId": "withdraw",
              "text": "I withdraw my authorization for Example Health Plan to request my health information from other plans",
              "answer": [{"valueBoolean": true}]
            }]
          },
          {
            "linkId": "signature",
            "text": "Signature",
            "item": [
              {
                "linkId": "signer",
                "text": "Who is completing this form?",
                "answer": [{"valueCoding": {"code": "self", "display": "Member (myself)"}}]
              },
              {"linkId": "signed-on", "text": "Date", "answer": [{"valueDate": "2026-10-14"}]}
            ]
          }
        ]
      },
      "request": {
        "method": "PUT",
        "url": "QuestionnaireResponse?identifier=https://example.org/fhir/sid/consent-form|P2P-000360"
      },
      "fullUrl": "urn:uuid:5e7a7a00-0000-4000-8000-000000000010"
    },
    {
      "resource": {
        "resourceType": "DocumentReference",
        "identifier": [{"system": "https://example.org/fhir/sid/consent-form", "value": "P2P-000360"}],
        "status": "current",
        "type": {"coding": [{"system": "http://loinc.org", "code": "59284-0", "display": "Consent Document"}]},
        "subject": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "date": "2026-10-14T11:30:00-04:00",
        "author": [{"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"}],
        "custodian": {"reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|12345"},
        "description": "Payer-to-Payer withdrawal",
        "content": [{
          "attachment": {
            "contentType": "application/fhir+json",
            "url": "urn:uuid:5e7a7a00-0000-4000-8000-000000000010",
            "title": "Payer-to-Payer withdrawal (answers)",
            "creation": "2026-10-14T11:30:00-04:00"
          }
        }]
      },
      "request": {
        "method": "PUT",
        "url": "DocumentReference?identifier=https://example.org/fhir/sid/consent-form|P2P-000360"
      },
      "fullUrl": "urn:uuid:5e7a7a00-0000-4000-8000-000000000011"
    },
    {
      "resource": {
        "resourceType": "Consent",
        "identifier": [{"system": "https://example.org/fhir/sid/payer-to-payer-consent", "value": "MBR0000012"}],
        "status": "inactive",
        "scope": {
          "coding": [{"system": "http://terminology.hl7.org/CodeSystem/consentscope", "code": "patient-privacy"}]
        },
        "category": [
          {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "IDSCL"}]},
          {
            "coding": [{
              "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose",
              "code": "payer-to-payer"
            }]
          }
        ],
        "patient": {"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"},
        "dateTime": "2026-10-14T11:30:00-04:00",
        "performer": [{"reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"}],
        "organization": [{"reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|12345"}],
        "sourceReference": {"reference": "urn:uuid:5e7a7a00-0000-4000-8000-000000000011"},
        "policy": [{"uri": "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-consent.html#sensitive"}],
        "provision": {
          "type": "permit",
          "period": {"start": "2026-10-13", "end": "2027-12-31"},
          "actor": [
            {
              "role": {
                "coding": [{
                  "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                  "code": "performer"
                }]
              },
              "reference": {
                "reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|67890",
                "display": "Lakeside Health Plan"
              }
            },
            {
              "role": {
                "coding": [{"system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType", "code": "IRCP"}]
              },
              "reference": {
                "reference": "Organization?identifier=urn:oid:2.16.840.1.113883.6.300|12345",
                "display": "Example Health Plan"
              }
            }
          ],
          "action": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/consentaction", "code": "disclose"}]}]
        }
      },
      "request": {
        "method": "PUT",
        "url": "Consent?identifier=https://example.org/fhir/sid/payer-to-payer-consent|MBR0000012"
      }
    }
  ]
}
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "type": "transaction-response",
  "resourceType": "Bundle",
  "entry": [
    {
      "response": {
        "etag": "169",
        "location": "<base>/fhir/QuestionnaireResponse/75b71653-e481-420c-b046-20dd60489a59/_history/169",
        "status": "201",
        "lastModified": "2026-10-22T13:06:02.038989Z"
      }
    },
    {
      "response": {
        "etag": "171",
        "location": "<base>/fhir/DocumentReference/68ef44da-f4a1-482e-9db7-4ee73108c315/_history/171",
        "status": "201",
        "lastModified": "2026-10-22T13:06:02.038989Z"
      }
    },
    {
      "response": {
        "etag": "173",
        "location": "<base>/fhir/Consent/01a163b7-eefd-79d5-8dc9-68e497f07371/_history/173",
        "status": "200",
        "lastModified": "2026-10-22T13:06:02.038989Z"
      }
    }
  ],
  "id": "edb47f16-6f08-4868-bd7c-7eb2b3135e09"
}
```

{% endtab %}
{% endtabs %}

## Retrieve submitted resources

| Need | Request |
|---|---|
| The Provider Access decision | `GET /fhir/Consent?identifier=https://example.org/fhir/sid/provider-access-consent\|<Member ID>` — one Consent, `deny` after 01, `permit` after 02 |
| The Payer-to-Payer decision | `GET /fhir/Consent?identifier=https://example.org/fhir/sid/payer-to-payer-consent\|<Member ID>` — one Consent, `active` after 03, `inactive` after 05 |
| Both | `GET /fhir/Consent?patient:Patient.identifier=https://example.org/fhir/sid/member-id\|<Member ID>` |
| Earlier decisions | `GET /fhir/Consent/<id>/_history` |

Aidbox requires the target type `:Patient` in `patient:Patient.identifier`. The `actor` search parameter matches Organizations in any actor role; it does not distinguish source plans from the recipient.

## Search examples

These examples show the results after submitting bundles 00–05 in order.

### All consents of the member, with their organizations

Get both Consents and the Organizations referenced by their actors.

{% tabs %}
{% tab title="Request" %}

```http
GET /fhir/Consent?patient:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&_include=Consent:actor
Accept: application/fhir+json
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "meta": {"versionId": "0"},
  "total": 2,
  "link": [
    {
      "relation": "first",
      "url": "<base>/fhir/Consent?patient:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&_include=Consent:actor&_page=1"
    },
    {
      "relation": "self",
      "url": "<base>/fhir/Consent?patient:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&_include=Consent:actor&_page=1"
    }
  ],
  "entry": [
    {
      "resource": {
        "patient": {"reference": "Patient/example-member"},
        "category": [
          {"coding": [{"code": "IDSCL", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"}]},
          {
            "coding": [{
              "code": "provider-access",
              "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose"
            }]
          }
        ],
        "provision": {
          "type": "permit",
          "actor": [{
            "role": {
              "coding": [{
                "code": "performer",
                "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type"
              }]
            },
            "reference": {"reference": "Organization/example-health-plan"}
          }],
          "action": [{"coding": [{"code": "disclose", "system": "http://terminology.hl7.org/CodeSystem/consentaction"}]}],
          "period": {"start": "2026-10-09"}
        },
        "meta": {
          "profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-provider-consent"],
          "lastUpdated": "2026-10-22T13:05:59.596598Z",
          "versionId": "149",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.048287Z"}]
        },
        "organization": [{"reference": "Organization/example-health-plan"}],
        "resourceType": "Consent",
        "scope": {
          "coding": [{"code": "patient-privacy", "system": "http://terminology.hl7.org/CodeSystem/consentscope"}]
        },
        "sourceReference": {"reference": "QuestionnaireResponse/6ce846b9-d22c-4c36-a5e7-fbb1115e5af6"},
        "dateTime": "2026-10-09T10:05:00-04:00",
        "status": "active",
        "id": "01a163b7-e91d-7039-813c-f4cddb9b8e22",
        "policyRule": {
          "coding": [{
            "code": "cric",
            "system": "http://terminology.hl7.org/CodeSystem/consentpolicycodes",
            "display": "Common Rule Informed Consent"
          }]
        },
        "identifier": [{"value": "MBR0000012", "system": "https://example.org/fhir/sid/provider-access-consent"}],
        "performer": [{"reference": "Patient/example-member"}]
      },
      "search": {"mode": "match"},
      "fullUrl": "<base>/fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22",
      "link": [{"relation": "self", "url": "<base>/fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22"}]
    },
    {
      "resource": {
        "patient": {"reference": "Patient/example-member"},
        "category": [
          {"coding": [{"code": "IDSCL", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"}]},
          {
            "coding": [{
              "code": "payer-to-payer",
              "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose"
            }]
          }
        ],
        "provision": {
          "type": "permit",
          "actor": [
            {
              "role": {
                "coding": [{
                  "code": "performer",
                  "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type"
                }]
              },
              "reference": {"display": "Lakeside Health Plan", "reference": "Organization/lakeside-health-plan"}
            },
            {
              "role": {
                "coding": [{"code": "IRCP", "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType"}]
              },
              "reference": {"display": "Example Health Plan", "reference": "Organization/example-health-plan"}
            }
          ],
          "action": [{"coding": [{"code": "disclose", "system": "http://terminology.hl7.org/CodeSystem/consentaction"}]}],
          "period": {"end": "2027-12-31", "start": "2026-10-13"}
        },
        "meta": {
          "lastUpdated": "2026-10-22T13:06:02.038989Z",
          "versionId": "173",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.778072Z"}]
        },
        "organization": [{"reference": "Organization/example-health-plan"}],
        "resourceType": "Consent",
        "scope": {
          "coding": [{"code": "patient-privacy", "system": "http://terminology.hl7.org/CodeSystem/consentscope"}]
        },
        "policy": [{"uri": "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-consent.html#sensitive"}],
        "sourceReference": {"reference": "DocumentReference/68ef44da-f4a1-482e-9db7-4ee73108c315"},
        "dateTime": "2026-10-14T11:30:00-04:00",
        "status": "inactive",
        "id": "01a163b7-eefd-79d5-8dc9-68e497f07371",
        "identifier": [{"value": "MBR0000012", "system": "https://example.org/fhir/sid/payer-to-payer-consent"}],
        "performer": [{"reference": "Patient/example-member"}]
      },
      "search": {"mode": "match"},
      "fullUrl": "<base>/fhir/Consent/01a163b7-eefd-79d5-8dc9-68e497f07371",
      "link": [{"relation": "self", "url": "<base>/fhir/Consent/01a163b7-eefd-79d5-8dc9-68e497f07371"}]
    },
    {
      "resource": {
        "meta": {
          "profile": ["http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-organization"],
          "lastUpdated": "2026-10-22T13:05:58.678191Z",
          "versionId": "135",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:58.678191Z"}]
        },
        "name": "Example Health Plan",
        "type": [{
          "coding": [{
            "code": "pay",
            "system": "http://terminology.hl7.org/CodeSystem/organization-type",
            "display": "Payer"
          }]
        }],
        "active": true,
        "identifier": [{"value": "12345", "system": "urn:oid:2.16.840.1.113883.6.300"}],
        "id": "example-health-plan",
        "resourceType": "Organization"
      },
      "search": {"mode": "include"},
      "fullUrl": "<base>/fhir/Organization/example-health-plan",
      "link": [{"relation": "self", "url": "<base>/fhir/Organization/example-health-plan"}]
    },
    {
      "resource": {
        "meta": {
          "profile": ["http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-organization"],
          "lastUpdated": "2026-10-22T13:05:58.678191Z",
          "versionId": "137",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:58.678191Z"}]
        },
        "name": "Lakeside Health Plan",
        "type": [{
          "coding": [{
            "code": "pay",
            "system": "http://terminology.hl7.org/CodeSystem/organization-type",
            "display": "Payer"
          }]
        }],
        "active": true,
        "identifier": [{"value": "67890", "system": "urn:oid:2.16.840.1.113883.6.300"}],
        "id": "lakeside-health-plan",
        "resourceType": "Organization"
      },
      "search": {"mode": "include"},
      "fullUrl": "<base>/fhir/Organization/lakeside-health-plan",
      "link": [{"relation": "self", "url": "<base>/fhir/Organization/lakeside-health-plan"}]
    }
  ]
}
```

{% endtab %}
{% endtabs %}

### Consents with their forms

Get both Consents with the Provider Access QuestionnaireResponse and the Payer-to-Payer DocumentReference.

{% tabs %}
{% tab title="Request" %}

```http
GET /fhir/Consent?patient:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&_include=Consent:source-reference
Accept: application/fhir+json
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "meta": {"versionId": "0"},
  "total": 2,
  "link": [
    {
      "relation": "first",
      "url": "<base>/fhir/Consent?patient:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&_include=Consent:source-reference&_page=1"
    },
    {
      "relation": "self",
      "url": "<base>/fhir/Consent?patient:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&_include=Consent:source-reference&_page=1"
    }
  ],
  "entry": [
    {
      "resource": {
        "patient": {"reference": "Patient/example-member"},
        "category": [
          {"coding": [{"code": "IDSCL", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"}]},
          {
            "coding": [{
              "code": "provider-access",
              "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose"
            }]
          }
        ],
        "provision": {
          "type": "permit",
          "actor": [{
            "role": {
              "coding": [{
                "code": "performer",
                "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type"
              }]
            },
            "reference": {"reference": "Organization/example-health-plan"}
          }],
          "action": [{"coding": [{"code": "disclose", "system": "http://terminology.hl7.org/CodeSystem/consentaction"}]}],
          "period": {"start": "2026-10-09"}
        },
        "meta": {
          "profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-provider-consent"],
          "lastUpdated": "2026-10-22T13:05:59.596598Z",
          "versionId": "149",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.048287Z"}]
        },
        "organization": [{"reference": "Organization/example-health-plan"}],
        "resourceType": "Consent",
        "scope": {
          "coding": [{"code": "patient-privacy", "system": "http://terminology.hl7.org/CodeSystem/consentscope"}]
        },
        "sourceReference": {"reference": "QuestionnaireResponse/6ce846b9-d22c-4c36-a5e7-fbb1115e5af6"},
        "dateTime": "2026-10-09T10:05:00-04:00",
        "status": "active",
        "id": "01a163b7-e91d-7039-813c-f4cddb9b8e22",
        "policyRule": {
          "coding": [{
            "code": "cric",
            "system": "http://terminology.hl7.org/CodeSystem/consentpolicycodes",
            "display": "Common Rule Informed Consent"
          }]
        },
        "identifier": [{"value": "MBR0000012", "system": "https://example.org/fhir/sid/provider-access-consent"}],
        "performer": [{"reference": "Patient/example-member"}]
      },
      "search": {"mode": "match"},
      "fullUrl": "<base>/fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22",
      "link": [{"relation": "self", "url": "<base>/fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22"}]
    },
    {
      "resource": {
        "patient": {"reference": "Patient/example-member"},
        "category": [
          {"coding": [{"code": "IDSCL", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"}]},
          {
            "coding": [{
              "code": "payer-to-payer",
              "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose"
            }]
          }
        ],
        "provision": {
          "type": "permit",
          "actor": [
            {
              "role": {
                "coding": [{
                  "code": "performer",
                  "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type"
                }]
              },
              "reference": {"display": "Lakeside Health Plan", "reference": "Organization/lakeside-health-plan"}
            },
            {
              "role": {
                "coding": [{"code": "IRCP", "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType"}]
              },
              "reference": {"display": "Example Health Plan", "reference": "Organization/example-health-plan"}
            }
          ],
          "action": [{"coding": [{"code": "disclose", "system": "http://terminology.hl7.org/CodeSystem/consentaction"}]}],
          "period": {"end": "2027-12-31", "start": "2026-10-13"}
        },
        "meta": {
          "lastUpdated": "2026-10-22T13:06:02.038989Z",
          "versionId": "173",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.778072Z"}]
        },
        "organization": [{"reference": "Organization/example-health-plan"}],
        "resourceType": "Consent",
        "scope": {
          "coding": [{"code": "patient-privacy", "system": "http://terminology.hl7.org/CodeSystem/consentscope"}]
        },
        "policy": [{"uri": "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-consent.html#sensitive"}],
        "sourceReference": {"reference": "DocumentReference/68ef44da-f4a1-482e-9db7-4ee73108c315"},
        "dateTime": "2026-10-14T11:30:00-04:00",
        "status": "inactive",
        "id": "01a163b7-eefd-79d5-8dc9-68e497f07371",
        "identifier": [{"value": "MBR0000012", "system": "https://example.org/fhir/sid/payer-to-payer-consent"}],
        "performer": [{"reference": "Patient/example-member"}]
      },
      "search": {"mode": "match"},
      "fullUrl": "<base>/fhir/Consent/01a163b7-eefd-79d5-8dc9-68e497f07371",
      "link": [{"relation": "self", "url": "<base>/fhir/Consent/01a163b7-eefd-79d5-8dc9-68e497f07371"}]
    },
    {
      "resource": {
        "questionnaire": "https://example.org/fhir/Questionnaire/provider-access-opt-out",
        "meta": {
          "profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"],
          "lastUpdated": "2026-10-22T13:05:59.596598Z",
          "versionId": "147",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.596598Z"}]
        },
        "item": [
          {
            "text": "Do you want your health information shared with your treating providers?",
            "answer": [{"valueCoding": {"code": "share", "display": "Yes, share my information with my providers"}}],
            "linkId": "decision"
          },
          {
            "item": [
              {
                "text": "Who is completing this form?",
                "answer": [{"valueCoding": {"code": "self", "display": "Member (myself)"}}],
                "linkId": "signer"
              },
              {"text": "Date", "answer": [{"valueDate": "2026-10-09"}], "linkId": "signed-on"}
            ],
            "text": "Signature",
            "linkId": "signature"
          }
        ],
        "resourceType": "QuestionnaireResponse",
        "author": {"reference": "Patient/example-member"},
        "status": "completed",
        "id": "6ce846b9-d22c-4c36-a5e7-fbb1115e5af6",
        "identifier": {"value": "PAC-000158", "system": "https://example.org/fhir/sid/consent-form"},
        "authored": "2026-10-09T10:05:00-04:00",
        "subject": {"reference": "Patient/example-member"}
      },
      "search": {"mode": "include"},
      "fullUrl": "<base>/fhir/QuestionnaireResponse/6ce846b9-d22c-4c36-a5e7-fbb1115e5af6",
      "link": [{"relation": "self", "url": "<base>/fhir/QuestionnaireResponse/6ce846b9-d22c-4c36-a5e7-fbb1115e5af6"}]
    },
    {
      "resource": {
        "description": "Payer-to-Payer withdrawal",
        "date": "2026-10-14T11:30:00-04:00",
        "meta": {
          "lastUpdated": "2026-10-22T13:06:02.038989Z",
          "versionId": "171",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:06:02.038989Z"}]
        },
        "content": [{
          "attachment": {
            "url": "QuestionnaireResponse/75b71653-e481-420c-b046-20dd60489a59",
            "title": "Payer-to-Payer withdrawal (answers)",
            "creation": "2026-10-14T11:30:00-04:00",
            "contentType": "application/fhir+json"
          }
        }],
        "type": {"coding": [{"code": "59284-0", "system": "http://loinc.org", "display": "Consent Document"}]},
        "resourceType": "DocumentReference",
        "author": [{"reference": "Patient/example-member"}],
        "custodian": {"reference": "Organization/example-health-plan"},
        "status": "current",
        "id": "68ef44da-f4a1-482e-9db7-4ee73108c315",
        "identifier": [{"value": "P2P-000360", "system": "https://example.org/fhir/sid/consent-form"}],
        "subject": {"reference": "Patient/example-member"}
      },
      "search": {"mode": "include"},
      "fullUrl": "<base>/fhir/DocumentReference/68ef44da-f4a1-482e-9db7-4ee73108c315",
      "link": [{"relation": "self", "url": "<base>/fhir/DocumentReference/68ef44da-f4a1-482e-9db7-4ee73108c315"}]
    }
  ]
}
```

{% endtab %}
{% endtabs %}

### Retrieve the member, consents, coverages, and forms

Get the member's Patient resource, both Consents, both Coverages, and all five QuestionnaireResponses.

{% tabs %}
{% tab title="Request" %}

```http
GET /fhir/Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012&_revinclude=Consent:patient&_revinclude=Coverage:beneficiary&_revinclude=QuestionnaireResponse:subject
Accept: application/fhir+json
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "meta": {"versionId": "0"},
  "total": 1,
  "link": [
    {
      "relation": "first",
      "url": "<base>/fhir/Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012&_revinclude=Consent:patient&_revinclude=Coverage:beneficiary&_revinclude=QuestionnaireResponse:subject&_page=1"
    },
    {
      "relation": "self",
      "url": "<base>/fhir/Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012&_revinclude=Consent:patient&_revinclude=Coverage:beneficiary&_revinclude=QuestionnaireResponse:subject&_page=1"
    }
  ],
  "entry": [
    {
      "resource": {
        "meta": {
          "profile": [
            "http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient",
            "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-patient-demographics"
          ],
          "lastUpdated": "2026-10-22T13:05:58.678191Z",
          "versionId": "141",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:58.678191Z"}]
        },
        "name": [{"given": ["Maria", "Elena"], "family": "Alvarez"}],
        "active": true,
        "gender": "female",
        "birthDate": "1961-04-17",
        "identifier": [{
          "type": {"coding": [{"code": "MB", "system": "http://terminology.hl7.org/CodeSystem/v2-0203"}]},
          "value": "MBR0000012",
          "system": "https://example.org/fhir/sid/member-id"
        }],
        "id": "example-member",
        "resourceType": "Patient"
      },
      "search": {"mode": "match"},
      "fullUrl": "<base>/fhir/Patient/example-member",
      "link": [{"relation": "self", "url": "<base>/fhir/Patient/example-member"}]
    },
    {
      "resource": {
        "patient": {"reference": "Patient/example-member"},
        "category": [
          {"coding": [{"code": "IDSCL", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"}]},
          {
            "coding": [{
              "code": "provider-access",
              "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose"
            }]
          }
        ],
        "provision": {
          "type": "permit",
          "actor": [{
            "role": {
              "coding": [{
                "code": "performer",
                "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type"
              }]
            },
            "reference": {"reference": "Organization/example-health-plan"}
          }],
          "action": [{"coding": [{"code": "disclose", "system": "http://terminology.hl7.org/CodeSystem/consentaction"}]}],
          "period": {"start": "2026-10-09"}
        },
        "meta": {
          "profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-provider-consent"],
          "lastUpdated": "2026-10-22T13:05:59.596598Z",
          "versionId": "149",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.048287Z"}]
        },
        "organization": [{"reference": "Organization/example-health-plan"}],
        "resourceType": "Consent",
        "scope": {
          "coding": [{"code": "patient-privacy", "system": "http://terminology.hl7.org/CodeSystem/consentscope"}]
        },
        "sourceReference": {"reference": "QuestionnaireResponse/6ce846b9-d22c-4c36-a5e7-fbb1115e5af6"},
        "dateTime": "2026-10-09T10:05:00-04:00",
        "status": "active",
        "id": "01a163b7-e91d-7039-813c-f4cddb9b8e22",
        "policyRule": {
          "coding": [{
            "code": "cric",
            "system": "http://terminology.hl7.org/CodeSystem/consentpolicycodes",
            "display": "Common Rule Informed Consent"
          }]
        },
        "identifier": [{"value": "MBR0000012", "system": "https://example.org/fhir/sid/provider-access-consent"}],
        "performer": [{"reference": "Patient/example-member"}]
      },
      "search": {"mode": "include"},
      "fullUrl": "<base>/fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22",
      "link": [{"relation": "self", "url": "<base>/fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22"}]
    },
    {
      "resource": {
        "patient": {"reference": "Patient/example-member"},
        "category": [
          {"coding": [{"code": "IDSCL", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"}]},
          {
            "coding": [{
              "code": "payer-to-payer",
              "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose"
            }]
          }
        ],
        "provision": {
          "type": "permit",
          "actor": [
            {
              "role": {
                "coding": [{
                  "code": "performer",
                  "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type"
                }]
              },
              "reference": {"display": "Lakeside Health Plan", "reference": "Organization/lakeside-health-plan"}
            },
            {
              "role": {
                "coding": [{"code": "IRCP", "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType"}]
              },
              "reference": {"display": "Example Health Plan", "reference": "Organization/example-health-plan"}
            }
          ],
          "action": [{"coding": [{"code": "disclose", "system": "http://terminology.hl7.org/CodeSystem/consentaction"}]}],
          "period": {"end": "2027-12-31", "start": "2026-10-13"}
        },
        "meta": {
          "lastUpdated": "2026-10-22T13:06:02.038989Z",
          "versionId": "173",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.778072Z"}]
        },
        "organization": [{"reference": "Organization/example-health-plan"}],
        "resourceType": "Consent",
        "scope": {
          "coding": [{"code": "patient-privacy", "system": "http://terminology.hl7.org/CodeSystem/consentscope"}]
        },
        "policy": [{"uri": "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-consent.html#sensitive"}],
        "sourceReference": {"reference": "DocumentReference/68ef44da-f4a1-482e-9db7-4ee73108c315"},
        "dateTime": "2026-10-14T11:30:00-04:00",
        "status": "inactive",
        "id": "01a163b7-eefd-79d5-8dc9-68e497f07371",
        "identifier": [{"value": "MBR0000012", "system": "https://example.org/fhir/sid/payer-to-payer-consent"}],
        "performer": [{"reference": "Patient/example-member"}]
      },
      "search": {"mode": "include"},
      "fullUrl": "<base>/fhir/Consent/01a163b7-eefd-79d5-8dc9-68e497f07371",
      "link": [{"relation": "self", "url": "<base>/fhir/Consent/01a163b7-eefd-79d5-8dc9-68e497f07371"}]
    },
    {
      "resource": {
        "meta": {
          "profile": ["http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-coverage"],
          "lastUpdated": "2026-10-22T13:05:59.778072Z",
          "versionId": "159",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.778072Z"}]
        },
        "beneficiary": {"reference": "Patient/example-member"},
        "relationship": {
          "coding": [{
            "code": "self",
            "system": "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
            "display": "Self"
          }]
        },
        "resourceType": "Coverage",
        "payor": [{"display": "Lakeside Health Plan", "reference": "Organization/lakeside-health-plan"}],
        "status": "cancelled",
        "id": "01a163b7-f1ce-7271-8ae3-eb7bcc6547e8",
        "identifier": [
          {"value": "PCV-000342-1", "system": "https://example.org/fhir/sid/other-plan-coverage"},
          {
            "type": {"coding": [{"code": "MB", "system": "http://terminology.hl7.org/CodeSystem/v2-0203"}]},
            "value": "XYZ123456789",
            "assigner": {"display": "Lakeside Health Plan", "reference": "Organization/lakeside-health-plan"}
          }
        ],
        "subscriberId": "XYZ123456789"
      },
      "search": {"mode": "include"},
      "fullUrl": "<base>/fhir/Coverage/01a163b7-f1ce-7271-8ae3-eb7bcc6547e8",
      "link": [{"relation": "self", "url": "<base>/fhir/Coverage/01a163b7-f1ce-7271-8ae3-eb7bcc6547e8"}]
    },
    {
      "resource": {
        "meta": {
          "profile": ["http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-coverage"],
          "lastUpdated": "2026-10-22T13:05:59.778072Z",
          "versionId": "161",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.778072Z"}]
        },
        "beneficiary": {"reference": "Patient/example-member"},
        "relationship": {
          "coding": [{
            "code": "self",
            "system": "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
            "display": "Self"
          }]
        },
        "resourceType": "Coverage",
        "payor": [{
          "display": "Blue Valley Health Plan",
          "reference": "Organization/25966a97-da9d-4605-bdcd-22aaff9e48f2"
        }],
        "status": "active",
        "id": "01a163b7-f281-7174-8392-b70f103983fe",
        "identifier": [
          {"value": "PCV-000342-2", "system": "https://example.org/fhir/sid/other-plan-coverage"},
          {
            "type": {"coding": [{"code": "MB", "system": "http://terminology.hl7.org/CodeSystem/v2-0203"}]},
            "value": "BVH-4471902",
            "assigner": {
              "display": "Blue Valley Health Plan",
              "reference": "Organization/25966a97-da9d-4605-bdcd-22aaff9e48f2"
            }
          }
        ],
        "subscriberId": "BVH-4471902"
      },
      "search": {"mode": "include"},
      "fullUrl": "<base>/fhir/Coverage/01a163b7-f281-7174-8392-b70f103983fe",
      "link": [{"relation": "self", "url": "<base>/fhir/Coverage/01a163b7-f281-7174-8392-b70f103983fe"}]
    },
    {
      "resource": {
        "questionnaire": "https://example.org/fhir/Questionnaire/provider-access-opt-out",
        "meta": {
          "profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"],
          "lastUpdated": "2026-10-22T13:05:59.048287Z",
          "versionId": "143",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.048287Z"}]
        },
        "item": [
          {
            "text": "Do you want your health information shared with your treating providers?",
            "answer": [{
              "valueCoding": {"code": "opt-out", "display": "No, do not share my information with my providers"}
            }],
            "linkId": "decision"
          },
          {
            "item": [
              {
                "text": "Who is completing this form?",
                "answer": [{"valueCoding": {"code": "self", "display": "Member (myself)"}}],
                "linkId": "signer"
              },
              {"text": "Date", "answer": [{"valueDate": "2026-10-06"}], "linkId": "signed-on"}
            ],
            "text": "Signature",
            "linkId": "signature"
          }
        ],
        "resourceType": "QuestionnaireResponse",
        "author": {"reference": "Patient/example-member"},
        "status": "completed",
        "id": "1d76de2e-dd29-47bd-a832-1860c4cf353f",
        "identifier": {"value": "PAC-000117", "system": "https://example.org/fhir/sid/consent-form"},
        "authored": "2026-10-06T14:22:00-04:00",
        "subject": {"reference": "Patient/example-member"}
      },
      "search": {"mode": "include"},
      "fullUrl": "<base>/fhir/QuestionnaireResponse/1d76de2e-dd29-47bd-a832-1860c4cf353f",
      "link": [{"relation": "self", "url": "<base>/fhir/QuestionnaireResponse/1d76de2e-dd29-47bd-a832-1860c4cf353f"}]
    },
    {
      "resource": {
        "questionnaire": "https://example.org/fhir/Questionnaire/provider-access-opt-out",
        "meta": {
          "profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"],
          "lastUpdated": "2026-10-22T13:05:59.596598Z",
          "versionId": "147",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.596598Z"}]
        },
        "item": [
          {
            "text": "Do you want your health information shared with your treating providers?",
            "answer": [{"valueCoding": {"code": "share", "display": "Yes, share my information with my providers"}}],
            "linkId": "decision"
          },
          {
            "item": [
              {
                "text": "Who is completing this form?",
                "answer": [{"valueCoding": {"code": "self", "display": "Member (myself)"}}],
                "linkId": "signer"
              },
              {"text": "Date", "answer": [{"valueDate": "2026-10-09"}], "linkId": "signed-on"}
            ],
            "text": "Signature",
            "linkId": "signature"
          }
        ],
        "resourceType": "QuestionnaireResponse",
        "author": {"reference": "Patient/example-member"},
        "status": "completed",
        "id": "6ce846b9-d22c-4c36-a5e7-fbb1115e5af6",
        "identifier": {"value": "PAC-000158", "system": "https://example.org/fhir/sid/consent-form"},
        "authored": "2026-10-09T10:05:00-04:00",
        "subject": {"reference": "Patient/example-member"}
      },
      "search": {"mode": "include"},
      "fullUrl": "<base>/fhir/QuestionnaireResponse/6ce846b9-d22c-4c36-a5e7-fbb1115e5af6",
      "link": [{"relation": "self", "url": "<base>/fhir/QuestionnaireResponse/6ce846b9-d22c-4c36-a5e7-fbb1115e5af6"}]
    },
    {
      "resource": {
        "questionnaire": "https://example.org/fhir/Questionnaire/payer-to-payer-opt-in",
        "meta": {
          "profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"],
          "lastUpdated": "2026-10-22T13:05:59.778072Z",
          "versionId": "153",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.778072Z"}]
        },
        "item": [
          {
            "item": [
              {
                "text": "Health plan",
                "answer": [{
                  "valueReference": {
                    "display": "Lakeside Health Plan",
                    "reference": "Organization/lakeside-health-plan"
                  }
                }],
                "linkId": "plan"
              },
              {
                "text": "Member ID with that plan",
                "answer": [{"valueString": "XYZ123456789"}],
                "linkId": "plan-member-id"
              },
              {
                "text": "Was that plan in your own name?",
                "answer": [{
                  "valueCoding": {
                    "code": "self",
                    "system": "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
                    "display": "Self"
                  }
                }],
                "linkId": "plan-relationship"
              },
              {
                "text": "Is this a plan you had before, or one you have now?",
                "answer": [{"valueCoding": {"code": "previous", "display": "A plan I had before"}}],
                "linkId": "plan-kind"
              }
            ],
            "text": "Previous or concurrent health plan",
            "linkId": "previous-or-concurrent-plan"
          },
          {
            "item": [
              {
                "text": "Plan name (as typed by the member)",
                "answer": [{"valueString": "Blue Valley Health Plan"}],
                "linkId": "plan-name"
              },
              {
                "text": "Member ID with that plan",
                "answer": [{"valueString": "BVH-4471902"}],
                "linkId": "plan-member-id"
              },
              {
                "text": "Was that plan in your own name?",
                "answer": [{
                  "valueCoding": {
                    "code": "self",
                    "system": "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
                    "display": "Self"
                  }
                }],
                "linkId": "plan-relationship"
              },
              {
                "text": "Is this a plan you had before, or one you have now?",
                "answer": [{"valueCoding": {"code": "concurrent", "display": "A plan I have now, alongside this plan"}}],
                "linkId": "plan-kind"
              }
            ],
            "text": "Previous or concurrent health plan",
            "linkId": "previous-or-concurrent-plan"
          },
          {
            "item": [
              {
                "text": "I authorize Example Health Plan to request my health information from the plans above",
                "answer": [{"valueBoolean": true}],
                "linkId": "opt-in"
              },
              {"text": "This authorization ends on", "answer": [{"valueDate": "2027-12-31"}], "linkId": "end-date"}
            ],
            "text": "Your decision",
            "linkId": "decision"
          },
          {
            "item": [
              {
                "text": "Who is completing this form?",
                "answer": [{"valueCoding": {"code": "self", "display": "Member (myself)"}}],
                "linkId": "signer"
              },
              {"text": "Date", "answer": [{"valueDate": "2026-10-12"}], "linkId": "signed-on"}
            ],
            "text": "Signature",
            "linkId": "signature"
          }
        ],
        "resourceType": "QuestionnaireResponse",
        "author": {"reference": "Patient/example-member"},
        "status": "completed",
        "id": "e54ba7e3-4554-4268-8b8c-f2feb93ebc59",
        "identifier": {"value": "P2P-000342", "system": "https://example.org/fhir/sid/consent-form"},
        "authored": "2026-10-12T16:40:00-04:00",
        "subject": {"reference": "Patient/example-member"}
      },
      "search": {"mode": "include"},
      "fullUrl": "<base>/fhir/QuestionnaireResponse/e54ba7e3-4554-4268-8b8c-f2feb93ebc59",
      "link": [{"relation": "self", "url": "<base>/fhir/QuestionnaireResponse/e54ba7e3-4554-4268-8b8c-f2feb93ebc59"}]
    },
    {
      "resource": {
        "questionnaire": "https://example.org/fhir/Questionnaire/payer-to-payer-opt-in",
        "meta": {
          "profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"],
          "lastUpdated": "2026-10-22T13:06:02.001074Z",
          "versionId": "163",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:06:02.001074Z"}]
        },
        "item": [
          {
            "item": [
              {
                "text": "Health plan",
                "answer": [{
                  "valueReference": {
                    "display": "Lakeside Health Plan",
                    "reference": "Organization/lakeside-health-plan"
                  }
                }],
                "linkId": "plan"
              },
              {
                "text": "Member ID with that plan",
                "answer": [{"valueString": "XYZ123456789"}],
                "linkId": "plan-member-id"
              },
              {
                "text": "Was that plan in your own name?",
                "answer": [{
                  "valueCoding": {
                    "code": "self",
                    "system": "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
                    "display": "Self"
                  }
                }],
                "linkId": "plan-relationship"
              },
              {
                "text": "Is this a plan you had before, or one you have now?",
                "answer": [{"valueCoding": {"code": "previous", "display": "A plan I had before"}}],
                "linkId": "plan-kind"
              }
            ],
            "text": "Previous or concurrent health plan",
            "linkId": "previous-or-concurrent-plan"
          },
          {
            "item": [
              {
                "text": "I authorize Example Health Plan to request my health information from the plans above",
                "answer": [{"valueBoolean": true}],
                "linkId": "opt-in"
              },
              {"text": "This authorization ends on", "answer": [{"valueDate": "2027-12-31"}], "linkId": "end-date"}
            ],
            "text": "Your decision",
            "linkId": "decision"
          },
          {
            "item": [
              {
                "text": "Who is completing this form?",
                "answer": [{"valueCoding": {"code": "self", "display": "Member (myself)"}}],
                "linkId": "signer"
              },
              {"text": "Date", "answer": [{"valueDate": "2026-10-13"}], "linkId": "signed-on"}
            ],
            "text": "Signature",
            "linkId": "signature"
          }
        ],
        "resourceType": "QuestionnaireResponse",
        "author": {"reference": "Patient/example-member"},
        "status": "completed",
        "id": "4d27435a-66c5-4fde-9536-0534113bed11",
        "identifier": {"value": "P2P-000351", "system": "https://example.org/fhir/sid/consent-form"},
        "authored": "2026-10-13T09:15:00-04:00",
        "subject": {"reference": "Patient/example-member"}
      },
      "search": {"mode": "include"},
      "fullUrl": "<base>/fhir/QuestionnaireResponse/4d27435a-66c5-4fde-9536-0534113bed11",
      "link": [{"relation": "self", "url": "<base>/fhir/QuestionnaireResponse/4d27435a-66c5-4fde-9536-0534113bed11"}]
    },
    {
      "resource": {
        "questionnaire": "https://example.org/fhir/Questionnaire/payer-to-payer-opt-in",
        "meta": {
          "profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"],
          "lastUpdated": "2026-10-22T13:06:02.038989Z",
          "versionId": "169",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:06:02.038989Z"}]
        },
        "item": [
          {
            "item": [{
              "text": "I withdraw my authorization for Example Health Plan to request my health information from other plans",
              "answer": [{"valueBoolean": true}],
              "linkId": "withdraw"
            }],
            "text": "Your decision",
            "linkId": "decision"
          },
          {
            "item": [
              {
                "text": "Who is completing this form?",
                "answer": [{"valueCoding": {"code": "self", "display": "Member (myself)"}}],
                "linkId": "signer"
              },
              {"text": "Date", "answer": [{"valueDate": "2026-10-14"}], "linkId": "signed-on"}
            ],
            "text": "Signature",
            "linkId": "signature"
          }
        ],
        "resourceType": "QuestionnaireResponse",
        "author": {"reference": "Patient/example-member"},
        "status": "completed",
        "id": "75b71653-e481-420c-b046-20dd60489a59",
        "identifier": {"value": "P2P-000360", "system": "https://example.org/fhir/sid/consent-form"},
        "authored": "2026-10-14T11:30:00-04:00",
        "subject": {"reference": "Patient/example-member"}
      },
      "search": {"mode": "include"},
      "fullUrl": "<base>/fhir/QuestionnaireResponse/75b71653-e481-420c-b046-20dd60489a59",
      "link": [{"relation": "self", "url": "<base>/fhir/QuestionnaireResponse/75b71653-e481-420c-b046-20dd60489a59"}]
    }
  ]
}
```

{% endtab %}
{% endtabs %}

### Consents with active status

Get Consents with `status=active`, without checking their effective periods.

{% tabs %}
{% tab title="Request" %}

```http
GET /fhir/Consent?patient:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&status=active
Accept: application/fhir+json
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "meta": {"versionId": "0"},
  "total": 1,
  "link": [
    {
      "relation": "first",
      "url": "<base>/fhir/Consent?patient:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&status=active&_page=1"
    },
    {
      "relation": "self",
      "url": "<base>/fhir/Consent?patient:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&status=active&_page=1"
    }
  ],
  "entry": [{
    "resource": {
      "patient": {"reference": "Patient/example-member"},
      "category": [
        {"coding": [{"code": "IDSCL", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"}]},
        {
          "coding": [{
            "code": "provider-access",
            "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose"
          }]
        }
      ],
      "provision": {
        "type": "permit",
        "actor": [{
          "role": {
            "coding": [{
              "code": "performer",
              "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type"
            }]
          },
          "reference": {"reference": "Organization/example-health-plan"}
        }],
        "action": [{"coding": [{"code": "disclose", "system": "http://terminology.hl7.org/CodeSystem/consentaction"}]}],
        "period": {"start": "2026-10-09"}
      },
      "meta": {
        "profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-provider-consent"],
        "lastUpdated": "2026-10-22T13:05:59.596598Z",
        "versionId": "149",
        "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.048287Z"}]
      },
      "organization": [{"reference": "Organization/example-health-plan"}],
      "resourceType": "Consent",
      "scope": {"coding": [{"code": "patient-privacy", "system": "http://terminology.hl7.org/CodeSystem/consentscope"}]},
      "sourceReference": {"reference": "QuestionnaireResponse/6ce846b9-d22c-4c36-a5e7-fbb1115e5af6"},
      "dateTime": "2026-10-09T10:05:00-04:00",
      "status": "active",
      "id": "01a163b7-e91d-7039-813c-f4cddb9b8e22",
      "policyRule": {
        "coding": [{
          "code": "cric",
          "system": "http://terminology.hl7.org/CodeSystem/consentpolicycodes",
          "display": "Common Rule Informed Consent"
        }]
      },
      "identifier": [{"value": "MBR0000012", "system": "https://example.org/fhir/sid/provider-access-consent"}],
      "performer": [{"reference": "Patient/example-member"}]
    },
    "search": {"mode": "match"},
    "fullUrl": "<base>/fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22",
    "link": [{"relation": "self", "url": "<base>/fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22"}]
  }]
}
```

{% endtab %}
{% endtabs %}

### Filter consents by API purpose

Get the Payer-to-Payer Consent by its API purpose in `category`.

{% tabs %}
{% tab title="Request" %}

```http
GET /fhir/Consent?patient:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&category=http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose|payer-to-payer
Accept: application/fhir+json
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "meta": {"versionId": "0"},
  "total": 1,
  "link": [
    {
      "relation": "first",
      "url": "<base>/fhir/Consent?patient:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&category=http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose|payer-to-payer&_page=1"
    },
    {
      "relation": "self",
      "url": "<base>/fhir/Consent?patient:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&category=http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose|payer-to-payer&_page=1"
    }
  ],
  "entry": [{
    "resource": {
      "patient": {"reference": "Patient/example-member"},
      "category": [
        {"coding": [{"code": "IDSCL", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"}]},
        {
          "coding": [{
            "code": "payer-to-payer",
            "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose"
          }]
        }
      ],
      "provision": {
        "type": "permit",
        "actor": [
          {
            "role": {
              "coding": [{
                "code": "performer",
                "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type"
              }]
            },
            "reference": {"display": "Lakeside Health Plan", "reference": "Organization/lakeside-health-plan"}
          },
          {
            "role": {
              "coding": [{"code": "IRCP", "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType"}]
            },
            "reference": {"display": "Example Health Plan", "reference": "Organization/example-health-plan"}
          }
        ],
        "action": [{"coding": [{"code": "disclose", "system": "http://terminology.hl7.org/CodeSystem/consentaction"}]}],
        "period": {"end": "2027-12-31", "start": "2026-10-13"}
      },
      "meta": {
        "lastUpdated": "2026-10-22T13:06:02.038989Z",
        "versionId": "173",
        "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.778072Z"}]
      },
      "organization": [{"reference": "Organization/example-health-plan"}],
      "resourceType": "Consent",
      "scope": {"coding": [{"code": "patient-privacy", "system": "http://terminology.hl7.org/CodeSystem/consentscope"}]},
      "policy": [{"uri": "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-consent.html#sensitive"}],
      "sourceReference": {"reference": "DocumentReference/68ef44da-f4a1-482e-9db7-4ee73108c315"},
      "dateTime": "2026-10-14T11:30:00-04:00",
      "status": "inactive",
      "id": "01a163b7-eefd-79d5-8dc9-68e497f07371",
      "identifier": [{"value": "MBR0000012", "system": "https://example.org/fhir/sid/payer-to-payer-consent"}],
      "performer": [{"reference": "Patient/example-member"}]
    },
    "search": {"mode": "match"},
    "fullUrl": "<base>/fhir/Consent/01a163b7-eefd-79d5-8dc9-68e497f07371",
    "link": [{"relation": "self", "url": "<base>/fhir/Consent/01a163b7-eefd-79d5-8dc9-68e497f07371"}]
  }]
}
```

{% endtab %}
{% endtabs %}

### Return selected resource elements

Return selected Consent fields; retrieve the full resource before updating it.

{% tabs %}
{% tab title="Request" %}

```http
GET /fhir/Consent?patient:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&_elements=identifier,status,provision
Accept: application/fhir+json
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "meta": {"versionId": "0"},
  "total": 2,
  "link": [
    {
      "relation": "first",
      "url": "<base>/fhir/Consent?patient:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&_elements=identifier,status,provision&_page=1"
    },
    {
      "relation": "self",
      "url": "<base>/fhir/Consent?patient:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&_elements=identifier,status,provision&_page=1"
    }
  ],
  "entry": [
    {
      "resource": {
        "identifier": [{"value": "MBR0000012", "system": "https://example.org/fhir/sid/provider-access-consent"}],
        "provision": {
          "type": "permit",
          "actor": [{
            "role": {
              "coding": [{
                "code": "performer",
                "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type"
              }]
            },
            "reference": {"reference": "Organization/example-health-plan"}
          }],
          "action": [{"coding": [{"code": "disclose", "system": "http://terminology.hl7.org/CodeSystem/consentaction"}]}],
          "period": {"start": "2026-10-09"}
        },
        "status": "active",
        "id": "01a163b7-e91d-7039-813c-f4cddb9b8e22",
        "resourceType": "Consent"
      },
      "search": {"mode": "match"},
      "fullUrl": "<base>/fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22",
      "link": [{"relation": "self", "url": "<base>/fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22"}]
    },
    {
      "resource": {
        "identifier": [{"value": "MBR0000012", "system": "https://example.org/fhir/sid/payer-to-payer-consent"}],
        "provision": {
          "type": "permit",
          "actor": [
            {
              "role": {
                "coding": [{
                  "code": "performer",
                  "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type"
                }]
              },
              "reference": {"display": "Lakeside Health Plan", "reference": "Organization/lakeside-health-plan"}
            },
            {
              "role": {
                "coding": [{"code": "IRCP", "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType"}]
              },
              "reference": {"display": "Example Health Plan", "reference": "Organization/example-health-plan"}
            }
          ],
          "action": [{"coding": [{"code": "disclose", "system": "http://terminology.hl7.org/CodeSystem/consentaction"}]}],
          "period": {"end": "2027-12-31", "start": "2026-10-13"}
        },
        "status": "inactive",
        "id": "01a163b7-eefd-79d5-8dc9-68e497f07371",
        "resourceType": "Consent"
      },
      "search": {"mode": "match"},
      "fullUrl": "<base>/fhir/Consent/01a163b7-eefd-79d5-8dc9-68e497f07371",
      "link": [{"relation": "self", "url": "<base>/fhir/Consent/01a163b7-eefd-79d5-8dc9-68e497f07371"}]
    }
  ]
}
```

{% endtab %}
{% endtabs %}

### Provider Access decision forms

Get the member's Provider Access QuestionnaireResponses, newest first.

{% tabs %}
{% tab title="Request" %}

```http
GET /fhir/QuestionnaireResponse?subject:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&questionnaire=https://example.org/fhir/Questionnaire/provider-access-opt-out&_sort=-authored
Accept: application/fhir+json
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "meta": {"versionId": "0"},
  "total": 2,
  "link": [
    {
      "relation": "first",
      "url": "<base>/fhir/QuestionnaireResponse?subject:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&questionnaire=https://example.org/fhir/Questionnaire/provider-access-opt-out&_sort=-authored&_page=1"
    },
    {
      "relation": "self",
      "url": "<base>/fhir/QuestionnaireResponse?subject:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&questionnaire=https://example.org/fhir/Questionnaire/provider-access-opt-out&_sort=-authored&_page=1"
    }
  ],
  "entry": [
    {
      "resource": {
        "questionnaire": "https://example.org/fhir/Questionnaire/provider-access-opt-out",
        "meta": {
          "profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"],
          "lastUpdated": "2026-10-22T13:05:59.596598Z",
          "versionId": "147",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.596598Z"}]
        },
        "item": [
          {
            "text": "Do you want your health information shared with your treating providers?",
            "answer": [{"valueCoding": {"code": "share", "display": "Yes, share my information with my providers"}}],
            "linkId": "decision"
          },
          {
            "item": [
              {
                "text": "Who is completing this form?",
                "answer": [{"valueCoding": {"code": "self", "display": "Member (myself)"}}],
                "linkId": "signer"
              },
              {"text": "Date", "answer": [{"valueDate": "2026-10-09"}], "linkId": "signed-on"}
            ],
            "text": "Signature",
            "linkId": "signature"
          }
        ],
        "resourceType": "QuestionnaireResponse",
        "author": {"reference": "Patient/example-member"},
        "status": "completed",
        "id": "6ce846b9-d22c-4c36-a5e7-fbb1115e5af6",
        "identifier": {"value": "PAC-000158", "system": "https://example.org/fhir/sid/consent-form"},
        "authored": "2026-10-09T10:05:00-04:00",
        "subject": {"reference": "Patient/example-member"}
      },
      "search": {"mode": "match"},
      "fullUrl": "<base>/fhir/QuestionnaireResponse/6ce846b9-d22c-4c36-a5e7-fbb1115e5af6",
      "link": [{"relation": "self", "url": "<base>/fhir/QuestionnaireResponse/6ce846b9-d22c-4c36-a5e7-fbb1115e5af6"}]
    },
    {
      "resource": {
        "questionnaire": "https://example.org/fhir/Questionnaire/provider-access-opt-out",
        "meta": {
          "profile": ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"],
          "lastUpdated": "2026-10-22T13:05:59.048287Z",
          "versionId": "143",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.048287Z"}]
        },
        "item": [
          {
            "text": "Do you want your health information shared with your treating providers?",
            "answer": [{
              "valueCoding": {"code": "opt-out", "display": "No, do not share my information with my providers"}
            }],
            "linkId": "decision"
          },
          {
            "item": [
              {
                "text": "Who is completing this form?",
                "answer": [{"valueCoding": {"code": "self", "display": "Member (myself)"}}],
                "linkId": "signer"
              },
              {"text": "Date", "answer": [{"valueDate": "2026-10-06"}], "linkId": "signed-on"}
            ],
            "text": "Signature",
            "linkId": "signature"
          }
        ],
        "resourceType": "QuestionnaireResponse",
        "author": {"reference": "Patient/example-member"},
        "status": "completed",
        "id": "1d76de2e-dd29-47bd-a832-1860c4cf353f",
        "identifier": {"value": "PAC-000117", "system": "https://example.org/fhir/sid/consent-form"},
        "authored": "2026-10-06T14:22:00-04:00",
        "subject": {"reference": "Patient/example-member"}
      },
      "search": {"mode": "match"},
      "fullUrl": "<base>/fhir/QuestionnaireResponse/1d76de2e-dd29-47bd-a832-1860c4cf353f",
      "link": [{"relation": "self", "url": "<base>/fhir/QuestionnaireResponse/1d76de2e-dd29-47bd-a832-1860c4cf353f"}]
    }
  ]
}
```

{% endtab %}
{% endtabs %}

### Payer-to-Payer forms

Get the member's Payer-to-Payer DocumentReferences, newest first.

{% tabs %}
{% tab title="Request" %}

```http
GET /fhir/DocumentReference?subject:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&type=http://loinc.org|59284-0&_sort=-date
Accept: application/fhir+json
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "meta": {"versionId": "0"},
  "total": 3,
  "link": [
    {
      "relation": "first",
      "url": "<base>/fhir/DocumentReference?subject:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&type=http://loinc.org|59284-0&_sort=-date&_page=1"
    },
    {
      "relation": "self",
      "url": "<base>/fhir/DocumentReference?subject:Patient.identifier=https://example.org/fhir/sid/member-id|MBR0000012&type=http://loinc.org|59284-0&_sort=-date&_page=1"
    }
  ],
  "entry": [
    {
      "resource": {
        "description": "Payer-to-Payer withdrawal",
        "date": "2026-10-14T11:30:00-04:00",
        "meta": {
          "lastUpdated": "2026-10-22T13:06:02.038989Z",
          "versionId": "171",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:06:02.038989Z"}]
        },
        "content": [{
          "attachment": {
            "url": "QuestionnaireResponse/75b71653-e481-420c-b046-20dd60489a59",
            "title": "Payer-to-Payer withdrawal (answers)",
            "creation": "2026-10-14T11:30:00-04:00",
            "contentType": "application/fhir+json"
          }
        }],
        "type": {"coding": [{"code": "59284-0", "system": "http://loinc.org", "display": "Consent Document"}]},
        "resourceType": "DocumentReference",
        "author": [{"reference": "Patient/example-member"}],
        "custodian": {"reference": "Organization/example-health-plan"},
        "status": "current",
        "id": "68ef44da-f4a1-482e-9db7-4ee73108c315",
        "identifier": [{"value": "P2P-000360", "system": "https://example.org/fhir/sid/consent-form"}],
        "subject": {"reference": "Patient/example-member"}
      },
      "search": {"mode": "match"},
      "fullUrl": "<base>/fhir/DocumentReference/68ef44da-f4a1-482e-9db7-4ee73108c315",
      "link": [{"relation": "self", "url": "<base>/fhir/DocumentReference/68ef44da-f4a1-482e-9db7-4ee73108c315"}]
    },
    {
      "resource": {
        "description": "Payer-to-Payer opt-in form",
        "date": "2026-10-13T09:15:00-04:00",
        "meta": {
          "lastUpdated": "2026-10-22T13:06:02.001074Z",
          "versionId": "165",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:06:02.001074Z"}]
        },
        "content": [{
          "attachment": {
            "url": "QuestionnaireResponse/4d27435a-66c5-4fde-9536-0534113bed11",
            "title": "Payer-to-Payer opt-in form (answers)",
            "creation": "2026-10-13T09:15:00-04:00",
            "contentType": "application/fhir+json"
          }
        }],
        "type": {"coding": [{"code": "59284-0", "system": "http://loinc.org", "display": "Consent Document"}]},
        "resourceType": "DocumentReference",
        "author": [{"reference": "Patient/example-member"}],
        "custodian": {"reference": "Organization/example-health-plan"},
        "status": "current",
        "id": "e756452c-fcc7-4950-9aa2-ac01d770c173",
        "identifier": [{"value": "P2P-000351", "system": "https://example.org/fhir/sid/consent-form"}],
        "subject": {"reference": "Patient/example-member"}
      },
      "search": {"mode": "match"},
      "fullUrl": "<base>/fhir/DocumentReference/e756452c-fcc7-4950-9aa2-ac01d770c173",
      "link": [{"relation": "self", "url": "<base>/fhir/DocumentReference/e756452c-fcc7-4950-9aa2-ac01d770c173"}]
    },
    {
      "resource": {
        "description": "Payer-to-Payer opt-in form",
        "date": "2026-10-12T16:40:00-04:00",
        "meta": {
          "lastUpdated": "2026-10-22T13:05:59.778072Z",
          "versionId": "155",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.778072Z"}]
        },
        "content": [{
          "attachment": {
            "url": "QuestionnaireResponse/e54ba7e3-4554-4268-8b8c-f2feb93ebc59",
            "title": "Payer-to-Payer opt-in form (answers)",
            "creation": "2026-10-12T16:40:00-04:00",
            "contentType": "application/fhir+json"
          }
        }],
        "type": {"coding": [{"code": "59284-0", "system": "http://loinc.org", "display": "Consent Document"}]},
        "resourceType": "DocumentReference",
        "author": [{"reference": "Patient/example-member"}],
        "custodian": {"reference": "Organization/example-health-plan"},
        "status": "current",
        "id": "cf0bcafe-0ec9-49cc-896d-6c5131154d86",
        "identifier": [{"value": "P2P-000342", "system": "https://example.org/fhir/sid/consent-form"}],
        "subject": {"reference": "Patient/example-member"}
      },
      "search": {"mode": "match"},
      "fullUrl": "<base>/fhir/DocumentReference/cf0bcafe-0ec9-49cc-896d-6c5131154d86",
      "link": [{"relation": "self", "url": "<base>/fhir/DocumentReference/cf0bcafe-0ec9-49cc-896d-6c5131154d86"}]
    }
  ]
}
```

{% endtab %}
{% endtabs %}

### Consent version history

Get the Provider Access Consent's versions, newest first, using its resource ID.

{% tabs %}
{% tab title="Request" %}

```http
GET /fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22/_history
Accept: application/fhir+json
```

{% endtab %}
{% tab title="Response" %}

```json
{
  "resourceType": "Bundle",
  "type": "history",
  "total": 2,
  "entry": [
    {
      "resource": {
        "patient": {"reference": "Patient/example-member"},
        "category": [
          {"coding": [{"code": "IDSCL", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"}]},
          {
            "coding": [{
              "code": "provider-access",
              "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose"
            }]
          }
        ],
        "provision": {
          "type": "permit",
          "actor": [{
            "role": {
              "coding": [{
                "code": "performer",
                "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type"
              }]
            },
            "reference": {"reference": "Organization/example-health-plan"}
          }],
          "action": [{"coding": [{"code": "disclose", "system": "http://terminology.hl7.org/CodeSystem/consentaction"}]}],
          "period": {"start": "2026-10-09"}
        },
        "meta": {
          "profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-provider-consent"],
          "lastUpdated": "2026-10-22T13:05:59.596598Z",
          "versionId": "149",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.048287Z"}]
        },
        "organization": [{"reference": "Organization/example-health-plan"}],
        "resourceType": "Consent",
        "scope": {
          "coding": [{"code": "patient-privacy", "system": "http://terminology.hl7.org/CodeSystem/consentscope"}]
        },
        "sourceReference": {"reference": "QuestionnaireResponse/6ce846b9-d22c-4c36-a5e7-fbb1115e5af6"},
        "dateTime": "2026-10-09T10:05:00-04:00",
        "status": "active",
        "id": "01a163b7-e91d-7039-813c-f4cddb9b8e22",
        "policyRule": {
          "coding": [{
            "code": "cric",
            "system": "http://terminology.hl7.org/CodeSystem/consentpolicycodes",
            "display": "Common Rule Informed Consent"
          }]
        },
        "identifier": [{"value": "MBR0000012", "system": "https://example.org/fhir/sid/provider-access-consent"}],
        "performer": [{"reference": "Patient/example-member"}]
      },
      "request": {"method": "PUT", "url": "Consent"},
      "response": {"status": "200"},
      "fullUrl": "<base>/fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22"
    },
    {
      "resource": {
        "patient": {"reference": "Patient/example-member"},
        "category": [
          {"coding": [{"code": "IDSCL", "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode"}]},
          {
            "coding": [{
              "code": "provider-access",
              "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose"
            }]
          }
        ],
        "provision": {
          "type": "deny",
          "actor": [{
            "role": {
              "coding": [{
                "code": "performer",
                "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type"
              }]
            },
            "reference": {"reference": "Organization/example-health-plan"}
          }],
          "action": [{"coding": [{"code": "disclose", "system": "http://terminology.hl7.org/CodeSystem/consentaction"}]}],
          "period": {"start": "2026-10-06"}
        },
        "meta": {
          "profile": ["http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-provider-consent"],
          "lastUpdated": "2026-10-22T13:05:59.048287Z",
          "versionId": "145",
          "extension": [{"url": "https://aidbox.app/ex/createdAt", "valueInstant": "2026-10-22T13:05:59.048287Z"}]
        },
        "organization": [{"reference": "Organization/example-health-plan"}],
        "resourceType": "Consent",
        "scope": {
          "coding": [{"code": "patient-privacy", "system": "http://terminology.hl7.org/CodeSystem/consentscope"}]
        },
        "sourceReference": {"reference": "QuestionnaireResponse/1d76de2e-dd29-47bd-a832-1860c4cf353f"},
        "dateTime": "2026-10-06T14:22:00-04:00",
        "status": "active",
        "id": "01a163b7-e91d-7039-813c-f4cddb9b8e22",
        "policyRule": {
          "coding": [{
            "code": "cric",
            "system": "http://terminology.hl7.org/CodeSystem/consentpolicycodes",
            "display": "Common Rule Informed Consent"
          }]
        },
        "identifier": [{"value": "MBR0000012", "system": "https://example.org/fhir/sid/provider-access-consent"}],
        "performer": [{"reference": "Patient/example-member"}]
      },
      "request": {"method": "POST", "url": "Consent"},
      "response": {"status": "201"},
      "fullUrl": "<base>/fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22"
    }
  ],
  "id": "149",
  "link": [
    {"relation": "first", "url": "<base>/fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22/_history?_count=100&_page=1"},
    {"relation": "self", "url": "<base>/fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22/_history?_count=100&_page=0"},
    {"relation": "next", "url": "<base>/fhir/Consent/01a163b7-e91d-7039-813c-f4cddb9b8e22/_history?_count=100&_page=1"}
  ]
}
```

{% endtab %}
{% endtabs %}

## Alongside the member portal

The member portal's [Data sharing page](../../fhir-app-portal/member-portal/consent-panel.md) creates a new Consent for each decision and [retires](../../api-reference/resources/consent.md#retire-a-record) the previous Consent. The integration described on this page updates one Consent per member and consent type.

Both approaches can be used on the same installation. For each member, use a single workflow to record consent decisions; using both workflows can leave separate active Consent resources for the same consent type.

These resources are read by [Provider Access](../../interop-apis/provider-access.md) and [Payer-to-Payer](../../interop-apis/payer-to-payer.md).
