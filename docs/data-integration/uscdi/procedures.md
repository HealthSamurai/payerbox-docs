---
description: >-
  Columns for service_requests, mapped from the USCDI v3.1 Procedures data
  class to US Core 6.1.0 FHIR.
---

# Procedures

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) data element onto a FHIR element.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`procedures`](#procedures) | [US Core Procedure](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-procedure.html) |
| [`service_requests`](#service-requests) | [US Core ServiceRequest](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-servicerequest.html) |

## procedures

One row per procedure performed. This dataset carries the **Procedures** element of the class.

{% file src="../../assets/data-integration/procedures.csv" %}
procedures.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `procedure_id` | Yes | your key for this procedure | `PRO-0001` |
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `status` | Yes | `preparation`, `in-progress`, `on-hold`, `stopped`, `completed`, `not-done`, `entered-in-error`, `unknown` [event-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/event-status%7C4.0.1) | `completed` |
| `code` | Yes | CPT, HCPCS, ICD-10-PCS, or SNOMED CT code, with `code_system`; CPT if omitted [US Core Procedure Codes](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-procedure-code) | `80146002` appendectomy |
| `performed_start` | Recommended | date or datetime | `2026-04-18` |
| `performed_end` | If a period | date or datetime | |
| `performer_npi` | If available | 10 digits | `9999999991` |
| `encounter_id` | If applicable | `encounters` key | `ENC-9912` |
| `service_request_id` | If available | `service_request_id` of the `service_requests` row, when the procedure fulfils a request | `SR-2201` |
| `reason_code` | If available | SNOMED CT or ICD-10-CM code(s), `;`-separated, with `reason_system`; SNOMED CT if omitted [procedure-reason](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/procedure-reason%7C4.0.1) | `733423003` food insecurity |

- `performed_end` marks a procedure that spans time. Send it only then; a single `performed_start` is a point in time.
- `service_request_id` links a performed procedure back to the request that ordered it, including an SDOH intervention recorded in `service_requests`.

## service_requests

One row per requested service: a referral, an order, or an SDOH intervention. This dataset carries the **Reason for Referral** and **SDOH Interventions** elements of the class; the services actually performed go in `procedures`.

{% file src="../../assets/data-integration/service_requests.csv" %}
service_requests.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `service_request_id` | Yes | your key for this request; `procedures` reference it | `SR-2201` |
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `status` | Yes | `draft`, `active`, `on-hold`, `completed`, `revoked`, `entered-in-error`, `unknown` [request-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/request-status%7C4.0.1) | `active` |
| `intent` | Yes | `proposal`, `plan`, `directive`, `order`, `original-order`, `reflex-order`, `filler-order`, `instance-order`, `option` [request-intent](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/request-intent%7C4.0.1) | `order` |
| `code` | Yes | CPT, HCPCS, SNOMED CT, or LOINC code, with `code_system`; CPT if omitted [US Core Procedure Codes](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-procedure-code) | `103696004` patient referral to specialist |
| `category` | Recommended | `sdoh` marks an SDOH intervention. The [US Core ServiceRequest Category](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-servicerequest-category) codes are extensible, so another code is accepted with `category_system` | `sdoh` |
| `reason_code` | If available | SNOMED CT or ICD-10-CM code(s), `;`-separated, with `reason_system`; SNOMED CT if omitted [US Core Condition Codes](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-condition-code) | `733423003` food insecurity |
| `authored_on` | If available | datetime | `2026-05-10` |
| `occurrence_date` | If available | datetime | `2026-05-24` |
| `requester_npi` | If available | 10 digits | `9999999991` |

- `status` and `intent` are both required bindings, so a value outside these lists is rejected. A referral a payer holds is normally `active` with intent `order`.
- `code` says what was requested. It is the one coded field with no fallback: a row without it cannot become a ServiceRequest. Its value set is deliberately broad, so use the system your domain uses — LOINC for a lab order, CPT or HCPCS off a claim.
- `reason_code` is why it was requested — the Reason for Referral element. For an SDOH intervention this is the need being addressed, such as food insecurity or lack of transport.
- `authored_on` is when the request was written; `occurrence_date` is when the service should happen.
- `requester_npi` must match a row in [`practitioners`](care-team.md#practitioners).
- `category` is what marks a row as an SDOH intervention, whatever the service is. The APIs that report on SDOH read it, not `code`.


These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), [Payer-to-Payer](../../interop-apis/payer-to-payer.md), and [Prior Auth](../../prior-auth/README.md).
