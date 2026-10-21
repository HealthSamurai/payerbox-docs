---
description: >-
  Member consent as FHIR instead of flat files: one transaction per decision,
  addressed by the plan's own numbers, with the Provider Access opt-out and the
  Payer-to-Payer opt-in, the forms, and the coverages a member names.
---

# Member Consent (FHIR)

A plan whose own system holds the decisions — a member portal, a consent management system — can write them to Payerbox as FHIR instead of the flat files of [Member Consent (CSV)](csv.md). The records are the same ones that feed builds: the [PDex Provider Consent](https://hl7.org/fhir/us/davinci-pdex/STU2.2/StructureDefinition-pdex-provider-consent.html) for the Provider Access opt-out, the [HRex Consent](https://hl7.org/fhir/us/davinci-hrex/STU1.1/StructureDefinition-hrex-consent.html) for the Payer-to-Payer opt-in, and an [HRex Coverage](https://hl7.org/fhir/us/davinci-hrex/STU1.1/StructureDefinition-hrex-coverage.html) per plan the member names. The element-level rules of each record are in the [Consent](../../api-reference/resources/consent.md) reference; this page is the contract for the bundles.

## Conventions

- **One decision is one transaction**, `POST /fhir` with a `Bundle` of `type: transaction`. Every entry is written or none is.
- **Every record is addressed by your number**: `PUT <Type>?identifier=<system>|<number>`. The first `PUT` creates the record, a later one with the same number updates it. No Payerbox ids, no `PATCH`.
- **One Provider Access Consent and one Payer-to-Payer Consent per member**, both numbered by the Member ID. Each new decision updates its record; the earlier versions stay in the record's history (`GET /fhir/Consent/<id>/_history`), and each decision keeps its own form.
- **The member, your Organization and the plans from your list are referenced, never sent.** A record in the same bundle is referenced by its `fullUrl`, any `urn:uuid:`.
- **The form travels as a `QuestionnaireResponse`**, no PDF. Its `questionnaire` canonical is yours.

The systems below are placeholders: use your own, and keep them stable.

| Record | Number (`identifier.value`) | System |
|---|---|---|
| Consent, Provider Access | Member ID | `https://example.org/fhir/sid/provider-access-consent` |
| Consent, Payer-to-Payer | Member ID | `https://example.org/fhir/sid/payer-to-payer-consent` |
| QuestionnaireResponse; DocumentReference (Payer-to-Payer only) | form number (`PAC-000117`) | `https://example.org/fhir/sid/consent-form` |
| Coverage | plan entry number (`PCV-000342-1`) | `https://example.org/fhir/sid/other-plan-coverage` |
| Organization of a plan the member typed under "Other" | plan entry number | `https://example.org/fhir/sid/unlisted-payer` |

| Points to | How |
|---|---|
| The member | `Patient?identifier=https://example.org/fhir/sid/member-id\|<Member ID>` |
| Your plan | `Organization/<id>` of the plan Organization set in [Consent Settings](../../fhir-app-portal/consent-settings.md) |
| A plan from your list | `Organization/<id>` of a plan registered in [Consent Settings](../../fhir-app-portal/consent-settings.md#other-health-plans-members-can-pick) or loaded with your data |
| A record in the same bundle | its `fullUrl` |

## Before the first decision

The records a decision points to must exist, with the profiles the Consent profiles require on their targets (see [Referenced records](../../api-reference/resources/consent.md#referenced-records)):

- your plan's `Organization`, declaring the HRex Organization profile;
- the member's `Patient`, declaring the US Core Patient profile and, for the coverages, the HRex Patient Demographics profile;
- an `Organization` per plan on your list, declaring the HRex Organization profile.

On a Payerbox installation these arrive with your data and through Consent Settings. The bundle below creates them on an empty test box, with `12345` as the plan's NAIC code (US Core requires five digits):

### 00. Sandbox setup

{% file src="../../../assets/data-integration/consent/00-sandbox-setup.json" %}
00-sandbox-setup.json
{% endfile %}

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "Organization",
        "id": "example-health-plan",
        "meta": {
          "profile": [
            "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-organization"
          ]
        },
        "active": true,
        "type": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/organization-type",
                "code": "pay",
                "display": "Payer"
              }
            ]
          }
        ],
        "name": "Example Health Plan",
        "identifier": [
          {
            "system": "urn:oid:2.16.840.1.113883.6.300",
            "value": "12345"
          }
        ]
      },
      "request": {
        "method": "PUT",
        "url": "Organization/example-health-plan"
      }
    },
    {
      "resource": {
        "resourceType": "Organization",
        "id": "lakeside-health-plan",
        "meta": {
          "profile": [
            "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-organization"
          ]
        },
        "active": true,
        "type": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/organization-type",
                "code": "pay",
                "display": "Payer"
              }
            ]
          }
        ],
        "name": "Lakeside Health Plan",
        "identifier": [
          {
            "system": "urn:oid:2.16.840.1.113883.6.300",
            "value": "67890"
          }
        ]
      },
      "request": {
        "method": "PUT",
        "url": "Organization/lakeside-health-plan"
      }
    },
    {
      "resource": {
        "resourceType": "Organization",
        "id": "riverbend-health-cooperative",
        "meta": {
          "profile": [
            "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-organization"
          ]
        },
        "active": true,
        "type": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/organization-type",
                "code": "pay",
                "display": "Payer"
              }
            ]
          }
        ],
        "name": "Riverbend Health Cooperative",
        "identifier": [
          {
            "system": "urn:oid:2.16.840.1.113883.6.300",
            "value": "54321"
          }
        ]
      },
      "request": {
        "method": "PUT",
        "url": "Organization/riverbend-health-cooperative"
      }
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
        "identifier": [
          {
            "type": {
              "coding": [
                {
                  "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                  "code": "MB"
                }
              ]
            },
            "system": "https://example.org/fhir/sid/member-id",
            "value": "MBR0000012"
          }
        ],
        "active": true,
        "name": [
          {
            "family": "Alvarez",
            "given": [
              "Maria",
              "Elena"
            ]
          }
        ],
        "gender": "female",
        "birthDate": "1961-04-17"
      },
      "request": {
        "method": "PUT",
        "url": "Patient/example-member"
      }
    }
  ]
}
```

## The decisions

A member's story in five bundles, in order. Each one is a complete transaction: resend it and the same records are updated, not duplicated.

### 01. Provider Access opt-out

On October 6 the member opts out of sharing with treating providers.

- The Consent is created (`201`) with the Member ID as its number, `provision.type` `deny`, `period.start` the day of the decision, no `end`.
- `policyRule` is `cric` with its `display`: PDex fixes the whole coding, and without the `display` the record is refused.
- `provision.actor` with role `performer` is your plan, the source of the data the member withholds.
- `sourceReference` points straight to the QuestionnaireResponse. PDex allows that, so Provider Access needs no DocumentReference.

{% file src="../../../assets/data-integration/consent/01-provider-access-opt-out.json" %}
01-provider-access-opt-out.json
{% endfile %}

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "QuestionnaireResponse",
        "meta": {
          "profile": [
            "http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"
          ]
        },
        "identifier": {
          "system": "https://example.org/fhir/sid/consent-form",
          "value": "PAC-000117"
        },
        "questionnaire": "https://example.org/fhir/Questionnaire/provider-access-opt-out",
        "status": "completed",
        "subject": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "authored": "2026-10-06T14:22:00-04:00",
        "author": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "item": [
          {
            "linkId": "decision",
            "text": "Do you want your health information shared with your treating providers?",
            "answer": [
              {
                "valueCoding": {
                  "code": "opt-out",
                  "display": "No, do not share my information with my providers"
                }
              }
            ]
          },
          {
            "linkId": "signature",
            "text": "Signature",
            "item": [
              {
                "linkId": "signer",
                "text": "Who is completing this form?",
                "answer": [
                  {
                    "valueCoding": {
                      "code": "self",
                      "display": "Member (myself)"
                    }
                  }
                ]
              },
              {
                "linkId": "signed-on",
                "text": "Date",
                "answer": [
                  {
                    "valueDate": "2026-10-06"
                  }
                ]
              }
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
        "meta": {
          "profile": [
            "http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-provider-consent"
          ]
        },
        "identifier": [
          {
            "system": "https://example.org/fhir/sid/provider-access-consent",
            "value": "MBR0000012"
          }
        ],
        "status": "active",
        "scope": {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/consentscope",
              "code": "patient-privacy"
            }
          ]
        },
        "category": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                "code": "IDSCL"
              }
            ]
          },
          {
            "coding": [
              {
                "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose",
                "code": "provider-access"
              }
            ]
          }
        ],
        "patient": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "dateTime": "2026-10-06T14:22:00-04:00",
        "performer": [
          {
            "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
          }
        ],
        "organization": [
          {
            "reference": "Organization/example-health-plan"
          }
        ],
        "sourceReference": {
          "reference": "urn:uuid:5e7a7a00-0000-4000-8000-000000000001"
        },
        "policyRule": {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/consentpolicycodes",
              "code": "cric",
              "display": "Common Rule Informed Consent"
            }
          ]
        },
        "provision": {
          "type": "deny",
          "period": {
            "start": "2026-10-06"
          },
          "actor": [
            {
              "role": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                    "code": "performer"
                  }
                ]
              },
              "reference": {
                "reference": "Organization/example-health-plan"
              }
            }
          ],
          "action": [
            {
              "coding": [
                {
                  "system": "http://terminology.hl7.org/CodeSystem/consentaction",
                  "code": "disclose"
                }
              ]
            }
          ]
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

### 02. Share again

On October 9 the member changes their mind. There is no separate earlier record: decisions 01 and 02 are two versions of one Consent. It is updated (`200`) to `permit` with a new date and a link to the new form `PAC-000158`. The opt-out of October 6 stays in the record's history and in its own form `PAC-000117`.

{% file src="../../../assets/data-integration/consent/02-share-again.json" %}
02-share-again.json
{% endfile %}

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "QuestionnaireResponse",
        "meta": {
          "profile": [
            "http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"
          ]
        },
        "identifier": {
          "system": "https://example.org/fhir/sid/consent-form",
          "value": "PAC-000158"
        },
        "questionnaire": "https://example.org/fhir/Questionnaire/provider-access-opt-out",
        "status": "completed",
        "subject": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "authored": "2026-10-09T10:05:00-04:00",
        "author": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "item": [
          {
            "linkId": "decision",
            "text": "Do you want your health information shared with your treating providers?",
            "answer": [
              {
                "valueCoding": {
                  "code": "share",
                  "display": "Yes, share my information with my providers"
                }
              }
            ]
          },
          {
            "linkId": "signature",
            "text": "Signature",
            "item": [
              {
                "linkId": "signer",
                "text": "Who is completing this form?",
                "answer": [
                  {
                    "valueCoding": {
                      "code": "self",
                      "display": "Member (myself)"
                    }
                  }
                ]
              },
              {
                "linkId": "signed-on",
                "text": "Date",
                "answer": [
                  {
                    "valueDate": "2026-10-09"
                  }
                ]
              }
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
        "meta": {
          "profile": [
            "http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-provider-consent"
          ]
        },
        "identifier": [
          {
            "system": "https://example.org/fhir/sid/provider-access-consent",
            "value": "MBR0000012"
          }
        ],
        "status": "active",
        "scope": {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/consentscope",
              "code": "patient-privacy"
            }
          ]
        },
        "category": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                "code": "IDSCL"
              }
            ]
          },
          {
            "coding": [
              {
                "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose",
                "code": "provider-access"
              }
            ]
          }
        ],
        "patient": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "dateTime": "2026-10-09T10:05:00-04:00",
        "performer": [
          {
            "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
          }
        ],
        "organization": [
          {
            "reference": "Organization/example-health-plan"
          }
        ],
        "sourceReference": {
          "reference": "urn:uuid:5e7a7a00-0000-4000-8000-000000000003"
        },
        "policyRule": {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/consentpolicycodes",
              "code": "cric",
              "display": "Common Rule Informed Consent"
            }
          ]
        },
        "provision": {
          "type": "permit",
          "period": {
            "start": "2026-10-09"
          },
          "actor": [
            {
              "role": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                    "code": "performer"
                  }
                ]
              },
              "reference": {
                "reference": "Organization/example-health-plan"
              }
            }
          ],
          "action": [
            {
              "coding": [
                {
                  "system": "http://terminology.hl7.org/CodeSystem/consentaction",
                  "code": "disclose"
                }
              ]
            }
          ]
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

### 03. Payer-to-Payer opt-in

On October 12 the member opts in for two plans: Lakeside from your list (previous) and Blue Valley, typed under "Other" (concurrent).

- Blue Valley gets an Organization numbered by its plan entry. The Consent and the Coverage point to it through the bundle's `urn:uuid`.
- One Consent for all plans. `provision.actor` with role `performer` is a plan allowed to disclose; HRex calls these entries the `source` slice. The entry with role `IRCP` is your plan, allowed to receive; HRex calls it the `recipient` slice. The slice names live only in the profile, a stored record carries just the role codes.
- `policy.uri` is `#sensitive` only (all data). `period` has `start` and `end`, both required by HRex.
- Two Coverages: the member's ID with that plan (`subscriberId` and the `MB` identifier), `relationship`, and `status` `cancelled` for a previous plan, `active` for a current one. [`$bulk-member-match`](../../api-reference/operations/bulk-member-match.md) sends them to the other plan as `CoverageToMatch`.
- The DocumentReference points to the QuestionnaireResponse. It is there because HRex lets a Payer-to-Payer Consent point only to a DocumentReference.
- In the form, each plan is a `previous-or-concurrent-plan` group, and `plan-kind` answers `previous` or `concurrent`.

