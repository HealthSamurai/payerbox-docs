---
description: >-
  The 24 CSV files of the USCDI feed, by data class and the US Core 6.1.0
  profile each becomes.
---

# USCDI v3.1 Data

| # | Dataset | USCDI v3.1 data class | US Core 6.1.0 target profile(s) |
|---|---|---|---|
| 1 | `patients` | [Patient Demographics](patient-demographics.md#patients) | Patient (+ race, ethnicity, sex, tribal extensions) |
| 2 | `related_persons` | [Patient Demographics (Related Person)](patient-demographics.md#related-persons) | RelatedPerson |
| 3 | `practitioners` | [Care Team Members](care-team.md#practitioners) (ref), may come from [Provider Directory](../provider-directory/README.md#providers) | Practitioner; PractitionerRole |
| 4 | `organizations` | Care Team / Provenance (ref), may come from [Provider Directory](../provider-directory/README.md#facilities) | Organization |
| 5 | `locations` | [Encounter Information](encounters.md#locations) (ref), may come from [Provider Directory](../provider-directory/README.md#facilities) | Location |
| 6 | `allergies` | [Allergies and Intolerances](allergies.md#allergies) | AllergyIntolerance |
| 7 | `conditions` | [Problems, Encounter Diagnosis, Health Concerns, SDOH](conditions.md#conditions) | Condition (Problems/Health-Concerns + Encounter-Diagnosis) |
| 8 | `medications` | Medications | MedicationRequest (+ Medication) |
| 9 | `medication_dispenses` | Medications (Fill Status) | MedicationDispense |
| 10 | `immunizations` | [Immunizations](immunizations.md#immunizations) | Immunization |
| 11 | `procedures` | Procedures | Procedure |
| 12 | `service_requests` | [Procedures (Referral), SDOH Interventions](procedures.md#service-requests) | ServiceRequest |
| 13 | `encounters` | [Encounter Information](encounters.md#encounters) | Encounter |
| 14 | `care_team` | [Care Team Members](care-team.md#care-team) | CareTeam |
| 15 | `care_plans` | Assessment and Plan of Treatment | CarePlan |
| 16 | `goals` | [Goals](goals.md#goals) | Goal |
| 17 | `coverage` | [Health Insurance Information](health-insurance.md#coverage) | Coverage |
| 18 | `documents` | Clinical Notes | DocumentReference |
| 19 | `diagnostic_reports` | Clinical Notes, Laboratory, Diagnostic Imaging (report level) | DiagnosticReport (Lab + Report/Note) |
| 20 | `devices` | [Unique Device Identifier(s)](devices.md#devices) | Implantable Device |
| 21 | `vital_signs` | Vital Signs | Observation (Vital Signs family) |
| 22 | `labs` | Laboratory | Observation (Lab Result) + Specimen |
| 23 | `social_history` | Health Status/Assessments (Smoking, Pregnancy) + Patient Demographics (Occupation) | Observation (Social History profiles) |
| 24 | `clinical_observations` | Clinical Tests, Diagnostic Imaging (result), Health Status/Assessments, Screening/SDOH | Observation (Clinical Result / Screening Assessment / Simple) |
