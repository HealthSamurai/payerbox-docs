---
description: >-
  Columns for medications and medication_dispenses, mapped from the USCDI v3.1
  Medications data class to US Core 6.1.0 FHIR.
---

# Medications

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) element to FHIR.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`medications`](#medications) | [US Core MedicationRequest](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-medicationrequest.html) |
| [`medication_dispenses`](#medication-dispenses) | [US Core MedicationDispense](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-medicationdispense.html) |

## medications

One row per medication order: the prescriber's intent, with drug, dose, and indication. **For most payers this file is sparse or empty** — orders live in EHR and e-prescribing systems, not in claims. If your medication data comes from pharmacy claims, it belongs in [`medication_dispenses`](#medication-dispenses); populate this file only with order-level data you actually hold.

{% file src="../../assets/data-integration/medications.82f3e20c.csv" %}
medications.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your stable key for this order; `medication_dispenses` reference it | `MED-77120` |
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `status` | Yes | `active`, `on-hold`, `cancelled`, `completed`, `entered-in-error`, `stopped`, `draft`, `unknown` [medicationrequest-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/medicationrequest-status%7C4.0.1) | `active` |
| `intent` | Yes | `proposal`, `plan`, `order`, `original-order`, `reflex-order`, `filler-order`, `instance-order`, `option` [medicationrequest-intent](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/medicationrequest-intent%7C4.0.1) | `order` |
| `medication_code` | Yes | RxNorm drug-level code, with `medication_system` (RxNorm assumed when empty) [Medication Clinical Drug](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1010.4/expansion) | `310965` ibuprofen 200 MG oral tablet |
| `category` | If available | `inpatient`, `outpatient`, `community`, `discharge` [medicationrequest-category](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/medicationrequest-category%7C4.0.1) | `outpatient` |
| `reported` | Recommended | `true` / `false` | `false` |
| `authored_on` | Recommended | datetime | `2026-05-30` |
| `requester_npi` | Recommended | 10 digits | `9999999991` |
| `encounter_id` | If applicable | `encounters` key | `ENC-9912` |
| `dosage_text` | Recommended | the sig, free text | `1 tab PO daily` |
| `dose_value` | If available | decimal | `200` |
| `dose_unit` | If `dose_value` | UCUM [ucum-common](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/ucum-common%7C4.0.1) | `mg` |
| `refills_allowed` | If available | integer | `3` |
| `dispense_quantity_value` | If available | decimal | `30` |
| `dispense_quantity_unit` | If `dispense_quantity_value` | UCUM [ucum-common](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/ucum-common%7C4.0.1) | `{tbl}` |
| `indication_code` | If available | SNOMED CT or ICD-10-CM code, with `indication_system` (SNOMED CT assumed when empty) [us-core-condition-code](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-condition-code) | `38341003` hypertensive disorder |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- `medication_code` is the one coded field with no fallback: a row without it cannot become a MedicationRequest. The value set holds RxNorm codes at the prescribable-product level — a clinical or branded drug, not the bare ingredient. Send `medication_system` as `http://www.nlm.nih.gov/research/umls/rxnorm`.
- `status` carries history: closed orders arrive as `completed`, `stopped`, or `cancelled`; `entered-in-error` retracts a record that should never have existed.
- `reported` set to `true` marks an order known secondhand — reported by the member or imported from another system — rather than authored in the system that sent it.
- `dosage_text` is the sig as written and the most valuable of the dose columns; `dose_value` + `dose_unit` are its structured counterpart, the USCDI Dose and Dose Unit of Measure elements. UCUM count units use curly braces: `{tbl}` tablets.
- `refills_allowed` and the `dispense_quantity_*` pair describe what the order authorizes the pharmacy to dispense — refills and amount per fill.
- `requester_npi` is the prescriber and must match a row in [`practitioners`](care-team.md#practitioners).

## medication_dispenses

One row per fill: what the pharmacy actually handed over. **For a payer this is usually the primary medication file** — pharmacy claims are fill records. It carries the USCDI Medications (Fill Status) element and stays distinct from the order in [`medications`](#medications).

{% file src="../../assets/data-integration/medication_dispenses.cb765d16.csv" %}
medication_dispenses.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your stable key for this fill | `MD-0001` |
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `status` | Yes | `preparation`, `in-progress`, `cancelled`, `on-hold`, `completed`, `entered-in-error`, `stopped`, `declined`, `unknown` [medicationdispense-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/medicationdispense-status%7C4.0.1) | `completed` |
| `medication_code` | Yes | RxNorm drug-level code, with `medication_system` (RxNorm assumed when empty) [Medication Clinical Drug](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1010.4/expansion) | `310965` ibuprofen 200 MG oral tablet |
| `type_code` | If available | fill type: `FF` first fill, `RF` refill, `EM` emergency supply, `UD` unit dose [ActPharmacySupplyType](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://terminology.hl7.org/ValueSet/v3-ActPharmacySupplyType) | `RF` |
| `pharmacy_org_npi` | Recommended | 10 digits | `9999999993` |
| `performer_npi` | If available | 10 digits, the dispensing pharmacist | `9999999991` |
| `authorizing_prescription_id` | If available | `record_id` of the `medications` row | `MED-77120` |
| `quantity_value` | If available | decimal | `30` |
| `quantity_unit` | If `quantity_value` | UCUM [ucum-common](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/ucum-common%7C4.0.1) | `{tbl}` |
| `when_handed_over` | If available | datetime | `2026-06-01` |
| `dosage_text` | If available | the sig, free text | `1 tab PO daily` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- `status` is the Fill Status element: `completed` for a fill picked up, `in-progress` or `preparation` for one underway, `declined` for one refused, `entered-in-error` to retract. The binding is required, so a value outside the list is rejected.
- A pharmacy-claim row that carries only an NDC may send it with `medication_system` as `http://hl7.org/fhir/sid/ndc`; Payerbox crosswalks it to the RxNorm coding US Core requires.
- `pharmacy_org_npi` is the dispensing pharmacy and `performer_npi` the dispensing pharmacist, when your source records one; both become `MedicationDispense.performer.actor` and must match a row in [`organizations`](care-team.md#organizations) and [`practitioners`](care-team.md#practitioners) respectively. Pharmacy claims usually identify only the store — sending just `pharmacy_org_npi` is fine.
- `when_handed_over` is when the medication left the pharmacy — for a claim, the fill date.

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), and [Payer-to-Payer](../../interop-apis/payer-to-payer.md).
