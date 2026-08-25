---
description: >-
  The inbound data contract. What a payer delivers to Payerbox, file by file and
  column by column, so Payerbox can build the FHIR its APIs serve.
---

# Data Integration Reference

What you send Payerbox. For each USCDI data class, the columns to deliver and the FHIR they become.

```mermaid
graph LR
    A(your source<br/>systems):::neutral1 --> B(flat file feed):::yellow2
    B --> C(Payerbox<br/>transform):::red2
    C --> D(FHIR<br/>in Aidbox):::violet2
    D --> E(Patient Access<br/>Provider Access<br/>Payer-to-Payer):::blue2
```

## File conventions

| Rule | Detail |
|---|---|
| Format | UTF-8, comma-delimited, RFC 4180 quoting. First row is the headers, named exactly as in the tables. |
| Delivery | Arranged per engagement. PHI: encrypted in transit and at rest under the executed BAA. |
| History (clinical feed) | Date of service on or after January 1, 2016. Send active and historical records; the status columns mark which is which. |

## Built on US Core

[USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi) lists the data. [US Core](https://hl7.org/fhir/us/core/STU6.1/) maps each element to FHIR. Payerbox pins **US Core 6.1.0**, realizing **USCDI v3** ([Implementation Guides](../api-reference/implementation-guides.md)). This feed targets **USCDI v3.1**.

## File index

### Clinical feed

| # | File | USCDI v3.1 data class | US Core 6.1.0 target profile(s) |
|---|---|---|---|
| 1 | `patients.csv` | [Patient Demographics](patient-demographics.md#patients-csv) | Patient (+ race, ethnicity, sex, tribal extensions) |
| 2 | `related_persons.csv` | [Patient Demographics (Related Person)](patient-demographics.md#related-persons-csv) | RelatedPerson |
| 3 | `practitioners.csv` | Care Team Members (ref), may come from [Provider Directory](provider-directory.md) | Practitioner; PractitionerRole |
| 4 | `organizations.csv` | Care Team / Provenance (ref), may come from [Provider Directory](provider-directory.md) | Organization |
| 5 | `locations.csv` | Encounter (ref), may come from [Provider Directory](provider-directory.md) | Location |
| 6 | `allergies.csv` | Allergies and Intolerances | AllergyIntolerance |
| 7 | `conditions.csv` | Problems, Encounter Diagnosis, Health Concerns, SDOH | Condition (Problems/Health-Concerns + Encounter-Diagnosis) |
| 8 | `medications.csv` | Medications | MedicationRequest (+ Medication) |
| 9 | `medication_dispenses.csv` | Medications (Fill Status) | MedicationDispense |
| 10 | `immunizations.csv` | Immunizations | Immunization |
| 11 | `procedures.csv` | Procedures | Procedure |
| 12 | `service_requests.csv` | Procedures (Referral), SDOH Interventions | ServiceRequest |
| 13 | `encounters.csv` | Encounter Information | Encounter |
| 14 | `care_team.csv` | Care Team Members | CareTeam |
| 15 | `care_plans.csv` | Assessment and Plan of Treatment | CarePlan |
| 16 | `goals.csv` | Goals | Goal |
| 17 | `coverage.csv` | [Health Insurance Information](health-insurance.md#coverage-csv) | Coverage |
| 18 | `documents.csv` | Clinical Notes | DocumentReference |
| 19 | `diagnostic_reports.csv` | Clinical Notes, Laboratory, Diagnostic Imaging (report level) | DiagnosticReport (Lab + Report/Note) |
| 20 | `devices.csv` | Unique Device Identifier(s) | Implantable Device |
| 21 | `vital_signs.csv` | Vital Signs | Observation (Vital Signs family) |
| 22 | `labs.csv` | Laboratory | Observation (Lab Result) + Specimen |
| 23 | `social_history.csv` | Health Status/Assessments (Smoking, Pregnancy) + Patient Demographics (Occupation) | Observation (Social History profiles) |
| 24 | `clinical_observations.csv` | Clinical Tests, Diagnostic Imaging (result), Health Status/Assessments, Screening/SDOH | Observation (Clinical Result / Screening Assessment / Simple) |

### Provider directory feed

Built to PDex Plan-Net STU 1.1.0, current and in-network only, delivered as a full snapshot.

| # | File | Data class | Plan-Net STU 1.1.0 target profile(s) |
|---|---|---|---|
| 1 | `providers.csv` | [Provider Directory](provider-directory.md) | Practitioner; PractitionerRole |
| 2 | `facilities.csv` | [Provider Directory](provider-directory.md) | Organization; Location |
| 3 | `networks.csv` | [Provider Directory](provider-directory.md) | Network |
| 4 | `plans.csv` | [Provider Directory](provider-directory.md) | InsurancePlan |
