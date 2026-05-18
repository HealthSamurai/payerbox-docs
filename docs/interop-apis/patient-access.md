---
description: SMART-on-FHIR API a member authorizes a third-party app to read their own claims, clinical, encounter, formulary, and prior-authorization data. Conformant to US Core, CARIN BB, and PDex.
---

# Patient Access API

![Patient Access flow: Member's third-party app calls the Payerbox FHIR platform via SMART App Launch and reads FHIR data; Health Plan data sources feed Payerbox with members' data; Member discovers and launches apps from the Member portal app gallery.](../../assets/interop-apis/patient-access-flow.svg)

The Patient Access API lets a member authorize a third-party app to read their own claims, clinical, encounter, formulary, and prior-authorization data over FHIR R4. Established by [CMS-9115-F](../compliance/cms-9115.md), in production since January 1, 2021; [CMS-0057-F](../compliance/cms-0057.md) adds prior-authorization data effective January 1, 2027.

## What Payerbox covers

- [US Core](https://hl7.org/fhir/us/core/) preloaded; [CARIN IG for Blue Button](https://hl7.org/fhir/us/carin-bb/), [PDex](https://hl7.org/fhir/us/davinci-pdex/), and [PDex US Drug Formulary](https://hl7.org/fhir/us/davinci-drug-formulary/) supported as additional FHIR packages.
- [FHIR App Portal](../fhir-app-portal/README.md) for member-facing app discovery and the [Developer Portal](../fhir-app-portal/developer-portal.md) for third-party app registration.
- Per-app audit logging of every member access.

## Caller and auth

| Property | Value |
|---|---|
| Caller | Third-party app the member authorizes (mobile, web, desktop) |
| Authentication | SMART App Launch — OAuth 2.0 authorization code, PKCE for public clients, OpenID Connect for identity |
| Discovery | `<base>/.well-known/smart-configuration` |
| Authorization endpoint | `<base>/auth/authorize` |
| Token endpoint | `<base>/auth/token` |
| CapabilityStatement | `<base>/fhir/metadata` |

## Patient scoping

The access token's `patient` claim names which member the app may read. Payerbox scopes every query to that patient automatically — an app cannot read another member's data by passing a different patient ID.

Launch flows, PKCE, scope syntax, refresh tokens, and token-response shape live in [API Reference / Authentication](../api-reference/authentication.md).

## Data scope

What a member can read through the API:

| Data class | FHIR resources | IG |
|---|---|---|
| USCDI clinical | Patient, Condition, Observation, MedicationRequest, AllergyIntolerance, Procedure, Immunization, DocumentReference, ... | US Core |
| Adjudicated claims with remittances and enrollee cost-sharing | ExplanationOfBenefit, Coverage | CARIN IG for Blue Button |
| Encounters with capitated providers | Encounter | US Core |
| Lab results | Observation (`category=laboratory`) | US Core |
| Drug formulary (MA-PD only) | InsurancePlan, Basic (formulary item), MedicationKnowledge | PDex US Drug Formulary |
| Prior authorization request and decision (effective January 1, 2027, drug PA excluded) | ExplanationOfBenefit (`use=preauthorization`) | PDex |

Service date floor: **January 1, 2016**.

## Read examples

Mapped to common member-app needs. Every request carries the member's `Authorization: Bearer <access-token>` header; Payerbox scopes results to the patient in the token's `patient` claim.

### Member demographics

```bash
GET <base>/fhir/Patient/<id>
```

### Lab results

`Observation` profiled as US Core Laboratory Result; filter by `category=laboratory`.

```bash
GET <base>/fhir/Observation?patient=<id>&category=laboratory
```

### Adjudicated claims

`ExplanationOfBenefit` is CARIN BB's focal resource for paid claims (institutional, professional, pharmacy, oral).

```bash
GET <base>/fhir/ExplanationOfBenefit?patient=<id>
```

### Active coverage

```bash
GET <base>/fhir/Coverage?patient=<id>&status=active
```

### Drug formulary (MA-PD)

Browse covered drugs in the member's plan formulary:

```bash
GET <base>/fhir/MedicationKnowledge?_profile=http://hl7.org/fhir/us/davinci-drug-formulary/StructureDefinition/usdf-FormularyDrug
```

### Prior authorization (from January 1, 2027)

Adjudicated PA decisions surface as `ExplanationOfBenefit` with `use=preauthorization`:

```bash
GET <base>/fhir/ExplanationOfBenefit?patient=<id>&_profile=http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-priorauthorization
```

## Limitations

- **Opt-in per app.** The member authorizes each third-party app separately. There is no payer-wide consent equivalent to Provider Access's opt-out model.
- **Prior authorization data lands January 1, 2027.** Before that date, prior-authorization data need not be exposed through Patient Access.
- **No `$export` on member-scoped tokens.** Bulk export is a system-level operation used by the payer; member apps use synchronous REST.
- **Single patient per token.** A guardian or personal representative needs separate tokens per dependent member.
