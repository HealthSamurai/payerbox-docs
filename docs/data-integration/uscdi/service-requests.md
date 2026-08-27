---
description: >-
  Columns for service_requests, mapped from the USCDI v3.1 Procedures data
  class to US Core 6.1.0 FHIR.
---

# Reason for Referral and SDOH Interventions

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) element to FHIR.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`service_requests`](#service-requests) | [US Core ServiceRequest](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-servicerequest.html) |

## service_requests

One row per requested service: a referral, an order, or an SDOH intervention. This dataset carries the Reason for Referral and SDOH Interventions elements of the Procedures data class; the services actually performed go in `procedures`.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `status` | Yes | `draft`, `active`, `on-hold`, `completed`, `revoked`, `entered-in-error`, `unknown` [request-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/request-status%7C4.0.1) | `active` |
| `intent` | Yes | `proposal`, `plan`, `directive`, `order`, `original-order`, `reflex-order`, `filler-order`, `instance-order`, `option` [request-intent](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/request-intent%7C4.0.1) | `order` |
| `code` | Yes | CPT, HCPCS, SNOMED CT, or LOINC code, with `code_system`; CPT if omitted [US Core Procedure Codes](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-procedure-code) | `103696004` patient referral to specialist |
| `category` | Recommended | `sdoh` marks an SDOH intervention. The [US Core ServiceRequest Category](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-servicerequest-category) codes are extensible, so another code is accepted with `category_system` | `sdoh` |
| `reason_code` | If available | SNOMED CT or ICD-10-CM code(s), `;`-separated, with `reason_system`; SNOMED CT if omitted [US Core Condition Codes](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-condition-code) | `733423003` food insecurity |
| `authored_on` | If available | datetime | `2026-05-10` |
| `occurrence_date` | If available | datetime | `2026-05-24` |
| `requester_npi` | If available | 10 digits | `1407006835` |

- `status` and `intent` are both required bindings, so a value outside these lists is rejected. A referral a payer holds is normally `active` with intent `order`.
- `code` says what was requested. It is the one coded field with no fallback: a row without it cannot become a ServiceRequest. Its value set is deliberately broad, so use the system your domain uses — LOINC for a lab order, CPT or HCPCS off a claim.
- `reason_code` is why it was requested — the Reason for Referral element. For an SDOH intervention this is the need being addressed, such as food insecurity or lack of transport.
- `authored_on` is when the request was written; `occurrence_date` is when the service should happen.
- `requester_npi` must match a row in [`practitioners`](care-team.md#practitioners).
- `category` is what marks a row as an SDOH intervention, whatever the service is. The APIs that report on SDOH read it, not `code`.


These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), [Payer-to-Payer](../../interop-apis/payer-to-payer.md), and [Prior Auth](../../prior-auth/README.md).