{% file src="../../../assets/data-integration/consent/03-payer-to-payer-opt-in.json" %}
03-payer-to-payer-opt-in.json
{% endfile %}

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "Organization",
        "meta": {
          "profile": [
            "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-organization"
          ]
        },
        "active": true,
        "type": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/organization-type",
                "code": "pay",
                "display": "Payer"
              }
            ]
          }
        ],
        "name": "Blue Valley Health Plan",
        "identifier": [
          {
            "system": "https://example.org/fhir/sid/unlisted-payer",
            "value": "PCV-000342-2"
          }
        ]
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
        "meta": {
          "profile": [
            "http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"
          ]
        },
        "identifier": {
          "system": "https://example.org/fhir/sid/consent-form",
          "value": "P2P-000342"
        },
        "questionnaire": "https://example.org/fhir/Questionnaire/payer-to-payer-opt-in",
        "status": "completed",
        "subject": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "authored": "2026-10-12T16:40:00-04:00",
        "author": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "item": [
          {
            "linkId": "previous-or-concurrent-plan",
            "text": "Previous or concurrent health plan",
            "item": [
              {
                "linkId": "plan",
                "text": "Health plan",
                "answer": [
                  {
                    "valueReference": {
                      "reference": "Organization/lakeside-health-plan",
                      "display": "Lakeside Health Plan"
                    }
                  }
                ]
              },
              {
                "linkId": "plan-member-id",
                "text": "Member ID with that plan",
                "answer": [
                  {
                    "valueString": "XYZ123456789"
                  }
                ]
              },
              {
                "linkId": "plan-relationship",
                "text": "Was that plan in your own name?",
                "answer": [
                  {
                    "valueCoding": {
                      "system": "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
                      "code": "self",
                      "display": "Self"
                    }
                  }
                ]
              },
              {
                "linkId": "plan-kind",
                "text": "Is this a plan you had before, or one you have now?",
                "answer": [
                  {
                    "valueCoding": {
                      "code": "previous",
                      "display": "A plan I had before"
                    }
                  }
                ]
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
                "answer": [
                  {
                    "valueString": "Blue Valley Health Plan"
                  }
                ]
              },
              {
                "linkId": "plan-member-id",
                "text": "Member ID with that plan",
                "answer": [
                  {
                    "valueString": "BVH-4471902"
                  }
                ]
              },
              {
                "linkId": "plan-relationship",
                "text": "Was that plan in your own name?",
                "answer": [
                  {
                    "valueCoding": {
                      "system": "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
                      "code": "self",
                      "display": "Self"
                    }
                  }
                ]
              },
              {
                "linkId": "plan-kind",
                "text": "Is this a plan you had before, or one you have now?",
                "answer": [
                  {
                    "valueCoding": {
                      "code": "concurrent",
                      "display": "A plan I have now, alongside this plan"
                    }
                  }
                ]
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
                "answer": [
                  {
                    "valueBoolean": true
                  }
                ]
              },
              {
                "linkId": "end-date",
                "text": "This authorization ends on",
                "answer": [
                  {
                    "valueDate": "2027-12-31"
                  }
                ]
              }
            ]
          },
          {
            "linkId": "signature",
            "text": "Signature",
            "item": [
              {
                "linkId": "signer",
                "text": "Who is completing this form?",
                "answer": [
                  {
                    "valueCoding": {
                      "code": "self",
                      "display": "Member (myself)"
                    }
                  }
                ]
              },
              {
                "linkId": "signed-on",
                "text": "Date",
                "answer": [
                  {
                    "valueDate": "2026-10-12"
                  }
                ]
              }
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
        "identifier": [
          {
            "system": "https://example.org/fhir/sid/consent-form",
            "value": "P2P-000342"
          }
        ],
        "status": "current",
        "type": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "59284-0",
              "display": "Consent Document"
            }
          ]
        },
        "subject": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "date": "2026-10-12T16:40:00-04:00",
        "author": [
          {
            "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
          }
        ],
        "custodian": {
          "reference": "Organization/example-health-plan"
        },
        "description": "Payer-to-Payer opt-in form",
        "content": [
          {
            "attachment": {
              "contentType": "application/fhir+json",
              "url": "urn:uuid:5e7a7a00-0000-4000-8000-000000000006",
              "title": "Payer-to-Payer opt-in form (answers)",
              "creation": "2026-10-12T16:40:00-04:00"
            }
          }
        ]
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
        "meta": {
          "profile": [
            "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-consent"
          ]
        },
        "identifier": [
          {
            "system": "https://example.org/fhir/sid/payer-to-payer-consent",
            "value": "MBR0000012"
          }
        ],
        "status": "active",
        "scope": {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/consentscope",
              "code": "patient-privacy"
            }
          ]
        },
        "category": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                "code": "IDSCL"
              }
            ]
          },
          {
            "coding": [
              {
                "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose",
                "code": "payer-to-payer"
              }
            ]
          }
        ],
        "patient": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "dateTime": "2026-10-12T16:40:00-04:00",
        "performer": [
          {
            "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
          }
        ],
        "organization": [
          {
            "reference": "Organization/example-health-plan"
          }
        ],
        "sourceReference": {
          "reference": "urn:uuid:5e7a7a00-0000-4000-8000-000000000007"
        },
        "policy": [
          {
            "uri": "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-consent.html#sensitive"
          }
        ],
        "provision": {
          "type": "permit",
          "period": {
            "start": "2026-10-12",
            "end": "2027-12-31"
          },
          "actor": [
            {
              "role": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                    "code": "performer"
                  }
                ]
              },
              "reference": {
                "reference": "Organization/lakeside-health-plan",
                "display": "Lakeside Health Plan"
              }
            },
            {
              "role": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                    "code": "performer"
                  }
                ]
              },
              "reference": {
                "reference": "urn:uuid:5e7a7a00-0000-4000-8000-000000000005",
                "display": "Blue Valley Health Plan"
              }
            },
            {
              "role": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                    "code": "IRCP"
                  }
                ]
              },
              "reference": {
                "reference": "Organization/example-health-plan",
                "display": "Example Health Plan"
              }
            }
          ],
          "action": [
            {
              "coding": [
                {
                  "system": "http://terminology.hl7.org/CodeSystem/consentaction",
                  "code": "disclose"
                }
              ]
            }
          ]
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
        "meta": {
          "profile": [
            "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-coverage"
          ]
        },
        "identifier": [
          {
            "system": "https://example.org/fhir/sid/other-plan-coverage",
            "value": "PCV-000342-1"
          },
          {
            "type": {
              "coding": [
                {
                  "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                  "code": "MB"
                }
              ]
            },
            "value": "XYZ123456789",
            "assigner": {
              "reference": "Organization/lakeside-health-plan",
              "display": "Lakeside Health Plan"
            }
          }
        ],
        "status": "cancelled",
        "subscriberId": "XYZ123456789",
        "beneficiary": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "relationship": {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
              "code": "self",
              "display": "Self"
            }
          ]
        },
        "payor": [
          {
            "reference": "Organization/lakeside-health-plan",
            "display": "Lakeside Health Plan"
          }
        ]
      },
      "request": {
        "method": "PUT",
        "url": "Coverage?identifier=https://example.org/fhir/sid/other-plan-coverage|PCV-000342-1"
      }
    },
    {
      "resource": {
        "resourceType": "Coverage",
        "meta": {
          "profile": [
            "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-coverage"
          ]
        },
        "identifier": [
          {
            "system": "https://example.org/fhir/sid/other-plan-coverage",
            "value": "PCV-000342-2"
          },
          {
            "type": {
              "coding": [
                {
                  "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                  "code": "MB"
                }
              ]
            },
            "value": "BVH-4471902",
            "assigner": {
              "reference": "urn:uuid:5e7a7a00-0000-4000-8000-000000000005",
              "display": "Blue Valley Health Plan"
            }
          }
        ],
        "status": "active",
        "subscriberId": "BVH-4471902",
        "beneficiary": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "relationship": {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
              "code": "self",
              "display": "Self"
            }
          ]
        },
        "payor": [
          {
            "reference": "urn:uuid:5e7a7a00-0000-4000-8000-000000000005",
            "display": "Blue Valley Health Plan"
          }
        ]
      },
      "request": {
        "method": "PUT",
        "url": "Coverage?identifier=https://example.org/fhir/sid/other-plan-coverage|PCV-000342-2"
      }
    }
  ]
}
```

### 04. Change of plans

On October 13 the member drops Blue Valley. The same Consent now names only Lakeside and points to the new form. The Coverages stay: exchange runs only with the plans the Consent names.

{% file src="../../../assets/data-integration/consent/04-change-of-plans.json" %}
04-change-of-plans.json
{% endfile %}

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "QuestionnaireResponse",
        "meta": {
          "profile": [
            "http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"
          ]
        },
        "identifier": {
          "system": "https://example.org/fhir/sid/consent-form",
          "value": "P2P-000351"
        },
        "questionnaire": "https://example.org/fhir/Questionnaire/payer-to-payer-opt-in",
        "status": "completed",
        "subject": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "authored": "2026-10-13T09:15:00-04:00",
        "author": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "item": [
          {
            "linkId": "previous-or-concurrent-plan",
            "text": "Previous or concurrent health plan",
            "item": [
              {
                "linkId": "plan",
                "text": "Health plan",
                "answer": [
                  {
                    "valueReference": {
                      "reference": "Organization/lakeside-health-plan",
                      "display": "Lakeside Health Plan"
                    }
                  }
                ]
              },
              {
                "linkId": "plan-member-id",
                "text": "Member ID with that plan",
                "answer": [
                  {
                    "valueString": "XYZ123456789"
                  }
                ]
              },
              {
                "linkId": "plan-relationship",
                "text": "Was that plan in your own name?",
                "answer": [
                  {
                    "valueCoding": {
                      "system": "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
                      "code": "self",
                      "display": "Self"
                    }
                  }
                ]
              },
              {
                "linkId": "plan-kind",
                "text": "Is this a plan you had before, or one you have now?",
                "answer": [
                  {
                    "valueCoding": {
                      "code": "previous",
                      "display": "A plan I had before"
                    }
                  }
                ]
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
                "answer": [
                  {
                    "valueBoolean": true
                  }
                ]
              },
              {
                "linkId": "end-date",
                "text": "This authorization ends on",
                "answer": [
                  {
                    "valueDate": "2027-12-31"
                  }
                ]
              }
            ]
          },
          {
            "linkId": "signature",
            "text": "Signature",
            "item": [
              {
                "linkId": "signer",
                "text": "Who is completing this form?",
                "answer": [
                  {
                    "valueCoding": {
                      "code": "self",
                      "display": "Member (myself)"
                    }
                  }
                ]
              },
              {
                "linkId": "signed-on",
                "text": "Date",
                "answer": [
                  {
                    "valueDate": "2026-10-13"
                  }
                ]
              }
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
        "identifier": [
          {
            "system": "https://example.org/fhir/sid/consent-form",
            "value": "P2P-000351"
          }
        ],
        "status": "current",
        "type": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "59284-0",
              "display": "Consent Document"
            }
          ]
        },
        "subject": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "date": "2026-10-13T09:15:00-04:00",
        "author": [
          {
            "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
          }
        ],
        "custodian": {
          "reference": "Organization/example-health-plan"
        },
        "description": "Payer-to-Payer opt-in form",
        "content": [
          {
            "attachment": {
              "contentType": "application/fhir+json",
              "url": "urn:uuid:5e7a7a00-0000-4000-8000-000000000008",
              "title": "Payer-to-Payer opt-in form (answers)",
              "creation": "2026-10-13T09:15:00-04:00"
            }
          }
        ]
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
        "meta": {
          "profile": [
            "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition/hrex-consent"
          ]
        },
        "identifier": [
          {
            "system": "https://example.org/fhir/sid/payer-to-payer-consent",
            "value": "MBR0000012"
          }
        ],
        "status": "active",
        "scope": {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/consentscope",
              "code": "patient-privacy"
            }
          ]
        },
        "category": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                "code": "IDSCL"
              }
            ]
          },
          {
            "coding": [
              {
                "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose",
                "code": "payer-to-payer"
              }
            ]
          }
        ],
        "patient": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "dateTime": "2026-10-13T09:15:00-04:00",
        "performer": [
          {
            "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
          }
        ],
        "organization": [
          {
            "reference": "Organization/example-health-plan"
          }
        ],
        "sourceReference": {
          "reference": "urn:uuid:5e7a7a00-0000-4000-8000-000000000009"
        },
        "policy": [
          {
            "uri": "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-consent.html#sensitive"
          }
        ],
        "provision": {
          "type": "permit",
          "period": {
            "start": "2026-10-13",
            "end": "2027-12-31"
          },
          "actor": [
            {
              "role": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                    "code": "performer"
                  }
                ]
              },
              "reference": {
                "reference": "Organization/lakeside-health-plan",
                "display": "Lakeside Health Plan"
              }
            },
            {
              "role": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                    "code": "IRCP"
                  }
                ]
              },
              "reference": {
                "reference": "Organization/example-health-plan",
                "display": "Example Health Plan"
              }
            }
          ],
          "action": [
            {
              "coding": [
                {
                  "system": "http://terminology.hl7.org/CodeSystem/consentaction",
                  "code": "disclose"
                }
              ]
            }
          ]
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

### 05. Payer-to-Payer withdrawal

On October 14 the member withdraws. The same Consent gets `status: inactive` and goes without `meta.profile`, because the HRex and PDex profiles allow only `active`. `sourceReference` now points to the withdrawal form, and `period` keeps its values.

{% file src="../../../assets/data-integration/consent/05-payer-to-payer-withdrawal.json" %}
05-payer-to-payer-withdrawal.json
{% endfile %}

```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "QuestionnaireResponse",
        "meta": {
          "profile": [
            "http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"
          ]
        },
        "identifier": {
          "system": "https://example.org/fhir/sid/consent-form",
          "value": "P2P-000360"
        },
        "questionnaire": "https://example.org/fhir/Questionnaire/payer-to-payer-opt-in",
        "status": "completed",
        "subject": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "authored": "2026-10-14T11:30:00-04:00",
        "author": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "item": [
          {
            "linkId": "decision",
            "text": "Your decision",
            "item": [
              {
                "linkId": "withdraw",
                "text": "I withdraw my authorization for Example Health Plan to request my health information from other plans",
                "answer": [
                  {
                    "valueBoolean": true
                  }
                ]
              }
            ]
          },
          {
            "linkId": "signature",
            "text": "Signature",
            "item": [
              {
                "linkId": "signer",
                "text": "Who is completing this form?",
                "answer": [
                  {
                    "valueCoding": {
                      "code": "self",
                      "display": "Member (myself)"
                    }
                  }
                ]
              },
              {
                "linkId": "signed-on",
                "text": "Date",
                "answer": [
                  {
                    "valueDate": "2026-10-14"
                  }
                ]
              }
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
        "identifier": [
          {
            "system": "https://example.org/fhir/sid/consent-form",
            "value": "P2P-000360"
          }
        ],
        "status": "current",
        "type": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "59284-0",
              "display": "Consent Document"
            }
          ]
        },
        "subject": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "date": "2026-10-14T11:30:00-04:00",
        "author": [
          {
            "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
          }
        ],
        "custodian": {
          "reference": "Organization/example-health-plan"
        },
        "description": "Payer-to-Payer withdrawal",
        "content": [
          {
            "attachment": {
              "contentType": "application/fhir+json",
              "url": "urn:uuid:5e7a7a00-0000-4000-8000-000000000010",
              "title": "Payer-to-Payer withdrawal (answers)",
              "creation": "2026-10-14T11:30:00-04:00"
            }
          }
        ]
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
        "identifier": [
          {
            "system": "https://example.org/fhir/sid/payer-to-payer-consent",
            "value": "MBR0000012"
          }
        ],
        "status": "inactive",
        "scope": {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/consentscope",
              "code": "patient-privacy"
            }
          ]
        },
        "category": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                "code": "IDSCL"
              }
            ]
          },
          {
            "coding": [
              {
                "system": "http://hl7.org/fhir/us/davinci-pdex/CodeSystem/pdex-consent-api-purpose",
                "code": "payer-to-payer"
              }
            ]
          }
        ],
        "patient": {
          "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
        },
        "dateTime": "2026-10-14T11:30:00-04:00",
        "performer": [
          {
            "reference": "Patient?identifier=https://example.org/fhir/sid/member-id|MBR0000012"
          }
        ],
        "organization": [
          {
            "reference": "Organization/example-health-plan"
          }
        ],
        "sourceReference": {
          "reference": "urn:uuid:5e7a7a00-0000-4000-8000-000000000011"
        },
        "policy": [
          {
            "uri": "http://hl7.org/fhir/us/davinci-hrex/StructureDefinition-hrex-consent.html#sensitive"
          }
        ],
        "provision": {
          "type": "permit",
          "period": {
            "start": "2026-10-13",
            "end": "2027-12-31"
          },
          "actor": [
            {
              "role": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
                    "code": "performer"
                  }
                ]
              },
              "reference": {
                "reference": "Organization/lakeside-health-plan",
                "display": "Lakeside Health Plan"
              }
            },
            {
              "role": {
                "coding": [
                  {
                    "system": "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
                    "code": "IRCP"
                  }
                ]
              },
              "reference": {
                "reference": "Organization/example-health-plan",
                "display": "Example Health Plan"
              }
            }
          ],
          "action": [
            {
              "coding": [
                {
                  "system": "http://terminology.hl7.org/CodeSystem/consentaction",
                  "code": "disclose"
                }
              ]
            }
          ]
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

## Reading back

| Need | Request |
|---|---|
| The Provider Access decision | `GET /fhir/Consent?identifier=https://example.org/fhir/sid/provider-access-consent\|<Member ID>` — one record, `deny` after 01, `permit` after 02 |
| The Payer-to-Payer decision | `GET /fhir/Consent?identifier=https://example.org/fhir/sid/payer-to-payer-consent\|<Member ID>` — one record, `active` after 03, `inactive` after 05 |
| Both | `GET /fhir/Consent?patient:Patient.identifier=https://example.org/fhir/sid/member-id\|<Member ID>` |
| Earlier decisions | `GET /fhir/Consent/<id>/_history` |

The `:Patient` in `patient:Patient.identifier` is needed. The `actor` search parameter matches an Organization in any role, so it cannot tell a source plan from the recipient.

## Alongside the member portal

The [Data sharing page](../../fhir-app-portal/member-portal/consent-panel.md) stores a decision differently: every choice is a new Consent, and the one it replaces is [retired](../../api-reference/resources/consent.md#retire-a-record). Both shapes are read the same way — a Consent counts while it is `active` and its `provision.period` covers the day — so the two can coexist on one installation. A member whose decisions arrive through this feed should not also record them on the page: the two records would not know of each other.

These resources are read by [Provider Access](../../interop-apis/provider-access.md) and [Payer-to-Payer](../../interop-apis/payer-to-payer.md).
